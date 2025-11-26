// popup.js - interaction avec Vault KV v2
const categorySelect = document.getElementById('categorySelect');
const newCategoryBtn = document.getElementById('newCategoryBtn');
const deleteCategoryBtn = document.getElementById('deleteCategoryBtn');
const writeBtn = document.getElementById('writeBtn');
const deleteBtn = document.getElementById('deleteBtn');
// const addFieldBtn = document.getElementById('addFieldBtn'); // Bouton supprimé
const generateBtn = document.getElementById('generateBtn');
const newEntryBtn = document.getElementById('newEntryBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
const secretTableBody = document.getElementById('secretTableBody');
const toast = document.getElementById('toast');
const optionsLink = document.getElementById('optionsLink');
const cardsContainer = document.getElementById('cardsContainer');
const itemsCount = document.getElementById('itemsCount');
const searchInput = document.getElementById('searchInput');
const createBtn = document.getElementById('createBtn');
const typeBtn = document.getElementById('typeBtn');
const settingsBtn = document.getElementById('settingsBtn');
const cardsView = document.getElementById('cardsView');
const detailView = document.getElementById('detailView');
const backBtn = document.getElementById('backBtn');
const detailTitle = document.getElementById('detailTitle');
const detailTitleInput = document.getElementById('detailTitleInput');
let currentCategoryPath = null;
let currentSecretName = null; // Nom du secret actuellement édité
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
const createPasswordModal = document.getElementById('createPasswordModal');
const createPasswordInput = document.getElementById('createPasswordInput');
const createPasswordConfirm = document.getElementById('createPasswordConfirm');
const createPasswordBtn = document.getElementById('createPasswordBtn');
const createPasswordError = document.getElementById('createPasswordError');
const toggleCreatePassword = document.getElementById('toggleCreatePassword');
const toggleCreatePasswordConfirm = document.getElementById('toggleCreatePasswordConfirm');

let settings = { vaultUrl: '', vaultToken: '', kvMount: '' };
let isAuthenticated = false;
let currentDecryptedToken = null;
let currentPin = null; // PIN stocké en mémoire pendant la session
let pendingToken = null; // Token en attente de configuration
let pendingDisplayName = null; // Display name en attente
let pendingMasterPassword = null; // Mot de passe Master Key en attente
let pendingIsOAuth = false; // Indique si l'authentification est OAuth (true) ou manuelle (false)
let categories = []; // Liste des catégories
const GOOGLE_CLIENT_ID = "482552972428-tn0hjn31huufi49cslf8982nmacf5sg9.apps.googleusercontent.com";

// Limiter les inputs PIN à 4 chiffres et valider automatiquement quand 4 chiffres sont entrés
authPinInput.addEventListener('input', (e) => {
  // Permettre uniquement les chiffres
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
  // Valider automatiquement quand 4 chiffres sont entrés
  if (e.target.value.length === 4 && /^\d{4}$/.test(e.target.value)) {
    handleAuth();
  }
});

authPinInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    handleAuth();
  }
  // Bloquer les caractères non numériques
  if (!/^\d$/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace') {
    e.preventDefault();
  }
});

createPinInput.addEventListener('input', (e) => {
  // Permettre uniquement les chiffres
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

createPinInput.addEventListener('keypress', (e) => {
  // Bloquer les caractères non numériques
  if (!/^\d$/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Tab') {
    e.preventDefault();
  }
});

createPinConfirm.addEventListener('input', (e) => {
  // Permettre uniquement les chiffres
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4);
});

createPinConfirm.addEventListener('keypress', (e) => {
  // Bloquer les caractères non numériques
  if (!/^\d$/.test(e.key) && e.key !== 'Enter' && e.key !== 'Backspace' && e.key !== 'Tab') {
    e.preventDefault();
  }
});

// Toggle visibilité des PINs lors de la création
const toggleCreatePin = document.getElementById('toggleCreatePin');
const toggleCreatePinConfirm = document.getElementById('toggleCreatePinConfirm');

if (toggleCreatePin) {
  toggleCreatePin.addEventListener('click', () => {
    const input = createPinInput;
    if (input.type === 'password') {
      input.type = 'text';
      toggleCreatePin.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      toggleCreatePin.title = 'Masquer le PIN';
    } else {
      input.type = 'password';
      toggleCreatePin.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      toggleCreatePin.title = 'Afficher le PIN';
    }
  });
}

if (toggleCreatePinConfirm) {
  toggleCreatePinConfirm.addEventListener('click', () => {
    const input = createPinConfirm;
    if (input.type === 'password') {
      input.type = 'text';
      toggleCreatePinConfirm.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      toggleCreatePinConfirm.title = 'Masquer le PIN';
    } else {
      input.type = 'password';
      toggleCreatePinConfirm.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      toggleCreatePinConfirm.title = 'Afficher le PIN';
    }
  });
}

setupTokenInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    setupTokenBtn.click();
  }
});

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

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

// Fonction pour vérifier si le token est encore valide
async function isTokenValid(vaultUrl, token) {
  try {
    const metadata = await getTokenMetadata(vaultUrl, token);
    if (!metadata) {
      return false;
    }
    
    // Si pas de date d'expiration, considérer comme valide (token sans expiration)
    if (!metadata.expireTime) {
      return true;
    }
    
    // Vérifier si la date d'expiration est dans le futur
    const now = Math.floor(Date.now() / 1000); // Timestamp Unix en secondes
    return metadata.expireTime > now;
  } catch (error) {
    console.error('Erreur lors de la vérification de validité du token:', error);
    return false;
  }
}

// Fonction pour régénérer automatiquement le token via OIDC et le sauvegarder
// Cette fonction ouvre le flux OIDC, récupère le nouveau token et le sauvegarde avec le PIN existant
async function regenerateTokenAndSave(vaultUrl, pin) {
  return new Promise((resolve, reject) => {
    // Afficher un message à l'utilisateur
    showToast('Régénération du token en cours...', 'info');
    
    // Sauvegarder le handler original
    const originalHandleVaultToken = window.handleVaultToken;
    let tokenResolved = false;
    
    // Créer un handler temporaire pour capturer et sauvegarder le nouveau token
    window.handleVaultToken = async (newToken) => {
      if (tokenResolved) return; // Éviter les appels multiples
      tokenResolved = true;
      
      try {
        // Restaurer le handler original immédiatement
        window.handleVaultToken = originalHandleVaultToken;
        
        // Vérifier que le token est valide
        const testResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
          method: 'GET',
          headers: {
            'X-Vault-Token': newToken,
            'Content-Type': 'application/json'
          }
        });

        if (!testResponse.ok) {
          throw new Error('Nouveau token invalide');
        }

        // Récupérer les métadonnées du token (TTL, date d'expiration)
        const tokenMetadata = await getTokenMetadata(vaultUrl, newToken);
        
        // Récupérer les données existantes
        const stored = await new Promise((resolve) => {
          chrome.storage.sync.get(['kvMount'], resolve);
        });
        
        // Récupérer l'entity_name si nécessaire
        let kvMount = stored.kvMount;
        if (!kvMount) {
          kvMount = await getEntityNameFromToken(vaultUrl, newToken);
        }
        
        // Créer le mount path s'il n'existe pas
        if (kvMount) {
          const mountResult = await ensureMountPath(vaultUrl, newToken, kvMount);
          if (!mountResult.success) {
            console.warn('Erreur mount lors de la régénération:', mountResult.message);
          }
        }
        
        // Chiffrer le nouveau token avec le PIN existant
        const encryptedToken = await window.cryptoUtils.encrypt(newToken, pin);
        const pinHash = await window.cryptoUtils.sha256(pin);
        
        // Préparer les données à sauvegarder
        const dataToSave = {
          vaultUrl: vaultUrl,
          encryptedToken: encryptedToken,
          pinHash: pinHash
        };
        
        if (kvMount) {
          dataToSave.kvMount = kvMount;
        }
        
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
        
        // Sauvegarder le nouveau token
        await new Promise((resolve) => {
          chrome.storage.sync.set(dataToSave, resolve);
        });
        
        console.log('Token régénéré et sauvegardé avec succès');
        showToast('Token régénéré avec succès', 'success');
        
        // Retourner le token déchiffré pour continuer l'authentification
        resolve(newToken);
      } catch (error) {
        // Restaurer le handler original en cas d'erreur
        window.handleVaultToken = originalHandleVaultToken;
        console.error('Erreur lors de la régénération du token:', error);
        showToast('Erreur lors de la régénération: ' + error.message, 'error');
        reject(error);
      }
    };
    
    // Ouvrir le flux OIDC en utilisant la même logique que openGoogleSignIn
    // mais sans afficher d'erreur dans setupError (on gère les erreurs ici)
    (async () => {
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
          throw new Error('Erreur Vault: ' + errorMsg);
        }

        const authData = await authResponse.json();
        const authUrl = authData.data?.auth_url;

        if (!authUrl) {
          throw new Error('URL d\'authentification non reçue de Vault');
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
            window.handleVaultToken = originalHandleVaultToken;
            reject(new Error('Impossible d\'ouvrir la fenêtre: ' + (chrome.runtime.lastError?.message || 'Erreur inconnue')));
            return;
          }

          const tabId = popupWindow.tabs[0].id;
          let callbackProcessed = false;
          
          // Injecter l'overlay IMMÉDIATEMENT dès que la popup est créée
          // On utilise un listener pour injecter dès que le tab commence à se charger
          const injectOverlay = async () => {
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                  // Créer l'overlay immédiatement
                  if (!document.getElementById('vault-auth-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.id = 'vault-auth-overlay';
                    overlay.style.cssText = `
                      position: fixed;
                      top: 0;
                      left: 0;
                      width: 100vw;
                      height: 100vh;
                      background: linear-gradient(135deg, #290873, #7209B7, #F72585);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      z-index: 999999;
                      font-family: Arial, sans-serif;
                      color: white;
                      text-align: center;
                      padding: 20px;
                    `;
                    overlay.innerHTML = `
                      <div>
                        <div style="font-size: 24px; margin-bottom: 10px; animation: spin 1s linear infinite;">⏳</div>
                        <p style="font-size: 18px; margin: 0;">Traitement en cours...</p>
                      </div>
                      <style>
                        @keyframes spin {
                          from { transform: rotate(0deg); }
                          to { transform: rotate(360deg); }
                        }
                      </style>
                    `;
                    
                    // Ajouter au document dès que possible
                    const addOverlay = () => {
                      if (document.documentElement) {
                        document.documentElement.appendChild(overlay);
                      } else if (document.body) {
                        document.body.appendChild(overlay);
                      } else {
                        // Attendre que le document soit prêt
                        if (document.readyState === 'loading') {
                          document.addEventListener('DOMContentLoaded', addOverlay);
                        } else {
                          setTimeout(addOverlay, 0);
                        }
                      }
                    };
                    addOverlay();
                    
                    // Cacher tout contenu qui apparaît
                    const hideContent = () => {
                      if (document.body) {
                        document.body.style.visibility = 'hidden';
                        document.body.style.opacity = '0';
                        document.body.style.display = 'none';
                      }
                    };
                    
                    // Observer les changements
                    const observer = new MutationObserver(() => {
                      hideContent();
                    });
                    
                    if (document.documentElement) {
                      observer.observe(document.documentElement, {
                        childList: true,
                        subtree: true
                      });
                    }
                    
                    // Cacher immédiatement si le body existe déjà
                    hideContent();
                  }
                },
                world: 'MAIN'
              });
            } catch (e) {
              console.warn('Could not inject overlay immediately:', e);
            }
          };
          
          // Injecter dès que possible
          setTimeout(injectOverlay, 0);
          // Aussi injecter quand le tab commence à se charger
          chrome.tabs.onUpdated.addListener(function onTabUpdate(updatedTabId, changeInfo) {
            if (updatedTabId === tabId && changeInfo.status === 'loading') {
              injectOverlay();
              chrome.tabs.onUpdated.removeListener(onTabUpdate);
            }
          });

          // Listen for tab updates to detect when we reach Vault callback
          const tabUpdateListener = async (updatedTabId, changeInfo, tab) => {
            if (updatedTabId !== tabId || callbackProcessed) return;
            
            // Check if we're on the Vault callback page
            if (changeInfo.url && changeInfo.url.includes('vault.exem.fr') && 
                changeInfo.url.includes('/auth/oidc/oidc/callback')) {
              console.log('Detected Vault callback page:', changeInfo.url);
              
              // Injecter immédiatement un script qui cache le contenu AVANT qu'il ne soit rendu
              try {
                // Injecter un script qui s'exécute au début du document et cache tout immédiatement
                await chrome.scripting.executeScript({
                  target: { tabId: tabId },
                  func: () => {
                    // Créer l'overlay immédiatement, même avant que le body n'existe
                    const overlay = document.createElement('div');
                    overlay.id = 'vault-auth-overlay';
                    overlay.style.cssText = `
                      position: fixed;
                      top: 0;
                      left: 0;
                      width: 100vw;
                      height: 100vh;
                      background: linear-gradient(135deg, #290873, #7209B7, #F72585);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      z-index: 999999;
                      font-family: Arial, sans-serif;
                      color: white;
                      text-align: center;
                      padding: 20px;
                    `;
                    overlay.innerHTML = `
                      <div>
                        <div style="font-size: 24px; margin-bottom: 10px; animation: spin 1s linear infinite;">⏳</div>
                        <p style="font-size: 18px; margin: 0;">Traitement en cours...</p>
                      </div>
                      <style>
                        @keyframes spin {
                          from { transform: rotate(0deg); }
                          to { transform: rotate(360deg); }
                        }
                      </style>
                    `;
                    
                    // Ajouter l'overlay au document immédiatement
                    if (document.documentElement) {
                      document.documentElement.appendChild(overlay);
                    } else {
                      // Si documentElement n'existe pas encore, attendre DOMContentLoaded
                      if (document.readyState === 'loading') {
                        document.addEventListener('DOMContentLoaded', () => {
                          document.documentElement.appendChild(overlay);
                        });
                      }
                    }
                    
                    // Cacher le body dès qu'il apparaît
                    const hideBody = () => {
                      if (document.body) {
                        document.body.style.visibility = 'hidden';
                        document.body.style.opacity = '0';
                        document.body.style.display = 'none';
                      }
                    };
                    
                    // Essayer immédiatement
                    hideBody();
                    
                    // Utiliser MutationObserver pour cacher tout contenu qui apparaît
                    const observer = new MutationObserver((mutations) => {
                      hideBody();
                      // Cacher aussi tous les éléments qui sont ajoutés
                      mutations.forEach((mutation) => {
                        mutation.addedNodes.forEach((node) => {
                          if (node.nodeType === 1) { // Element node
                            if (node !== overlay && node.id !== 'vault-auth-overlay') {
                              node.style.visibility = 'hidden';
                              node.style.opacity = '0';
                              node.style.display = 'none';
                            }
                          }
                        });
                      });
                    });
                    
                    // Observer les changements du document
                    if (document.documentElement) {
                      observer.observe(document.documentElement, {
                        childList: true,
                        subtree: true
                      });
                    }
                    
                    // Observer aussi quand le body est créé
                    if (document.body) {
                      observer.observe(document.body, {
                        childList: true,
                        subtree: true
                      });
                    } else {
                      // Attendre que le body soit créé
                      const bodyObserver = new MutationObserver(() => {
                        if (document.body) {
                          hideBody();
                          observer.observe(document.body, {
                            childList: true,
                            subtree: true
                          });
                          bodyObserver.disconnect();
                        }
                      });
                      bodyObserver.observe(document.documentElement, {
                        childList: true
                      });
                    }
                  },
                  world: 'MAIN'
                });
              } catch (e) {
                console.warn('Could not inject hiding script immediately:', e);
              }
              
              // Attendre un peu que le contenu se charge, puis extraire le token
              setTimeout(async () => {
                try {
                  // Inject script that saves content and extracts token
                  const results = await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => {
                      // Rendre le body visible temporairement pour lire le contenu
                      if (document.body) {
                        document.body.style.visibility = 'visible';
                        document.body.style.opacity = '1';
                      }
                      
                      // Sauvegarder le contenu original
                      const bodyText = document.body.innerText || document.body.textContent;
                      
                      // Re-cacher immédiatement
                      if (document.body) {
                        document.body.style.visibility = 'hidden';
                        document.body.style.opacity = '0';
                      }
                      
                      // Extraire le token depuis le contenu sauvegardé
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
                          rawText: bodyText.substring(0, 500)
                        };
                      }
                    }
                  });

                  callbackProcessed = true;
                  chrome.tabs.onUpdated.removeListener(tabUpdateListener);

                  if (!results || !results[0] || !results[0].result) {
                    // Si on ne peut pas lire le contenu, cacher l'overlay pour afficher le contenu réel
                    await chrome.scripting.executeScript({
                      target: { tabId: tabId },
                      func: () => {
                        const overlay = document.getElementById('vault-auth-overlay');
                        if (overlay) {
                          overlay.style.display = 'none';
                          overlay.remove();
                        }
                        // Restaurer la visibilité du body pour afficher le contenu réel
                        if (document.body) {
                          document.body.style.visibility = 'visible';
                          document.body.style.opacity = '1';
                          document.body.style.display = '';
                        }
                      }
                    });
                    
                    window.handleVaultToken = originalHandleVaultToken;
                    chrome.windows.remove(popupWindow.id);
                    reject(new Error('Impossible de lire la réponse de Vault'));
                    return;
                  }

                  const result = results[0].result;
                  console.log('Extracted result:', result);

                  if (!result.success || !result.token) {
                    // Si ce n'est pas un token valide, cacher l'overlay pour afficher le contenu réel
                    await chrome.scripting.executeScript({
                      target: { tabId: tabId },
                      func: () => {
                        const overlay = document.getElementById('vault-auth-overlay');
                        if (overlay) {
                          overlay.style.display = 'none';
                          overlay.remove();
                        }
                        // Restaurer la visibilité du body pour afficher le contenu réel
                        if (document.body) {
                          document.body.style.visibility = 'visible';
                          document.body.style.opacity = '1';
                          document.body.style.display = '';
                        }
                      }
                    });
                    
                    window.handleVaultToken = originalHandleVaultToken;
                    chrome.windows.remove(popupWindow.id);
                    reject(new Error('Token non trouvé dans la réponse Vault'));
                    return;
                  }

                  // Afficher un message de succès dans la popup au lieu du token
                  await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: () => {
                      // Mettre à jour l'overlay existant ou créer un nouveau
                      const overlay = document.getElementById('vault-auth-overlay');
                      if (overlay) {
                        overlay.innerHTML = `
                          <div>
                            <h1 style="font-size: 24px; margin-bottom: 10px;">✓</h1>
                            <p style="font-size: 18px; margin: 0;">Authentification Google réussie</p>
                          </div>
                        `;
                      } else {
                        // Si l'overlay n'existe pas, créer le message directement
                        document.body.innerHTML = `
                          <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; background: linear-gradient(135deg, #290873, #7209B7, #F72585); color: white; text-align: center; padding: 20px;">
                            <div>
                              <h1 style="font-size: 24px; margin-bottom: 10px;">✓</h1>
                              <p style="font-size: 18px; margin: 0;">Authentification Google réussie</p>
                            </div>
                          </div>
                        `;
                      }
                    }
                  });

                  // Attendre un peu pour que l'utilisateur voie le message
                  await new Promise(resolve => setTimeout(resolve, 1500));

                  // Close the popup
                  chrome.windows.remove(popupWindow.id);

                  // Process the token OAuth - utiliser la même logique que handleCredentialResponse
                  // Pour OAuth, on ne doit pas demander de mot de passe
                  const vaultUrl = settings.vaultUrl || 'https://vault.exem.fr/';
                  
                  // Vérifier le token et récupérer l'entity_name
                  const testResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
                    method: 'GET',
                    headers: {
                      'X-Vault-Token': result.token,
                      'Content-Type': 'application/json'
                    }
                  });

                  if (!testResponse.ok) {
                    throw new Error('Token Vault invalide');
                  }

                  const entityName = await getEntityNameFromToken(vaultUrl, result.token);

                  // Créer le mount path s'il n'existe pas
                  let mountPath = settings.kvMount || entityName;
                  const mountResult = await ensureMountPath(vaultUrl, result.token, mountPath);
                  if (!mountResult.success) {
                    const errorMsg = mountResult.message || 'Impossible de créer le mount path';
                    throw new Error(`Erreur mount: ${errorMsg}`);
                  }

                  // Token valide et mount créé, stocker temporairement
                  // Pour OAuth, utiliser directement l'entityName comme Master Key (pas de mot de passe)
                  pendingToken = result.token;
                  pendingDisplayName = entityName;
                  pendingIsOAuth = true; // Authentification OAuth
                  hideSetupModal();
                  // Passer directement au modal PIN (pas de mot de passe pour OAuth)
                  showCreatePinModal();
                } catch (e) {
                  callbackProcessed = true;
                  chrome.tabs.onUpdated.removeListener(tabUpdateListener);
                  window.handleVaultToken = originalHandleVaultToken;
                  console.error('Error extracting token:', e);
                  chrome.windows.remove(popupWindow.id);
                  reject(new Error('Erreur: ' + e.message));
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
              if (!tokenResolved) {
                window.handleVaultToken = originalHandleVaultToken;
                reject(new Error('Timeout: La régénération du token a pris trop de temps'));
              }
            }
          }, 5 * 60 * 1000);
        });
      } catch (error) {
        window.handleVaultToken = originalHandleVaultToken;
        console.error('OIDC auth error:', error);
        reject(error);
      }
    })();
  });
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
  
  // Setup Google Sign-In button click handler
  const buttonDiv = document.getElementById('googleSignInButton');
  if (buttonDiv) {
    buttonDiv.innerHTML = '<button class="btn btn-primary" style="width: 100%; padding: 12px; display: flex; align-items: center; justify-content: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Se connecter avec Google</button>';
    const button = buttonDiv.querySelector('button');
    if (button) {
      button.addEventListener('click', openGoogleSignIn);
    }
  }
}

// Open Google Sign-In using Vault's OIDC flow
async function openGoogleSignIn() {
  const vaultUrl = settings.vaultUrl || 'https://vault.exem.fr/';
  
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
      setupError.textContent = 'Erreur Vault: ' + errorMsg;
      setupError.style.display = 'block';
      return;
    }

    const authData = await authResponse.json();
    const authUrl = authData.data?.auth_url;

    if (!authUrl) {
      setupError.textContent = 'Erreur: URL d\'authentification non reçue de Vault';
      setupError.style.display = 'block';
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
        setupError.textContent = 'Impossible d\'ouvrir la fenêtre: ' + (chrome.runtime.lastError?.message || 'Erreur inconnue');
        setupError.style.display = 'block';
        return;
      }

      const tabId = popupWindow.tabs[0].id;
      let callbackProcessed = false;
      
      // Injecter l'overlay IMMÉDIATEMENT dès que la popup est créée
      const injectOverlay = async () => {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
              // Créer l'overlay immédiatement
              if (!document.getElementById('vault-auth-overlay')) {
                const overlay = document.createElement('div');
                overlay.id = 'vault-auth-overlay';
                overlay.style.cssText = `
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100vw;
                  height: 100vh;
                  background: linear-gradient(135deg, #290873, #7209B7, #F72585);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 999999;
                  font-family: Arial, sans-serif;
                  color: white;
                  text-align: center;
                  padding: 20px;
                `;
                overlay.innerHTML = `
                  <div>
                    <div style="font-size: 24px; margin-bottom: 10px; animation: spin 1s linear infinite;">⏳</div>
                    <p style="font-size: 18px; margin: 0;">Traitement en cours...</p>
                  </div>
                  <style>
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  </style>
                `;
                
                // Ajouter au document dès que possible
                const addOverlay = () => {
                  if (document.documentElement) {
                    document.documentElement.appendChild(overlay);
                  } else if (document.body) {
                    document.body.appendChild(overlay);
                  } else {
                    // Attendre que le document soit prêt
                    if (document.readyState === 'loading') {
                      document.addEventListener('DOMContentLoaded', addOverlay);
                    } else {
                      setTimeout(addOverlay, 0);
                    }
                  }
                };
                addOverlay();
                
                // Cacher tout contenu qui apparaît
                const hideContent = () => {
                  if (document.body) {
                    document.body.style.visibility = 'hidden';
                    document.body.style.opacity = '0';
                    document.body.style.display = 'none';
                  }
                };
                
                // Observer les changements
                const observer = new MutationObserver(() => {
                  hideContent();
                });
                
                if (document.documentElement) {
                  observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                  });
                }
                
                // Cacher immédiatement si le body existe déjà
                hideContent();
              }
            },
            world: 'MAIN'
          });
        } catch (e) {
          console.warn('Could not inject overlay immediately:', e);
        }
      };
      
      // Injecter dès que possible
      setTimeout(injectOverlay, 0);
      // Aussi injecter quand le tab commence à se charger
      chrome.tabs.onUpdated.addListener(function onTabUpdate(updatedTabId, changeInfo) {
        if (updatedTabId === tabId && changeInfo.status === 'loading') {
          injectOverlay();
          chrome.tabs.onUpdated.removeListener(onTabUpdate);
        }
      });

      // Listen for tab updates to detect when we reach Vault callback
      const tabUpdateListener = async (updatedTabId, changeInfo, tab) => {
        if (updatedTabId !== tabId || callbackProcessed) return;
        
        // Check if we're on the Vault callback page
        if (changeInfo.url && changeInfo.url.includes('vault.exem.fr') && 
            changeInfo.url.includes('/auth/oidc/oidc/callback')) {
          console.log('Detected Vault callback page:', changeInfo.url);
          
          // Injecter immédiatement un script qui cache le contenu AVANT qu'il ne soit rendu
          try {
            // Injecter un script qui s'exécute au début du document et cache tout immédiatement
            await chrome.scripting.executeScript({
              target: { tabId: tabId },
              func: () => {
                // Créer l'overlay immédiatement, même avant que le body n'existe
                const overlay = document.createElement('div');
                overlay.id = 'vault-auth-overlay';
                overlay.style.cssText = `
                  position: fixed;
                  top: 0;
                  left: 0;
                  width: 100vw;
                  height: 100vh;
                  background: linear-gradient(135deg, #290873, #7209B7, #F72585);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  z-index: 999999;
                  font-family: Arial, sans-serif;
                  color: white;
                  text-align: center;
                  padding: 20px;
                `;
                overlay.innerHTML = `
                  <div>
                    <div style="font-size: 24px; margin-bottom: 10px; animation: spin 1s linear infinite;">⏳</div>
                    <p style="font-size: 18px; margin: 0;">Traitement en cours...</p>
                  </div>
                  <style>
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  </style>
                `;
                
                // Ajouter l'overlay au document immédiatement
                if (document.documentElement) {
                  document.documentElement.appendChild(overlay);
                } else {
                  // Si documentElement n'existe pas encore, attendre DOMContentLoaded
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => {
                      document.documentElement.appendChild(overlay);
                    });
                  }
                }
                
                // Cacher le body dès qu'il apparaît
                const hideBody = () => {
                  if (document.body) {
                    document.body.style.visibility = 'hidden';
                    document.body.style.opacity = '0';
                    document.body.style.display = 'none';
                  }
                };
                
                // Essayer immédiatement
                hideBody();
                
                // Utiliser MutationObserver pour cacher tout contenu qui apparaît
                const observer = new MutationObserver((mutations) => {
                  hideBody();
                  // Cacher aussi tous les éléments qui sont ajoutés
                  mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                      if (node.nodeType === 1) { // Element node
                        if (node !== overlay && node.id !== 'vault-auth-overlay') {
                          node.style.visibility = 'hidden';
                          node.style.opacity = '0';
                          node.style.display = 'none';
                        }
                      }
                    });
                  });
                });
                
                // Observer les changements du document
                if (document.documentElement) {
                  observer.observe(document.documentElement, {
                    childList: true,
                    subtree: true
                  });
                }
                
                // Observer aussi quand le body est créé
                if (document.body) {
                  observer.observe(document.body, {
                    childList: true,
                    subtree: true
                  });
                } else {
                  // Attendre que le body soit créé
                  const bodyObserver = new MutationObserver(() => {
                    if (document.body) {
                      hideBody();
                      observer.observe(document.body, {
                        childList: true,
                        subtree: true
                      });
                      bodyObserver.disconnect();
                    }
                  });
                  bodyObserver.observe(document.documentElement, {
                    childList: true
                  });
                }
              },
              world: 'MAIN'
            });
          } catch (e) {
            console.warn('Could not inject hiding script immediately:', e);
          }
          
          // Attendre un peu que le contenu se charge, puis extraire le token
          setTimeout(async () => {
            try {
              // Inject script that saves content and extracts token
              const results = await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                  // Rendre le body visible temporairement pour lire le contenu
                  if (document.body) {
                    document.body.style.visibility = 'visible';
                    document.body.style.opacity = '1';
                  }
                  
                  // Sauvegarder le contenu original
                  const bodyText = document.body.innerText || document.body.textContent;
                  
                  // Re-cacher immédiatement
                  if (document.body) {
                    document.body.style.visibility = 'hidden';
                    document.body.style.opacity = '0';
                  }
                  
                  // Extraire le token depuis le contenu sauvegardé
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
                // Si on ne peut pas lire le contenu, cacher l'overlay pour afficher le contenu réel
                await chrome.scripting.executeScript({
                  target: { tabId: tabId },
                  func: () => {
                    const overlay = document.getElementById('vault-auth-overlay');
                    if (overlay) {
                      overlay.style.display = 'none';
                      overlay.remove();
                    }
                    // Restaurer la visibilité du body pour afficher le contenu réel
                    if (document.body) {
                      document.body.style.visibility = 'visible';
                      document.body.style.opacity = '1';
                      document.body.style.display = '';
                    }
                  }
                });
                
                setupError.textContent = 'Erreur: Impossible de lire la réponse de Vault';
                setupError.style.display = 'block';
                chrome.windows.remove(popupWindow.id);
                return;
              }

              const result = results[0].result;
              console.log('Extracted result:', result);

              if (!result.success || !result.token) {
                // Si ce n'est pas un token valide, cacher l'overlay pour afficher le contenu réel
                await chrome.scripting.executeScript({
                  target: { tabId: tabId },
                  func: () => {
                    const overlay = document.getElementById('vault-auth-overlay');
                    if (overlay) {
                      overlay.style.display = 'none';
                      overlay.remove();
                    }
                    // Restaurer la visibilité du body pour afficher le contenu réel
                    if (document.body) {
                      document.body.style.visibility = 'visible';
                      document.body.style.opacity = '1';
                      document.body.style.display = '';
                    }
                  }
                });
                
                setupError.textContent = 'Erreur: Token non trouvé dans la réponse Vault';
                setupError.style.display = 'block';
                console.error('Vault response:', result);
                chrome.windows.remove(popupWindow.id);
                return;
              }

              // Afficher un message de succès dans la popup au lieu du token
              await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                  // Mettre à jour l'overlay existant ou créer un nouveau
                  const overlay = document.getElementById('vault-auth-overlay');
                  if (overlay) {
                    overlay.innerHTML = `
                      <div>
                        <h1 style="font-size: 24px; margin-bottom: 10px;">✓</h1>
                        <p style="font-size: 18px; margin: 0;">Authentification Google réussie</p>
                      </div>
                    `;
                  } else {
                    // Si l'overlay n'existe pas, créer le message directement
                    document.body.innerHTML = `
                      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: Arial, sans-serif; background: linear-gradient(135deg, #290873, #7209B7, #F72585); color: white; text-align: center; padding: 20px;">
                        <div>
                          <h1 style="font-size: 24px; margin-bottom: 10px;">✓</h1>
                          <p style="font-size: 18px; margin: 0;">Authentification Google réussie</p>
                        </div>
                      </div>
                    `;
                  }
                }
              });

              // Attendre un peu pour que l'utilisateur voie le message
              await new Promise(resolve => setTimeout(resolve, 1500));

              // Close the popup
              chrome.windows.remove(popupWindow.id);

              // Process the token OAuth - utiliser la même logique que handleCredentialResponse
              // Pour OAuth, on ne doit pas demander de mot de passe
              const vaultUrl = settings.vaultUrl || 'https://vault.exem.fr/';
              
              // Vérifier le token et récupérer l'entity_name
              const testResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
                method: 'GET',
                headers: {
                  'X-Vault-Token': result.token,
                  'Content-Type': 'application/json'
                }
              });

              if (!testResponse.ok) {
                throw new Error('Token Vault invalide');
              }

              const entityName = await getEntityNameFromToken(vaultUrl, result.token);

              // Créer le mount path s'il n'existe pas
              let mountPath = settings.kvMount || entityName;
              const mountResult = await ensureMountPath(vaultUrl, result.token, mountPath);
              if (!mountResult.success) {
                const errorMsg = mountResult.message || 'Impossible de créer le mount path';
                throw new Error(`Erreur mount: ${errorMsg}`);
              }

              // Token valide et mount créé, stocker temporairement
              // Pour OAuth, utiliser directement l'entityName comme Master Key (pas de mot de passe)
              pendingToken = result.token;
              pendingDisplayName = entityName;
              pendingIsOAuth = true; // Authentification OAuth
              hideSetupModal();
              // Passer directement au modal PIN (pas de mot de passe pour OAuth)
              showCreatePinModal();
            } catch (e) {
              callbackProcessed = true;
              chrome.tabs.onUpdated.removeListener(tabUpdateListener);
              setupError.textContent = 'Erreur: ' + e.message;
              setupError.style.display = 'block';
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
    setupError.textContent = 'Erreur: ' + error.message;
    setupError.style.display = 'block';
  }
}

// Handle Vault token directly (without JWT exchange)
async function handleVaultToken(vaultToken) {
  const vaultUrl = settings.vaultUrl || 'https://vault.exem.fr/';

  try {
    // Verify the token is valid and get entity_name
    const testResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': vaultToken,
        'Content-Type': 'application/json'
      }
    });

    if (!testResponse.ok) {
      throw new Error('Token Vault invalide');
    }

    const entityName = await getEntityNameFromToken(vaultUrl, vaultToken);

    // Create mount path if it doesn't exist
    let mountPath = settings.kvMount || entityName;
    const mountResult = await ensureMountPath(vaultUrl, vaultToken, mountPath);
    if (!mountResult.success) {
      const errorMsg = mountResult.message || 'Impossible de créer le mount path';
      setupError.textContent = `Erreur mount: ${errorMsg}`;
      setupError.style.display = 'block';
      return;
    }

    // Token valid and mount created, store temporarily and ask for Master Password creation
    pendingToken = vaultToken;
    pendingDisplayName = entityName;
    pendingIsOAuth = false; // Authentification manuelle
    hideSetupModal();
    showCreatePasswordModal();
  } catch (error) {
    console.error('Token validation error:', error);
    setupError.textContent = error.message || 'Erreur lors de la validation du token';
    setupError.style.display = 'block';
  }
}

// Handle Google OIDC credential response
async function handleCredentialResponse(response) {
  if (!response || !response.credential) {
    setupError.textContent = 'Erreur: réponse Google invalide';
    setupError.style.display = 'block';
    return;
  }

  const googleIdToken = response.credential;
  const vaultUrl = settings.vaultUrl || 'https://vault.exem.fr/';

  try {
    setupError.style.display = 'none';
    
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

    // Verify the token is valid and get entity_name
    const testResponse = await fetch(`${vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': vaultToken,
        'Content-Type': 'application/json'
      }
    });

    if (!testResponse.ok) {
      throw new Error('Token Vault invalide');
    }

    const entityName = await getEntityNameFromToken(vaultUrl, vaultToken);

    // Create mount path if it doesn't exist
    let mountPath = settings.kvMount || entityName;
    const mountResult = await ensureMountPath(vaultUrl, vaultToken, mountPath);
    if (!mountResult.success) {
      const errorMsg = mountResult.message || 'Impossible de créer le mount path';
      setupError.textContent = `Erreur mount: ${errorMsg}. Vérifiez les permissions du token.`;
      setupError.style.display = 'block';
      return;
    }

    // Token valid and mount created, store temporarily
    // Pour OAuth, utiliser directement l'entityName comme Master Key (pas de mot de passe)
    pendingToken = vaultToken;
    pendingDisplayName = entityName;
    pendingIsOAuth = true; // Authentification OAuth
    hideSetupModal();
    // Passer directement au modal PIN (pas de mot de passe pour OAuth)
    showCreatePinModal();
  } catch (error) {
    console.error('OIDC authentication error:', error);
    setupError.textContent = error.message || 'Erreur lors de l\'authentification OIDC';
    setupError.style.display = 'block';
  }
}

// Cacher le modal de configuration initiale
function hideSetupModal() {
  setupModal.classList.remove('show');
}

// Afficher le modal de création de mot de passe Master Key
function showCreatePasswordModal() {
  createPasswordModal.classList.add('show');
  createPasswordInput.value = '';
  createPasswordConfirm.value = '';
  createPasswordError.style.display = 'none';
  createPasswordInput.focus();
}

// Cacher le modal de création de mot de passe Master Key
function hideCreatePasswordModal() {
  createPasswordModal.classList.remove('show');
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

// Toggle visibilité des mots de passe
if (toggleCreatePassword) {
  toggleCreatePassword.addEventListener('click', () => {
    const input = createPasswordInput;
    if (input.type === 'password') {
      input.type = 'text';
      toggleCreatePassword.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      toggleCreatePassword.title = 'Masquer le mot de passe';
    } else {
      input.type = 'password';
      toggleCreatePassword.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      toggleCreatePassword.title = 'Afficher le mot de passe';
    }
  });
}

if (toggleCreatePasswordConfirm) {
  toggleCreatePasswordConfirm.addEventListener('click', () => {
    const input = createPasswordConfirm;
    if (input.type === 'password') {
      input.type = 'text';
      toggleCreatePasswordConfirm.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      toggleCreatePasswordConfirm.title = 'Masquer le mot de passe';
    } else {
      input.type = 'password';
      toggleCreatePasswordConfirm.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      toggleCreatePasswordConfirm.title = 'Afficher le mot de passe';
    }
  });
}

// Créer le mount path s'il n'existe pas
// Retourne { success: boolean, message?: string }
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

// Authentifier l'utilisateur avec le PIN
async function authenticate(pin) {
  try {
    // Récupérer les données stockées
    const stored = await new Promise((resolve) => {
      chrome.storage.sync.get(['encryptedToken', 'pinHash', 'vaultUrl', 'kvMount', 'tokenExpireTime'], resolve);
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
    let decryptedToken = await window.cryptoUtils.decrypt(stored.encryptedToken, pin);

    // Vérifier si le token est encore valide (en vérifiant la date d'expiration sauvegardée)
    // Note: Si tokenExpireTime n'existe pas encore (première connexion), on ne fait pas cette vérification
    const now = Math.floor(Date.now() / 1000);
    let tokenNeedsRegeneration = false;
    
    if (stored.tokenExpireTime) {
      // Si la date d'expiration est passée, le token doit être régénéré
      if (stored.tokenExpireTime <= now) {
        tokenNeedsRegeneration = true;
        console.log('Token expiré selon la date sauvegardée, régénération nécessaire');
      }
    }
    // Si tokenExpireTime n'existe pas, on continue la vérification via l'API Vault

    // Vérifier que le token est valide via l'API Vault
    const testResponse = await fetch(`${stored.vaultUrl.replace(/\/$/, '')}/v1/auth/token/lookup-self`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': decryptedToken,
        'Content-Type': 'application/json'
      }
    });

    if (!testResponse.ok) {
      // Token invalide selon l'API, régénération nécessaire
      tokenNeedsRegeneration = true;
      console.log('Token invalide selon l\'API, régénération nécessaire');
    }
    // Si testResponse.ok est vrai, le token est valide selon Vault
    // On fait confiance à cette réponse et on ne fait pas de double vérification

    // Si le token doit être régénéré, déclencher le processus automatiquement
    if (tokenNeedsRegeneration) {
      console.log('Token expiré, régénération automatique en cours...');
      showToast('Token expiré. Régénération automatique en cours...', 'info');
      
      try {
        // Régénérer le token automatiquement via OIDC
        const newToken = await regenerateTokenAndSave(stored.vaultUrl || 'https://vault.exem.fr/', pin);
        
        // Utiliser le nouveau token pour continuer l'authentification
        decryptedToken = newToken;
      } catch (error) {
        console.error('Erreur lors de la régénération automatique:', error);
        showToast('Erreur lors de la régénération. Veuillez vous reconnecter manuellement.', 'error');
        hideAuthModal();
        showSetupModal();
        throw new Error('Impossible de régénérer le token automatiquement. Veuillez vous reconnecter.');
      }
    }

    // Récupérer les métadonnées du token pour mettre à jour le TTL si nécessaire
    const tokenMetadata = await getTokenMetadata(stored.vaultUrl || 'https://vault.exem.fr/', decryptedToken);
    if (tokenMetadata && tokenMetadata.expireTime) {
      // Mettre à jour la date d'expiration dans le storage
      await new Promise((resolve) => {
        chrome.storage.sync.set({ tokenExpireTime: tokenMetadata.expireTime }, resolve);
      });
    }

    // Récupérer l'entity_name si kvMount n'est pas défini
    let mountPath = stored.kvMount;
    if (!mountPath) {
      mountPath = await getEntityNameFromToken(stored.vaultUrl || 'https://vault.exem.fr/', decryptedToken);
      if (!mountPath) {
        throw new Error('Impossible de récupérer l\'entity_name. Le moteur de secrets ne peut pas être déterminé.');
      }
      // Sauvegarder le kvMount dans le storage pour la prochaine fois
      await new Promise((resolve) => {
        chrome.storage.sync.set({ kvMount: mountPath }, resolve);
      });
    }
    
    // Créer le mount path s'il n'existe pas après authentification (optionnel)
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
    currentPin = pin; // Stocker le PIN en mémoire pour le chiffrement des secrets
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
let currentSecrets = []; // Stocker les secrets actuels pour la recherche
let selectedType = null; // Type sélectionné pour le filtre (null = tous)

function clearSecretFields() {
  secretTableBody.innerHTML = '';
  if (cardsContainer) {
    cardsContainer.innerHTML = '';
    currentSecrets = [];
    updateItemsCount();
  }
}

// Fonction pour afficher les secrets sous forme de cartes
function displayCards(secrets) {
  if (!cardsContainer) return;
  
  cardsContainer.innerHTML = '';
  currentSecrets = secrets;
  
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
  let filteredSecrets = searchTerm 
    ? secrets.filter(s => 
        s.key.toLowerCase().includes(searchTerm) || 
        s.value.toLowerCase().includes(searchTerm)
      )
    : secrets;
  
  // Filtrer par type si un type est sélectionné
  if (selectedType) {
    filteredSecrets = filteredSecrets.filter(s => (s.type || 'Clés') === selectedType);
  }
  
  filteredSecrets.forEach((secret, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    
    // Icône avec première lettre ou numéro
    const icon = document.createElement('div');
    icon.className = 'card-icon';
    const iconText = secret.key.charAt(0).toUpperCase() || (index + 1).toString();
    icon.textContent = iconText;
    
    // Contenu de la carte
    const content = document.createElement('div');
    content.className = 'card-content';
    
    const title = document.createElement('div');
    title.className = 'card-title';
    title.textContent = secret.key; // Le titre est le nom du secret
    
    const subtitle = document.createElement('div');
    subtitle.className = 'card-subtitle';
    subtitle.textContent = secret.type || 'Clés'; // Le sous-titre est le type (par défaut "Clés")
    
    content.appendChild(title);
    content.appendChild(subtitle);
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    
    // Bouton copier
    const copyBtn = document.createElement('button');
    copyBtn.className = 'card-action-btn';
    copyBtn.title = 'Copier';
    copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    copyBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(secret.value);
        showToast('Valeur copiée', 'success');
      } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = secret.value;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Valeur copiée', 'success');
      }
    });
    
    // Bouton ouvrir - naviguer vers la vue de détail
    const openBtn = document.createElement('button');
    openBtn.className = 'card-action-btn';
    openBtn.title = 'Ouvrir';
    openBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>';
    openBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      navigateToDetail(secret, index);
    });
    
    actions.appendChild(copyBtn);
    actions.appendChild(openBtn);
    
    // Clic sur la carte pour ouvrir le détail
    card.addEventListener('click', (e) => {
      // Ne pas ouvrir si on clique sur les boutons d'action
      if (!e.target.closest('.card-action-btn')) {
        navigateToDetail(secret, index);
      }
    });
    
    card.appendChild(icon);
    card.appendChild(content);
    card.appendChild(actions);
    
    // Animation d'entrée
    card.style.opacity = '0';
    card.style.transform = 'translateY(-10px)';
    cardsContainer.appendChild(card);
    setTimeout(() => {
      card.style.transition = 'all 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, index * 50);
  });
  
  updateItemsCount(filteredSecrets.length);
}

// Fonction pour mettre à jour le compteur d'éléments
function updateItemsCount(count) {
  if (!itemsCount) return;
  const total = count !== undefined ? count : (currentSecrets ? currentSecrets.length : 0);
  itemsCount.textContent = `${total} élément${total > 1 ? 's' : ''} affiché${total > 1 ? 's' : ''}`;
}

// Fonction pour charger les cartes directement depuis Vault
// Liste tous les secrets individuels dans une catégorie
async function loadCardsFromVault(categoryPath) {
  if (!categoryPath || !cardsContainer) {
    displayCards([]);
    return;
  }

  const authenticated = await ensureAuthenticated();
  if (!authenticated) {
    displayCards([]);
    return;
  }

  try {
    // Lire le secret de la catégorie (qui contient tous les secrets de cette catégorie)
    let categoryData = {};
    try {
      const res = await readSecret(categoryPath);
      categoryData = (res && res.data && res.data.data) || {};
    } catch (e) {
      // La catégorie n'existe pas encore ou est vide
      displayCards([]);
      return;
    }

    // Exclure la clé "categories" si elle existe
    const secretNames = Object.keys(categoryData).filter(key => key !== 'categories');
    
    if (secretNames.length === 0) {
      displayCards([]);
      return;
    }

    // Extraire chaque secret et préparer l'affichage
    const secrets = [];
    for (const secretName of secretNames) {
      const secretData = categoryData[secretName];
      
      // secretData devrait être une liste de clés-valeurs
      let mainValue = '';
      let displayKey = secretName;
      
      if (Array.isArray(secretData) && secretData.length > 0) {
        // Prendre la première valeur de la liste pour l'affichage
        const firstItem = secretData[0];
        if (firstItem && firstItem.value) {
          // Déchiffrer la valeur si nécessaire
          let decryptedValue = firstItem.value;
          
          // Vérifier si c'est un objet chiffré
          if (typeof firstItem.value === 'object' && firstItem.value.iv && firstItem.value.ciphertext && firstItem.value.tag) {
            const context = `vault-secret-${categoryPath}-${secretName}-${firstItem.key}`;
            decryptedValue = await window.cryptoSystem.decryptSecret(firstItem.value, currentPin, context);
          } else if (typeof firstItem.value === 'string') {
            // Vérifier si c'est une chaîne JSON chiffrée
            try {
              const parsedValue = JSON.parse(firstItem.value);
              if (parsedValue && parsedValue.iv && parsedValue.ciphertext && parsedValue.tag) {
                const context = `vault-secret-${categoryPath}-${secretName}-${firstItem.key}`;
                decryptedValue = await window.cryptoSystem.decryptSecret(parsedValue, currentPin, context);
              } else {
                decryptedValue = firstItem.value;
              }
            } catch (e) {
              // Utiliser la valeur brute
              decryptedValue = firstItem.value;
            }
          }
          
          mainValue = decryptedValue;
          displayKey = firstItem.key || secretName;
        }
      }
      
      secrets.push({
        key: secretName,
        value: mainValue,
        displayKey: displayKey,
        type: 'Clés', // Type par défaut (pour le moment, seul type existant)
        path: categoryPath // Le path est maintenant juste la catégorie
      });
    }
    
    displayCards(secrets);
  } catch (e) {
    console.error('Erreur lors du chargement des secrets:', e);
    displayCards([]);
  }
}

// Fonction pour convertir les champs du tableau en format cartes (utilisée uniquement pour la synchronisation temporaire)
function convertTableToCards() {
  const rows = Array.from(secretTableBody.querySelectorAll('tr'));
  const secrets = rows.map(row => {
    const keyInput = row.querySelector('td:first-child input');
    const valInput = row.querySelector('td:nth-child(2) input');
    return {
      key: keyInput ? keyInput.value.trim() : '',
      value: valInput ? valInput.value : ''
    };
  }).filter(s => s.key || s.value);
  
  displayCards(secrets);
}

// Fonction pour naviguer vers la vue de détail
async function navigateToDetail(secret, index, isNew = false, withGeneratedPassword = false) {
  if (!cardsView || !detailView) return;
  
  // Masquer la vue des cartes et afficher la vue de détail
  cardsView.style.display = 'none';
  detailView.style.display = 'flex';
  
  if (isNew) {
    // Nouveau secret - initialiser avec un nom par défaut et un champ "Mot de passe"
    currentSecretName = null;
    if (detailTitleInput) {
      detailTitleInput.value = 'Nouveau secret';
    } else if (detailTitle) {
      detailTitle.textContent = 'Nouveau secret';
    }
    clearSecretFields();
    // Ajouter le champ "Mot de passe" par défaut
    if (withGeneratedPassword) {
      // Pré-remplir avec un mot de passe généré
      const generatedPassword = generatePassword(16);
      addField('Mot de passe', generatedPassword, true);
      showToast('Mot de passe généré', 'success');
    } else {
      // Ajouter le champ "Mot de passe" par défaut avec une valeur vide
      addField('Mot de passe', '', true);
    }
  } else if (secret) {
    // Secret existant - charger les données du secret spécifique
    currentSecretName = secret.key;
    if (detailTitleInput) {
      detailTitleInput.value = secret.key || 'Détail du secret';
    } else if (detailTitle) {
      detailTitle.textContent = secret.key || 'Détail du secret';
    }
    
    // Charger le secret spécifique avec sa liste de clés-valeurs
    // Le path est maintenant juste la catégorie
    if (currentCategoryPath) {
      await loadSecretDetail(currentCategoryPath);
    } else if (secret.path) {
      // Extraire la catégorie du path si nécessaire (pour compatibilité)
      const pathParts = secret.path.split('/');
      const categoryPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : secret.path;
      await loadSecretDetail(categoryPath);
    } else {
      clearSecretFields();
      addField(secret.key, secret.value);
    }
  }
}

// Fonction pour charger un secret spécifique avec sa liste de clés-valeurs
async function loadSecretDetail(secretPath) {
  if (!secretPath) {
    clearSecretFields();
    return;
  }

  // Extraire le nom du secret depuis le path
  // Le path peut être soit "categorie/nom_secret" (ancien format) soit juste "categorie" (nouveau format)
  let categoryPath = secretPath;
  let secretName = null;
  
  // Utiliser currentCategoryPath si disponible, sinon extraire du path
  if (currentCategoryPath) {
    categoryPath = currentCategoryPath;
    secretName = currentSecretName;
  } else {
    const pathParts = secretPath.split('/');
    if (pathParts.length > 1) {
      // Ancien format : "categorie/nom_secret"
      secretName = pathParts[pathParts.length - 1];
      categoryPath = pathParts.slice(0, -1).join('/');
    } else {
      // Si on a juste le path de la catégorie, utiliser currentSecretName
      categoryPath = secretPath;
      secretName = currentSecretName;
    }
  }

  if (!secretName) {
    clearSecretFields();
    return;
  }

  currentSecretName = secretName;
  // Mettre à jour le champ de saisie du nom
  if (detailTitleInput) {
    detailTitleInput.value = secretName;
  } else if (detailTitle) {
    detailTitle.textContent = secretName;
  }

  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;

  try {
    // Lire le secret de la catégorie (qui contient tous les secrets)
    const res = await readSecret(categoryPath);
    const categoryData = (res && res.data && res.data.data) || {};
    
    clearSecretFields();
    
    // Extraire le secret spécifique par son nom
    const secretData = categoryData[secretName];
    
    if (secretData && Array.isArray(secretData)) {
      // Charger chaque élément de la liste dans le tableau
      for (const item of secretData) {
        if (item && item.key) {
          let decryptedValue = item.value || '';
          
          // Déchiffrer la valeur si nécessaire (item.value est déjà un objet si chiffré)
          if (item.value && typeof item.value === 'object' && item.value.iv && item.value.ciphertext && item.value.tag) {
            // C'est un objet chiffré, le déchiffrer
            const context = `vault-secret-${categoryPath}-${secretName}-${item.key}`;
            decryptedValue = await window.cryptoSystem.decryptSecret(item.value, currentPin, context);
          } else if (typeof item.value === 'string') {
            // C'est une chaîne, vérifier si c'est du JSON chiffré
            try {
              const parsedValue = JSON.parse(item.value);
              if (parsedValue && parsedValue.iv && parsedValue.ciphertext && parsedValue.tag) {
                const context = `vault-secret-${categoryPath}-${secretName}-${item.key}`;
                decryptedValue = await window.cryptoSystem.decryptSecret(parsedValue, currentPin, context);
              } else {
                decryptedValue = item.value;
              }
            } catch (e) {
              // Ce n'est pas du JSON, utiliser la valeur brute
              decryptedValue = item.value;
            }
          } else {
            // C'est déjà une valeur déchiffrée ou autre type
            decryptedValue = item.value;
          }
          
          const isPwd = item.key.toLowerCase().includes('password') || item.key.toLowerCase().includes('pass') || item.key.toLowerCase().includes('pwd');
          addField(item.key, decryptedValue, isPwd);
        }
      }
    } else {
      // Aucune valeur, ajouter un champ vide
      addField('', '');
    }
  } catch (e) {
    console.error('Erreur lors du chargement du secret:', e);
    clearSecretFields();
    addField('', '');
  }
}

// Fonction pour revenir à la vue des cartes
async function navigateToCards() {
  if (!cardsView || !detailView) return;
  
  // Masquer la vue de détail et afficher la vue des cartes
  detailView.style.display = 'none';
  cardsView.style.display = 'flex';
  
  // Recharger les cartes directement depuis Vault pour s'assurer qu'elles sont synchronisées
  if (currentCategoryPath) {
    await loadCardsFromVault(currentCategoryPath);
  } else {
    displayCards([]);
  }
}

// Event listener pour le bouton retour
if (backBtn) {
  backBtn.addEventListener('click', () => {
    navigateToCards();
  });
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
    // Ne pas mettre à jour les cartes depuis le tableau - elles doivent toujours refléter Vault
    // Les cartes seront rechargées depuis Vault après sauvegarde
  });
  
  // Ne pas mettre à jour les cartes quand la valeur change - elles doivent toujours refléter Vault
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
    // Ne pas mettre à jour les cartes - elles doivent toujours refléter Vault
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

// Event listener supprimé - le bouton "Ajouter champ" a été retiré
// Utiliser le bouton "Nouvelle entrée" dans le header de la table à la place

generateBtn.addEventListener('click', () => {
  // Vérifier qu'on est dans la vue détaillée
  if (!detailView || detailView.style.display === 'none') {
    showToast('Ouvrez d\'abord un secret', 'error');
    return;
  }
  
  // Récupérer tous les labels existants dans le tableau
  const rows = Array.from(secretTableBody.querySelectorAll('tr'));
  const existingLabels = new Set();
  rows.forEach(row => {
    const keyInput = row.querySelector('td:first-child input');
    if (keyInput && keyInput.value.trim()) {
      existingLabels.add(keyInput.value.trim());
    }
  });
  
  // Trouver le prochain nom disponible
  let fieldName = 'Mot de passe';
  if (existingLabels.has(fieldName)) {
    let n = 1;
    while (existingLabels.has(`${fieldName} ${n}`)) {
      n++;
    }
    fieldName = `${fieldName} ${n}`;
  }
  
  // Générer un mot de passe
  const generatedPassword = generatePassword(16);
  
  // Ajouter le champ avec le mot de passe généré
  addField(fieldName, generatedPassword, true);
  showToast('Mot de passe généré', 'success');
});

// Event listeners pour les nouveaux éléments
if (searchInput) {
  searchInput.addEventListener('input', () => {
    if (cardsContainer && currentSecrets.length > 0) {
      displayCards(currentSecrets);
    }
  });
}

if (createBtn) {
  createBtn.addEventListener('click', () => {
    // Vérifier qu'une catégorie est sélectionnée
    const path = getCurrentPath();
    if (!path) {
      showToast('Sélectionnez d\'abord une catégorie', 'error');
      return;
    }
    // Naviguer vers la vue de détail pour créer un nouveau secret
    navigateToDetail(null, -1, true);
  });
}

if (typeBtn) {
  typeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showTypeFilterMenu();
  });
}

// Fonction pour afficher le menu de filtre par type
function showTypeFilterMenu() {
  // Extraire les types uniques des secrets actuels
  const types = new Set();
  currentSecrets.forEach(secret => {
    const type = secret.type || 'Clés';
    types.add(type);
  });
  
  const typesArray = Array.from(types).sort();
  
  // Créer le menu déroulant
  const existingMenu = document.getElementById('typeFilterMenu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }
  
  const menu = document.createElement('div');
  menu.id = 'typeFilterMenu';
  menu.className = 'type-filter-menu';
  
  // Option "Tous"
  const allOption = document.createElement('div');
  allOption.className = 'type-filter-option' + (selectedType === null ? ' active' : '');
  allOption.textContent = 'Tous';
  allOption.addEventListener('click', () => {
    selectedType = null;
    updateTypeButtonText();
    displayCards(currentSecrets);
    menu.remove();
  });
  menu.appendChild(allOption);
  
  // Options pour chaque type
  typesArray.forEach(type => {
    const option = document.createElement('div');
    option.className = 'type-filter-option' + (selectedType === type ? ' active' : '');
    option.textContent = type;
    option.addEventListener('click', () => {
      selectedType = type;
      updateTypeButtonText();
      displayCards(currentSecrets);
      menu.remove();
    });
    menu.appendChild(option);
  });
  
  // Positionner le menu sous le bouton
  const rect = typeBtn.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.left = rect.left + 'px';
  menu.style.zIndex = '1000';
  
  document.body.appendChild(menu);
  
  // Fermer le menu si on clique ailleurs
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && e.target !== typeBtn && !typeBtn.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => {
    document.addEventListener('click', closeMenu);
  }, 0);
}

// Fonction pour mettre à jour le texte du bouton Type
function updateTypeButtonText() {
  if (typeBtn) {
    let buttonText = typeBtn.querySelector('span');
    if (!buttonText) {
      // Créer un span si il n'existe pas
      buttonText = document.createElement('span');
      typeBtn.appendChild(buttonText);
    }
    buttonText.textContent = selectedType ? `Type: ${selectedType}` : 'Type';
  }
}

if (settingsBtn) {
  settingsBtn.addEventListener('click', () => {
    // Ouvrir les options
    if (optionsLink) {
      optionsLink.click();
    } else {
      chrome.runtime.openOptionsPage();
    }
  });
}

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
    try { json = text ? JSON.parse(text) : {}; } catch (e) { json = { raw: text }; }
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

// Fonction pour charger automatiquement les secrets d'une catégorie (maintenue pour compatibilité)
// Cette fonction n'est plus utilisée pour charger les cartes, mais peut être utilisée pour d'autres besoins
async function loadCategorySecrets(categoryPath) {
  // Cette fonction est maintenant obsolète car chaque secret est individuel
  // Les cartes sont chargées via loadCardsFromVault
  // Les détails de secret sont chargés via loadSecretDetail
  if (!categoryPath) {
    clearSecretFields();
    currentCategoryPath = null;
    if (cardsContainer) {
      displayCards([]);
    }
    return;
  }

  // Stocker le chemin de la catégorie actuelle
  currentCategoryPath = categoryPath;
  
  // Charger les cartes depuis Vault
  if (cardsContainer && cardsView && cardsView.style.display !== 'none') {
    await loadCardsFromVault(categoryPath);
  }
}

writeBtn.addEventListener('click', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;

  const categoryPath = getCurrentPath();
  if (!categoryPath) {
    showToast('Sélectionnez une catégorie ou créez-en une nouvelle', 'error');
    return;
  }

  // Déterminer le nom du secret (nouveau ou modifié)
  const newName = detailTitleInput ? detailTitleInput.value.trim() : currentSecretName;
  if (!newName || newName === 'Nouveau secret' || newName === '') {
    showToast('Veuillez entrer un nom pour le secret', 'error');
    if (detailTitleInput) {
      detailTitleInput.focus();
    }
    return;
  }

  // Vérifier si le nom a changé pour un secret existant
  let oldSecretPath = null;
  if (currentSecretName && newName !== currentSecretName && currentSecretName !== 'Nouveau secret') {
    oldSecretPath = `${categoryPath}/${currentSecretName}`;
    // Vérifier si l'ancien secret existe
    try {
      await readSecret(oldSecretPath);
      // Si le nouveau nom existe déjà, demander confirmation
      try {
        await readSecret(`${categoryPath}/${newName}`);
        if (!confirm(`Un secret avec le nom "${newName}" existe déjà. Voulez-vous le remplacer ?`)) {
          return;
        }
      } catch (e) {
        // Le nouveau nom n'existe pas, on peut continuer
      }
    } catch (e) {
      // L'ancien secret n'existe pas, continuer normalement
    }
  }

  const rows = Array.from(secretTableBody.querySelectorAll('tr'));
  const keyValueList = [];
  
  // Chiffrer les valeurs des secrets avant de les sauvegarder
  for (const row of rows) {
    const key = row.querySelector('td:first-child input').value.trim();
    const val = row.querySelector('td:nth-child(2) input').value;
    
    if (key) {
      // Chiffrer la valeur avec le système de chiffrement
      try {
        const context = `vault-secret-${categoryPath}-${newName}-${key}`;
        const encryptedValue = await window.cryptoSystem.encryptSecret(val, currentPin, context);
        // Stocker l'objet chiffré directement (pas de JSON.stringify, Vault le fera)
        keyValueList.push({
          key: key,
          value: encryptedValue
        });
        console.log(`Secret ${key} chiffré avec succès`);
      } catch (error) {
        console.error(`Erreur lors du chiffrement de ${key}:`, error);
        showToast(`Erreur lors du chiffrement de ${key}: ${error.message}`, 'error');
        return;
      }
    }
  }

  if (keyValueList.length === 0) {
    showToast('Aucun champ à sauvegarder', 'error');
    return;
  }

  try {
    // Lire le secret de la catégorie existant (qui contient tous les secrets de cette catégorie)
    let categoryData = {};
    try {
      const res = await readSecret(categoryPath);
      categoryData = (res && res.data && res.data.data) || {};
    } catch (e) {
      // La catégorie n'existe pas encore, créer un nouvel objet
      categoryData = {};
    }

    // Si le nom a changé, supprimer l'ancien secret de l'objet
    if (oldSecretPath && currentSecretName && currentSecretName !== 'Nouveau secret') {
      const oldSecretName = currentSecretName;
      if (categoryData[oldSecretName]) {
        delete categoryData[oldSecretName];
      }
    }

    // Ajouter ou mettre à jour le secret dans l'objet de la catégorie
    categoryData[newName] = keyValueList;

    // Sauvegarder tout l'objet de la catégorie
    await writeSecret(categoryPath, categoryData);
    
    // Mettre à jour le nom actuel
    currentSecretName = newName;

    // Attendre un peu pour que Vault mette à jour
    await new Promise(resolve => setTimeout(resolve, 300));

    // Recharger les catégories et s'assurer que la catégorie est toujours sélectionnée
    await loadCategoriesFromVault();

    // S'assurer que la catégorie est toujours sélectionnée après rechargement et recharger les secrets
    setTimeout(async () => {
      if (categories.includes(categoryPath)) {
        categorySelect.value = categoryPath;
        // Recharger les cartes depuis Vault pour s'assurer qu'elles sont synchronisées
        if (cardsView && cardsView.style.display !== 'none') {
          await loadCardsFromVault(categoryPath);
        }
      }
    }, 100);

    showToast('Secret sauvegardé avec succès (chiffré)', 'success');
    
    // Revenir à la vue des cartes après sauvegarde
    navigateToCards();
  } catch (e) {
    showToast('Erreur: ' + (e.response?.errors?.[0] || e.message), 'error');
  }
});

deleteBtn.addEventListener('click', async () => {
  const authenticated = await ensureAuthenticated();
  if (!authenticated) return;

  const categoryPath = getCurrentPath();
  if (!categoryPath) {
    showToast('Sélectionnez une catégorie', 'error');
    return;
  }

  if (!currentSecretName) {
    showToast('Aucun secret sélectionné', 'error');
    return;
  }

  if (!confirm(`Supprimer le secret "${currentSecretName}" ? Cette action peut être irréversible.`)) return;
  try {
    // Lire le secret de la catégorie (qui contient tous les secrets)
    let categoryData = {};
    try {
      const res = await readSecret(categoryPath);
      categoryData = (res && res.data && res.data.data) || {};
    } catch (e) {
      showToast('La catégorie n\'existe pas', 'error');
      return;
    }

    // Vérifier si le secret existe
    if (!categoryData[currentSecretName]) {
      showToast('Le secret n\'existe pas', 'error');
      return;
    }

    // Supprimer seulement la clé du secret dans l'objet de la catégorie
    delete categoryData[currentSecretName];

    // Sauvegarder l'objet de la catégorie mis à jour
    await writeSecret(categoryPath, categoryData);

    // Attendre un peu pour que Vault mette à jour
    await new Promise(resolve => setTimeout(resolve, 300));

    showToast('Suppression réussie', 'success');

    clearSecretFields();
    currentSecretName = null;

    // Recharger les catégories
    await loadCategoriesFromVault();
    // S'assurer que la catégorie est toujours sélectionnée si elle existe dans le fichier categories
    setTimeout(async () => {
      if (categories.includes(categoryPath)) {
        categorySelect.value = categoryPath;
        // Recharger les cartes depuis Vault après suppression
        if (cardsView && cardsView.style.display !== 'none') {
          await loadCardsFromVault(categoryPath);
        }
      }
    }, 100);
    
    // Revenir à la vue des cartes après suppression
    navigateToCards();
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

    const entityName = await getEntityNameFromToken(vaultUrl, token);

    // Créer le mount path s'il n'existe pas
    let mountPath = settings.kvMount || entityName;
    const mountResult = await ensureMountPath(vaultUrl, token, mountPath);
    if (!mountResult.success) {
      const errorMsg = mountResult.message || 'Impossible de créer le mount path';
      setupError.textContent = `Erreur mount: ${errorMsg}. Vérifiez les permissions du token.`;
      setupError.style.display = 'block';
      return;
    }

    // Token valide et mount créé, stocker temporairement et demander la création du mot de passe Master Key
    pendingToken = token;
    pendingDisplayName = entityName;
    pendingIsOAuth = false; // Authentification manuelle
    hideSetupModal();
    showCreatePasswordModal();
  } catch (error) {
    setupError.textContent = error.message || 'Erreur lors de la validation du token';
    setupError.style.display = 'block';
  }
});

// Gestion de la création du mot de passe Master Key
createPasswordBtn.addEventListener('click', async () => {
  const password = createPasswordInput.value;
  const passwordConfirmValue = createPasswordConfirm.value;
  
  // Validation du mot de passe
  if (password.length < 12) {
    createPasswordError.textContent = 'Le mot de passe doit contenir au moins 12 caractères';
    createPasswordError.style.display = 'block';
    return;
  }
  
  if (password !== passwordConfirmValue) {
    createPasswordError.textContent = 'Les mots de passe ne correspondent pas';
    createPasswordError.style.display = 'block';
    return;
  }
  
  if (!pendingToken) {
    createPasswordError.textContent = 'Erreur: token manquant';
    createPasswordError.style.display = 'block';
    return;
  }
  
  createPasswordError.style.display = 'none';
  
  // Stocker le mot de passe temporairement et passer au modal PIN
  pendingMasterPassword = password;
  hideCreatePasswordModal();
  showCreatePinModal();
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

  // Pour OAuth, pas besoin de mot de passe (on utilise l'entityName)
  // Pour l'authentification manuelle, le mot de passe est requis
  if (!pendingIsOAuth && !pendingMasterPassword) {
    createPinError.textContent = 'Erreur: mot de passe Master Key manquant';
    createPinError.style.display = 'block';
    return;
  }

  createPinError.style.display = 'none';

  try {
    // Récupérer les métadonnées du token (TTL, date d'expiration)
    const tokenMetadata = await getTokenMetadata(settings.vaultUrl || 'https://vault.exem.fr/', pendingToken);
    
    // Hasher le PIN en SHA256
    const pinHash = await window.cryptoUtils.sha256(pin);

    // Chiffrer le token avec le PIN
    const encryptedToken = await window.cryptoUtils.encrypt(pendingToken, pin);

    // Initialiser le système de chiffrement
    // Pour OAuth: utiliser l'entityName (userId) comme Master Key
    // Pour manuel: utiliser le mot de passe comme Master Key
    const kvMount = pendingDisplayName || settings.kvMount;
    if (pendingIsOAuth) {
      // OAuth: utiliser l'entityName directement comme Master Key
      await window.cryptoSystem.initializeCryptoSystemWithUserId(kvMount, pin, kvMount);
    } else {
      // Manuel: utiliser le mot de passe
      await window.cryptoSystem.initializeCryptoSystem(pendingMasterPassword, pin, kvMount);
    }
    console.log('✅ Système de chiffrement initialisé avec succès');
    
    // Préparer les données à sauvegarder
    const dataToSave = {
      vaultUrl: settings.vaultUrl || 'https://vault.exem.fr/',
      kvMount: kvMount,
      encryptedToken: encryptedToken,
      pinHash: pinHash,
      isOAuth: pendingIsOAuth // Stocker le flag pour savoir comment récupérer la Master Key
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

    hideCreatePinModal();
    showToast('Configuration enregistrée avec succès !', 'success');
    pendingToken = null;
    pendingDisplayName = null;
    pendingMasterPassword = null;
    pendingIsOAuth = false;

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
    chrome.storage.sync.set({ categories: categories }, resolve);
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
  // Revenir à la vue des cartes quand on change de catégorie
  if (cardsView && detailView) {
    detailView.style.display = 'none';
    cardsView.style.display = 'flex';
  }
  // Charger les secrets dans le tableau ET les cartes depuis Vault
  await loadCategorySecrets(path);
  await loadCardsFromVault(path);
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
    chrome.storage.sync.get(['vaultUrl', 'kvMount', 'encryptedToken', 'pinHash'], resolve);
  });

  settings.vaultUrl = stored.vaultUrl || 'https://vault.exem.fr/';
  settings.kvMount = stored.kvMount || '';

  // Vérifier si un token est configuré
  if (!stored.encryptedToken || !stored.pinHash) {
    // Pas de configuration, afficher le modal de configuration initiale
    // Wait a bit for Google Identity Services to load
    setTimeout(() => {
      showSetupModal();
    }, 100);
  } else {
    // Configuration existante, demander l'authentification rapide
    showAuthModal();
  }

  // Ne pas initialiser de champs par défaut - les données viennent de Vault
}

// Lancer l'initialisation au chargement
initialize();
