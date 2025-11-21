const statusDiv = document.getElementById('status');

// Extract ID token from URL fragment
function extractIdToken() {
  try {
    // Google OAuth returns the ID token in the URL fragment: #id_token=...
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    const error = params.get('error');
    
    if (error) {
      const errorDescription = params.get('error_description') || error;
      statusDiv.textContent = 'Erreur: ' + decodeURIComponent(errorDescription);
      statusDiv.className = 'error';
      setTimeout(() => {
        window.close();
      }, 3000);
      return;
    }
    
    if (!idToken) {
      statusDiv.textContent = 'Erreur: Aucun token reçu de Google';
      statusDiv.className = 'error';
      setTimeout(() => {
        window.close();
      }, 3000);
      return;
    }
    
    // Send the token back to the extension
    chrome.runtime.sendMessage({
      type: 'GOOGLE_OIDC_TOKEN',
      token: idToken
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        statusDiv.textContent = 'Erreur lors de l\'envoi du token. Veuillez fermer cet onglet.';
        statusDiv.className = 'error';
      } else {
        statusDiv.textContent = 'Authentification réussie! Fermeture...';
        statusDiv.className = 'success';
        setTimeout(() => {
          window.close();
        }, 1000);
      }
    });
  } catch (error) {
    console.error('Error extracting token:', error);
    statusDiv.textContent = 'Erreur: ' + error.message;
    statusDiv.className = 'error';
    setTimeout(() => {
      window.close();
    }, 3000);
  }
}

// Extract token when page loads
extractIdToken();

