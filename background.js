// Service Worker pour gérer les messages du content script
// Vérifie et sauvegarde automatiquement les données de formulaires

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_FORM_DATA') {
    handleCheckFormData(request.data, sendResponse);
    return true; // Indique qu'on répondra de manière asynchrone
  }
  
  if (request.type === 'SAVE_FORM_DATA') {
    handleSaveFormData(request.data, sendResponse);
    return true;
  }
});

/**
 * Vérifie si les données du formulaire existent déjà dans Vault
 */
async function handleCheckFormData(formData, sendResponse) {
  try {
    // Récupérer les informations de connexion
    const stored = await chrome.storage.sync.get(['encryptedToken', 'pinHash', 'vaultUrl', 'kvMount']);
    
    if (!stored.encryptedToken || !stored.vaultUrl || !stored.kvMount) {
      sendResponse({ shouldSave: false, reason: 'Extension non configurée' });
      return;
    }

    // Pour vérifier, on doit être authentifié - on va demander à l'utilisateur de s'authentifier
    // Pour l'instant, on propose toujours de sauvegarder si on détecte des données intéressantes
    // L'utilisateur devra s'authentifier dans le popup pour finaliser la sauvegarde
    
    const domain = formData.domain;
    const hasPassword = !!formData.fields.password;
    const hasUsername = !!formData.fields.username || !!formData.fields.email;
    
    // Proposer de sauvegarder si on a au moins un mot de passe ou des identifiants
    const shouldSave = hasPassword || hasUsername;
    
    sendResponse({ 
      shouldSave: shouldSave,
      domain: domain
    });
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    sendResponse({ shouldSave: false, error: error.message });
  }
}

/**
 * Sauvegarde les données du formulaire dans Vault
 */
async function handleSaveFormData(formData, sendResponse) {
  try {
    // Récupérer les informations de connexion
    const stored = await chrome.storage.sync.get(['encryptedToken', 'pinHash', 'vaultUrl', 'kvMount']);
    
    if (!stored.encryptedToken || !stored.vaultUrl || !stored.kvMount) {
      sendResponse({ success: false, error: 'Extension non configurée. Veuillez vous authentifier dans le popup.' });
      return;
    }

    // Stocker les données de formulaire en attente
    await chrome.storage.local.set({
      pendingFormData: formData,
      pendingFormSave: true
    });

    // Essayer d'ouvrir le popup
    try {
      await chrome.action.openPopup();
      sendResponse({ success: true, message: 'Popup ouvert pour authentification' });
    } catch (error) {
      // Le popup ne peut pas s'ouvrir automatiquement (Chrome limite cela)
      // L'utilisateur devra cliquer sur l'icône manuellement
      // Les données sont déjà stockées, elles seront traitées au prochain ouverture
      sendResponse({ 
        success: true, 
        message: 'Données en attente. Cliquez sur l\'icône de l\'extension pour sauvegarder.' 
      });
    }
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    sendResponse({ success: false, error: error.message });
  }
}

