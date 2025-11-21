# Vault Password Manager - Extension Chrome

Extension Chrome (Manifest V3) pour gérer les mots de passe dans HashiCorp Vault (KV v2) avec **chiffrement de bout en bout** utilisant **ChaCha20-Poly1305** et **BLAKE3**.

## 🎨 Nouveau Design UI (v1.1.2)

L'extension bénéficie maintenant d'un **design moderne et vibrant** avec :
- 🌈 **Palette de couleurs vibrante** (violet, rose, bleu)
- ✨ **Animations fluides** et transitions élégantes
- 🎯 **Interface moderne** inspirée de [Magic Patterns](https://project-bubbly-cave-978.magicpatterns.app/)
- 💫 **Gradients colorés** et ombres subtiles

👉 **[Voir les démos et la documentation →](index-demos.html)**

## 🔐 Fonctionnalités de Sécurité

- ✅ **Chiffrement de bout en bout** : Les secrets sont chiffrés localement avant d'être envoyés à Vault
- ✅ **ChaCha20-Poly1305** : Algorithme de chiffrement authentifié moderne et rapide
- ✅ **BLAKE3** : Fonction de dérivation de clés haute performance
- ✅ **Master Key sécurisée** : Génération cryptographiquement sécurisée de 256 bits
- ✅ **Sous-clés uniques** : Chaque secret a sa propre clé de chiffrement dérivée
- ✅ **Authentification rapide par PIN** : Code à 4 chiffres pour un accès rapide
- ✅ **Authentification Google OIDC** : Connexion sécurisée via Google

## 📋 Fonctionnalités

- ✅ Configuration de l'URL du Vault et du token (page Options)
- ✅ Lister / Lire / Créer / Mettre à jour / Supprimer des secrets dans un backend KV v2
- ✅ Génération de mots de passe aléatoires sécurisés
- ✅ Stockage sécurisé de la configuration (chrome.storage avec chiffrement)
- ✅ Interface utilisateur moderne et intuitive
- ✅ Copier/coller des valeurs avec un clic
- ✅ Masquage/affichage des mots de passe
- ✅ Détection automatique des champs de type password
- ✅ Gestion de catégories de secrets
- ✅ **Export/Import de la Master Key** : Backup et restauration en un clic
- ✅ **Synchronisation Chrome Automatique** : Master Key synchronisée entre tous vos appareils

## Installation

1. **Générer les icônes** (optionnel mais recommandé) :
   - Ouvrez `icons/generate-icons.html` dans votre navigateur
   - Cliquez sur "Générer toutes les icônes" puis téléchargez les 3 fichiers PNG
   - Placez-les dans le dossier `icons/`

2. **Charger l'extension dans Chrome** :
   - Ouvrez Chrome et allez à `chrome://extensions/`
   - Activez le **Mode développeur** (en haut à droite)
   - Cliquez sur **Charger l'extension non empaquetée**
   - Sélectionnez le dossier contenant les fichiers de l'extension

3. **Configurer le Vault** :
   - Cliquez sur l'icône de l'extension dans la barre d'outils
   - **Première utilisation** : 
     - Option 1 : Cliquez sur "Se connecter avec Google" pour obtenir un token Vault via OIDC
     - Option 2 : Entrez manuellement votre token Vault
   - **Créer un PIN** :
     - Entrez un code à 4 chiffres pour sécuriser votre token
     - Confirmez le code
     - Le système génère automatiquement une Master Key chiffrée
   - **Utilisation ultérieure** :
     - Entrez simplement votre PIN à 4 chiffres pour vous authentifier

## Utilisation

### Lister les secrets
1. Sélectionnez une catégorie dans le menu déroulant
2. Les secrets se chargent automatiquement

### Lire un secret
1. Entrez le chemin complet du secret (ex: `prod/database`)
2. Cliquez sur "Lire"
3. Les champs s'affichent dans le tableau

### Sauvegarder un secret
1. Entrez le chemin du secret
2. Utilisez les champs du tableau pour ajouter/modifier les clés-valeurs
3. Cliquez sur "Sauvegarder"

### Supprimer un secret
1. Entrez le chemin du secret
2. Cliquez sur "Supprimer"
3. Confirmez la suppression

### Générer un mot de passe
- Cliquez sur "Générer mot de passe" pour créer un mot de passe aléatoire de 16 caractères

### Fonctionnalités du tableau
- **👁️/🙈** : Afficher/masquer le mot de passe
- **📋** : Copier la valeur dans le presse-papiers
- **🗑️** : Supprimer la ligne

## Structure des fichiers

```
.
├── manifest.json                  # Configuration de l'extension
├── popup.html                    # Interface principale
├── popup.css                     # Styles de l'interface
├── popup.js                      # Logique principale et API Vault
├── options.html                  # Page de configuration
├── options.js                    # Logique de configuration
├── crypto-utils.js               # Fonctions cryptographiques de base (AES-GCM, SHA-256)
├── crypto-system.js              # Système de chiffrement principal (ChaCha20-Poly1305 + BLAKE3)
├── lib/                          # Bibliothèques de chiffrement
│   ├── blake3.js                # Implémentation BLAKE3 pour dérivation de clés
│   └── chacha20-poly1305.js     # Implémentation ChaCha20-Poly1305
├── icons/                        # Dossier des icônes
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── generate-icons.html
│   └── README.md
├── CRYPTO-SYSTEM.md              # Documentation détaillée du système de chiffrement
├── test-crypto-system.html       # Tests interactifs du système
└── README.md                     # Ce fichier
```

## 🔒 Sécurité

### Architecture de Chiffrement

Le système utilise une approche de **chiffrement en couches** :

1. **Master Key (256 bits)** : Générée lors de la première configuration
   - Stockée dans `chrome.storage.local` chiffrée par votre PIN
   - Utilisée pour dériver toutes les sous-clés

2. **Dérivation de Sous-Clés (BLAKE3)** :
   - Chaque secret a sa propre sous-clé unique
   - Contexte de dérivation : `vault-secret-{catégorie}-{nom}`
   - Empêche la corrélation entre secrets

3. **Chiffrement Authentifié (ChaCha20-Poly1305)** :
   - Chiffre les valeurs des secrets avant envoi à Vault
   - Authentification intégrée (détection de modifications)
   - Performances élevées sans accélération matérielle

4. **Protection du Token Vault** :
   - Token chiffré avec AES-GCM et votre PIN
   - Déchiffré uniquement en mémoire pendant la session

### Modèle de Menace

✅ **Protège contre :**
- Accès non autorisé à `chrome.storage.local`
- Compromission du serveur Vault (secrets chiffrés côté client)
- Interception réseau (TLS + chiffrement supplémentaire)
- Modifications non autorisées des secrets (authentification)

⚠️ **Ne protège PAS contre :**
- Compromission totale de la machine (malware, keylogger)
- Oubli du PIN (tous les secrets deviennent inaccessibles)
- Attaque par force brute du PIN (10 000 combinaisons seulement)

### Recommandations

Pour un déploiement en production :
- ✅ **Utilisez OIDC** pour l'authentification (Google, Okta, etc.)
- ✅ **Limitez les permissions** du token Vault au strict nécessaire
- ✅ **Utilisez TLS** pour toutes les communications
- ✅ **Sauvegardez** vos secrets chiffrés régulièrement
- ✅ **Ne partagez jamais** votre PIN ou token
- ⚠️ **Considérez un PIN plus long** pour un usage sensible (modifier le code)

📖 **Documentation complète** : Consultez [CRYPTO-SYSTEM.md](CRYPTO-SYSTEM.md) pour plus de détails techniques.

## API Vault (KV v2)

L'extension utilise les endpoints suivants :
- **Lire** : `GET /v1/<mount>/data/<path>`
- **Écrire** : `POST /v1/<mount>/data/<path>` avec body `{ data: {...} }`
- **Lister** : `GET /v1/<mount>/metadata/<path>?list=true`
- **Supprimer** : `DELETE /v1/<mount>/metadata/<path>`

## 🧪 Tests

Un fichier de test interactif est disponible : `test-crypto-system.html`

Tests disponibles :
- ✅ Génération de Master Key
- ✅ Dérivation de sous-clés
- ✅ Chiffrement/déchiffrement
- ✅ Vérification d'authenticité
- ✅ Tests de performance

## 💾 Backup et Synchronisation de la Master Key

**IMPORTANT** : La Master Key est essentielle pour déchiffrer vos secrets. Si vous la perdez, vos secrets seront **irrécupérables**.

### ☁️ Synchronisation Chrome Automatique (RECOMMANDÉ)

La méthode la plus simple pour utiliser l'extension sur plusieurs ordinateurs !

**Activation :**
1. Ouvrez **Options** → Section "☁️ Synchronisation Chrome"
2. Cochez **"Activer la synchronisation Chrome"**
3. Entrez votre PIN
4. ✅ **Votre Master Key est maintenant synchronisée !**

**Sur un nouvel ordinateur :**
1. Installez Chrome + connectez-vous avec votre compte Google
2. Installez l'extension
3. Ouvrez l'extension → Entrez votre PIN
4. ✅ **Tous vos secrets sont automatiquement disponibles !**

**Avantages :**
- ✅ Synchronisation automatique instantanée
- ✅ Disponible sur tous vos appareils Chrome
- ✅ Aucune configuration supplémentaire
- ✅ Master Key toujours chiffrée (PIN requis)

📖 **Guide complet** : [GUIDE-SYNC-CHROME.md](GUIDE-SYNC-CHROME.md)

### 📁 Export/Import Manuel (Backup de Sécurité)

**Export :**
1. Ouvrez **Options** → Section "🔐 Gestion de la Master Key"
2. Cliquez sur **"📥 Télécharger Master Key"**
3. Entrez votre PIN
4. Le fichier `vault-master-key-{timestamp}.txt` est téléchargé

**Import :**
1. Ouvrez **Options**
2. Cliquez sur **"📤 Importer Master Key"**
3. Sélectionnez votre fichier de backup
4. Entrez votre PIN

⚠️ **Sécurité** : Le fichier exporté contient la Master Key en clair. Stockez-le dans un endroit sûr :
- Gestionnaire de mots de passe (KeePass, 1Password, etc.)
- Clé USB chiffrée
- Coffre-fort physique

📖 **Documentation complète** : [GUIDE-BACKUP-MASTERKEY.md](GUIDE-BACKUP-MASTERKEY.md)

### 💡 Recommandation

Pour une sécurité maximale, utilisez **les deux méthodes** :
- ☁️ **Sync Chrome** pour un usage quotidien multi-appareils
- 📁 **Backup manuel** une fois par mois pour une sécurité ultime

## 🔄 Migration des Secrets Existants

Les secrets existants stockés en clair dans Vault sont **automatiquement compatibles**. Lors de la première sauvegarde, ils seront re-chiffrés avec le nouveau système.

## Améliorations futures possibles

- ✅ ~~Chiffrement côté client avant envoi~~ (Implémenté !)
- Support des versions KV v2 (sélectionner version, restaurer)
- Auto-renouvellement du token via un backend
- Import/export JSON (chiffré)
- Recherche et filtrage des secrets
- Historique des modifications
- Rotation automatique de la Master Key
- Support de plusieurs profils utilisateurs

## Licence

Ce projet est fourni tel quel pour usage personnel et développement.

