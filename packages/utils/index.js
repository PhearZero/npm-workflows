export function encode(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decode(base64url) {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  return Buffer.from(base64, 'base64');
}

export function isBuffer(buffer) { return Buffer.isBuffer(buffer); }

export function isString(string) { return typeof string === 'string'; }