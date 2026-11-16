function base64UrlDecodeToString(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

export function decodeJwt(token) {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Not a valid JWT (expected 3 dot-separated parts).');
  }
  const header = JSON.parse(base64UrlDecodeToString(parts[0]));
  const payload = JSON.parse(base64UrlDecodeToString(parts[1]));
  return { header, payload, signature: parts[2] };
}
