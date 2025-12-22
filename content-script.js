// Content Script pour détecter et proposer la sauvegarde automatique des formulaires
// Surveille les formulaires remplis et propose de sauvegarder les informations dans Vault

(function() {
  'use strict';

  // Configuration
  const FORM_SUBMIT_DELAY = 500; // Délai avant d'extraire les données après soumission
  const SAVE_PROMPT_TIMEOUT = 30000; // Timeout pour la proposition de sauvegarde (30 secondes)

  // État
  let lastSubmittedForm = null;
  let savePromptShown = false;

  /**
   * Extrait les données d'un formulaire
   */
  function extractFormData(form) {
    const formData = new FormData(form);
    const data = {};
    const fields = {};

    // Parcourir tous les champs du formulaire
    for (const [key, value] of formData.entries()) {
      if (value && value.trim()) {
        data[key] = value.trim();
      }
    }

    // Extraire aussi depuis les inputs directement (pour les champs non dans formData)
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      const name = input.name || input.id || input.getAttribute('data-name');
      const type = input.type?.toLowerCase() || '';
      const value = input.value?.trim();

      if (value && name) {
        // Identifier le type de champ
        if (type === 'password' || name.toLowerCase().includes('password') || name.toLowerCase().includes('pass')) {
          fields.password = value;
        } else if (type === 'email' || name.toLowerCase().includes('email') || name.toLowerCase().includes('mail')) {
          fields.email = value;
        } else if (name.toLowerCase().includes('username') || name.toLowerCase().includes('user') || name.toLowerCase().includes('login')) {
          fields.username = value;
        } else if (name.toLowerCase().includes('url') || name.toLowerCase().includes('website') || name.toLowerCase().includes('site')) {
          fields.url = value;
        } else if (type === 'text' || type === 'tel' || type === 'number') {
          // Autres champs texte
          if (!fields.other) fields.other = {};
          fields.other[name] = value;
        }
      }
    });

    // Essayer d'identifier l'URL du site
    fields.url = fields.url || window.location.origin + window.location.pathname;

    return {
      formData: data,
      fields: fields,
      url: window.location.href,
      domain: window.location.hostname
    };
  }

  /**
   * Vérifie si le formulaire contient des informations intéressantes à sauvegarder
   */
  function hasSaveableData(formData) {
    return !!(formData.fields.password || formData.fields.username || formData.fields.email);
  }

  /**
   * Affiche une notification pour proposer la sauvegarde
   */
  function showSavePrompt(formData) {
    if (savePromptShown) return;
    savePromptShown = true;

    // Créer l'élément de notification
    const prompt = document.createElement('div');
    prompt.id = 'vault-save-prompt';
    prompt.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #290873 0%, #F72585 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;

    // Ajouter l'animation CSS
    if (!document.getElementById('vault-prompt-styles')) {
      const style = document.createElement('style');
      style.id = 'vault-prompt-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(400px);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: bold; font-size: 16px; margin-bottom: 12px;';
    title.textContent = '💾 Sauvegarder dans Vault ?';

    const info = document.createElement('div');
    info.style.cssText = 'font-size: 14px; margin-bottom: 16px; opacity: 0.9;';
    const fieldsList = [];
    if (formData.fields.username) fieldsList.push('Nom d\'utilisateur');
    if (formData.fields.email) fieldsList.push('Email');
    if (formData.fields.password) fieldsList.push('Mot de passe');
    info.textContent = `Détecté: ${fieldsList.join(', ')}`;

    const buttons = document.createElement('div');
    buttons.style.cssText = 'display: flex; gap: 10px;';

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Sauvegarder';
    saveBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: white;
      color: #290873;
      border: none;
      border-radius: 6px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s;
    `;
    saveBtn.onmouseover = () => saveBtn.style.transform = 'scale(1.05)';
    saveBtn.onmouseout = () => saveBtn.style.transform = 'scale(1)';
    saveBtn.onclick = () => {
      prompt.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => prompt.remove(), 300);
      savePromptShown = false;
      // Marquer les données comme sauvegardées pour éviter de les réafficher
      chrome.storage.local.set({
        pendingFormSave: false
      });
      sendSaveRequest(formData);
    };

    const dismissBtn = document.createElement('button');
    dismissBtn.textContent = 'Ignorer';
    dismissBtn.style.cssText = `
      flex: 1;
      padding: 10px;
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    `;
    dismissBtn.onmouseover = () => dismissBtn.style.background = 'rgba(255,255,255,0.3)';
    dismissBtn.onmouseout = () => dismissBtn.style.background = 'rgba(255,255,255,0.2)';
    dismissBtn.onclick = () => {
      prompt.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => prompt.remove(), 300);
      savePromptShown = false;
      // Nettoyer les données en attente si l'utilisateur ignore
      chrome.storage.local.remove(['pendingFormData', 'pendingFormSave', 'formSubmitTimestamp']);
    };

    buttons.appendChild(saveBtn);
    buttons.appendChild(dismissBtn);

    prompt.appendChild(title);
    prompt.appendChild(info);
    prompt.appendChild(buttons);
    document.body.appendChild(prompt);

    // Auto-fermeture après timeout
    setTimeout(() => {
      if (document.body.contains(prompt)) {
        prompt.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => prompt.remove(), 300);
        savePromptShown = false;
      }
    }, SAVE_PROMPT_TIMEOUT);
  }

  /**
   * Envoie une demande de sauvegarde à l'extension
   */
  function sendSaveRequest(formData) {
    chrome.runtime.sendMessage({
      type: 'SAVE_FORM_DATA',
      data: formData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Erreur communication extension:', chrome.runtime.lastError);
        return;
      }
      
      if (response && response.success) {
        showSuccessMessage();
      } else if (response && response.error) {
        showErrorMessage(response.error);
      }
    });
  }

  /**
   * Affiche un message de succès
   */
  function showSuccessMessage() {
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    msg.textContent = '✅ Informations sauvegardées dans Vault !';
    document.body.appendChild(msg);
    
    setTimeout(() => {
      msg.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => msg.remove(), 300);
    }, 3000);
  }

  /**
   * Affiche un message d'erreur
   */
  function showErrorMessage(error) {
    const msg = document.createElement('div');
    msg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: slideIn 0.3s ease-out;
    `;
    msg.textContent = `❌ Erreur: ${error}`;
    document.body.appendChild(msg);
    
    setTimeout(() => {
      msg.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => msg.remove(), 300);
    }, 5000);
  }

  /**
   * Surveille la soumission de formulaires
   */
  function setupFormMonitoring() {
    // Intercepter AVANT la soumission pour capturer les données avant la navigation
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (!form || form.tagName !== 'FORM') return;

      // Extraire les données IMMÉDIATEMENT avant la navigation
      const formData = extractFormData(form);
      
      if (hasSaveableData(formData)) {
        lastSubmittedForm = formData;
        
        // Sauvegarder les données dans chrome.storage pour qu'elles persistent après navigation
        chrome.storage.local.set({
          pendingFormData: formData,
          pendingFormSave: true,
          formSubmitTimestamp: Date.now()
        }, () => {
          // Vérifier avec l'extension si ces données existent déjà
          chrome.runtime.sendMessage({
            type: 'CHECK_FORM_DATA',
            data: formData
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Erreur communication extension:', chrome.runtime.lastError);
              return;
            }
            
            // Si les données sont différentes ou nouvelles, proposer la sauvegarde
            if (response && response.shouldSave) {
              // Afficher le popup immédiatement
              showSavePrompt(formData);
            }
          });
        });
      }
    }, true); // Utiliser capture phase pour intercepter avant la navigation

    // Écouter aussi les clics sur les boutons de soumission (pour les formulaires dynamiques)
    // Intercepter AVANT le submit pour capturer les données
    document.addEventListener('click', (e) => {
      const button = e.target;
      if (button.tagName === 'BUTTON' && (button.type === 'submit' || button.getAttribute('type') === 'submit')) {
        const form = button.closest('form');
        if (form) {
          // Extraire les données immédiatement avant la navigation
          const formData = extractFormData(form);
          if (hasSaveableData(formData)) {
            lastSubmittedForm = formData;
            
            // Sauvegarder dans chrome.storage avant la navigation
            chrome.storage.local.set({
              pendingFormData: formData,
              pendingFormSave: true,
              formSubmitTimestamp: Date.now()
            }, () => {
              chrome.runtime.sendMessage({
                type: 'CHECK_FORM_DATA',
                data: formData
              }, (response) => {
                if (chrome.runtime.lastError) return;
                if (response && response.shouldSave) {
                  // Afficher immédiatement avant la navigation
                  showSavePrompt(formData);
                }
              });
            });
          }
        }
      }
    }, true);
  }

  /**
   * Vérifie s'il y a des données de formulaire en attente depuis une navigation précédente
   */
  async function checkPendingFormDataOnLoad() {
    try {
      const stored = await new Promise((resolve) => {
        chrome.storage.local.get(['pendingFormData', 'pendingFormSave', 'formSubmitTimestamp'], resolve);
      });

      // Vérifier si les données sont récentes (moins de 10 secondes)
      if (stored.pendingFormSave && stored.pendingFormData && stored.formSubmitTimestamp) {
        const timeSinceSubmit = Date.now() - stored.formSubmitTimestamp;
        if (timeSinceSubmit < 10000) { // 10 secondes
          // Afficher le popup sur la nouvelle page
          if (hasSaveableData(stored.pendingFormData)) {
            // Réinitialiser le flag pour permettre l'affichage
            savePromptShown = false;
            showSavePrompt(stored.pendingFormData);
          }
        } else {
          // Les données sont trop anciennes, les nettoyer
          chrome.storage.local.remove(['pendingFormData', 'pendingFormSave', 'formSubmitTimestamp']);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des données en attente:', error);
    }
  }

  // Initialiser le monitoring quand le DOM est prêt
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupFormMonitoring();
      // Vérifier les données en attente après un court délai pour laisser la page se charger
      setTimeout(checkPendingFormDataOnLoad, 500);
    });
  } else {
    setupFormMonitoring();
    setTimeout(checkPendingFormDataOnLoad, 500);
  }

  // Réinitialiser le flag si la page change (SPA)
  let currentUrl = window.location.href;
  const observer = new MutationObserver(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      savePromptShown = false;
      // Vérifier à nouveau les données en attente après changement de page
      setTimeout(checkPendingFormDataOnLoad, 500);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Écouter aussi les événements de navigation (pour les SPA)
  window.addEventListener('popstate', () => {
    setTimeout(checkPendingFormDataOnLoad, 500);
  });

})();

