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
const GOOGLE_CLIENT_ID = "482552972428-tn0hjn31huufi49cslf8982nmacf5sg9.apps.googleusercontent.com";

// Limiter les inputs PIN à 4 chiffres
pinInput.addEventListener('input', (e) => {
  e.target.value = e.target.value.slice(0, 4);
});

pinConfirm.addEventListener('input', (e) => {
  e.target.value = e.target.value.slice(0, 4);
});

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
    
    // Create mount path if it doesn't exist
    const mountResult = await ensureMountPath(vaultUrl, vaultToken, kvMount);
    if (!mountResult.success) {
      alert(`Erreur mount: ${mountResult.message || 'Impossible de créer le mount path'}. Vérifiez les permissions du token.`);
      return;
    }
    
    // Encrypt the token
    const encryptedToken = await window.cryptoUtils.encrypt(vaultToken, pin);
    const pinHash = await window.cryptoUtils.sha256(pin);
    
    // Save to storage
    await new Promise((resolve) => {
      chrome.storage.local.set({
        vaultUrl: vaultUrl,
        kvMount: kvMount,
        encryptedToken: encryptedToken,
        pinHash: pinHash
      }, resolve);
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
    
    // Sauvegarder dans chrome.storage.local
    await new Promise((resolve) => {
      chrome.storage.local.set({
        vaultUrl: vaultUrl,
        kvMount: kvMount,
        encryptedToken: encryptedToken,
        pinHash: pinHash
      }, resolve);
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
          
          // Créer le mount path s'il n'existe pas
          const mountResult = await ensureMountPath(vaultUrl, vaultToken, kvMount);
          if (!mountResult.success) {
            alert(`Erreur mount: ${mountResult.message || 'Impossible de créer le mount path'}. Vérifiez les permissions du token.`);
            return;
          }
          
          // Chiffrer le nouveau token avec le même PIN
          const encryptedToken = await window.cryptoUtils.encrypt(vaultToken, currentPin);
          
          await new Promise((resolve) => {
            chrome.storage.local.set({
              vaultUrl: vaultUrl,
              kvMount: kvMount,
              encryptedToken: encryptedToken
            }, resolve);
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
