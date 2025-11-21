const GOOGLE_CLIENT_ID = "482552972428-tn0hjn31huufi49cslf8982nmacf5sg9.apps.googleusercontent.com";
const statusDiv = document.getElementById('status');

function handleCredentialResponse(response) {
  if (!response || !response.credential) {
    statusDiv.textContent = 'Erreur: réponse Google invalide';
    statusDiv.className = 'error';
    return;
  }

  const googleIdToken = response.credential;
  
  // Send the token back to the extension via chrome.runtime.sendMessage
  try {
    chrome.runtime.sendMessage({
      type: 'GOOGLE_OIDC_TOKEN',
      token: googleIdToken
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        statusDiv.textContent = 'Erreur lors de l\'envoi du token. Veuillez fermer cet onglet.';
        statusDiv.className = 'error';
      } else {
        statusDiv.textContent = 'Authentification réussie! Fermeture...';
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    });
  } catch (error) {
    console.error('Error sending message:', error);
    statusDiv.textContent = 'Erreur lors de l\'envoi du token. Veuillez fermer cet onglet.';
    statusDiv.className = 'error';
  }
}

function initializeGoogleSignIn() {
  if (!window.google || !window.google.accounts || !window.google.accounts.id) {
    statusDiv.textContent = 'Erreur: Google Identity Services non chargé';
    statusDiv.className = 'error';
    return;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse
    });

    const buttonDiv = document.getElementById('buttonDiv');
    if (buttonDiv) {
      window.google.accounts.id.renderButton(buttonDiv, {
        theme: "outline",
        size: "large",
        width: "100%"
      });
      statusDiv.textContent = '';
    }
  } catch (error) {
    console.error('Error initializing Google Sign-In:', error);
    statusDiv.textContent = 'Erreur lors de l\'initialisation: ' + error.message;
    statusDiv.className = 'error';
  }
}

// Wait for Google Identity Services to load
let retryCount = 0;
const maxRetries = 50;
const initGoogleSignIn = () => {
  if (window.google && window.google.accounts && window.google.accounts.id) {
    initializeGoogleSignIn();
  } else if (retryCount < maxRetries) {
    retryCount++;
    setTimeout(initGoogleSignIn, 100);
  } else {
    statusDiv.textContent = 'Erreur: Impossible de charger Google Identity Services';
    statusDiv.className = 'error';
  }
};

// Start initialization
if (window.google && window.google.accounts && window.google.accounts.id) {
  initializeGoogleSignIn();
} else {
  initGoogleSignIn();
}

// Listen for messages from extension
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_GOOGLE_TOKEN') {
    const token = sessionStorage.getItem('googleOidcToken');
    if (token) {
      event.source.postMessage({
        type: 'GOOGLE_OIDC_TOKEN',
        token: token
      }, event.origin);
    }
  }
});

