const vaultUrlInput = document.getElementById('vaultUrl');
const vaultTokenInput = document.getElementById('vaultToken');
const kvMountInput = document.getElementById('kvMount');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const pinModal = document.getElementById('pinModal');
const pinInput = document.getElementById('pinInput');
const pinConfirm = document.getElementById('pinConfirm');
const pinSaveBtn = document.getElementById('pinSaveBtn');
const pinCancelBtn = document.getElementById('pinCancelBtn');
const pinError = document.getElementById('pinError');
const exportMasterKeyBtn = document.getElementById('exportMasterKeyBtn');
const importMasterKeyBtn = document.getElementById('importMasterKeyBtn');
const importMasterKeyFile = document.getElementById('importMasterKeyFile');
const masterKeyStatus = document.getElementById('masterKeyStatus');
const pinPromptModal = document.getElementById('pinPromptModal');
const pinPromptInput = document.getElementById('pinPromptInput');
const pinPromptOkBtn = document.getElementById('pinPromptOkBtn');
const pinPromptCancelBtn = document.getElementById('pinPromptCancelBtn');
const pinPromptError = document.getElementById('pinPromptError');
const pinPromptTitle = document.getElementById('pinPromptTitle');
const pinPromptMessage = document.getElementById('pinPromptMessage');
const syncEnabledCheckbox = document.getElementById('syncEnabledCheckbox');
const syncStatus = document.getElementById('syncStatus');
const exportCategoriesBtn = document.getElementById('exportCategoriesBtn');
const importCategoriesBtn = document.getElementById('importCategoriesBtn');
const importCategoriesFile = document.getElementById('importCategoriesFile');
const categoriesStatus = document.getElementById('categoriesStatus');
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const passwordConfirm = document.getElementById('passwordConfirm');
const passwordSaveBtn = document.getElementById('passwordSaveBtn');
const passwordCancelBtn = document.getElementById('passwordCancelBtn');
const passwordError = document.getElementById('passwordError');
const togglePasswordInput = document.getElementById('togglePasswordInput');
const togglePasswordConfirm = document.getElementById('togglePasswordConfirm');
const passwordPromptModal = document.getElementById('passwordPromptModal');
const passwordPromptInput = document.getElementById('passwordPromptInput');
const passwordPromptOkBtn = document.getElementById('passwordPromptOkBtn');
const passwordPromptCancelBtn = document.getElementById('passwordPromptCancelBtn');
const passwordPromptError = document.getElementById('passwordPromptError');
const passwordPromptTitle = document.getElementById('passwordPromptTitle');
const passwordPromptMessage = document.getElementById('passwordPromptMessage');
const togglePasswordPromptInput = document.getElementById('togglePasswordPromptInput');
const GOOGLE_CLIENT_ID = "482552972428-tn0hjn31huufi49cslf8982nmacf5sg9.apps.googleusercontent.com";

// Variables pour le modal PIN prompt
let pinPromptResolve = null;

// Variables pour le modal mot de passe
let passwordResolve = null;
let passwordPromptResolve = null;

// Limiter les inputs PIN à 4 chiffres
pinInput.addEventListener('input', (e) => {
  // Permettre uniquement les chiffres
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

pinInput.addEventListener('keypress', (e) => {
  // Bloquer les caractères non numériques
  if (!/^\d$/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Tab') {
    e.preventDefault();
  }
});

pinConfirm.addEventListener('input', (e) => {
  // Permettre uniquement les chiffres
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

pinConfirm.addEventListener('keypress', (e) => {
  // Bloquer les caractères non numériques
  if (!/^\d$/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Tab') {
    e.preventDefault();
  }
});

// Toggle visibilité des PINs lors de la création
const togglePinInput = document.getElementById('togglePinInput');
const togglePinConfirm = document.getElementById('togglePinConfirm');

if (togglePinInput) {
  togglePinInput.addEventListener('click', () => {
    const input = pinInput;
    if (input.type === 'password') {
      input.type = 'text';
      togglePinInput.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      togglePinInput.title = 'Masquer le PIN';
    } else {
      input.type = 'password';
      togglePinInput.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      togglePinInput.title = 'Afficher le PIN';
    }
  });
}

if (togglePinConfirm) {
  togglePinConfirm.addEventListener('click', () => {
    const input = pinConfirm;
    if (input.type === 'password') {
      input.type = 'text';
      togglePinConfirm.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      togglePinConfirm.title = 'Masquer le PIN';
    } else {
      input.type = 'password';
      togglePinConfirm.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      togglePinConfirm.title = 'Afficher le PIN';
    }
  });
}

function loadSettings() {
  chrome.storage.sync.get(['vaultUrl', 'kvMount'], (res) => {
    vaultUrlInput.value = res.vaultUrl || 'https://vault.exem.fr/';
    kvMountInput.value = res.kvMount || '';
  });
  
  // Setup Google Sign-In button
  const buttonDiv = document.getElementById('googleSignInButton');
  if (buttonDiv) {
    buttonDiv.innerHTML = '<button class="btn btn-primary" style="width: 100%; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Se connecter avec Google</button>';
    const button = buttonDiv.querySelector('button');
    if (button) {
      button.addEventListener('click', openGoogleSignIn);
    }
  }
}

// Fonction pour récupérer l'entity_name depuis le token
async function getEntityNameFromToken(vaultUrl, token) {
  try {
    // D'abord, récupérer l'entity_id depuis le token
    const tokenResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': token,
        'Content-Type': 'application/json'
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Impossible de récupérer les informations du token');
    }
    
    const tokenData = await tokenResponse.json();
    const entityId = tokenData.data?.entity_id;
    
    if (!entityId) {
      console.error('entity_id non trouvé dans le token');
      return null;
    }
    
    // Ensuite, récupérer l'entity_name avec l'entity_id
    const entityResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/identity/entity/id/${entityId}`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': token,
        'Content-Type': 'application/json'
      }
    });
    
    if (!entityResponse.ok) {
      throw new Error('Impossible de récupérer les informations de l\'entité');
    }
    
    const entityData = await entityResponse.json();
    const entityName = entityData.data?.name;
    
    if (!entityName) {
      console.error('entity_name non trouvé dans l\'entité');
      return null;
    }
    
    // Remplacer les caractères non alphanumériques par des underscores
    return entityName.replace(/[^a-zA-Z0-9]/g, "_");
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'entity_name:', error);
    return null;
  }
}

// Open Google Sign-In using Vault's OIDC flow
async function openGoogleSignIn() {
  const vaultUrl = vaultUrlInput.value.trim() || 'https://vault.exem.fr/';
  
  // Start the Vault OIDC auth flow
  try {
    // First, get the auth URL from Vault
    const authResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/oidc/oidc/auth_url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'default-google-oidc',
        redirect_uri: `${vaultUrl.replace(/\/$/, '')}/v1/auth/oidc/oidc/callback`
      })
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json().catch(() => ({}));
      const errorMsg = errorData.errors?.[0] || `Erreur ${authResponse.status}`;
      alert('Erreur Vault: ' + errorMsg);
      return;
    }

    const authData = await authResponse.json();
    const authUrl = authData.data?.auth_url;

    if (!authUrl) {
      alert('Erreur: URL d\'authentification non reçue de Vault');
      return;
    }
  
    // Open in popup window using Chrome API
    const width = 500;
    const height = 600;
    const left = Math.round((screen.availLeft || 0) + (screen.availWidth - width) / 2);
    const top = Math.round((screen.availTop || 0) + (screen.availHeight - height) / 2);

    chrome.windows.create({
      url: authUrl,
      type: 'popup',
      width: width,
      height: height,
      left: left,
      top: top
    }, (popupWindow) => {
      if (chrome.runtime.lastError || !popupWindow) {
        alert('Impossible d\'ouvrir la fenêtre: ' + (chrome.runtime.lastError?.message || 'Erreur inconnue'));
        return;
      }

      const tabId = popupWindow.tabs[0].id;
      let callbackProcessed = false;

      // Listen for tab updates to detect when we reach Vault callback
      const tabUpdateListener = async (updatedTabId, changeInfo, tab) => {
        if (updatedTabId !== tabId || callbackProcessed) return;
        
        // Check if we're on the Vault callback page
        if (changeInfo.url && changeInfo.url.includes('vault.exem.fr') && 
            changeInfo.url.includes('/auth/oidc/oidc/callback')) {
          console.log('Detected Vault callback page:', changeInfo.url);
          
          // Wait a moment for the page to load
          setTimeout(async () => {
            try {
              // Inject script to extract token from the page
              const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                  // Try to extract token from the page body
                  const bodyText = document.body.innerText || document.body.textContent;
                  
                  // Vault typically returns JSON with the token
                  try {
                    const data = JSON.parse(bodyText);
                    return {
                      success: true,
                      token: data.auth?.client_token || null,
                      data: data
                    };
                  } catch (e) {
                    // If not JSON, try to find token in the text
                    const tokenMatch = bodyText.match(/"client_token"\s*:\s*"([^"]+)"/);
                    return {
                      success: !!tokenMatch,
                      token: tokenMatch ? tokenMatch[1] : null,
                      rawText: bodyText.substring(0, 500) // First 500 chars for debugging
                    };
                  }
                }
              });

              callbackProcessed = true;
              chrome.tabs.onUpdated.removeListener(tabUpdateListener);

              if (!results || !results[0] || !results[0].result) {
                alert('Erreur: Impossible de lire la réponse de Vault');
                chrome.windows.remove(popupWindow.id);
                return;
              }

              const result = results[0].result;
              console.log('Extracted result:', result);

              if (!result.success || !result.token) {
                alert('Erreur: Token non trouvé dans la réponse Vault');
                console.error('Vault response:', result);
                chrome.windows.remove(popupWindow.id);
                return;
              }

              // Close the popup
              chrome.windows.remove(popupWindow.id);

              // Set the token in the input field and proceed
              vaultTokenInput.value = result.token;

              // Récupérer l'entity_name depuis le token
              const displayName = await getEntityNameFromToken(vaultUrl, result.token);
              if (displayName) {
                kvMountInput.value = displayName;
              }

              // Check if PIN exists, if not show PIN modal
              chrome.storage.sync.get(['pinHash'], async (res) => {
                if (res.pinHash) {
                  const currentPin = prompt('Entrez votre clé d\'authentification rapide actuelle (4 chiffres) :');
                  if (!currentPin || currentPin.length !== 4) {
                    alert('Code incorrect');
                    return;
                  }

                  const currentPinHash = await window.cryptoUtils.sha256(currentPin);
                  if (currentPinHash !== res.pinHash) {
                    alert('Code incorrect');
                    return;
                  }

                  await saveTokenWithPin(result.token, currentPin);
                } else {
                  showPinModal();
                }
              });
            } catch (e) {
              callbackProcessed = true;
              chrome.tabs.onUpdated.removeListener(tabUpdateListener);
              alert('Erreur: ' + e.message);
              console.error('Error extracting token:', e);
              chrome.windows.remove(popupWindow.id);
            }
          }, 1000); // Wait 1 second for page to fully load
        }
      };

      chrome.tabs.onUpdated.addListener(tabUpdateListener);

      // Cleanup after 5 minutes
      setTimeout(() => {
        if (!callbackProcessed) {
          chrome.tabs.onUpdated.removeListener(tabUpdateListener);
          chrome.windows.remove(popupWindow.id).catch(() => {});
        }
      }, 5 * 60 * 1000);
    });
  } catch (error) {
    console.error('OIDC auth error:', error);
    alert('Erreur: ' + error.message);
  }
}

// Handle Google OIDC credential response
async function handleCredentialResponse(response) {
  if (!response || !response.credential) {
    alert('Erreur: réponse Google invalide');
    return;
  }

  const googleIdToken = response.credential;
  const vaultUrl = vaultUrlInput.value.trim() || 'https://vault.exem.fr/';

  try {
    // Send JWT to Vault OIDC login endpoint
    const loginResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/oidc/oidc/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'default-google-oidc', jwt: googleIdToken })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json().catch(() => ({}));
      const errorMsg = errorData.errors?.[0] || `Erreur ${loginResponse.status} lors de la connexion OIDC`;
      throw new Error(errorMsg);
    }

    const data = await loginResponse.json();
    const vaultToken = data.auth?.client_token;

    if (!vaultToken) {
      throw new Error('Token Vault non reçu dans la réponse');
    }

    // Set the token in the input field and proceed with normal flow
    vaultTokenInput.value = vaultToken;
    
    // Automatically trigger the save flow
    // Check if PIN exists, if not show PIN modal, otherwise save directly
    chrome.storage.sync.get(['pinHash'], async (res) => {
      if (res.pinHash) {
        // PIN exists, ask for it to update
        const currentPin = prompt('Entrez votre clé d\'authentification rapide actuelle (4 chiffres) :');
        if (!currentPin || currentPin.length !== 4) {
          alert('Code incorrect');
          return;
        }
        
        const currentPinHash = await window.cryptoUtils.sha256(currentPin);
        if (currentPinHash !== res.pinHash) {
          alert('Code incorrect');
          return;
        }
        
        // Verify and save the token
        await saveTokenWithPin(vaultToken, currentPin);
      } else {
        // No PIN, show PIN creation modal
        showPinModal();
      }
    });
  } catch (error) {
    console.error('OIDC authentication error:', error);
    alert('Erreur lors de l\'authentification OIDC: ' + error.message);
  }
}

// Fonction pour récupérer les métadonnées du token (TTL, dates d'expiration)
async function getTokenMetadata(vaultUrl, token) {
  try {
    const tokenResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': token,
        'Content-Type': 'application/json'
      }
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Impossible de récupérer les informations du token');
    }
    
    const tokenData = await tokenResponse.json();
    const data = tokenData.data || {};
    
    // Extraire les informations de validité
    const ttl = data.ttl || 0; // TTL en secondes
    const creationTime = data.creation_time || 0; // Timestamp Unix
    const expireTime = data.expire_time || null; // Timestamp Unix ou null si pas d'expiration
    
    // Calculer la date d'expiration si elle n'est pas fournie mais que le TTL existe
    let calculatedExpireTime = expireTime;
    if (!expireTime && ttl > 0 && creationTime > 0) {
      calculatedExpireTime = creationTime + ttl;
    }
    
    return {
      ttl: ttl,
      creationTime: creationTime,
      expireTime: calculatedExpireTime,
      renewable: data.renewable || false,
      entityId: data.entity_id
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des métadonnées du token:', error);
    return null;
  }
}

// Helper function to save token with PIN
async function saveTokenWithPin(vaultToken, pin) {
  const vaultUrl = vaultUrlInput.value.trim() || 'https://vault.exem.fr/';
  let kvMount = kvMountInput.value.trim();
  
  // Si kvMount n'est pas défini, récupérer l'entity_name
  if (!kvMount) {
    kvMount = await getEntityNameFromToken(vaultUrl, vaultToken);
    if (kvMount) {
      kvMountInput.value = kvMount;
    } else {
      throw new Error('Impossible de récupérer l\'entity_name. Le moteur de secrets ne peut pas être déterminé.');
    }
  }
  
  try {
    // Verify the token is valid
    const testResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': vaultToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!testResponse.ok) {
      throw new Error('Token invalide');
    }
    
    // Récupérer les métadonnées du token (TTL, date d'expiration)
    const tokenMetadata = await getTokenMetadata(vaultUrl, vaultToken);
    
    // Create mount path if it doesn't exist
    const mountResult = await ensureMountPath(vaultUrl, vaultToken, kvMount);
    if (!mountResult.success) {
      alert(`Erreur mount: ${mountResult.message || 'Impossible de créer le mount path'}. Vérifiez les permissions du token.`);
      return;
    }
    
    // Encrypt the token
    const encryptedToken = await window.cryptoUtils.encrypt(vaultToken, pin);
    const pinHash = await window.cryptoUtils.sha256(pin);
    
    // Préparer les données à sauvegarder
    const dataToSave = {
      vaultUrl: vaultUrl,
      kvMount: kvMount,
      encryptedToken: encryptedToken,
      pinHash: pinHash
    };
    
    // Ajouter les métadonnées du token si disponibles
    if (tokenMetadata) {
      if (tokenMetadata.expireTime) {
        dataToSave.tokenExpireTime = tokenMetadata.expireTime;
      }
      if (tokenMetadata.ttl) {
        dataToSave.tokenTtl = tokenMetadata.ttl;
      }
      if (tokenMetadata.creationTime) {
        dataToSave.tokenCreationTime = tokenMetadata.creationTime;
      }
    }
    
    // Save to storage
    await new Promise((resolve) => {
      chrome.storage.sync.set(dataToSave, resolve);
    });
    
    alert('Configuration mise à jour avec succès !');
    vaultTokenInput.value = '';
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
}

// Créer le mount path s'il n'existe pas
async function ensureMountPath(vaultUrl, token, mountPath) {
  try {
    console.log(`Tentative de création du mount "${mountPath}"...`);
    
    // Essayer directement de créer le mount
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
    
    // Succès : 200 ou 204
    if (createResponse.ok || createResponse.status === 204) {
      console.log('Mount créé avec succès');
      return { success: true };
    }
    
    // Si erreur 400, vérifier si c'est parce que le mount existe déjà
    if (createResponse.status === 400) {
      let error;
      try {
        error = JSON.parse(createResponseText);
      } catch {
        error = { errors: [createResponseText] };
      }
      const errorMsg = error.errors?.[0] || '';
      
      // Si le mount existe déjà, c'est un succès
      if (errorMsg.includes('path is already in use') || errorMsg.includes('existing mount')) {
        console.log(`Mount "${mountPath}" existe déjà`);
        return { success: true };
      }
      
      // Autre erreur 400
      console.error('Erreur création mount:', errorMsg);
      return { success: false, message: errorMsg };
    }
    
    // Autre code d'erreur
    let error;
    try {
      error = JSON.parse(createResponseText);
    } catch {
      error = { errors: [createResponseText] };
    }
    const errorMsg = error.errors?.[0] || `Erreur ${createResponse.status} lors de la création du mount`;
    console.error('Erreur création mount:', errorMsg);
    return { success: false, message: errorMsg };
  } catch (error) {
    console.error('Exception ensureMountPath:', error);
    return { success: false, message: error.message || 'Erreur réseau lors de la création du mount' };
  }
}

// Afficher le modal de création de PIN
function showPinModal() {
  pinModal.classList.add('show');
  pinInput.value = '';
  pinConfirm.value = '';
  pinError.style.display = 'none';
  pinInput.focus();
}

// Cacher le modal
function hidePinModal() {
  pinModal.classList.remove('show');
}

// Sauvegarder le PIN
pinSaveBtn.addEventListener('click', async () => {
  const pin = pinInput.value;
  const pinConfirmValue = pinConfirm.value;
  
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    pinError.textContent = 'Le code doit contenir exactement 4 chiffres';
    pinError.style.display = 'block';
    return;
  }
  
  if (pin !== pinConfirmValue) {
    pinError.textContent = 'Les codes ne correspondent pas';
    pinError.style.display = 'block';
    return;
  }
  
  pinError.style.display = 'none';
  
  // Get token from input (could be from OIDC or manual entry)
  const vaultUrl = vaultUrlInput.value.trim();
  const vaultToken = vaultTokenInput.value.trim();
  let kvMount = kvMountInput.value.trim();
  
  if (!vaultToken) {
    pinError.textContent = 'Aucun token disponible. Veuillez vous connecter avec Google ou entrer un token manuellement.';
    pinError.style.display = 'block';
    return;
  }
  
  try {
    // Vérifier que le token est valide en testant une requête
    const testResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': vaultToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (!testResponse.ok) {
      throw new Error('Token invalide. Vérifiez votre token Vault.');
    }
    
    // Récupérer les métadonnées du token (TTL, date d'expiration)
    const tokenMetadata = await getTokenMetadata(vaultUrl, vaultToken);
    
  // Si kvMount n'est pas défini, récupérer l'entity_name
  if (!kvMount) {
    kvMount = await getEntityNameFromToken(vaultUrl, vaultToken);
    if (kvMount) {
      kvMountInput.value = kvMount;
    } else {
      throw new Error('Impossible de récupérer l\'entity_name. Le moteur de secrets ne peut pas être déterminé.');
    }
  }
  
  // Créer le mount path s'il n'existe pas
  const mountResult = await ensureMountPath(vaultUrl, vaultToken, kvMount);
    if (!mountResult.success) {
      const errorMsg = mountResult.message || 'Impossible de créer le mount path';
      pinError.textContent = `Erreur mount: ${errorMsg}. Vérifiez les permissions du token.`;
      pinError.style.display = 'block';
      return;
    }
    
    // Hasher le PIN en SHA256
    const pinHash = await window.cryptoUtils.sha256(pin);
    
    // Chiffrer le token
    const encryptedToken = await window.cryptoUtils.encrypt(vaultToken, pin);
    
    // Demander le mot de passe Master Key si le système n'est pas encore initialisé
    let masterPassword = null;
    if (!(await window.cryptoSystem.hasMasterKey())) {
      hidePinModal();
      masterPassword = await promptForPassword();
      if (!masterPassword) {
        // L'utilisateur a annulé, ne pas sauvegarder
        return;
      }
    }
    
    // Initialiser le système de chiffrement (dériver la master key depuis le mot de passe)
    if (masterPassword) {
      // Utiliser le kvMount comme userId pour générer un sel déterministe
      await window.cryptoSystem.initializeCryptoSystem(masterPassword, pin, kvMount);
      console.log('Système de chiffrement initialisé avec succès');
    } else {
      console.log('Système de chiffrement déjà initialisé');
    }
    
    // Préparer les données à sauvegarder
    const dataToSave = {
      vaultUrl: vaultUrl,
      kvMount: kvMount,
      encryptedToken: encryptedToken,
      pinHash: pinHash
    };
    
    // Ajouter les métadonnées du token si disponibles
    if (tokenMetadata) {
      if (tokenMetadata.expireTime) {
        dataToSave.tokenExpireTime = tokenMetadata.expireTime;
      }
      if (tokenMetadata.ttl) {
        dataToSave.tokenTtl = tokenMetadata.ttl;
      }
      if (tokenMetadata.creationTime) {
        dataToSave.tokenCreationTime = tokenMetadata.creationTime;
      }
    }
    
    // Sauvegarder dans chrome.storage.sync
    await new Promise((resolve) => {
      chrome.storage.sync.set(dataToSave, resolve);
    });
    
    hidePinModal();
    alert('Configuration enregistrée avec succès ! Votre token est maintenant sécurisé.');
    vaultTokenInput.value = ''; // Effacer le champ pour la sécurité
  } catch (error) {
    pinError.textContent = error.message || 'Erreur lors de l\'enregistrement';
    pinError.style.display = 'block';
  }
});

pinCancelBtn.addEventListener('click', () => {
  hidePinModal();
});

// ============================================================
// GESTION DU MODAL MOT DE PASSE MASTER KEY
// ============================================================

// Afficher le modal de création de mot de passe
function showPasswordModal() {
  passwordModal.classList.add('show');
  passwordInput.value = '';
  passwordConfirm.value = '';
  passwordError.style.display = 'none';
  passwordInput.focus();
}

// Cacher le modal de mot de passe
function hidePasswordModal() {
  passwordModal.classList.remove('show');
}

// Toggle visibilité des mots de passe
if (togglePasswordInput) {
  togglePasswordInput.addEventListener('click', () => {
    const input = passwordInput;
    if (input.type === 'password') {
      input.type = 'text';
      togglePasswordInput.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      togglePasswordInput.title = 'Masquer le mot de passe';
    } else {
      input.type = 'password';
      togglePasswordInput.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      togglePasswordInput.title = 'Afficher le mot de passe';
    }
  });
}

if (togglePasswordConfirm) {
  togglePasswordConfirm.addEventListener('click', () => {
    const input = passwordConfirm;
    if (input.type === 'password') {
      input.type = 'text';
      togglePasswordConfirm.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      togglePasswordConfirm.title = 'Masquer le mot de passe';
    } else {
      input.type = 'password';
      togglePasswordConfirm.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      togglePasswordConfirm.title = 'Afficher le mot de passe';
    }
  });
}

// Fonction pour demander le mot de passe via un modal
function promptForPassword() {
  return new Promise((resolve) => {
    passwordInput.value = '';
    passwordConfirm.value = '';
    passwordError.style.display = 'none';
    passwordModal.classList.add('show');
    passwordInput.focus();
    
    passwordResolve = resolve;
  });
}

// Gestionnaire pour sauvegarder le mot de passe
passwordSaveBtn.addEventListener('click', async () => {
  const password = passwordInput.value;
  const passwordConfirmValue = passwordConfirm.value;
  
  // Validation du mot de passe
  if (password.length < 12) {
    passwordError.textContent = 'Le mot de passe doit contenir au moins 12 caractères';
    passwordError.style.display = 'block';
    return;
  }
  
  if (password !== passwordConfirmValue) {
    passwordError.textContent = 'Les mots de passe ne correspondent pas';
    passwordError.style.display = 'block';
    return;
  }
  
  passwordError.style.display = 'none';
  hidePasswordModal();
  
  if (passwordResolve) {
    passwordResolve(password);
    passwordResolve = null;
  }
});

passwordCancelBtn.addEventListener('click', () => {
  hidePasswordModal();
  if (passwordResolve) {
    passwordResolve(null);
    passwordResolve = null;
  }
});

// Toggle visibilité du mot de passe dans le prompt
if (togglePasswordPromptInput) {
  togglePasswordPromptInput.addEventListener('click', () => {
    const input = passwordPromptInput;
    if (input.type === 'password') {
      input.type = 'text';
      togglePasswordPromptInput.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      togglePasswordPromptInput.title = 'Masquer le mot de passe';
    } else {
      input.type = 'password';
      togglePasswordPromptInput.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      togglePasswordPromptInput.title = 'Afficher le mot de passe';
    }
  });
}

// Fonction pour demander le mot de passe Master Key via un modal
function promptForMasterPassword(title, message) {
  return new Promise((resolve) => {
    passwordPromptTitle.textContent = title || 'Mot de passe Master Key requis';
    passwordPromptMessage.textContent = message || 'Entrez votre mot de passe Master Key';
    passwordPromptInput.value = '';
    passwordPromptError.style.display = 'none';
    passwordPromptModal.classList.add('show');
    passwordPromptInput.focus();
    
    passwordPromptResolve = resolve;
  });
}

// Gestionnaires du modal password prompt
passwordPromptOkBtn.addEventListener('click', async () => {
  const password = passwordPromptInput.value;
  
  if (!password || password.length < 12) {
    passwordPromptError.textContent = 'Le mot de passe doit contenir au moins 12 caractères';
    passwordPromptError.style.display = 'block';
    return;
  }
  
  passwordPromptModal.classList.remove('show');
  if (passwordPromptResolve) {
    passwordPromptResolve(password);
    passwordPromptResolve = null;
  }
});

passwordPromptCancelBtn.addEventListener('click', () => {
  passwordPromptModal.classList.remove('show');
  if (passwordPromptResolve) {
    passwordPromptResolve(null);
    passwordPromptResolve = null;
  }
});

saveBtn.addEventListener('click', async () => {
  const vaultUrl = vaultUrlInput.value.trim();
  const vaultToken = vaultTokenInput.value.trim();
  let kvMount = kvMountInput.value.trim();
  
  if (!vaultUrl || !vaultToken) {
    alert('Veuillez remplir l\'URL et le token Vault');
    return;
  }
  
  // Si kvMount n'est pas défini, récupérer l'entity_name
  if (!kvMount) {
    kvMount = await getEntityNameFromToken(vaultUrl, vaultToken);
    if (kvMount) {
      kvMountInput.value = kvMount;
    } else {
      alert('Impossible de récupérer l\'entity_name. Le moteur de secrets ne peut pas être déterminé.');
      return;
    }
  }
  
  // Vérifier si un PIN existe déjà
  chrome.storage.sync.get(['pinHash'], async (res) => {
    if (res.pinHash) {
      // PIN existe déjà, demander de le confirmer pour mettre à jour
      const currentPin = prompt('Entrez votre clé d\'authentification rapide actuelle (4 chiffres) :');
      if (!currentPin || currentPin.length !== 4) {
        alert('Code incorrect');
        return;
      }
      
      const currentPinHash = await window.cryptoUtils.sha256(currentPin);
      if (currentPinHash !== res.pinHash) {
        alert('Code incorrect');
        return;
      }
      
      // Déchiffrer l'ancien token pour le mettre à jour
      chrome.storage.sync.get(['encryptedToken'], async (res2) => {
        try {
          const oldToken = await window.cryptoUtils.decrypt(res2.encryptedToken, currentPin);
          
          // Vérifier le nouveau token
          const testResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
            method: 'GET',
            headers: {
              'X-Vault-Token': vaultToken,
              'Content-Type': 'application/json'
            }
          });
          
          if (!testResponse.ok) {
            throw new Error('Nouveau token invalide');
          }
          
          // Récupérer les métadonnées du token (TTL, date d'expiration)
          const tokenMetadata = await getTokenMetadata(vaultUrl, vaultToken);
          
          // Créer le mount path s'il n'existe pas
          const mountResult = await ensureMountPath(vaultUrl, vaultToken, kvMount);
          if (!mountResult.success) {
            alert(`Erreur mount: ${mountResult.message || 'Impossible de créer le mount path'}. Vérifiez les permissions du token.`);
            return;
          }
          
          // Chiffrer le nouveau token avec le même PIN
          const encryptedToken = await window.cryptoUtils.encrypt(vaultToken, currentPin);
          
          // Préparer les données à sauvegarder
          const dataToSave = {
            vaultUrl: vaultUrl,
            kvMount: kvMount,
            encryptedToken: encryptedToken
          };
          
          // Ajouter les métadonnées du token si disponibles
          if (tokenMetadata) {
            if (tokenMetadata.expireTime) {
              dataToSave.tokenExpireTime = tokenMetadata.expireTime;
            }
            if (tokenMetadata.ttl) {
              dataToSave.tokenTtl = tokenMetadata.ttl;
            }
            if (tokenMetadata.creationTime) {
              dataToSave.tokenCreationTime = tokenMetadata.creationTime;
            }
          }
          
          await new Promise((resolve) => {
            chrome.storage.sync.set(dataToSave, resolve);
          });
          
          alert('Configuration mise à jour avec succès !');
          vaultTokenInput.value = '';
        } catch (error) {
          alert('Erreur: ' + error.message);
        }
      });
    } else {
      // Pas de PIN, en créer un nouveau
      showPinModal();
    }
  });
});

clearBtn.addEventListener('click', () => {
  if (confirm('Voulez-vous vraiment réinitialiser toute la configuration ? Cette action est irréversible.')) {
    chrome.storage.sync.clear(() => {
      vaultUrlInput.value = 'https://vault.exem.fr/';
      vaultTokenInput.value = '';
      kvMountInput.value = '';
      alert('Configuration réinitialisée.');
    });
  }
});

loadSettings();

// ============================================================
// GESTION DE LA MASTER KEY (EXPORT/IMPORT)
// ============================================================

// Afficher le statut de la Master Key
async function updateMasterKeyStatus() {
  const hasMK = await window.cryptoSystem.hasMasterKey();
  if (hasMK) {
    masterKeyStatus.innerHTML = '✅ <strong>Mot de passe Master Key configuré</strong> - Vous pouvez l\'exporter pour backup';
    masterKeyStatus.style.color = '#059669';
  } else {
    masterKeyStatus.innerHTML = '⚠️ <strong>Aucun mot de passe Master Key</strong> - Créez-en un ou importez-en un';
    masterKeyStatus.style.color = '#d97706';
  }
}

// Appeler au chargement
updateMasterKeyStatus();

// ============================================================
// SYNCHRONISATION CHROME
// ============================================================

// Mettre à jour le statut de synchronisation
async function updateSyncStatus() {
  try {
    const syncInfo = await window.cryptoSystem.getSyncInfo();
    
    if (syncInfo.enabled && syncInfo.hasSyncedKey) {
      const syncDate = syncInfo.syncDate ? new Date(syncInfo.syncDate).toLocaleString() : 'inconnue';
      syncStatus.innerHTML = `✅ <strong>Synchronisation active</strong> - Dernière sync: ${syncDate}`;
      syncStatus.style.color = '#059669';
      syncEnabledCheckbox.checked = true;
    } else if (syncInfo.hasSyncedKey && !syncInfo.enabled) {
      syncStatus.innerHTML = '⚠️ <strong>Master Key trouvée dans le cloud</strong> mais synchronisation désactivée';
      syncStatus.style.color = '#d97706';
      syncEnabledCheckbox.checked = false;
    } else {
      syncStatus.innerHTML = '⚪ <strong>Synchronisation désactivée</strong> - La Master Key est uniquement en local';
      syncStatus.style.color = '#6b7280';
      syncEnabledCheckbox.checked = false;
    }
  } catch (error) {
    console.error('Erreur lors de la vérification du statut sync:', error);
    syncStatus.innerHTML = '❌ Erreur lors de la vérification du statut';
    syncStatus.style.color = '#dc2626';
  }
}

// Appeler au chargement
updateSyncStatus();

// Gérer le changement de la checkbox
syncEnabledCheckbox.addEventListener('change', async () => {
  const shouldEnable = syncEnabledCheckbox.checked;
  
  try {
    // Vérifier si une Master Key existe
    const hasMK = await window.cryptoSystem.hasMasterKey();
    if (!hasMK) {
      alert('❌ Aucune Master Key à synchroniser. Créez-en une d\'abord en configurant l\'extension.');
      syncEnabledCheckbox.checked = false;
      return;
    }
    
    if (shouldEnable) {
      // Activer la synchronisation
      syncStatus.innerHTML = '⏳ Activation de la synchronisation...';
      syncStatus.style.color = '#3b82f6';
      
      // Demander le PIN
      const pin = await promptForPin(
        '🔐 Activation de la Synchronisation',
        'Entrez votre PIN pour synchroniser la Master Key'
      );
      
      if (!pin) {
        syncEnabledCheckbox.checked = false;
        await updateSyncStatus();
        return;
      }
      
      // Activer la sync
      await window.cryptoSystem.setSyncEnabled(true, pin);
      
      syncStatus.innerHTML = '✅ <strong>Synchronisation activée avec succès !</strong>';
      syncStatus.style.color = '#059669';
      
      setTimeout(() => {
        alert('✅ Synchronisation activée !\n\n' +
          'Votre Master Key est maintenant synchronisée avec votre compte Google Chrome.\n\n' +
          '🔄 Elle sera automatiquement disponible sur tous vos appareils Chrome connectés au même compte.');
      }, 100);
      
    } else {
      // Désactiver la synchronisation
      const confirm1 = confirm(
        '⚠️ Désactiver la synchronisation ?\n\n' +
        'La Master Key sera supprimée de la synchronisation Chrome mais restera disponible en local sur cet appareil.\n\n' +
        'Les autres appareils ne recevront plus les mises à jour.\n\n' +
        'Continuer ?'
      );
      
      if (!confirm1) {
        syncEnabledCheckbox.checked = true;
        return;
      }
      
      syncStatus.innerHTML = '⏳ Désactivation de la synchronisation...';
      syncStatus.style.color = '#3b82f6';
      
      // Demander le PIN
      const pin = await promptForPin(
        '🔐 Désactivation de la Synchronisation',
        'Entrez votre PIN pour confirmer'
      );
      
      if (!pin) {
        syncEnabledCheckbox.checked = true;
        await updateSyncStatus();
        return;
      }
      
      // Désactiver la sync
      await window.cryptoSystem.setSyncEnabled(false, pin);
      
      syncStatus.innerHTML = '⚪ <strong>Synchronisation désactivée</strong>';
      syncStatus.style.color = '#6b7280';
      
      alert('✅ Synchronisation désactivée.\n\n' +
        'La Master Key reste disponible en local sur cet appareil.');
    }
    
    // Mettre à jour les statuts
    await updateSyncStatus();
    await updateMasterKeyStatus();
    
  } catch (error) {
    console.error('Erreur lors du changement de synchronisation:', error);
    syncStatus.innerHTML = `❌ Erreur: ${error.message}`;
    syncStatus.style.color = '#dc2626';
    alert('❌ Erreur: ' + error.message);
    
    // Remettre la checkbox dans son état précédent
    syncEnabledCheckbox.checked = !shouldEnable;
  }
});

// Fonction pour demander le PIN via un modal
function promptForPin(title, message) {
  return new Promise((resolve) => {
    pinPromptTitle.textContent = title;
    pinPromptMessage.textContent = message;
    pinPromptInput.value = '';
    pinPromptError.style.display = 'none';
    pinPromptModal.classList.add('show');
    pinPromptInput.focus();
    
    pinPromptResolve = resolve;
  });
}

// Gestionnaires du modal PIN prompt
pinPromptInput.addEventListener('input', (e) => {
  // Permettre uniquement les chiffres
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

pinPromptInput.addEventListener('keypress', (e) => {
  // Bloquer les caractères non numériques
  if (!/^\d$/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Tab') {
    e.preventDefault();
  }
});

pinPromptOkBtn.addEventListener('click', async () => {
  const pin = pinPromptInput.value;
  
  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    pinPromptError.textContent = 'Le code doit contenir exactement 4 chiffres';
    pinPromptError.style.display = 'block';
    return;
  }
  
  // Vérifier le PIN
  try {
    const stored = await new Promise((resolve) => {
      chrome.storage.sync.get(['pinHash'], resolve);
    });
    
    if (!stored.pinHash) {
      pinPromptError.textContent = 'Aucun PIN configuré';
      pinPromptError.style.display = 'block';
      return;
    }
    
    const pinHash = await window.cryptoUtils.sha256(pin);
    if (pinHash !== stored.pinHash) {
      pinPromptError.textContent = 'Code incorrect';
      pinPromptError.style.display = 'block';
      return;
    }
    
    // PIN correct
    pinPromptModal.classList.remove('show');
    if (pinPromptResolve) {
      pinPromptResolve(pin);
      pinPromptResolve = null;
    }
  } catch (error) {
    pinPromptError.textContent = 'Erreur: ' + error.message;
    pinPromptError.style.display = 'block';
  }
});

pinPromptCancelBtn.addEventListener('click', () => {
  pinPromptModal.classList.remove('show');
  if (pinPromptResolve) {
    pinPromptResolve(null);
    pinPromptResolve = null;
  }
});

// Export Master Key (mot de passe)
exportMasterKeyBtn.addEventListener('click', async () => {
  try {
    // Vérifier si une Master Key existe
    const hasMK = await window.cryptoSystem.hasMasterKey();
    if (!hasMK) {
      alert('Aucun mot de passe Master Key à exporter. Créez-en un d\'abord en configurant l\'extension.');
      return;
    }
    
    // Demander le mot de passe Master Key
    const masterPassword = await promptForMasterPassword(
      '🔐 Export du Mot de passe Master Key',
      'Entrez votre mot de passe Master Key pour l\'exporter'
    );
    
    if (!masterPassword) {
      return; // Annulé
    }
    
    // Vérifier que le mot de passe est correct en dérivant la clé
    const salt = await window.cryptoSystem.getMasterKeySalt();
    if (!salt) {
      throw new Error('Aucun sel trouvé. Le système n\'utilise peut-être pas encore de mot de passe.');
    }
    
    // Dériver la master key depuis le mot de passe pour vérification
    const { key: derivedKey } = await window.cryptoSystem.deriveMasterKeyFromPassword(masterPassword, salt);
    
    // Demander le PIN pour comparer avec la master key stockée
    const pin = await promptForPin(
      '🔐 Export du Mot de passe Master Key',
      'Entrez votre PIN pour vérifier'
    );
    
    if (!pin) {
      return; // Annulé
    }
    
    // Charger la Master Key stockée
    const storedMasterKey = await window.cryptoSystem.loadMasterKey(pin);
    
    // Vérifier que le mot de passe est correct
    if (!arraysEqual(derivedKey, storedMasterKey)) {
      alert('❌ Mot de passe Master Key incorrect');
      return;
    }
    
    // Créer le contenu du fichier avec métadonnées
    const exportData = {
      version: '2.0',
      type: 'vault-password-manager-master-password',
      exportDate: new Date().toISOString(),
      masterPassword: masterPassword,
      warning: 'HAUTEMENT CONFIDENTIEL - Ne partagez jamais ce fichier'
    };
    
    const fileContent = JSON.stringify(exportData, null, 2);
    
    // Télécharger le fichier
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-master-password-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ Mot de passe Master Key exporté avec succès!\n\n⚠️ IMPORTANT : Stockez ce fichier dans un endroit sûr et ne le partagez jamais.');
    
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    alert('❌ Erreur lors de l\'export: ' + error.message);
  }
});

// Fonction helper pour comparer deux Uint8Array
function arraysEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// Import Master Key (mot de passe)
importMasterKeyBtn.addEventListener('click', () => {
  importMasterKeyFile.click();
});

importMasterKeyFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    // Lire le fichier
    const fileContent = await file.text();
    let importData;
    
    try {
      importData = JSON.parse(fileContent);
    } catch {
      alert('❌ Format de fichier invalide. Le fichier doit être au format JSON.');
      return;
    }
    
    // Vérifier le format (support ancien et nouveau format)
    let masterPassword = null;
    if (importData.type === 'vault-password-manager-master-password' && importData.masterPassword) {
      // Nouveau format : mot de passe
      masterPassword = importData.masterPassword;
    } else if (importData.type === 'vault-password-manager-master-key' && importData.masterKey) {
      // Ancien format : master key hex (non supporté pour le nouveau système)
      alert('❌ Ce fichier contient une ancienne Master Key générée automatiquement.\n\nLe nouveau système utilise un mot de passe utilisateur. Veuillez créer un nouveau mot de passe.');
      importMasterKeyFile.value = '';
      return;
    } else {
      alert('❌ Ce fichier ne contient pas un mot de passe Master Key valide.');
      importMasterKeyFile.value = '';
      return;
    }
    
    // Validation du mot de passe
    if (!masterPassword || masterPassword.length < 12) {
      alert('❌ Le mot de passe doit contenir au moins 12 caractères.');
      importMasterKeyFile.value = '';
      return;
    }
    
    // Confirmation
    const confirmMsg = `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point d'importer un mot de passe Master Key.\n\n` +
      `Cela va :\n` +
      `• Remplacer votre mot de passe Master Key actuel (si il existe)\n` +
      `• Dériver une nouvelle Master Key depuis ce mot de passe\n` +
      `• Vous permettre de déchiffrer les secrets créés avec ce mot de passe\n` +
      `• Rendre inaccessibles les secrets créés avec l'ancien mot de passe\n\n` +
      `Fichier exporté le : ${importData.exportDate ? new Date(importData.exportDate).toLocaleString() : 'date inconnue'}\n\n` +
      `Êtes-vous sûr de vouloir continuer ?`;
    
    if (!confirm(confirmMsg)) {
      importMasterKeyFile.value = '';
      return;
    }
    
    // Demander le PIN
    const pin = await promptForPin(
      '🔐 Import du Mot de passe Master Key',
      'Entrez votre PIN pour chiffrer la Master Key dérivée'
    );
    
    if (!pin) {
      importMasterKeyFile.value = '';
      return; // Annulé
    }
    
    // Dériver la master key depuis le mot de passe
    const { key: masterKey, salt } = await window.cryptoSystem.deriveMasterKeyFromPassword(masterPassword);
    
    // Stocker la master key (avec le sel)
    await window.cryptoSystem.storeMasterKey(masterKey, pin, salt);
    
    alert('✅ Mot de passe Master Key importé avec succès!\n\nVous pouvez maintenant déchiffrer les secrets créés avec ce mot de passe.');
    
    // Mettre à jour le statut
    await updateMasterKeyStatus();
    
    // Réinitialiser l'input file
    importMasterKeyFile.value = '';
    
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    alert('❌ Erreur lors de l\'import: ' + error.message);
    importMasterKeyFile.value = '';
  }
});

// ============================================================
// IMPORT/EXPORT DES CATÉGORIES ET SECRETS
// ============================================================

// Variables pour l'authentification dans options.js
let optionsVaultUrl = null;
let optionsKvMount = null;
let optionsVaultToken = null;
let optionsPin = null;

// Fonction pour authentifier l'utilisateur dans options.js
async function authenticateForOptions(pin) {
  try {
    const stored = await new Promise((resolve) => {
      chrome.storage.sync.get(['encryptedToken', 'pinHash', 'vaultUrl', 'kvMount'], resolve);
    });

    if (!stored.encryptedToken || !stored.pinHash) {
      throw new Error('Configuration incomplète. Veuillez configurer l\'extension d\'abord.');
    }

    const pinHash = await window.cryptoUtils.sha256(pin);
    if (pinHash !== stored.pinHash) {
      throw new Error('Code incorrect');
    }

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
      throw new Error('Token invalide. Veuillez vous reconnecter.');
    }

    optionsVaultUrl = stored.vaultUrl || 'https://vault.exem.fr/';
    optionsKvMount = stored.kvMount || '';
    optionsVaultToken = decryptedToken;
    optionsPin = pin;

    return true;
  } catch (error) {
    throw error;
  }
}

// Fonction helper pour les appels Vault dans options.js
function vaultFetchOptions(path, opts = {}) {
  if (!optionsVaultUrl || !optionsVaultToken) {
    return Promise.reject(new Error('Vault non authentifié'));
  }
  const headers = opts.headers || {};
  headers['X-Vault-Token'] = optionsVaultToken;
  headers['Content-Type'] = 'application/json';
  opts.headers = headers;
  const url = optionsVaultUrl.replace(/\/$/, '') + path;
  return fetch(url, opts).then(async (r) => {
    const text = await r.text();
    let json;
    try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text }; }
    if (!r.ok) {
      const err = new Error('Vault API error: ' + r.status);
      err.response = json;
      throw err;
    }
    return json;
  });
}

// Fonction pour lire un secret depuis Vault
function readSecretOptions(secretPath) {
  const mount = optionsKvMount;
  const p = `/v1/${mount}/data/${encodeURIComponent(secretPath)}`;
  return vaultFetchOptions(p, { method: 'GET' });
}

// Fonction pour écrire un secret dans Vault
function writeSecretOptions(secretPath, dataObj) {
  const mount = optionsKvMount;
  const p = `/v1/${mount}/data/${encodeURIComponent(secretPath)}`;
  return vaultFetchOptions(p, { method: 'POST', body: JSON.stringify({ data: dataObj }) });
}

// Fonction pour charger les catégories depuis Vault
async function loadCategoriesFromVaultOptions() {
  try {
    const res = await readSecretOptions('categories');
    const categoriesList = (res && res.data && res.data.data && res.data.data.categories) || [];
    return Array.isArray(categoriesList) ? categoriesList : [];
  } catch (e) {
    console.log('Fichier categories n\'existe pas encore');
    return [];
  }
}

// Fonction pour déchiffrer un secret
async function decryptSecretValue(encryptedValue, categoryPath, secretName, key) {
  if (!encryptedValue) return '';
  
  if (typeof encryptedValue === 'object' && encryptedValue.iv && encryptedValue.ciphertext && encryptedValue.tag) {
    // C'est un objet chiffré
    const context = `vault-secret-${categoryPath}-${secretName}-${key}`;
    return await window.cryptoSystem.decryptSecret(encryptedValue, optionsPin, context);
  } else if (typeof encryptedValue === 'string') {
    // Vérifier si c'est du JSON chiffré
    try {
      const parsedValue = JSON.parse(encryptedValue);
      if (parsedValue && parsedValue.iv && parsedValue.ciphertext && parsedValue.tag) {
        const context = `vault-secret-${categoryPath}-${secretName}-${key}`;
        return await window.cryptoSystem.decryptSecret(parsedValue, optionsPin, context);
      } else {
        return encryptedValue;
      }
    } catch (e) {
      return encryptedValue;
    }
  } else {
    return encryptedValue;
  }
}

// Fonction pour chiffrer un secret
async function encryptSecretValue(value, categoryPath, secretName, key) {
  if (!value) return '';
  
  const context = `vault-secret-${categoryPath}-${secretName}-${key}`;
  return await window.cryptoSystem.encryptSecret(value, optionsPin, context);
}

// Fonction pour exporter toutes les catégories et leurs secrets
async function exportAllCategories() {
  try {
    // Demander le PIN
    const pin = await promptForPin(
      '🔐 Export des Catégories',
      'Entrez votre PIN pour exporter vos catégories et secrets'
    );
    
    if (!pin) {
      return; // Annulé
    }

    // Authentifier
    categoriesStatus.innerHTML = '⏳ Authentification...';
    categoriesStatus.style.color = '#3b82f6';
    await authenticateForOptions(pin);

    // Charger les catégories
    categoriesStatus.innerHTML = '⏳ Chargement des catégories...';
    const categories = await loadCategoriesFromVaultOptions();

    if (categories.length === 0) {
      categoriesStatus.innerHTML = '⚠️ Aucune catégorie trouvée';
      categoriesStatus.style.color = '#d97706';
      return;
    }

    // Pour chaque catégorie, charger tous les secrets
    categoriesStatus.innerHTML = '⏳ Chargement des secrets...';
    const exportData = {
      version: '1.0',
      type: 'vault-password-manager-categories',
      exportDate: new Date().toISOString(),
      categories: []
    };

    for (const categoryPath of categories) {
      try {
        // Lire le secret de la catégorie (qui contient tous les secrets)
        const res = await readSecretOptions(categoryPath);
        const categoryData = (res && res.data && res.data.data) || {};
        
        // Déchiffrer tous les secrets
        const decryptedSecrets = {};
        for (const [secretName, secretData] of Object.entries(categoryData)) {
          if (secretName === 'categories') continue; // Ignorer la clé categories
          
          if (Array.isArray(secretData)) {
            // Déchiffrer chaque élément de la liste
            const decryptedItems = [];
            for (const item of secretData) {
              if (item && item.key) {
                const decryptedValue = await decryptSecretValue(
                  item.value,
                  categoryPath,
                  secretName,
                  item.key
                );
                decryptedItems.push({
                  key: item.key,
                  value: decryptedValue
                });
              }
            }
            decryptedSecrets[secretName] = decryptedItems;
          } else {
            decryptedSecrets[secretName] = secretData;
          }
        }

        exportData.categories.push({
          name: categoryPath,
          secrets: decryptedSecrets
        });
      } catch (e) {
        console.error(`Erreur lors du chargement de la catégorie ${categoryPath}:`, e);
        // Continuer avec les autres catégories
        exportData.categories.push({
          name: categoryPath,
          secrets: {},
          error: e.message
        });
      }
    }

    // Créer le fichier JSON
    const fileContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-categories-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    categoriesStatus.innerHTML = `✅ Export réussi ! ${exportData.categories.length} catégorie(s) exportée(s)`;
    categoriesStatus.style.color = '#059669';
    
    alert(`✅ Export réussi !\n\n${exportData.categories.length} catégorie(s) exportée(s).\n\n⚠️ IMPORTANT : Ce fichier contient vos secrets déchiffrés. Stockez-le dans un endroit sûr et ne le partagez jamais.`);

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    categoriesStatus.innerHTML = `❌ Erreur: ${error.message}`;
    categoriesStatus.style.color = '#dc2626';
    alert('❌ Erreur lors de l\'export: ' + error.message);
  }
}

// Fonction pour importer des catégories et leurs secrets
async function importAllCategories(file) {
  try {
    // Vérifier si le nom du fichier correspond au format d'export natif
    const fileName = file.name;
    const isNativeExport = /^vault-categories-export-\d+\.json$/.test(fileName);
    
    // Lire le fichier
    const fileContent = await file.text();
    let importData;
    
    try {
      importData = JSON.parse(fileContent);
    } catch {
      throw new Error('Format de fichier invalide. Le fichier doit être au format JSON.');
    }

    // Vérifier le format
    if (!importData.categories || importData.type !== 'vault-password-manager-categories') {
      throw new Error('Ce fichier ne contient pas des catégories valides.');
    }

    // Confirmation
    const confirmMsg = `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point d'importer ${importData.categories.length} catégorie(s).\n\n` +
      `Cela va :\n` +
      `• Remplacer toutes vos catégories existantes\n` +
      `• Remplacer tous les secrets existants dans ces catégories\n` +
      `• Les secrets seront chiffrés avec votre Master Key actuelle\n\n` +
      `Fichier exporté le : ${importData.exportDate ? new Date(importData.exportDate).toLocaleString() : 'date inconnue'}\n\n` +
      `Êtes-vous sûr de vouloir continuer ?`;
    
    if (!confirm(confirmMsg)) {
      return;
    }

    // Demander le PIN
    const pin = await promptForPin(
      '🔐 Import des Catégories',
      'Entrez votre PIN pour importer vos catégories et secrets'
    );
    
    if (!pin) {
      return; // Annulé
    }

    // Authentifier
    categoriesStatus.innerHTML = '⏳ Authentification...';
    categoriesStatus.style.color = '#3b82f6';
    await authenticateForOptions(pin);

    // Vérifier que le système de chiffrement est initialisé
    const hasMK = await window.cryptoSystem.hasMasterKey();
    if (!hasMK) {
      throw new Error('Aucune Master Key trouvée. Veuillez d\'abord configurer l\'extension.');
    }

    // Importer chaque catégorie
    categoriesStatus.innerHTML = '⏳ Import en cours...';
    let importedCount = 0;
    let errorCount = 0;

    for (const category of importData.categories) {
      try {
        if (category.error) {
          console.warn(`Catégorie ${category.name} a une erreur: ${category.error}`);
          errorCount++;
          continue;
        }

        // Chiffrer tous les secrets
        const encryptedSecrets = {};
        for (const [secretName, secretData] of Object.entries(category.secrets || {})) {
          if (Array.isArray(secretData)) {
            // Chiffrer chaque élément de la liste
            const encryptedItems = [];
            for (const item of secretData) {
              if (item && item.key) {
                let valueToEncrypt = item.value;
                
                // Si le fichier n'est pas un export natif, vérifier si la valeur est déjà chiffrée
                if (!isNativeExport) {
                  // Vérifier si la valeur est déjà chiffrée (objet avec iv, ciphertext, tag)
                  const isAlreadyEncrypted = (
                    valueToEncrypt &&
                    typeof valueToEncrypt === 'object' &&
                    valueToEncrypt.iv &&
                    valueToEncrypt.ciphertext &&
                    valueToEncrypt.tag
                  ) || (
                    typeof valueToEncrypt === 'string' &&
                    (() => {
                      try {
                        const parsed = JSON.parse(valueToEncrypt);
                        return parsed && parsed.iv && parsed.ciphertext && parsed.tag;
                      } catch {
                        return false;
                      }
                    })()
                  );
                  
                  // Si déjà chiffré, ne pas re-chiffrer
                  if (isAlreadyEncrypted) {
                    encryptedItems.push({
                      key: item.key,
                      value: valueToEncrypt
                    });
                    continue;
                  }
                }
                
                // Sinon, chiffrer la valeur (fichier natif déchiffré ou fichier externe en clair)
                const encryptedValue = await encryptSecretValue(
                  valueToEncrypt,
                  category.name,
                  secretName,
                  item.key
                );
                encryptedItems.push({
                  key: item.key,
                  value: encryptedValue
                });
              }
            }
            encryptedSecrets[secretName] = encryptedItems;
          } else {
            // Pour les valeurs non-array, vérifier aussi si elles sont déjà chiffrées
            if (!isNativeExport && secretData && typeof secretData === 'object' && secretData.iv && secretData.ciphertext && secretData.tag) {
              // Déjà chiffré, ne pas re-chiffrer
              encryptedSecrets[secretName] = secretData;
            } else {
              // Sinon, chiffrer (ou garder tel quel si ce n'est pas une valeur simple)
              encryptedSecrets[secretName] = secretData;
            }
          }
        }

        // Écrire la catégorie dans Vault
        await writeSecretOptions(category.name, encryptedSecrets);
        importedCount++;
      } catch (e) {
        console.error(`Erreur lors de l'import de la catégorie ${category.name}:`, e);
        errorCount++;
      }
    }

    // Mettre à jour la liste des catégories
    const categoryNames = importData.categories
      .filter(cat => !cat.error)
      .map(cat => cat.name);
    
    await writeSecretOptions('categories', { categories: categoryNames });

    categoriesStatus.innerHTML = `✅ Import réussi ! ${importedCount} catégorie(s) importée(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`;
    categoriesStatus.style.color = '#059669';
    
    alert(`✅ Import réussi !\n\n${importedCount} catégorie(s) importée(s).${errorCount > 0 ? `\n\n⚠️ ${errorCount} catégorie(s) n'a/ont pas pu être importée(s).` : ''}`);

    // Réinitialiser l'input file
    importCategoriesFile.value = '';

  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    categoriesStatus.innerHTML = `❌ Erreur: ${error.message}`;
    categoriesStatus.style.color = '#dc2626';
    alert('❌ Erreur lors de l\'import: ' + error.message);
    importCategoriesFile.value = '';
  }
}

// Event listeners pour l'import/export
exportCategoriesBtn.addEventListener('click', exportAllCategories);

importCategoriesBtn.addEventListener('click', () => {
  importCategoriesFile.click();
});

importCategoriesFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  await importAllCategories(file);
});
