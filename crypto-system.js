// crypto-system.js - Système de chiffrement complet pour Vault Password Manager
// Basé sur ChaCha20-Poly1305 et BLAKE3

// --------------------------------------------------------------
// 1. GÉNÉRATION ET STOCKAGE DE LA MASTER KEY
// --------------------------------------------------------------

/**
 * Génère une master key sécurisée
 * @param {number} length - taille de la clé en bytes (défaut: 32 = 256 bits)
 * @returns {Uint8Array}
 */
function generateMasterKey(length = 32) {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Stocke la master key dans chrome.storage (local + sync), chiffrée par le PIN
 * @param {Uint8Array} masterKey - la master key à stocker
 * @param {string} pin - le PIN à 4 chiffres pour chiffrer la master key
 * @param {boolean} enableSync - si true, synchronise aussi dans chrome.storage.sync
 */
async function storeMasterKey(masterKey, pin, enableSync = true) {
  // Convertir la master key en hex pour le stockage
  const masterKeyHex = Array.from(masterKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Chiffrer la master key avec le PIN en utilisant AES-GCM (ancien système)
  const encryptedMasterKey = await window.cryptoUtils.encrypt(masterKeyHex, pin);
  
  // Stocker dans chrome.storage.local
  await new Promise((resolve) => {
    chrome.storage.local.set({ encryptedMasterKey }, resolve);
  });
  
  // Si la sync est activée, stocker aussi dans chrome.storage.sync
  if (enableSync) {
    try {
      await new Promise((resolve, reject) => {
        chrome.storage.sync.set({ 
          encryptedMasterKey,
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
    chrome.storage.local.get(['encryptedMasterKey'], resolve);
  });
  
  // Si pas en local, essayer chrome.storage.sync
  if (!stored.encryptedMasterKey) {
    console.log('Master Key absente en local, recherche dans sync...');
    stored = await new Promise((resolve) => {
      chrome.storage.sync.get(['encryptedMasterKey'], resolve);
    });
    
    // Si trouvée dans sync, la copier en local pour accès rapide
    if (stored.encryptedMasterKey) {
      console.log('Master Key trouvée dans sync, copie en local...');
      await new Promise((resolve) => {
        chrome.storage.local.set({ encryptedMasterKey: stored.encryptedMasterKey }, resolve);
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
 * Initialise le système de chiffrement (génère ou réutilise la master key)
 * Si une Master Key existe déjà, elle est réutilisée au lieu d'en créer une nouvelle
 * @param {string} pin - le PIN à 4 chiffres
 * @returns {Promise<void>}
 */
async function initializeCryptoSystem(pin) {
  // Vérifier si une master key existe déjà
  if (await hasMasterKey()) {
    console.log('✅ Master Key existante détectée - réutilisation au lieu d\'en créer une nouvelle');
    console.log('ℹ️  La Master Key existante reste chiffrée et peut être utilisée pour déchiffrer vos secrets');
    return;
  }
  
  // Générer une nouvelle master key
  console.log('🔑 Aucune Master Key détectée - génération d\'une nouvelle Master Key...');
  const masterKey = generateMasterKey(32);
  
  console.log('✅ Master Key générée (longueur:', masterKey.length, 'bytes)');
  
  // Stocker la master key chiffrée par le PIN
  await storeMasterKey(masterKey, pin);
  
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
  
  // Re-chiffrer avec le nouveau PIN
  await storeMasterKey(masterKey, newPin);
  
  console.log('Master key re-encrypted with new PIN');
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

