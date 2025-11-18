// popup.js - interaction avec Vault KV v2
const categorySelect = document.getElementById('categorySelect');
const newCategoryBtn = document.getElementById('newCategoryBtn');
const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');
const listBtn = document.getElementById('listBtn');
const writeBtn = document.getElementById('writeBtn');
const deleteBtn = document.getElementById('deleteBtn');
const addFieldBtn = document.getElementById('addFieldBtn');
const generateBtn = document.getElementById('generateBtn');
const newEntryBtn = document.getElementById('newEntryBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
const secretTableBody = document.getElementById('secretTableBody');
const toast = document.getElementById('toast');
const optionsLink = document.getElementById('optionsLink');
const authModal = document.getElementById('authModal');
const authPinInput = document.getElementById('authPinInput');
const authError = document.getElementById('authError');
const setupModal = document.getElementById('setupModal');
const setupTokenInput = document.getElementById('setupTokenInput');
const setupTokenBtn = document.getElementById('setupTokenBtn');
const setupError = document.getElementById('setupError');
const createPinModal = document.getElementById('createPinModal');
const createPinInput = document.getElementById('createPinInput');
const createPinConfirm = document.getElementById('createPinConfirm');
const createPinBtn = document.getElementById('createPinBtn');
const createPinError = document.getElementById('createPinError');

let settings = { vaultUrl: '', vaultToken: '', kvMount: 'passwords' };
let isAuthenticated = false;
let currentDecryptedToken = null;
let pendingToken = null; // Token en attente de configuration
let categories = []; // Liste des catégories

// Limiter les inputs PIN à 4 chiffres et valider automatiquement quand 4 chiffres sont entrés
authPinInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.slice(0, 4);
  // Valider automatiquement quand 4 chiffres sont entrés
  if (e.target.value.length === 4 && /^\d{4}$/.test(e.target.value)) {
    handleAuth();
  }
});

authPinInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleAuth();
  }
});

createPinInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.slice(0, 4);
});

createPinConfirm.addEventListener('input', (e) => {
  e.target.value = e.target.value.slice(0, 4);
});

setupTokenInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    setupTokenBtn.click();
  }
});

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Toast notification
function showToast(message, type = 'info') {
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Afficher le modal d'authentification
function showAuthModal() {
  authModal.classList.add('show');
  authPinInput.value = '';
  authError.style.display = 'none';
  authPinInput.focus();
}

// Cacher le modal d'authentification
function hideAuthModal() {
  authModal.classList.remove('show');
}

// Afficher le modal de configuration initiale
function showSetupModal() {
  setupModal.classList.add('show');
  setupTokenInput.value = '';
  setupError.style.display = 'none';
  setupTokenInput.focus();
}

// Cacher le modal de configuration initiale
function hideSetupModal() {
  setupModal.classList.remove('show');
}

// Afficher le modal de création de PIN
function showCreatePinModal() {
  createPinModal.classList.add('show');
  createPinInput.value = '';
  createPinConfirm.value = '';
  createPinError.style.display = 'none';
  createPinInput.focus();
}

// Cacher le modal de création de PIN
function hideCreatePinModal() {
  createPinModal.classList.remove('show');
}

// Vérifier si le mount path existe, sinon le créer
// Retourne { success: boolean, message?: string }
async function ensureMountPath(vaultUrl, token, mountPath) {
  try {
    // Vérifier si le mount existe en listant tous les mounts
    const response = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/sys/mounts`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': token,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { errors: [errorText] };
      }
      const errorMsg = error.errors?.[0] || `Erreur ${response.status} lors de la liste des mounts`;
      return { success: false, message: errorMsg };
    }
    
    const mountsData = await response.json();
    const mounts = mountsData.data || {};
    
    // Vérifier si le mount existe (avec ou sans slash final)
    const mountPathWithSlash = mountPath.endsWith('/') ? mountPath : `${mountPath}/`;
    const mountExists = mounts[mountPathWithSlash] !== undefined || mounts[mountPath] !== undefined;
    
    if (mountExists) {
      // Le mount existe déjà
      console.log(`Mount "${mountPath}" existe déjà`);
      return { success: true };
    }
    
    // Le mount n'existe pas, le créer
    console.log(`Création du mount "${mountPath}"...`);
    const createResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/sys/mounts/${mountPath}`, {
      method: 'POST',
      headers: {
        'X-Vault-Token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'kv',
        options: {
          version: '2'
        }
      })
    });
    
    const createResponseText = await createResponse.text();
    console.log('Réponse création mount:', createResponse.status, createResponseText);
    
    if (createResponse.ok || createResponse.status === 204) {
      // Vérifier que le mount a bien été créé en relisant la liste des mounts
      await new Promise(resolve => setTimeout(resolve, 500)); // Attendre un peu
      const verifyResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/sys/mounts`, {
        method: 'GET',
        headers: {
          'X-Vault-Token': token,
          'Content-Type': 'application/json'
        }
      });
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        const verifyMounts = verifyData.data || {};
        const mountPathWithSlash = mountPath.endsWith('/') ? mountPath : `${mountPath}/`;
        const mountCreated = verifyMounts[mountPathWithSlash] !== undefined || verifyMounts[mountPath] !== undefined;
        
        if (mountCreated) {
          console.log('Mount créé et vérifié avec succès');
          return { success: true };
        } else {
          console.warn('Mount créé mais non trouvé dans la liste');
          return { success: false, message: 'Mount créé mais non trouvé dans la liste' };
        }
      } else {
        console.warn('Impossible de vérifier le mount après création:', verifyResponse.status);
        return { success: false, message: 'Mount créé mais non vérifié' };
      }
    } else {
      let error;
      try {
        error = JSON.parse(createResponseText);
      } catch {
        error = { errors: [createResponseText] };
      }
      const errorMsg = error.errors?.[0] || `Erreur ${createResponse.status} lors de la création du mount`;
      console.error('Erreur création mount:', errorMsg);
      return { success: false, message: errorMsg };
    }
  } catch (error) {
    console.error('Exception ensureMountPath:', error);
    return { success: false, message: error.message || 'Erreur réseau lors de la vérification du mount' };
  }
}

// Authentifier l'utilisateur avec le PIN
async function authenticate(pin) {
  try {
    // Récupérer les données stockées
    const stored = await new Promise((resolve) => {
      chrome.storage.local.get(['encryptedToken', 'pinHash', 'vaultUrl', 'kvMount'], resolve);
    });
    
    if (!stored.encryptedToken || !stored.pinHash) {
      throw new Error('Configuration incomplète. Veuillez configurer l\'extension dans les options.');
    }
    
    // Hasher le PIN saisi
    const pinHash = await window.cryptoUtils.sha256(pin);
    
    // Vérifier le hash
    if (pinHash !== stored.pinHash) {
      throw new Error('Code incorrect');
    }
    
    // Déchiffrer le token
    const decryptedToken = await window.cryptoUtils.decrypt(stored.encryptedToken, pin);
    
    // Vérifier que le token est valide
    const testResponse = await fetch(`${stored.vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': decryptedToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!testResponse.ok) {
      throw new Error('Token invalide. Veuillez reconfigurer l\'extension.');
    }
    
    // Créer le mount path s'il n'existe pas après authentification (optionnel)
    const mountPath = stored.kvMount || 'passwords';
    const mountResult = await ensureMountPath(stored.vaultUrl || 'https://vault.exem.fr/', decryptedToken, mountPath);
    if (mountResult.success) {
      console.log('Mount path vérifié/créé avec succès');
    } else {
      const errorMessage = mountResult.message || 'Le mount path n\'a pas pu être vérifié/créé. Vérifiez les permissions du token.';
      console.warn('Mount path:', errorMessage);
      showToast(`Mount "${mountPath}": ${errorMessage}`, 'error');
    }
    
    // Authentification réussie
    currentDecryptedToken = decryptedToken;
    settings.vaultUrl = stored.vaultUrl || 'https://vault.exem.fr/';
    settings.kvMount = mountPath;
    settings.vaultToken = decryptedToken;
    isAuthenticated = true;
    
    // Charger les catégories depuis Vault après authentification
    await loadCategoriesFromVault();
    
    hideAuthModal();
    return true;
  } catch (error) {
    throw error;
  }
}

// Gestionnaire d'authentification rapide
let authResolve = null;

async function handleAuth() {
  const pin = authPinInput.value;
  
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    authError.textContent = 'Le code doit contenir exactement 4 chiffres';
    authError.style.display = 'block';
    return;
  }
  
  try {
    await authenticate(pin);
    authError.style.display = 'none';
    if (authResolve) {
      authResolve(true);
      authResolve = null;
    }
  } catch (error) {
    authError.textContent = error.message || 'Erreur d\'authentification';
    authError.style.display = 'block';
    authPinInput.value = '';
    authPinInput.focus();
    if (authResolve) {
      authResolve(false);
      authResolve = null;
    }
  }
}

// Le bouton de validation a été retiré, la validation se fait automatiquement après 4 chiffres

// Vérifier l'authentification avant une action
async function ensureAuthenticated() {
  if (isAuthenticated && currentDecryptedToken) {
    return true;
  }
  
  return new Promise((resolve) => {
    showAuthModal();
    authResolve = resolve;
  });
}

// utilitaires pour gestion UI
function clearSecretFields() {
  secretTableBody.innerHTML = '';
}

function addField(key = '', value = '', isPassword = false) {
  const row = document.createElement('tr');
  
  // Cellule clé
  const keyCell = document.createElement('td');
  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.placeholder = 'clé';
  keyInput.value = key;
  keyCell.appendChild(keyInput);
  
  // Cellule valeur avec boutons
  const valueCell = document.createElement('td');
  valueCell.className = 'value-cell';
  const valInput = document.createElement('input');
  valInput.type = isPassword ? 'password' : 'text';
  valInput.placeholder = 'valeur';
  valInput.value = value;
  if (isPassword || key.toLowerCase().includes('password') || key.toLowerCase().includes('pass') || key.toLowerCase().includes('pwd')) {
    valInput.type = 'password';
    valInput.classList.add('password-field');
  }
  valueCell.appendChild(valInput);
  
  // Bouton toggle visibilité (visible au survol)
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'action-btn toggle-btn';
  toggleBtn.title = valInput.type === 'password' ? 'Afficher' : 'Masquer';
  toggleBtn.innerHTML = valInput.type === 'password' 
    ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
    : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
  toggleBtn.addEventListener('click', () => {
    if (valInput.type === 'password') {
      valInput.type = 'text';
      toggleBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      toggleBtn.title = 'Masquer';
    } else {
      valInput.type = 'password';
      toggleBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      toggleBtn.title = 'Afficher';
    }
  });
  valueCell.appendChild(toggleBtn);
  
  // Bouton copier (visible au survol uniquement)
  const copyBtn = document.createElement('button');
  copyBtn.className = 'action-btn copy-btn';
  copyBtn.title = 'Copier';
  copyBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(valInput.value);
      copyBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      copyBtn.title = 'Copié!';
      showToast('Valeur copiée', 'success');
      setTimeout(() => {
        copyBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        copyBtn.title = 'Copier';
      }, 2000);
    } catch (err) {
      valInput.select();
      document.execCommand('copy');
      copyBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      showToast('Valeur copiée', 'success');
      setTimeout(() => {
        copyBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
      }, 2000);
    }
  });
  valueCell.appendChild(copyBtn);
  
  // Cellule actions (supprimer)
  const actionCell = document.createElement('td');
  actionCell.className = 'row-actions';
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'action-btn delete-btn';
  deleteBtn.title = 'Supprimer';
  deleteBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
  deleteBtn.addEventListener('click', () => {
    row.style.opacity = '0';
    row.style.transform = 'translateX(-10px)';
    setTimeout(() => row.remove(), 150);
  });
  actionCell.appendChild(deleteBtn);
  
  row.appendChild(keyCell);
  row.appendChild(valueCell);
  row.appendChild(actionCell);
  
  // Animation d'entrée
  row.style.opacity = '0';
  row.style.transform = 'translateY(-5px)';
  secretTableBody.appendChild(row);
  setTimeout(() => {
    row.style.transition = 'all 0.15s ease';
    row.style.opacity = '1';
    row.style.transform = 'translateY(0)';
  }, 10);
  
  // Auto-détection du type password lors de la saisie de la clé
  keyInput.addEventListener('input', () => {
    const keyLower = keyInput.value.toLowerCase();
    if (keyLower.includes('password') || keyLower.includes('pass') || keyLower.includes('pwd')) {
      valInput.type = 'password';
      valInput.classList.add('password-field');
      toggleBtn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      toggleBtn.title = 'Afficher';
    }
  });
}

// Bouton "Nouvelle entrée" intelligent
newEntryBtn.addEventListener('click', () => {
  const rows = Array.from(secretTableBody.querySelectorAll('tr'));
  const hasEmptyRows = rows.some(row => {
    const keyInput = row.querySelector('td:first-child input');
    const valInput = row.querySelector('td:nth-child(2) input');
    return !keyInput.value.trim() && !valInput.value.trim();
  });
  
  if (!hasEmptyRows) {
    addField('', '');
    showToast('Nouvelle entrée ajoutée', 'success');
  } else {
    showToast('Une entrée vide existe déjà', 'info');
  }
});

// Bouton "Copier tout"
copyAllBtn.addEventListener('click', async () => {
  const rows = Array.from(secretTableBody.querySelectorAll('tr'));
  if (rows.length === 0) {
    showToast('Aucune entrée à copier', 'error');
    return;
  }
  
  const data = {};
  rows.forEach(row => {
    const key = row.querySelector('td:first-child input').value.trim();
    const val = row.querySelector('td:nth-child(2) input').value;
    if (key) data[key] = val;
  });
  
  if (Object.keys(data).length === 0) {
    showToast('Aucune entrée valide à copier', 'error');
    return;
  }
  
  const text = Object.entries(data)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  
  try {
    await navigator.clipboard.writeText(text);
    showToast('Tout copié dans le presse-papiers', 'success');
  } catch (err) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Tout copié dans le presse-papiers', 'success');
  }
});

addFieldBtn.addEventListener('click', () => {
  addField();
  showToast('Champ ajouté', 'success');
});

generateBtn.addEventListener('click', () => {
  const pw = generatePassword(16);
  addField('password', pw, true);
  showToast('Mot de passe généré', 'success');
});

// password generator
function generatePassword(length = 16) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  let str = '';
  for (let i = 0; i < length; i++) {
    str += chars[array[i] % chars.length];
  }
  return str;
}

// Vault API helpers (KV v2)
function vaultFetch(path, opts = {}) {
  if (!settings.vaultUrl || !settings.vaultToken) {
    return Promise.reject(new Error('Vault non configuré. Ouvre les options.'));
  }
  const headers = opts.headers || {};
  headers['X-Vault-Token'] = settings.vaultToken;
  headers['Content-Type'] = 'application/json';
  opts.headers = headers;
  const url = settings.vaultUrl.replace(/\/$/, '') + path;
  return fetch(url, opts).then(async (r) => {
    const text = await r.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch(e) { json = { raw: text }; }
    if (!r.ok) {
      const err = new Error('Vault API error: ' + r.status);
      err.response = json;
      throw err;
    }
    return json;
  });
}

function listSecrets(listPath) {
  const mount = settings.kvMount;
  // Pour un chemin vide, ne pas ajouter de slash après metadata
  let p;
  if (!listPath || listPath === '') {
    p = `/v1/${mount}/metadata?list=true`;
  } else {
    // S'assurer que le chemin ne commence pas par / et se termine par / pour les dossiers
    const cleanPath = listPath.replace(/^\/+/, '').replace(/\/+$/, '');
    p = `/v1/${mount}/metadata/${encodeURIComponent(cleanPath)}?list=true`;
  }
  return vaultFetch(p, { method: 'GET' });
}

function readSecret(secretPath) {
  const mount = settings.kvMount;
  const p = `/v1/${mount}/data/${encodeURIComponent(secretPath)}`;
  return vaultFetch(p, { method: 'GET' });
}

function writeSecret(secretPath, dataObj) {
  const mount = settings.kvMount;
  const p = `/v1/${mount}/data/${encodeURIComponent(secretPath)}`;
  return vaultFetch(p, { method: 'POST', body: JSON.stringify({ data: dataObj }) });
}

function deleteSecret(secretPath) {
  const mount = settings.kvMount;
  // Dans Vault KV v2, supprimer les métadonnées supprime aussi le secret
  const p = `/v1/${mount}/metadata/${encodeURIComponent(secretPath)}`;
  return vaultFetch(p, { method: 'DELETE' });
}

// Fonction pour supprimer complètement un secret (data + metadata)
async function deleteSecretCompletely(secretPath) {
  const mount = settings.kvMount;
  // Supprimer d'abord les données, puis les métadonnées
  try {
    // Essayer de supprimer les données (peut échouer si le secret n'existe pas)
    const dataPath = `/v1/${mount}/data/${encodeURIComponent(secretPath)}`;
    try {
      await vaultFetch(dataPath, { method: 'DELETE' });
    } catch (e) {
      // Ignorer si le secret data n'existe pas
    }
  } catch (e) {
    // Ignorer
  }
  // Supprimer les métadonnées (cela supprime aussi le secret dans KV v2)
  return deleteSecret(secretPath);
}

// wire buttons avec authentification
listBtn.addEventListener('click', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  
  // Recharger les catégories depuis Vault
  await loadCategoriesFromVault();
  
  const path = getCurrentPath();
  if (!path) {
    showToast('Aucune catégorie disponible', 'info');
    return;
  }
  
  try {
    const res = await listSecrets(path);
    const keys = (res && res.data && res.data.keys) || [];
    if (keys.length === 0) {
      showToast('Aucune clé trouvée', 'info');
    } else {
      showToast(`${keys.length} clé(s) trouvée(s)`, 'success');
    }
  } catch (e) {
    showToast('Erreur lors du listing: ' + (e.response?.errors?.[0] || e.message), 'error');
  }
});

// Fonction pour charger automatiquement les secrets d'une catégorie
async function loadCategorySecrets(categoryPath) {
  if (!categoryPath) {
    clearSecretFields();
    return;
  }
  
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  
  try {
    const res = await readSecret(categoryPath);
    const data = (res && res.data && res.data.data) || {};
    clearSecretFields();
    if (Object.keys(data).length === 0) {
      // Secret vide, ne rien afficher
    } else {
      Object.entries(data).forEach(([k, v]) => {
        const isPwd = k.toLowerCase().includes('password') || k.toLowerCase().includes('pass') || k.toLowerCase().includes('pwd');
        addField(k, v, isPwd);
      });
    }
  } catch (e) {
    // Si le secret n'existe pas, simplement vider les champs
    clearSecretFields();
  }
}

writeBtn.addEventListener('click', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  
  const path = getCurrentPath();
  if (!path) { 
    showToast('Sélectionnez une catégorie ou créez-en une nouvelle', 'error'); 
    return; 
  }
  const rows = Array.from(secretTableBody.querySelectorAll('tr'));
  const obj = {};
  rows.forEach(row => {
    const key = row.querySelector('td:first-child input').value.trim();
    const val = row.querySelector('td:nth-child(2) input').value;
    if (key) obj[key] = val;
  });
  
  try {
    // Vérifier si le secret existe déjà dans Vault
    let secretExists = false;
    try {
      await readSecret(path);
      secretExists = true;
    } catch (e) {
      secretExists = false;
    }
    
    // Si le secret n'existe pas et qu'il n'y a pas de champs, ne rien faire
    if (!secretExists && Object.keys(obj).length === 0) {
      showToast('Le secret a été supprimé. Ajoutez des champs pour créer un nouveau secret.', 'info');
      return;
    }
    
    // Si le secret existe mais qu'il n'y a pas de champs, c'est une erreur
    if (secretExists && Object.keys(obj).length === 0) {
      showToast('Aucun champ à sauvegarder', 'error');
      return;
    }
    
    // Écrire le secret (cela crée le dossier passwords/nom_de_la_categorie si c'est le premier secret)
    await writeSecret(path, obj);
    
    // Attendre un peu pour que Vault mette à jour
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Recharger les catégories et s'assurer que la catégorie est toujours sélectionnée
    await loadCategoriesFromVault();
    
    // S'assurer que la catégorie est toujours sélectionnée après rechargement et recharger les secrets
    setTimeout(async () => {
      if (categories.includes(path)) {
        categorySelect.value = path;
        await loadCategorySecrets(path);
      }
    }, 100);
    
    showToast('Secret sauvegardé avec succès', 'success');
  } catch (e) {
    showToast('Erreur: ' + (e.response?.errors?.[0] || e.message), 'error');
  }
});

deleteBtn.addEventListener('click', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  
  const path = getCurrentPath();
  if (!path) { 
    showToast('Sélectionnez une catégorie', 'error'); 
    return; 
  }
  if (!confirm(`Supprimer la metadata du secret "${path}" ? Cette action peut être irréversible.`)) return;
  try {
    // Vérifier si le secret existe avant suppression
    let secretExistsBefore = false;
    try {
      await readSecret(path);
      secretExistsBefore = true;
    } catch (e) {
      secretExistsBefore = false;
    }
    
    if (!secretExistsBefore) {
      showToast('Le secret n\'existe pas', 'error');
      return;
    }
    
    // Supprimer le secret complètement
    await deleteSecretCompletely(path);
    
    // Vérifier s'il reste des secrets dans la catégorie après suppression
    await new Promise(resolve => setTimeout(resolve, 300)); // Attendre que Vault mette à jour
    
    // Vérifier si le secret principal existe encore
    let secretExistsAfter = false;
    try {
      await readSecret(path);
      secretExistsAfter = true;
    } catch (e) {
      secretExistsAfter = false;
    }
    
    // Lister tous les secrets dans le dossier de la catégorie (sous-dossiers)
    let hasSubSecrets = false;
    try {
      const subSecrets = await listAllSecretsInCategory(path);
      // Filtrer pour exclure le fichier categories s'il existe dans la liste
      const realSubSecrets = subSecrets.filter(s => {
        const secretName = s.endsWith('/') ? s.slice(0, -1) : s;
        return secretName !== 'categories';
      });
      hasSubSecrets = realSubSecrets.length > 0;
    } catch (e) {
      // Si on ne peut pas lister, considérer qu'il n'y a pas de sous-secrets
      hasSubSecrets = false;
    }
    
    // Si c'était le dernier secret (pas de secret principal et pas de sous-secrets), supprimer le dossier
    if (!secretExistsAfter && !hasSubSecrets) {
      // Supprimer tous les secrets restants dans le dossier (s'il y en a)
      try {
        const remainingSecrets = await listAllSecretsInCategory(path);
        for (const secret of remainingSecrets) {
          const secretPath = secret.endsWith('/') 
            ? `${path}/${secret.slice(0, -1)}` 
            : `${path}/${secret}`;
          try {
            await deleteSecretCompletely(secretPath);
          } catch (e) {
            console.warn(`Impossible de supprimer ${secretPath}:`, e);
          }
        }
        // Attendre un peu pour que Vault mette à jour
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn('Erreur lors de la suppression du dossier de la catégorie:', e);
      }
      showToast('Dernier secret supprimé, dossier de la catégorie supprimé', 'success');
    } else {
      showToast('Suppression réussie', 'success');
    }
    
    clearSecretFields();
    
    // Recharger les catégories
    await loadCategoriesFromVault();
    // S'assurer que la catégorie est toujours sélectionnée si elle existe dans le fichier categories
    setTimeout(async () => {
      if (categories.includes(path)) {
        categorySelect.value = path;
        await loadCategorySecrets(path);
      }
    }, 100);
  } catch (e) {
    showToast('Erreur: ' + (e.response?.errors?.[0] || e.message), 'error');
  }
});

// Gestion de la configuration initiale
setupTokenBtn.addEventListener('click', async () => {
  const token = setupTokenInput.value.trim();
  if (!token) {
    setupError.textContent = 'Veuillez entrer un token';
    setupError.style.display = 'block';
    return;
  }
  
  const vaultUrl = settings.vaultUrl || 'https://vault.exem.fr/';
  
  try {
    // Vérifier que le token est valide
    const testResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': token,
        'Content-Type': 'application/json'
      }
    });
    
    if (!testResponse.ok) {
      throw new Error('Token invalide. Vérifiez votre token Vault.');
    }
    
    // Créer le mount path s'il n'existe pas
    const mountPath = settings.kvMount || 'passwords';
    const mountResult = await ensureMountPath(vaultUrl, token, mountPath);
    if (!mountResult.success) {
      const errorMsg = mountResult.message || 'Impossible de créer le mount path';
      setupError.textContent = `Erreur mount: ${errorMsg}. Vérifiez les permissions du token.`;
      setupError.style.display = 'block';
      return;
    }
    
    // Token valide et mount créé, stocker temporairement et demander la création du PIN
    pendingToken = token;
    hideSetupModal();
    showCreatePinModal();
  } catch (error) {
    setupError.textContent = error.message || 'Erreur lors de la validation du token';
    setupError.style.display = 'block';
  }
});

// Gestion de la création du PIN
createPinBtn.addEventListener('click', async () => {
  const pin = createPinInput.value;
  const pinConfirmValue = createPinConfirm.value;
  
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    createPinError.textContent = 'Le code doit contenir exactement 4 chiffres';
    createPinError.style.display = 'block';
    return;
  }
  
  if (pin !== pinConfirmValue) {
    createPinError.textContent = 'Les codes ne correspondent pas';
    createPinError.style.display = 'block';
    return;
  }
  
  if (!pendingToken) {
    createPinError.textContent = 'Erreur: token manquant';
    createPinError.style.display = 'block';
    return;
  }
  
  createPinError.style.display = 'none';
  
  try {
    // Hasher le PIN en SHA256
    const pinHash = await window.cryptoUtils.sha256(pin);
    
    // Chiffrer le token avec le PIN
    const encryptedToken = await window.cryptoUtils.encrypt(pendingToken, pin);
    
    // Sauvegarder dans chrome.storage.local
    await new Promise((resolve) => {
      chrome.storage.local.set({
        vaultUrl: settings.vaultUrl || 'https://vault.exem.fr/',
        kvMount: settings.kvMount || 'passwords',
        encryptedToken: encryptedToken,
        pinHash: pinHash
      }, resolve);
    });
    
    hideCreatePinModal();
    showToast('Configuration enregistrée avec succès !', 'success');
    pendingToken = null;
    
    // Maintenant demander l'authentification rapide pour utiliser l'extension
    setTimeout(() => {
      showAuthModal();
    }, 500);
  } catch (error) {
    createPinError.textContent = error.message || 'Erreur lors de l\'enregistrement';
    createPinError.style.display = 'block';
  }
});

// Fonction utilitaire pour vérifier si un chemin est le fichier categories à la racine
function isPlaceholder(secretPath) {
  return secretPath === 'categories';
}

// Fonction utilitaire pour obtenir le chemin du fichier categories à la racine
function getPlaceholderPath() {
  return 'categories';
}

// Fonction utilitaire pour charger la liste des catégories depuis le fichier categories
async function loadCategoriesFromFile() {
  try {
    const res = await readSecret('categories');
    const categoriesList = (res && res.data && res.data.data && res.data.data.categories) || [];
    return Array.isArray(categoriesList) ? categoriesList : [];
  } catch (e) {
    // Si le fichier n'existe pas, retourner une liste vide
    console.log('Fichier categories n\'existe pas encore');
    return [];
  }
}

// Fonction utilitaire pour sauvegarder la liste des catégories dans le fichier categories
async function saveCategoriesToFile() {
  try {
    await writeSecret('categories', { categories: categories });
    console.log('Liste des catégories sauvegardée dans categories');
  } catch (e) {
    console.error('Erreur lors de la sauvegarde des catégories:', e);
    throw e;
  }
}

// Fonction utilitaire pour lister tous les secrets dans une catégorie (y compris les sous-dossiers)
async function listAllSecretsInCategory(categoryName) {
  try {
    const res = await listSecrets(categoryName);
    return (res && res.data && res.data.keys) || [];
  } catch (e) {
    console.error('Erreur lors du listing des secrets dans la catégorie:', e);
    return [];
  }
}

// Fonction utilitaire pour supprimer le fichier categories à la racine
async function removePlaceholder() {
  try {
    const placeholderPath = getPlaceholderPath();
    await deleteSecret(placeholderPath);
    console.log('Fichier categories supprimé');
  } catch (e) {
    console.warn('Impossible de supprimer le fichier categories:', e);
    // Ne pas échouer si le fichier categories n'existe pas
  }
}

// Fonction utilitaire pour supprimer complètement une catégorie (dossier + fichier categories)
async function removeCategory(categoryName) {
  try {
    // 1. Supprimer le secret principal de la catégorie s'il existe (passwords/nom_categorie)
    try {
      await deleteSecretCompletely(categoryName);
      console.log(`Secret principal ${categoryName} supprimé`);
    } catch (e) {
      // Le secret principal n'existe peut-être pas, continuer
      console.log(`Secret principal de ${categoryName} n'existe pas ou déjà supprimé`);
    }
    
    // 2. Supprimer tous les secrets dans le dossier de la catégorie (passwords/nom_categorie/*)
    try {
      const secrets = await listAllSecretsInCategory(categoryName);
      console.log(`Secrets trouvés dans ${categoryName}:`, secrets);
      for (const secret of secrets) {
        const secretPath = secret.endsWith('/') 
          ? `${categoryName}/${secret.slice(0, -1)}` 
          : `${categoryName}/${secret}`;
        try {
          await deleteSecretCompletely(secretPath);
          console.log(`Secret ${secretPath} supprimé`);
        } catch (e) {
          console.warn(`Impossible de supprimer ${secretPath}:`, e);
        }
      }
      // Attendre un peu pour que Vault mette à jour
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      // Si on ne peut pas lister les secrets, le dossier n'existe peut-être pas
      console.log(`Impossible de lister les secrets de ${categoryName}, le dossier n'existe peut-être pas`);
    }
    
    // 3. Retirer la catégorie de la liste dans le fichier categories (categories/nom_categorie)
    categories = categories.filter(cat => cat !== categoryName);
    await saveCategoriesToFile();
    console.log(`Catégorie ${categoryName} retirée du fichier categories`);
    
    // 4. Recharger les catégories et mettre à jour l'interface
    await loadCategoriesFromVault();
    
    // 5. Réinitialiser la sélection de catégorie
    if (categories.length > 0) {
      categorySelect.value = categories[0];
    } else {
      categorySelect.value = '';
    }
    clearSecretFields();
    
    console.log(`Catégorie ${categoryName} complètement supprimée (passwords/${categoryName} et categories/${categoryName})`);
  } catch (e) {
    console.error(`Erreur lors de la suppression de la catégorie ${categoryName}:`, e);
    throw e;
  }
}

// Fonction utilitaire pour s'assurer que le fichier categories existe à la racine
async function ensureCategoriesFileExists() {
  try {
    // Vérifier si le fichier existe déjà
    try {
      await readSecret('categories');
      return true;
    } catch (e) {
      // Le fichier n'existe pas, le créer avec une liste vide
      await writeSecret('categories', { categories: [] });
      return true;
    }
  } catch (e) {
    console.error('Erreur lors de la création du fichier categories:', e);
    return false;
  }
}

// Charger les catégories depuis Vault
async function loadCategoriesFromVault() {
  if (!isAuthenticated || !settings.vaultToken) {
    // Pas encore authentifié, initialiser avec une liste vide
    categories = [];
    updateCategorySelect();
    return;
  }
  
  try {
    // S'assurer que le fichier categories existe
    await ensureCategoriesFileExists();
    
    // Charger la liste des catégories depuis le fichier categories
    const loadedCategories = await loadCategoriesFromFile();
    
    // Vérifier quelles catégories existent réellement dans Vault
    // Une catégorie peut exister dans le fichier categories sans avoir de dossier (pas encore de secret)
    // Mais si elle a un dossier, elle doit être dans le fichier categories
    const validCategories = [];
    for (const cat of loadedCategories) {
      try {
        // Vérifier si la catégorie a un dossier dans Vault
        await listAllSecretsInCategory(cat);
        // Si on arrive ici, la catégorie a un dossier, elle est valide
        validCategories.push(cat);
      } catch (e) {
        // La catégorie n'a pas de dossier, mais elle peut exister dans le fichier categories
        // (elle n'a pas encore de secret). On la garde dans la liste.
        validCategories.push(cat);
      }
    }
    
    categories = validCategories;
    
    console.log('Catégories chargées depuis le fichier categories:', categories);
    
    // Mettre à jour le select
    updateCategorySelect();
  } catch (e) {
    console.error('Erreur lors du chargement des catégories:', e);
    console.error('Détails de l\'erreur:', e.response || e.message);
    categories = [];
    updateCategorySelect();
    // Afficher un message d'erreur à l'utilisateur
    if (e.response?.errors) {
      showToast('Erreur lors du chargement des catégories: ' + e.response.errors[0], 'error');
    }
  }
}

// Sauvegarder les catégories
async function saveCategories() {
  await new Promise((resolve) => {
    chrome.storage.local.set({ categories: categories }, resolve);
  });
}

// Mettre à jour le select des catégories
function updateCategorySelect() {
  const previousValue = categorySelect.value;
  categorySelect.innerHTML = '';
  
  if (categories.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Aucune catégorie';
    categorySelect.appendChild(option);
    return;
  }
  
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categorySelect.appendChild(option);
  });
  
  // Sélectionner la première catégorie par défaut ou restaurer la sélection précédente
  if (categories.length > 0) {
    if (previousValue && categories.includes(previousValue)) {
      categorySelect.value = previousValue;
    } else {
      categorySelect.value = categories[0];
    }
    // Charger automatiquement les secrets de la catégorie sélectionnée
    loadCategorySecrets(categorySelect.value);
  }
}

// Obtenir le chemin actuel (catégorie sélectionnée)
function getCurrentPath() {
  return categorySelect.value || '';
}

// Écouter les changements de catégorie pour charger automatiquement les secrets
categorySelect.addEventListener('change', async () => {
  const path = getCurrentPath();
  await loadCategorySecrets(path);
});

// Gestion du bouton nouvelle catégorie
newCategoryBtn.addEventListener('click', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  
  const categoryName = prompt('Entrez le nom de la nouvelle catégorie:');
  if (!categoryName || !categoryName.trim()) {
    return;
  }
  
  const trimmedName = categoryName.trim();
  if (categories.includes(trimmedName)) {
    showToast('Cette catégorie existe déjà', 'error');
    return;
  }
  
  // Ajouter la catégorie uniquement au fichier categories (pas de secret initial)
  try {
    // Ajouter la catégorie à la liste dans le fichier categories
    if (!categories.includes(trimmedName)) {
      categories.push(trimmedName);
      await saveCategoriesToFile();
    }
    
    // Recharger les catégories depuis Vault
    await loadCategoriesFromVault();
    
    // S'assurer que la catégorie est sélectionnée et charger ses secrets
    if (categories.includes(trimmedName)) {
      categorySelect.value = trimmedName;
      await loadCategorySecrets(trimmedName);
      showToast('Catégorie créée avec succès', 'success');
    } else {
      showToast('Erreur lors de la création de la catégorie', 'error');
    }
  } catch (e) {
    console.error('Erreur lors de la création de catégorie:', e);
    showToast('Erreur lors de la création: ' + (e.response?.errors?.[0] || e.message), 'error');
  }
});

// Gestion du bouton supprimer catégorie
deleteCategoryBtn.addEventListener('click', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;
  
  const categoryName = getCurrentPath();
  if (!categoryName) {
    showToast('Sélectionnez une catégorie à supprimer', 'error');
    return;
  }
  
  if (!confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ?\n\nCette action supprimera :\n- Le dossier passwords/${categoryName}\n- L'entrée dans le fichier categories\n\nCette action est irréversible.`)) {
    return;
  }
  
  try {
    await removeCategory(categoryName);
    showToast('Catégorie supprimée avec succès', 'success');
  } catch (e) {
    console.error('Erreur lors de la suppression de la catégorie:', e);
    showToast('Erreur lors de la suppression: ' + (e.response?.errors?.[0] || e.message), 'error');
  }
});

// Initialisation - vérifier la configuration
async function initialize() {
  // Initialiser les catégories (vide au début)
  categories = [];
  updateCategorySelect();
  
  // Charger les paramètres
  const stored = await new Promise((resolve) => {
    chrome.storage.local.get(['vaultUrl', 'kvMount', 'encryptedToken', 'pinHash'], resolve);
  });
  
  settings.vaultUrl = stored.vaultUrl || 'https://vault.exem.fr/';
  settings.kvMount = stored.kvMount || 'passwords';
  
  // Vérifier si un token est configuré
  if (!stored.encryptedToken || !stored.pinHash) {
    // Pas de configuration, afficher le modal de configuration initiale
    showSetupModal();
  } else {
    // Configuration existante, demander l'authentification rapide
    showAuthModal();
  }
  
  // Ne pas initialiser de champs par défaut - les données viennent de Vault
}

// Lancer l'initialisation au chargement
initialize();
