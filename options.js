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
    kvMountInput.value = res.kvMount || 'passwords';
  });
}

// Vérifier si le mount path existe, sinon le créer
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
  
  // Hasher le PIN en SHA256
  const pinHash = await window.cryptoUtils.sha256(pin);
  
  // Chiffrer le token avec le PIN
  const vaultUrl = vaultUrlInput.value.trim();
  const vaultToken = vaultTokenInput.value.trim();
  const kvMount = kvMountInput.value.trim() || 'passwords';
  
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
    
    // Créer le mount path s'il n'existe pas
    const mountResult = await ensureMountPath(vaultUrl, vaultToken, kvMount);
    if (!mountResult.success) {
      const errorMsg = mountResult.message || 'Impossible de créer le mount path';
      pinError.textContent = `Erreur mount: ${errorMsg}. Vérifiez les permissions du token.`;
      pinError.style.display = 'block';
      return;
    }
    
    // Chiffrer le token
    const encryptedToken = await window.cryptoUtils.encrypt(vaultToken, pin);
    
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
  const kvMount = kvMountInput.value.trim() || 'passwords';
  
  if (!vaultUrl || !vaultToken) {
    alert('Veuillez remplir l\'URL et le token Vault');
    return;
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
      kvMountInput.value = 'passwords';
      alert('Configuration réinitialisée.');
    });
  }
});

loadSettings();
