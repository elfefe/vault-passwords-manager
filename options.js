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
const GOOGLE_CLIENT_ID = "482552972428-tn0hjn31huufi49cslf8982nmacf5sg9.apps.googleusercontent.com";

// Variables pour le modal PIN prompt
let pinPromptResolve = null;

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
  chrome.storage.local.get(['vaultUrl', 'kvMount'], (res) => {
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
              chrome.storage.local.get(['pinHash'], async (res) => {
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
    chrome.storage.local.get(['pinHash'], async (res) => {
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
      chrome.storage.local.set(dataToSave, resolve);
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
    
    // Initialiser le système de chiffrement (générer la master key)
    await window.cryptoSystem.initializeCryptoSystem(pin);
    console.log('Système de chiffrement initialisé avec succès');
    
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
    
    // Sauvegarder dans chrome.storage.local
    await new Promise((resolve) => {
      chrome.storage.local.set(dataToSave, resolve);
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
  chrome.storage.local.get(['pinHash'], async (res) => {
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
      chrome.storage.local.get(['encryptedToken'], async (res2) => {
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
            chrome.storage.local.set(dataToSave, resolve);
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
    chrome.storage.local.clear(() => {
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
    masterKeyStatus.innerHTML = '✅ <strong>Master Key présente</strong> - Vous pouvez l\'exporter pour backup';
    masterKeyStatus.style.color = '#059669';
  } else {
    masterKeyStatus.innerHTML = '⚠️ <strong>Aucune Master Key</strong> - Créez-en une ou importez-en une';
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
      chrome.storage.local.get(['pinHash'], resolve);
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

// Export Master Key
exportMasterKeyBtn.addEventListener('click', async () => {
  try {
    // Vérifier si une Master Key existe
    const hasMK = await window.cryptoSystem.hasMasterKey();
    if (!hasMK) {
      alert('Aucune Master Key à exporter. Créez-en une d\'abord en configurant l\'extension.');
      return;
    }
    
    // Demander le PIN
    const pin = await promptForPin(
      '🔐 Export de la Master Key',
      'Entrez votre PIN pour déverrouiller la Master Key'
    );
    
    if (!pin) {
      return; // Annulé
    }
    
    // Charger la Master Key
    const masterKey = await window.cryptoSystem.loadMasterKey(pin);
    
    // Convertir en hexadécimal
    const masterKeyHex = Array.from(masterKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Créer le contenu du fichier avec métadonnées
    const exportData = {
      version: '1.1',
      type: 'vault-password-manager-master-key',
      exportDate: new Date().toISOString(),
      masterKey: masterKeyHex,
      warning: 'HAUTEMENT CONFIDENTIEL - Ne partagez jamais ce fichier'
    };
    
    const fileContent = JSON.stringify(exportData, null, 2);
    
    // Télécharger le fichier
    const blob = new Blob([fileContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vault-master-key-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('✅ Master Key exportée avec succès!\n\n⚠️ IMPORTANT : Stockez ce fichier dans un endroit sûr et ne le partagez jamais.');
    
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    alert('❌ Erreur lors de l\'export: ' + error.message);
  }
});

// Import Master Key
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
    
    // Vérifier le format
    if (!importData.masterKey || importData.type !== 'vault-password-manager-master-key') {
      alert('❌ Ce fichier ne contient pas une Master Key valide.');
      return;
    }
    
    // Confirmation
    const confirmMsg = `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point d'importer une Master Key.\n\n` +
      `Cela va :\n` +
      `• Remplacer votre Master Key actuelle (si elle existe)\n` +
      `• Vous permettre de déchiffrer les secrets créés avec cette Master Key\n` +
      `• Rendre inaccessibles les secrets créés avec l'ancienne Master Key\n\n` +
      `Fichier exporté le : ${new Date(importData.exportDate).toLocaleString()}\n\n` +
      `Êtes-vous sûr de vouloir continuer ?`;
    
    if (!confirm(confirmMsg)) {
      return;
    }
    
    // Demander le PIN
    const pin = await promptForPin(
      '🔐 Import de la Master Key',
      'Entrez votre PIN pour chiffrer la nouvelle Master Key'
    );
    
    if (!pin) {
      return; // Annulé
    }
    
    // Convertir hex en Uint8Array
    const masterKeyHex = importData.masterKey;
    const masterKey = new Uint8Array(
      masterKeyHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    
    if (masterKey.length !== 32) {
      alert('❌ Taille de Master Key invalide. Elle doit faire 32 bytes (256 bits).');
      return;
    }
    
    // Convertir en hex pour le stockage
    const masterKeyHexForStorage = Array.from(masterKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Chiffrer la master key avec le PIN
    const encryptedMasterKey = await window.cryptoUtils.encrypt(masterKeyHexForStorage, pin);
    
    // Stocker dans chrome.storage.local
    await new Promise((resolve) => {
      chrome.storage.local.set({ encryptedMasterKey }, resolve);
    });
    
    alert('✅ Master Key importée avec succès!\n\nVous pouvez maintenant déchiffrer les secrets créés avec cette Master Key.');
    
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
