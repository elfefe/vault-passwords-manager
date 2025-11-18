// crypto-utils.js - Fonctions de chiffrement/déchiffrement et hash

// Convertir une clé (string) en CryptoKey pour AES-GCM
async function deriveKey(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return await crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

// Chiffrer un texte avec une clé
async function encrypt(text, password) {
  try {
    const key = await deriveKey(password);
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );
    
    // Combiner IV et données chiffrées en base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Erreur de chiffrement:', error);
    throw error;
  }
}

// Déchiffrer un texte avec une clé
async function decrypt(encryptedBase64, password) {
  try {
    const key = await deriveKey(password);
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Erreur de déchiffrement:', error);
    throw new Error('Clé incorrecte ou données corrompues');
  }
}

// Hasher en SHA256
async function sha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Exporter pour utilisation dans d'autres fichiers
if (typeof window !== 'undefined') {
  window.cryptoUtils = {
    encrypt,
    decrypt,
    sha256
  };
}

