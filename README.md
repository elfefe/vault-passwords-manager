# Vault Password Manager - Extension Chrome

Extension Chrome (Manifest V3) pour gérer les mots de passe dans HashiCorp Vault (KV v2).

## Fonctionnalités

- ✅ Configuration de l'URL du Vault et du token (page Options)
- ✅ Lister / Lire / Créer / Mettre à jour / Supprimer des secrets dans un backend KV v2
- ✅ Génération de mots de passe aléatoires sécurisés
- ✅ Stockage de la configuration localement (chrome.storage)
- ✅ Interface utilisateur améliorée avec tableau
- ✅ Copier/coller des valeurs avec un clic
- ✅ Masquage/affichage des mots de passe
- ✅ Détection automatique des champs de type password

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
   - Cliquez sur l'icône ⚙️ pour ouvrir les options
   - Entrez l'URL de votre Vault (ex: `https://vault.example.com`)
   - Entrez votre token Vault
   - Spécifiez le mount path KV (par défaut: `secret`)
   - Cliquez sur "Enregistrer"

## Utilisation

### Lister les secrets
1. Entrez un chemin (ou laissez vide pour la racine)
2. Cliquez sur "Lister"

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
├── manifest.json          # Configuration de l'extension
├── popup.html            # Interface principale
├── popup.css             # Styles de l'interface
├── popup.js              # Logique principale et API Vault
├── options.html          # Page de configuration
├── options.js            # Logique de configuration
├── icons/                # Dossier des icônes
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   ├── generate-icons.html  # Générateur d'icônes
│   └── README.md
└── README.md             # Ce fichier
```

## Sécurité

⚠️ **Important** : Le token Vault est stocké localement dans `chrome.storage`. C'est pratique pour le développement mais **risqué en production**.

Pour un déploiement sérieux :
- Utilisez AppRole ou OIDC pour l'authentification
- Utilisez un backend intermédiaire qui émet des tokens courts
- Ne partagez jamais votre token avec autrui
- Restreignez les permissions `host_permissions` à votre domaine Vault uniquement

## API Vault (KV v2)

L'extension utilise les endpoints suivants :
- **Lire** : `GET /v1/<mount>/data/<path>`
- **Écrire** : `POST /v1/<mount>/data/<path>` avec body `{ data: {...} }`
- **Lister** : `GET /v1/<mount>/metadata/<path>?list=true`
- **Supprimer** : `DELETE /v1/<mount>/metadata/<path>`

## Améliorations futures possibles

- Support des versions KV v2 (sélectionner version, restaurer)
- Chiffrement côté client avant envoi
- Auto-renouvellement du token via un backend
- Import/export JSON
- Recherche et filtrage des secrets
- Historique des modifications

## Licence

Ce projet est fourni tel quel pour usage personnel et développement.

