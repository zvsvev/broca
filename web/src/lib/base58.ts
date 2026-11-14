const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Encode(bytes: Uint8Array): string {
  const digits = [0];
  for (let i = 0; i < bytes.length; i += 1) {
    let carry = bytes[i];
    for (let j = 0; j < digits.length; j += 1) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  let output = "";
  for (let i = 0; i < bytes.length && bytes[i] === 0; i += 1) {
    output += ALPHABET[0];
  }
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    output += ALPHABET[digits[i]];
  }
  return output;
}
