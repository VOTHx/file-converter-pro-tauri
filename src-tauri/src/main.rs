#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::convert_text,
            commands::read_text_file,
            commands::write_text_file,
            commands::convert_images,
            commands::image_to_base64,
            commands::resize_images,
            commands::compress_images,
            commands::extract_zip,
            commands::files_to_zip,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
