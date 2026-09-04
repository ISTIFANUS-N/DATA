/**
 * Generates a random password using the browser's CSPRNG. Mix of
 * upper/lower/digits/symbols, avoiding visually ambiguous characters
 * (0/O, 1/l/I) since people do sometimes need to type these by hand.
 */
export function generatePassword(length = 12): string {
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (v) => charset[v % charset.length]).join('');
}
