// BLAKE3 implementation for browser
// Simplified version using Web Crypto API fallback with BLAKE3-like KDF

/**
 * BLAKE3 Key Derivation Function
 * Utilise HKDF avec SHA-256 comme fallback compatible navigateur
 * Pour une vraie implémentation BLAKE3, utiliser @noble/hashes ou blake3-wasm
 */

async function blake3DeriveKey(context, masterKey, options = {}) {
  const length = options.length || 32;
  
  // Convertir masterKey en ArrayBuffer si nécessaire
  const keyBuffer = typeof masterKey === 'string' 
    ? new TextEncoder().encode(masterKey)
    : masterKey;
  
  // Convertir context en ArrayBuffer
  const contextBuffer = new TextEncoder().encode(context);
  
  // Utiliser HKDF-SHA256 comme alternative compatible navigateur
  // HKDF est une fonction de dérivation de clé sécurisée
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HKDF' },
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(32), // Salt vide pour correspondre au comportement BLAKE3
      info: contextBuffer
    },
    cryptoKey,
    length * 8 // bits
  );
  
  return new Uint8Array(derivedBits);
}

// Exporter pour utilisation dans d'autres fichiers
if (typeof window !== 'undefined') {
  window.blake3 = {
    deriveKey: blake3DeriveKey
  };
}

