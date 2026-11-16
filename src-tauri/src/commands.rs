use base64::{engine::general_purpose, Engine as _};
use quick_xml::events::Event;
use quick_xml::Reader;
use serde::Serialize;
use serde_json::{Map, Value};
use std::fs;
use std::path::Path;

// ---------------- Text / data conversion ----------------

#[tauri::command]
pub fn convert_text(mode: String, input: String) -> Result<String, String> {
    match mode.as_str() {
        "text-to-json" => text_to_json(&input),
        "json-to-text" => json_to_text(&input),
        "csv-to-json" => csv_to_json(&input),
        "json-to-csv" => json_to_csv(&input),
        "json-to-xml" => json_to_xml(&input),
        "xml-to-json" => xml_to_json(&input),
        "text-to-base64" => Ok(general_purpose::STANDARD.encode(input.as_bytes())),
        "base64-to-text" => base64_to_text(&input),
        "json-to-yaml" => json_to_yaml(&input),
        "yaml-to-json" => yaml_to_json(&input),
        other => Err(format!("Unknown mode: {other}")),
    }
}

fn text_to_json(input: &str) -> Result<String, String> {
    let mut map = Map::new();
    map.insert("text".to_string(), Value::String(input.to_string()));
    serde_json::to_string_pretty(&Value::Object(map)).map_err(|e| e.to_string())
}

fn json_to_text(input: &str) -> Result<String, String> {
    let value: Value = serde_json::from_str(input).map_err(|e| e.to_string())?;
    if let Some(text) = value.get("text").and_then(|v| v.as_str()) {
        Ok(text.to_string())
    } else {
        serde_json::to_string_pretty(&value).map_err(|e| e.to_string())
    }
}

fn csv_to_json(input: &str) -> Result<String, String> {
    let mut reader = csv::Reader::from_reader(input.as_bytes());
    let headers = reader.headers().map_err(|e| e.to_string())?.clone();
    let mut rows = Vec::new();
    for record in reader.records() {
        let record = record.map_err(|e| e.to_string())?;
        let mut row = Map::new();
        for (h, v) in headers.iter().zip(record.iter()) {
            row.insert(h.to_string(), Value::String(v.to_string()));
        }
        rows.push(Value::Object(row));
    }
    serde_json::to_string_pretty(&Value::Array(rows)).map_err(|e| e.to_string())
}

fn json_to_csv(input: &str) -> Result<String, String> {
    let value: Value = serde_json::from_str(input).map_err(|e| e.to_string())?;
    let rows = match value {
        Value::Array(arr) => arr,
        other => vec![other],
    };
    if rows.is_empty() {
        return Ok(String::new());
    }
    let mut headers: Vec<String> = Vec::new();
    if let Value::Object(map) = &rows[0] {
        headers = map.keys().cloned().collect();
    }
    let mut wtr = csv::Writer::from_writer(vec![]);
    wtr.write_record(&headers).map_err(|e| e.to_string())?;
    for row in &rows {
        if let Value::Object(map) = row {
            let record: Vec<String> = headers
                .iter()
                .map(|h| match map.get(h) {
                    Some(Value::String(s)) => s.clone(),
                    Some(v) => v.to_string(),
                    None => String::new(),
                })
                .collect();
            wtr.write_record(&record).map_err(|e| e.to_string())?;
        }
    }
    let bytes = wtr.into_inner().map_err(|e| e.to_string())?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

fn json_to_xml(input: &str) -> Result<String, String> {
    let value: Value = serde_json::from_str(input).map_err(|e| e.to_string())?;
    let mut xml = String::from("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<root>");
    value_to_xml(&value, &mut xml);
    xml.push_str("</root>");
    Ok(xml)
}

fn value_to_xml(value: &Value, out: &mut String) {
    match value {
        Value::Object(map) => {
            for (k, v) in map {
                out.push('<');
                out.push_str(k);
                out.push('>');
                value_to_xml(v, out);
                out.push_str("</");
                out.push_str(k);
                out.push('>');
            }
        }
        Value::Array(arr) => {
            for item in arr {
                out.push_str("<item>");
                value_to_xml(item, out);
                out.push_str("</item>");
            }
        }
        Value::String(s) => out.push_str(&escape_xml(s)),
        Value::Number(n) => out.push_str(&n.to_string()),
        Value::Bool(b) => out.push_str(&b.to_string()),
        Value::Null => {}
    }
}

fn escape_xml(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;")
}

fn xml_to_json(input: &str) -> Result<String, String> {
    let mut reader = Reader::from_str(input);
    reader.trim_text(true);
    let mut buf = Vec::new();
    loop {
        match reader.read_event_into(&mut buf).map_err(|e| e.to_string())? {
            Event::Start(ref e) => {
                let name = String::from_utf8_lossy(e.name().as_ref()).to_string();
                let value = parse_xml_element(&mut reader)?;
                let mut root = Map::new();
                root.insert(name, value);
                return serde_json::to_string_pretty(&Value::Object(root)).map_err(|e| e.to_string());
            }
            Event::Eof => return Err("No root element found in XML".to_string()),
            _ => {}
        }
        buf.clear();
    }
}

fn parse_xml_element(reader: &mut Reader<&[u8]>) -> Result<Value, String> {
    let mut children: Map<String, Value> = Map::new();
    let mut text = String::new();
    let mut buf = Vec::new();
    loop {
        buf.clear();
        match reader.read_event_into(&mut buf).map_err(|e| e.to_string())? {
            Event::Start(ref e) => {
                let name = String::from_utf8_lossy(e.name().as_ref()).to_string();
                let child_value = parse_xml_element(reader)?;
                insert_xml_child(&mut children, name, child_value);
            }
            Event::Empty(ref e) => {
                let name = String::from_utf8_lossy(e.name().as_ref()).to_string();
                insert_xml_child(&mut children, name, Value::Null);
            }
            Event::Text(e) => {
                text.push_str(&e.unescape().map_err(|e| e.to_string())?.into_owned());
            }
            Event::End(_) => break,
            Event::Eof => return Err("Unexpected end of XML".to_string()),
            _ => {}
        }
    }
    if children.is_empty() {
        Ok(Value::String(text.trim().to_string()))
    } else {
        Ok(Value::Object(children))
    }
}

fn insert_xml_child(map: &mut Map<String, Value>, name: String, value: Value) {
    match map.get_mut(&name) {
        Some(Value::Array(arr)) => arr.push(value),
        Some(existing) => {
            let old = existing.clone();
            *existing = Value::Array(vec![old, value]);
        }
        None => {
            map.insert(name, value);
        }
    }
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_text_file(path: String, content: String) -> Result<(), String> {
    fs::write(&path, content).map_err(|e| e.to_string())
}

fn json_to_yaml(input: &str) -> Result<String, String> {
    let value: Value = serde_json::from_str(input).map_err(|e| e.to_string())?;
    serde_yaml::to_string(&value).map_err(|e| e.to_string())
}

fn yaml_to_json(input: &str) -> Result<String, String> {
    let value: serde_yaml::Value = serde_yaml::from_str(input).map_err(|e| e.to_string())?;
    let json_value: Value = serde_json::to_value(&value).map_err(|e| e.to_string())?;
    serde_json::to_string_pretty(&json_value).map_err(|e| e.to_string())
}

fn base64_to_text(input: &str) -> Result<String, String> {
    let bytes = general_purpose::STANDARD
        .decode(input.trim())
        .map_err(|e| e.to_string())?;
    String::from_utf8(bytes).map_err(|e| e.to_string())
}

// ---------------- Image conversion ----------------

#[derive(Serialize)]
pub struct FileResult {
    pub file: String,
    pub ok: bool,
    pub out_path: Option<String>,
    pub error: Option<String>,
}

#[tauri::command]
pub fn convert_images(
    file_paths: Vec<String>,
    target_format: String,
    out_dir: String,
) -> Vec<FileResult> {
    file_paths
        .into_iter()
        .map(|file_path| {
            let stem = Path::new(&file_path)
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "output".to_string());
            let out_path = Path::new(&out_dir).join(format!("{stem}.{target_format}"));

            match image::open(&file_path) {
                Ok(img) => {
                    let fmt = match target_format.as_str() {
                        "jpg" | "jpeg" => image::ImageFormat::Jpeg,
                        "png" => image::ImageFormat::Png,
                        "webp" => image::ImageFormat::WebP,
                        "bmp" => image::ImageFormat::Bmp,
                        other => {
                            return FileResult {
                                file: file_path,
                                ok: false,
                                out_path: None,
                                error: Some(format!("Unsupported target format: {other}")),
                            }
                        }
                    };
                    match img.save_with_format(&out_path, fmt) {
                        Ok(_) => FileResult {
                            file: file_path,
                            ok: true,
                            out_path: Some(out_path.to_string_lossy().to_string()),
                            error: None,
                        },
                        Err(e) => FileResult {
                            file: file_path,
                            ok: false,
                            out_path: None,
                            error: Some(e.to_string()),
                        },
                    }
                }
                Err(e) => FileResult {
                    file: file_path,
                    ok: false,
                    out_path: None,
                    error: Some(e.to_string()),
                },
            }
        })
        .collect()
}

#[tauri::command]
pub fn image_to_base64(path: String) -> Result<String, String> {
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;
    Ok(general_purpose::STANDARD.encode(bytes))
}

#[tauri::command]
pub fn resize_images(
    file_paths: Vec<String>,
    width: u32,
    height: u32,
    maintain_aspect: bool,
    out_dir: String,
) -> Vec<FileResult> {
    file_paths
        .into_iter()
        .map(|file_path| {
            let path = Path::new(&file_path);
            let ext = path
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("png")
                .to_lowercase();
            let stem = path
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "output".to_string());
            let out_path = Path::new(&out_dir).join(format!("{stem}_resized.{ext}"));

            match image::open(&file_path) {
                Ok(img) => {
                    let resized = if maintain_aspect {
                        img.resize(width, height, image::imageops::FilterType::Lanczos3)
                    } else {
                        img.resize_exact(width, height, image::imageops::FilterType::Lanczos3)
                    };
                    let fmt = match ext.as_str() {
                        "jpg" | "jpeg" => image::ImageFormat::Jpeg,
                        "webp" => image::ImageFormat::WebP,
                        "bmp" => image::ImageFormat::Bmp,
                        _ => image::ImageFormat::Png,
                    };
                    match resized.save_with_format(&out_path, fmt) {
                        Ok(_) => FileResult {
                            file: file_path,
                            ok: true,
                            out_path: Some(out_path.to_string_lossy().to_string()),
                            error: None,
                        },
                        Err(e) => FileResult {
                            file: file_path,
                            ok: false,
                            out_path: None,
                            error: Some(e.to_string()),
                        },
                    }
                }
                Err(e) => FileResult {
                    file: file_path,
                    ok: false,
                    out_path: None,
                    error: Some(e.to_string()),
                },
            }
        })
        .collect()
}

#[derive(Serialize)]
pub struct CompressResult {
    pub file: String,
    pub ok: bool,
    pub out_path: Option<String>,
    pub original_size: Option<u64>,
    pub compressed_size: Option<u64>,
    pub error: Option<String>,
}

#[tauri::command]
pub fn compress_images(file_paths: Vec<String>, quality: u8, out_dir: String) -> Vec<CompressResult> {
    file_paths
        .into_iter()
        .map(|file_path| {
            let original_size = fs::metadata(&file_path).ok().map(|m| m.len());
            let stem = Path::new(&file_path)
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "output".to_string());
            // Compression always outputs JPEG regardless of input format — that's
            // the only format here with a real quality/size tradeoff knob. PNG is
            // lossless by design and won't shrink meaningfully the same way.
            let out_path = Path::new(&out_dir).join(format!("{stem}_compressed.jpg"));

            let img = match image::open(&file_path) {
                Ok(i) => i,
                Err(e) => {
                    return CompressResult {
                        file: file_path,
                        ok: false,
                        out_path: None,
                        original_size,
                        compressed_size: None,
                        error: Some(e.to_string()),
                    }
                }
            };

            let file = match fs::File::create(&out_path) {
                Ok(f) => f,
                Err(e) => {
                    return CompressResult {
                        file: file_path,
                        ok: false,
                        out_path: None,
                        original_size,
                        compressed_size: None,
                        error: Some(e.to_string()),
                    }
                }
            };
            let writer = std::io::BufWriter::new(file);
            let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(writer, quality);

            match encoder.encode_image(&img) {
                Ok(_) => {
                    let compressed_size = fs::metadata(&out_path).ok().map(|m| m.len());
                    CompressResult {
                        file: file_path,
                        ok: true,
                        out_path: Some(out_path.to_string_lossy().to_string()),
                        original_size,
                        compressed_size,
                        error: None,
                    }
                }
                Err(e) => CompressResult {
                    file: file_path,
                    ok: false,
                    out_path: None,
                    original_size,
                    compressed_size: None,
                    error: Some(e.to_string()),
                },
            }
        })
        .collect()
}

// ---------------- Zip ----------------

#[derive(Serialize)]
pub struct ExtractResult {
    pub out_path: String,
    pub entries: Vec<String>,
}

#[tauri::command]
pub fn extract_zip(zip_path: String, out_dir: String) -> Result<ExtractResult, String> {
    let file = fs::File::open(&zip_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    let stem = Path::new(&zip_path)
        .file_stem()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "extracted".to_string());
    let dest_dir = Path::new(&out_dir).join(stem);
    fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;

    let mut entries = Vec::new();
    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let out_file_path = match entry.enclosed_name() {
            Some(p) => dest_dir.join(p),
            None => continue,
        };
        if entry.name().ends_with('/') {
            fs::create_dir_all(&out_file_path).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = out_file_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }
            let mut out_file = fs::File::create(&out_file_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut entry, &mut out_file).map_err(|e| e.to_string())?;
        }
        entries.push(entry.name().to_string());
    }

    Ok(ExtractResult {
        out_path: dest_dir.to_string_lossy().to_string(),
        entries,
    })
}

#[tauri::command]
pub fn files_to_zip(
    file_paths: Vec<String>,
    out_dir: String,
    zip_name: String,
) -> Result<String, String> {
    let final_name = if zip_name.ends_with(".zip") {
        zip_name
    } else {
        format!("{zip_name}.zip")
    };
    let out_path = Path::new(&out_dir).join(final_name);
    let file = fs::File::create(&out_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);
    let options = zip::write::FileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated);

    for path_str in &file_paths {
        let path = Path::new(path_str);
        let name = path
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "file".to_string());
        zip.start_file(name, options).map_err(|e| e.to_string())?;
        let bytes = fs::read(path).map_err(|e| e.to_string())?;
        std::io::Write::write_all(&mut zip, &bytes).map_err(|e| e.to_string())?;
    }
    zip.finish().map_err(|e| e.to_string())?;

    Ok(out_path.to_string_lossy().to_string())
}
