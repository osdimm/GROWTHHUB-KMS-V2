/**
 * Password Hashing Utility using SHA-256 Web Crypto API
 */

export const hashPassword = async (plainText: string): Promise<string> => {
  if (!plainText) return '';
  
  // Standard SHA-256 hashing using Web Crypto API
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Basic fallback if crypto.subtle is unavailable in legacy environment
  let hash = 0;
  for (let i = 0; i < plainText.length; i++) {
    const char = plainText.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `legacy_hash_${Math.abs(hash)}`;
};

/**
 * Verify password against stored password string (supports both hashed & legacy plain text)
 */
export const verifyPassword = async (
  inputPlain: string,
  storedPassword?: string
): Promise<{ isValid: boolean; needsUpgrade: boolean; newHash: string }> => {
  if (!storedPassword) {
    return { isValid: false, needsUpgrade: false, newHash: '' };
  }

  const computedHash = await hashPassword(inputPlain);

  // 1. Direct Hash Match (64-char SHA-256 hex string)
  if (storedPassword.toLowerCase() === computedHash.toLowerCase()) {
    return { isValid: true, needsUpgrade: false, newHash: computedHash };
  }

  // 2. Legacy Plain Text Match -> Signal automatic upgrade to SHA-256 Hash
  if (storedPassword === inputPlain) {
    return { isValid: true, needsUpgrade: true, newHash: computedHash };
  }

  return { isValid: false, needsUpgrade: false, newHash: '' };
};
