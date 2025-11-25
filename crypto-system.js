// crypto-system.js - Système de chiffrement complet pour Vault Password Manager
// Basé sur ChaCha20-Poly1305 et BLAKE3

// --------------------------------------------------------------
// 1. GÉNÉRATION ET STOCKAGE DE LA MASTER KEY
// --------------------------------------------------------------

/**
 * Génère une master key sécurisée (obsolète - utilisez deriveMasterKeyFromPassword)
 * @param {number} length - taille de la clé en bytes (défaut: 32 = 256 bits)
 * @returns {Uint8Array}
 */
function generateMasterKey(length = 32) {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Génère un sel déterministe à partir d'un identifiant utilisateur (kvMount/entity_name)
 * @param {string} userId - l'identifiant utilisateur (kvMount/entity_name)
 * @returns {Promise<Uint8Array>}
 */
async function generateDeterministicSalt(userId) {
  // Utiliser SHA-256 pour créer un sel de 16 bytes à partir de l'identifiant utilisateur
  const userIdBuffer = new TextEncoder().encode(`vault-master-key-salt-${userId}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', userIdBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  // Prendre les 16 premiers bytes comme sel
  return hashArray.slice(0, 16);
}

/**
 * Dérive une master key depuis un mot de passe utilisateur en utilisant PBKDF2
 * @param {string} password - le mot de passe utilisateur
 * @param {string} userId - l'identifiant utilisateur (kvMount/entity_name) pour générer un sel déterministe
 * @param {Uint8Array} salt - le sel pour la dérivation (optionnel, généré de manière déterministe si non fourni)
 * @param {number} iterations - nombre d'itérations PBKDF2 (défaut: 100000)
 * @param {number} length - taille de la clé en bytes (défaut: 32 = 256 bits)
 * @returns {Promise<{key: Uint8Array, salt: Uint8Array}>}
 */
async function deriveMasterKeyFromPassword(password, userId = null, salt = null, iterations = 100000, length = 32) {
  // Générer un sel déterministe si non fourni et qu'un userId est fourni
  if (!salt) {
    if (userId) {
      // Utiliser un sel déterministe basé sur l'identifiant utilisateur
      salt = await generateDeterministicSalt(userId);
    } else {
      // Fallback : générer un sel aléatoire (pour compatibilité avec l'ancien système)
      salt = crypto.getRandomValues(new Uint8Array(16));
    }
  }
  
  // Convertir le mot de passe en ArrayBuffer
  const passwordBuffer = new TextEncoder().encode(password);
  
  // Importer la clé pour PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Dériver la clé avec PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    length * 8 // longueur en bits
  );
  
  return {
    key: new Uint8Array(derivedBits),
    salt: salt
  };
}

/**
 * Stocke la master key dans chrome.storage (local + sync), chiffrée par le PIN
 * @param {Uint8Array} masterKey - la master key à stocker
 * @param {Uint8Array} salt - le sel utilisé pour la dérivation (optionnel)
 * @param {string} pin - le PIN à 4 chiffres pour chiffrer la master key
 * @param {boolean} enableSync - si true, synchronise aussi dans chrome.storage.sync
 */
async function storeMasterKey(masterKey, pin, salt = null, enableSync = true) {
  // Convertir la master key en hex pour le stockage
  const masterKeyHex = Array.from(masterKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Convertir le sel en hex si fourni
  let saltHex = null;
  if (salt) {
    saltHex = Array.from(salt)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  // Chiffrer la master key avec le PIN en utilisant AES-GCM (ancien système)
  const encryptedMasterKey = await window.cryptoUtils.encrypt(masterKeyHex, pin);
  
  // Préparer les données à stocker
  const dataToStore = { encryptedMasterKey };
  if (saltHex) {
    dataToStore.masterKeySalt = saltHex;
  }
  
  // Stocker dans chrome.storage.local
  await new Promise((resolve) => {
    chrome.storage.local.set(dataToStore, resolve);
  });
  
  // Si la sync est activée, stocker aussi dans chrome.storage.sync
  if (enableSync) {
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.sync.set({ 
          ...dataToStore,
          masterKeySyncEnabled: true,
          masterKeySyncDate: new Date().toISOString()
        }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
      console.log('Master Key synchronisée avec chrome.storage.sync');
    } catch (error) {
      console.warn('Impossible de synchroniser la Master Key:', error);
      // Ne pas échouer si la sync échoue, la Master Key est déjà en local
    }
  }
}

/**
 * Charge la master key depuis chrome.storage (local ou sync)
 * @param {string} pin - le PIN à 4 chiffres pour déchiffrer la master key
 * @returns {Promise<Uint8Array>}
 */
async function loadMasterKey(pin) {
  // Essayer d'abord chrome.storage.local
  let stored = await new Promise((resolve) => {
    chrome.storage.local.get(['encryptedMasterKey', 'masterKeySalt'], resolve);
  });
  
  // Si pas en local, essayer chrome.storage.sync
  if (!stored.encryptedMasterKey) {
    console.log('Master Key absente en local, recherche dans sync...');
    stored = await new Promise((resolve) => {
      chrome.storage.sync.get(['encryptedMasterKey', 'masterKeySalt'], resolve);
    });
    
    // Si trouvée dans sync, la copier en local pour accès rapide
    if (stored.encryptedMasterKey) {
      console.log('Master Key trouvée dans sync, copie en local...');
      await new Promise((resolve) => {
        chrome.storage.local.set({ 
          encryptedMasterKey: stored.encryptedMasterKey,
          masterKeySalt: stored.masterKeySalt
        }, resolve);
      });
    }
  }
  
  if (!stored.encryptedMasterKey) {
    throw new Error('Master key not initialized!');
  }
  
  // Déchiffrer la master key avec le PIN
  const masterKeyHex = await window.cryptoUtils.decrypt(stored.encryptedMasterKey, pin);
  
  // Convertir de hex vers Uint8Array
  const masterKey = new Uint8Array(
    masterKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );
  
  return masterKey;
}

/**
 * Récupère le sel de la master key depuis le stockage
 * @returns {Promise<Uint8Array|null>}
 */
async function getMasterKeySalt() {
  // Essayer d'abord chrome.storage.local
  let stored = await new Promise((resolve) => {
    chrome.storage.local.get(['masterKeySalt'], resolve);
  });
  
  // Si pas en local, essayer chrome.storage.sync
  if (!stored.masterKeySalt) {
    stored = await new Promise((resolve) => {
      chrome.storage.sync.get(['masterKeySalt'], resolve);
    });
  }
  
  if (!stored.masterKeySalt) {
    return null;
  }
  
  // Convertir de hex vers Uint8Array
  return new Uint8Array(
    stored.masterKeySalt.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
  );
}

/**
 * Vérifie si une master key existe déjà (local ou sync)
 * @returns {Promise<boolean>}
 */
async function hasMasterKey() {
  // Vérifier d'abord en local
  let stored = await new Promise((resolve) => {
    chrome.storage.local.get(['encryptedMasterKey'], resolve);
  });
  
  if (stored.encryptedMasterKey) {
    return true;
  }
  
  // Sinon vérifier dans sync
  stored = await new Promise((resolve) => {
    chrome.storage.sync.get(['encryptedMasterKey'], resolve);
  });
  
  return !!stored.encryptedMasterKey;
}

/**
 * Vérifie si le système utilise un mot de passe (présence d'un sel)
 * @returns {Promise<boolean>}
 */
async function usesPassword() {
  const salt = await getMasterKeySalt();
  return salt !== null;
}

/**
 * Vérifie si la synchronisation est activée
 * @returns {Promise<boolean>}
 */
async function isSyncEnabled() {
  const stored = await new Promise((resolve) => {
    chrome.storage.sync.get(['masterKeySyncEnabled'], resolve);
  });
  return !!stored.masterKeySyncEnabled;
}

/**
 * Active ou désactive la synchronisation de la Master Key
 * @param {boolean} enabled - true pour activer, false pour désactiver
 * @param {string} pin - le PIN pour accéder à la Master Key
 */
async function setSyncEnabled(enabled, pin) {
  if (enabled) {
    // Activer la sync : copier la Master Key en sync
    const masterKey = await loadMasterKey(pin);
    await storeMasterKey(masterKey, pin, true);
    console.log('Synchronisation activée');
  } else {
    // Désactiver la sync : supprimer de sync mais garder en local
    await new Promise((resolve) => {
      chrome.storage.sync.remove(['encryptedMasterKey', 'masterKeySyncEnabled', 'masterKeySyncDate'], resolve);
    });
    console.log('Synchronisation désactivée');
  }
}

/**
 * Récupère les informations de synchronisation
 * @returns {Promise<Object>}
 */
async function getSyncInfo() {
  const stored = await new Promise((resolve) => {
    chrome.storage.sync.get(['masterKeySyncEnabled', 'masterKeySyncDate', 'encryptedMasterKey'], resolve);
  });
  
  return {
    enabled: !!stored.masterKeySyncEnabled,
    syncDate: stored.masterKeySyncDate || null,
    hasSyncedKey: !!stored.encryptedMasterKey
  };
}

// --------------------------------------------------------------
// 2. DÉRIVATION DE SOUS-CLÉS AVEC BLAKE3
// --------------------------------------------------------------

/**
 * Dérive une sous-clé à partir de la master key en utilisant BLAKE3
 * @param {Uint8Array} masterKey - la master key
 * @param {string} context - identifiant unique (ex: "secrets", "user-42", "vault-secret-123")
 * @param {number} length - taille de la clé dérivée en bytes (défaut: 32)
 * @returns {Promise<Uint8Array>}
 */
async function deriveSubKey(masterKey, context, length = 32) {
  return await window.blake3.deriveKey(context, masterKey, { length });
}

// --------------------------------------------------------------
// 3. CHIFFREMENT / DÉCHIFFREMENT AVEC ChaCha20-Poly1305
// --------------------------------------------------------------

const cipher = new window.ChaCha20Poly1305();

/**
 * Chiffre un texte en clair avec une clé
 * @param {string|Uint8Array} plaintext - le texte à chiffrer
 * @param {Uint8Array} key - la clé de chiffrement (32 bytes)
 * @returns {Promise<Object>} - { iv, ciphertext, tag } encodés en base64
 */
async function encryptWithKey(plaintext, key) {
  // Générer un nonce aléatoire
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  
  // Chiffrer
  const result = await cipher.encrypt(plaintext, key, nonce);
  
  // Convertir en base64 pour le stockage
  return {
    iv: btoa(String.fromCharCode(...result.nonce)),
    ciphertext: btoa(String.fromCharCode(...result.ciphertext)),
    tag: btoa(String.fromCharCode(...result.tag))
  };
}

/**
 * Déchiffre un texte chiffré avec une clé
 * @param {Object} encrypted - { iv, ciphertext, tag } encodés en base64
 * @param {Uint8Array} key - la clé de déchiffrement (32 bytes)
 * @returns {Promise<string>} - le texte déchiffré
 */
async function decryptWithKey(encrypted, key) {
  // Décoder depuis base64
  const nonce = Uint8Array.from(atob(encrypted.iv), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(encrypted.ciphertext), c => c.charCodeAt(0));
  const tag = Uint8Array.from(atob(encrypted.tag), c => c.charCodeAt(0));
  
  // Déchiffrer
  const plaintext = await cipher.decrypt(ciphertext, key, nonce, tag);
  
  // Convertir en string
  return new TextDecoder().decode(plaintext);
}

// --------------------------------------------------------------
// 4. API HAUT NIVEAU POUR LES SECRETS
// --------------------------------------------------------------

/**
 * Chiffre un secret avec la master key et un contexte
 * @param {string} secretValue - la valeur du secret à chiffrer
 * @param {string} pin - le PIN pour déverrouiller la master key
 * @param {string} context - contexte de dérivation (ex: nom du secret)
 * @returns {Promise<Object>} - objet chiffré { iv, ciphertext, tag }
 */
async function encryptSecret(secretValue, pin, context) {
  // Charger la master key
  const masterKey = await loadMasterKey(pin);
  
  // Dériver une sous-clé pour ce secret
  const subKey = await deriveSubKey(masterKey, context);
  
  // Chiffrer le secret
  return await encryptWithKey(secretValue, subKey);
}

/**
 * Déchiffre un secret avec la master key et un contexte
 * @param {Object} encryptedSecret - objet chiffré { iv, ciphertext, tag }
 * @param {string} pin - le PIN pour déverrouiller la master key
 * @param {string} context - contexte de dérivation (doit être le même qu'au chiffrement)
 * @returns {Promise<string>} - la valeur déchiffrée du secret
 */
async function decryptSecret(encryptedSecret, pin, context) {
  // Charger la master key
  const masterKey = await loadMasterKey(pin);
  
  // Dériver la même sous-clé
  const subKey = await deriveSubKey(masterKey, context);
  
  // Déchiffrer le secret
  return await decryptWithKey(encryptedSecret, subKey);
}

/**
 * Initialise le système de chiffrement avec un mot de passe utilisateur
 * Dérive la master key depuis le mot de passe au lieu de la générer aléatoirement
 * @param {string} password - le mot de passe utilisateur (minimum 12 caractères)
 * @param {string} pin - le PIN à 4 chiffres pour chiffrer la master key dérivée
 * @param {string} userId - l'identifiant utilisateur (kvMount/entity_name) pour générer un sel déterministe
 * @returns {Promise<void>}
 */
async function initializeCryptoSystem(password, pin, userId = null) {
  // Vérifier si une master key existe déjà
  if (await hasMasterKey()) {
    console.log('✅ Master Key existante détectée - réutilisation au lieu d\'en créer une nouvelle');
    console.log('ℹ️  La Master Key existante reste chiffrée et peut être utilisée pour déchiffrer vos secrets');
    return;
  }
  
  // Valider le mot de passe
  if (!password || password.length < 12) {
    throw new Error('Le mot de passe doit contenir au moins 12 caractères');
  }
  
  // Récupérer le userId depuis le stockage si non fourni
  if (!userId) {
    const stored = await new Promise((resolve) => {
      chrome.storage.local.get(['kvMount'], resolve);
    });
    userId = stored.kvMount || null;
    
    if (!userId) {
      console.warn('⚠️ Aucun userId (kvMount) trouvé. Le sel sera aléatoire et ne pourra pas être recréé après réinstallation.');
    }
  }
  
  // Dériver la master key depuis le mot de passe avec un sel déterministe
  console.log('🔑 Dérivation de la Master Key depuis le mot de passe utilisateur...');
  const { key: masterKey, salt } = await deriveMasterKeyFromPassword(password, userId);
  
  console.log('✅ Master Key dérivée (longueur:', masterKey.length, 'bytes)');
  if (userId) {
    console.log('✅ Sel déterministe utilisé (basé sur userId:', userId, ')');
  }
  
  // Stocker la master key chiffrée par le PIN (avec le sel pour référence, mais il sera régénéré de manière déterministe)
  await storeMasterKey(masterKey, pin, salt);
  
  console.log('✅ Master Key stockée avec succès et chiffrée avec votre PIN');
}

/**
 * Change le PIN et re-chiffre la master key
 * @param {string} oldPin - l'ancien PIN
 * @param {string} newPin - le nouveau PIN
 * @returns {Promise<void>}
 */
async function changePinAndReencryptMasterKey(oldPin, newPin) {
  // Charger la master key avec l'ancien PIN
  const masterKey = await loadMasterKey(oldPin);
  
  // Récupérer le sel existant
  const salt = await getMasterKeySalt();
  
  // Re-chiffrer avec le nouveau PIN (en conservant le sel)
  await storeMasterKey(masterKey, newPin, salt);
  
  console.log('Master key re-encrypted with new PIN');
}

/**
 * Change le mot de passe Master Key (nécessite de re-dériver la clé)
 * @param {string} oldPassword - l'ancien mot de passe
 * @param {string} newPassword - le nouveau mot de passe
 * @param {string} pin - le PIN pour accéder à la master key actuelle
 * @param {string} userId - l'identifiant utilisateur (kvMount/entity_name) pour générer un sel déterministe
 * @returns {Promise<void>}
 */
async function changeMasterPassword(oldPassword, newPassword, pin, userId = null) {
  // Valider les mots de passe
  if (!oldPassword || oldPassword.length < 12) {
    throw new Error('L\'ancien mot de passe doit contenir au moins 12 caractères');
  }
  if (!newPassword || newPassword.length < 12) {
    throw new Error('Le nouveau mot de passe doit contenir au moins 12 caractères');
  }
  
  // Récupérer le userId depuis le stockage si non fourni
  if (!userId) {
    const stored = await new Promise((resolve) => {
      chrome.storage.local.get(['kvMount'], resolve);
    });
    userId = stored.kvMount || null;
  }
  
  // Dériver l'ancienne master key depuis l'ancien mot de passe avec le sel déterministe
  const { key: oldMasterKey } = await deriveMasterKeyFromPassword(oldPassword, userId);
  
  // Vérifier que l'ancienne master key correspond (en comparant avec celle stockée)
  const storedMasterKey = await loadMasterKey(pin);
  if (!arraysEqual(oldMasterKey, storedMasterKey)) {
    throw new Error('Ancien mot de passe incorrect');
  }
  
  // Dériver une nouvelle master key depuis le nouveau mot de passe (même sel déterministe)
  const { key: newMasterKey, salt: newSalt } = await deriveMasterKeyFromPassword(newPassword, userId);
  
  // Stocker la nouvelle master key (avec le sel pour référence)
  await storeMasterKey(newMasterKey, pin, newSalt);
  
  console.log('Master password changed successfully');
}

/**
 * Compare deux Uint8Array
 */
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// --------------------------------------------------------------
// 5. EXPORTER L'API
// --------------------------------------------------------------

if (typeof window !== 'undefined') {
  window.cryptoSystem = {
    // Gestion de la master key
    initializeCryptoSystem,
    hasMasterKey,
    loadMasterKey,
    storeMasterKey,
    changePinAndReencryptMasterKey,
    changeMasterPassword,
    deriveMasterKeyFromPassword,
    usesPassword,
    getMasterKeySalt,
    
    // Synchronisation Chrome
    isSyncEnabled,
    setSyncEnabled,
    getSyncInfo,
    
    // Chiffrement/déchiffrement de secrets
    encryptSecret,
    decryptSecret,
    
    // API bas niveau (pour usage avancé)
    generateMasterKey,
    deriveSubKey,
    encryptWithKey,
    decryptWithKey
  };
}

console.log('Crypto system initialized');

