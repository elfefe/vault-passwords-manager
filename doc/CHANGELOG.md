# 📝 Changelog - Vault Password Manager

## Version 1.1.2 - Novembre 2024 🎨

### 🔐 Sécurité PIN Améliorée

#### Champs PIN Sécurisés

- **PIN masqué avec "••••"** :
  - Changement de `type="number"` à `type="password"`
  - Affichage des caractères masqués pendant la saisie
  - Protection contre le shoulder surfing

- **Bouton "œil" pour vérification** :
  - Ajouté lors de la création du PIN uniquement
  - Permet de révéler/masquer le PIN pour vérification
  - Pas de bouton lors de l'authentification (sécurité max)
  - Icône change selon l'état (œil ouvert/barré)

- **Validation numérique stricte** :
  - Seuls les chiffres 0-9 acceptés
  - Blocage des caractères non numériques
  - Limitation automatique à 4 caractères
  - Code JavaScript robuste

#### Modaux Concernés

- `authModal` (popup) - PIN masqué, pas de bouton œil
- `createPinModal` (popup) - PIN masqué + boutons œil
- `pinModal` (options) - PIN masqué + boutons œil
- `pinPromptModal` (options) - PIN masqé

#### Fichiers Modifiés

- `popup.html` - Ajout des boutons œil et type password
- `popup.js` - Validation numérique et toggle visibilité
- `popup.css` - Styles pour boutons œil
- `options.html` - Ajout des boutons œil et type password
- `options.js` - Validation numérique et toggle visibilité

#### Documentation

- `demo-pin-security.html` - Démo interactive des améliorations
- `PIN-SECURITY-UPDATE.md` - Documentation complète
- `index-demos.html` - Ajout du lien vers la démo PIN

### 🎨 Nouveau Design UI

#### Refonte Complète de l'Interface

- **Design moderne et vibrant** inspiré de [Magic Patterns](https://project-bubbly-cave-978.magicpatterns.app/)
  - Palette de couleurs vibrante (violet, rose, bleu)
  - Gradients élégants dans le header et les boutons
  - Animations fluides et transitions élégantes
  - Ombres colorées pour la profondeur

- **Header avec gradient** :
  - Dégradé violet → rose (135deg)
  - Texte blanc avec icône intégrée
  - Animation slideDown au chargement
  - Effet hover sur l'icône settings

- **Boutons modernisés** :
  - Bouton primaire avec gradient rose-violet
  - Ombres colorées selon le type
  - Effet hover avec levée (translateY)
  - Transitions fluides (0.2s cubic-bezier)

- **Tableau des secrets amélioré** :
  - Bordures arrondies (12px)
  - Header avec fond gradient léger
  - Hover sur lignes avec gradient transparent
  - Boutons d'action colorés (bleu/violet/rose)
  - Scrollbar personnalisée avec gradient

- **Modaux redesignés** :
  - Fond avec backdrop-filter blur
  - Titres en gradient de texte
  - Input PIN avec lettres espacées
  - Animations fadeIn + slideUp

- **Variables CSS** :
  - `--color-primary: #290873` (Violet)
  - `--color-pink: #F72585` (Rose)
  - `--color-violet: #7209B7` (Violet secondaire)
  - `--color-blue: #4361EE` (Bleu)
  - Et 4 autres couleurs pour cohérence

- **Démos et documentation** :
  - `demo-new-design.html` - Démo interactive
  - `comparaison-design.html` - Comparaison avant/après
  - `index-demos.html` - Page d'accueil des démos
  - `DESIGN-CHANGES.md` - Documentation technique
  - `TESTER-NOUVEAU-DESIGN.md` - Guide de test
  - `IMPLEMENTATION-COMPLETE.md` - Checklist complète

#### Fichiers Modifiés

- `popup.css` - Refonte complète avec nouveau design
- `options.html` - Header gradient et styles modernisés
- `README.md` - Section nouveau design ajoutée

### ☁️ Synchronisation Chrome Automatique

### 🎉 Nouvelle Fonctionnalité Majeure

#### Synchronisation Chrome Automatique

- **Synchronisation automatique** : Master Key synchronisée entre tous vos appareils Chrome
  - Utilise `chrome.storage.sync` (API native Chrome)
  - Synchronisation instantanée via votre compte Google
  - Aucune configuration supplémentaire requise
  - Master Key toujours chiffrée par votre PIN

- **Interface dans Options** :
  - Nouvelle section "☁️ Synchronisation Chrome Automatique"
  - Checkbox pour activer/désactiver la sync
  - Statut en temps réel avec date de dernière synchronisation
  - Explications et avantages affichés

- **Détection automatique** :
  - Sur un nouvel appareil, la Master Key est automatiquement récupérée depuis le cloud
  - Fallback sur `chrome.storage.local` si sync non disponible
  - Copie automatique de sync vers local pour accès rapide

### 🔧 Modifications

#### `crypto-system.js`
- Fonction `storeMasterKey()` : Paramètre `enableSync` pour activer la synchronisation
- Fonction `loadMasterKey()` : Recherche d'abord en local, puis dans sync
- Fonction `hasMasterKey()` : Vérifie local ET sync
- Nouvelles fonctions :
  - `isSyncEnabled()` : Vérifie si la sync est active
  - `setSyncEnabled()` : Active/désactive la sync
  - `getSyncInfo()` : Récupère les infos de synchronisation

#### `options.html`
- Nouvelle section "☁️ Synchronisation Chrome Automatique"
- Checkbox avec label explicatif
- Zone d'information avec avantages
- Statut de synchronisation en temps réel

#### `options.js`
- Fonction `updateSyncStatus()` : Affiche le statut de sync
- Event listener sur la checkbox de sync
- Demande de PIN pour activer/désactiver
- Confirmations pour désactivation
- Messages d'alerte informatifs

### 📦 Nouveaux Fichiers

- `GUIDE-SYNC-CHROME.md` : Guide complet de 400+ lignes
  - Comparaison avec backup manuel
  - Cas d'usage détaillés
  - Sécurité et modèle de menace
  - Résolution de problèmes
  - FAQ complète

### 🔒 Sécurité

**Architecture de synchronisation :**

```
PIN (local à chaque appareil)
    ↓
Master Key (chiffrée avec le PIN)
    ↓
chrome.storage.sync (chiffré par Google)
    ↓
Tous vos appareils Chrome (même compte Google)
```

**Protections :**
- ✅ Master Key toujours chiffrée par le PIN
- ✅ Transmission sécurisée (TLS)
- ✅ Authentification Google requise
- ✅ PIN ne se synchronise PAS (reste local)

### ✨ Avantages

| Avant (1.1.1) | Maintenant (1.1.2) |
|---------------|---------------------|
| Backup manuel requis | Synchronisation automatique |
| Export/Import fichier .txt | Transparent et instantané |
| Configuration sur chaque PC | Configuration une seule fois |
| Partage difficile entre PC | Disponible partout automatiquement |

### 🎯 Cas d'Usage

#### Multi-Appareils
PC1 → Active sync → PC2, PC3 automatiquement synchronisés

#### Nouveau PC
Installation Chrome + Extension + PIN = Tous les secrets disponibles

#### Récupération
PIN oublié ? Backup manuel toujours disponible en sécurité

### 📚 Documentation

- **README** : Section "Backup et Synchronisation" mise à jour
- **GUIDE-SYNC-CHROME.md** : Guide complet
- **GUIDE-DEMARRAGE-RAPIDE.md** : Mention de la sync Chrome

### ⚠️ Limites Techniques

- **Quota** : 100 KB dans `chrome.storage.sync` (nous utilisons ~1 KB)
- **Délai** : Sync instantanée à quelques minutes max
- **Plateformes** : Desktop uniquement (Windows, Mac, Linux, ChromeOS)
- **Mobile** : Non supporté (Chrome mobile ne supporte pas les extensions)

### 💡 Recommandation

**Double Backup** : Utilisez les deux méthodes pour sécurité maximale
- ☁️ Sync Chrome pour usage quotidien
- 📁 Backup manuel une fois par mois

---

## Version 1.1.1 - Novembre 2024 💾

### 🎉 Nouvelles Fonctionnalités

#### Export/Import de la Master Key

- **Export** : Téléchargez votre Master Key au format JSON
  - Protection par PIN requise
  - Format standardisé avec métadonnées
  - Avertissements de sécurité intégrés

- **Import** : Restaurez votre Master Key depuis un backup
  - Validation du format de fichier
  - Confirmation obligatoire avant remplacement
  - Support de la migration entre ordinateurs

- **Interface** : Nouvelle section dans la page Options
  - Statut de la Master Key en temps réel
  - Boutons dédiés pour export/import
  - Messages d'erreur clairs

### 📦 Nouveaux Fichiers

- `GUIDE-BACKUP-MASTERKEY.md` : Guide complet pour l'export/import

### 🔧 Modifications

#### `options.html`
- Ajout de la section "🔐 Gestion de la Master Key"
- Nouveau modal pour demander le PIN lors des opérations sensibles
- Styles pour les boutons warning/danger
- Input file caché pour l'import

#### `options.js`
- Fonction `updateMasterKeyStatus()` : Affiche le statut de la Master Key
- Fonction `promptForPin()` : Modal réutilisable pour demander le PIN
- Fonction d'export : Télécharge la Master Key en JSON
- Fonction d'import : Charge et valide la Master Key depuis un fichier
- Validation du format et de la taille de la Master Key

### 🔒 Sécurité

- ✅ PIN requis pour export/import
- ✅ Validation stricte du format de fichier
- ✅ Avertissements multiples sur la sensibilité des données
- ✅ Confirmation obligatoire avant remplacement
- ✅ Master Key stockée en hexadécimal (64 caractères = 256 bits)

### 📚 Documentation

- Guide complet de backup : `GUIDE-BACKUP-MASTERKEY.md`
- README mis à jour avec section backup
- Cas d'usage : migration, sync multi-ordinateurs, récupération

### ⚠️ Avertissements Importants

**Le fichier exporté contient la Master Key en CLAIR**

**À FAIRE** :
- ✅ Stocker dans un gestionnaire de mots de passe
- ✅ Chiffrer avec GPG/PGP
- ✅ Stocker sur clé USB chiffrée
- ✅ Garder dans un coffre-fort physique

**À NE JAMAIS FAIRE** :
- ❌ Envoyer par email
- ❌ Stocker sur cloud non chiffré
- ❌ Partager sur messagerie
- ❌ Laisser dans dossier Téléchargements

---

## Version 1.1.0 - Novembre 2024 🔐

### 🎉 Nouvelles Fonctionnalités Majeures

#### Système de Chiffrement de Bout en Bout

- **ChaCha20-Poly1305** : Implémentation du chiffrement authentifié moderne
  - Chiffrement rapide sans accélération matérielle
  - Authentification intégrée (détection des modifications)
  - Nonce de 96 bits généré aléatoirement

- **BLAKE3** : Dérivation de clés haute performance
  - Utilise HKDF-SHA256 comme fallback compatible navigateur
  - Génération de sous-clés uniques par secret
  - Contexte de dérivation personnalisé

- **Master Key sécurisée** :
  - Génération de 256 bits d'entropie cryptographiquement sécurisée
  - Stockage chiffré dans `chrome.storage.local`
  - Protection par PIN à 4 chiffres
  - Déchiffrée uniquement en mémoire pendant la session

#### Architecture de Sécurité

```
PIN (4 chiffres)
    ↓
Master Key (256 bits, chiffrée)
    ↓
Sous-clés dérivées (BLAKE3, unique par secret)
    ↓
Secrets chiffrés (ChaCha20-Poly1305)
    ↓
Stockage dans Vault
```

### 📦 Nouveaux Fichiers

- `lib/blake3.js` : Implémentation BLAKE3 pour dérivation de clés
- `lib/chacha20-poly1305.js` : Implémentation ChaCha20-Poly1305
- `crypto-system.js` : Système de chiffrement principal
- `CRYPTO-SYSTEM.md` : Documentation technique complète
- `test-crypto-system.html` : Tests interactifs du système
- `CHANGELOG.md` : Ce fichier

### 🔧 Modifications

#### `popup.js`
- Ajout de la variable `currentPin` pour stocker le PIN en mémoire
- Initialisation de la Master Key lors de la création du PIN
- Chiffrement des valeurs de secrets avant sauvegarde dans Vault
- Déchiffrement automatique des secrets lors du chargement
- Compatibilité rétroactive avec les secrets non chiffrés

#### `options.js`
- Initialisation de la Master Key lors de la configuration initiale
- Support du chiffrement lors de la modification du token

#### `popup.html` et `options.html`
- Inclusion des nouvelles bibliothèques de chiffrement dans le bon ordre :
  1. `lib/blake3.js`
  2. `lib/chacha20-poly1305.js`
  3. `crypto-utils.js`
  4. `crypto-system.js`
  5. Script principal

#### `manifest.json`
- Mise à jour de la version : `1.0` → `1.1`
- Mise à jour de la description pour mentionner le chiffrement

### ✨ Améliorations

- **Sécurité renforcée** : Secrets chiffrés localement avant envoi à Vault
- **Performances** : ChaCha20 est plus rapide qu'AES-GCM sans AES-NI
- **Isolation** : Chaque secret a sa propre clé de chiffrement
- **Authentification** : Détection automatique des modifications de secrets
- **Compatibilité** : Les anciens secrets non chiffrés restent accessibles

### 🐛 Corrections

- Aucun bug connu dans cette version

### ⚠️ Changements Incompatibles

**Aucun !** Cette version est 100% compatible avec la version précédente :
- Les secrets existants en clair restent lisibles
- Ils seront automatiquement re-chiffrés lors de la prochaine sauvegarde
- Aucune migration manuelle requise

### 🔄 Migration

Pour migrer de la version 1.0 à la 1.1 :

1. **Sauvegardez vos secrets** (optionnel mais recommandé)
   - Exportez vos secrets depuis Vault si vous avez des doutes

2. **Mettez à jour l'extension**
   - Remplacez les fichiers de l'extension par les nouveaux
   - Rechargez l'extension dans `chrome://extensions/`

3. **Première utilisation après mise à jour**
   - Si vous aviez déjà un PIN configuré :
     - La Master Key sera générée automatiquement au prochain déverrouillage
   - Si c'est une nouvelle installation :
     - Suivez la procédure de configuration normale

4. **Re-chiffrer les secrets existants** (optionnel)
   - Ouvrez chaque catégorie
   - Cliquez sur "Sauvegarder" pour re-chiffrer les secrets
   - Les secrets sont automatiquement migrés vers le nouveau format

### 📊 Métriques de Performance

Tests effectués sur 100 itérations :

| Opération | Temps moyen | Débit |
|-----------|-------------|-------|
| Chiffrement | ~2-3 ms | ~400 op/s |
| Déchiffrement | ~2-3 ms | ~400 op/s |
| Dérivation de clé | ~1-2 ms | ~600 op/s |

*Tests réalisés sur Chrome 120, CPU moderne*

### 🔜 Prochaines Étapes

Version 1.2 (planifiée) :
- Rotation automatique de la Master Key
- Support de PIN plus longs (6-8 chiffres)
- Export/import chiffré de secrets
- Historique des modifications
- Support de plusieurs profils utilisateurs

### 📚 Documentation

- **README.md** : Guide d'utilisation général
- **CRYPTO-SYSTEM.md** : Documentation technique du système de chiffrement
- **test-crypto-system.html** : Tests interactifs

### 🙏 Remerciements

Merci à la communauté open-source pour :
- [ChaCha20-Poly1305 (RFC 8439)](https://datatracker.ietf.org/doc/html/rfc8439)
- [BLAKE3](https://github.com/BLAKE3-team/BLAKE3)
- [HashiCorp Vault](https://www.vaultproject.io/)
- [Web Crypto API](https://www.w3.org/TR/WebCryptoAPI/)

---

## Version 1.0.0 - Date Initiale

### Fonctionnalités Initiales

- Configuration de l'URL Vault et du token
- Gestion des secrets KV v2 (CRUD)
- Génération de mots de passe aléatoires
- Interface utilisateur avec tableau
- Authentification Google OIDC
- PIN à 4 chiffres pour protection du token
- Gestion de catégories de secrets
- Copier/coller des valeurs
- Masquage/affichage des mots de passe
- Détection automatique des champs password

---

**Pour toute question ou problème, consultez la documentation ou ouvrez une issue.**

