# 🚀 Guide de Démarrage Rapide

## Installation et Configuration (5 minutes)

### Étape 1 : Charger l'Extension 📦

1. Ouvrez Chrome et allez à `chrome://extensions/`
2. Activez le **Mode développeur** (en haut à droite)
3. Cliquez sur **Charger l'extension non empaquetée**
4. Sélectionnez le dossier `Vault Password Manager`

✅ L'icône de l'extension apparaît dans la barre d'outils !

### Étape 2 : Première Configuration 🔐

1. **Cliquez sur l'icône de l'extension**
   
2. **Connectez-vous à Vault** (2 options) :
   
   **Option A - Connexion Google (Recommandé)** :
   - Cliquez sur "Se connecter avec Google"
   - Autorisez l'accès dans la fenêtre popup
   - Le token est automatiquement récupéré
   
   **Option B - Token manuel** :
   - Entrez votre token Vault (format `s.xxxxxx`)
   - Cliquez sur "Continuer"

3. **Créez votre PIN de sécurité** :
   - Entrez un code à 4 chiffres (ex: `1234`)
   - Confirmez le code
   - ✨ Le système génère automatiquement votre Master Key !

4. **Vous êtes prêt !** 🎉
   - Le popup se ferme automatiquement
   - À la prochaine ouverture, entrez simplement votre PIN

### Étape 3 : Créer Votre Premier Secret 🔑

1. **Ouvrez l'extension** et entrez votre PIN

2. **Créez une catégorie** :
   - Cliquez sur le bouton `+` à côté du menu déroulant
   - Entrez un nom (ex: "Réseaux Sociaux")
   - Validez

3. **Ajoutez des champs** :
   - Cliquez sur "Nouvelle entrée" ou "Ajouter champ"
   - Entrez la clé (ex: "username")
   - Entrez la valeur (ex: "john.doe@example.com")
   - Pour un mot de passe, utilisez "Générer mot de passe"

4. **Sauvegardez** :
   - Cliquez sur "Sauvegarder"
   - 🔐 Le secret est automatiquement chiffré avant d'être envoyé à Vault !
   - ✅ Message de confirmation : "Secret sauvegardé avec succès (chiffré)"

### Étape 4 : Utiliser Vos Secrets 💪

#### Lire un Secret
1. Sélectionnez une catégorie dans le menu déroulant
2. Les secrets se chargent automatiquement
3. 🔓 Ils sont déchiffrés en temps réel !

#### Copier une Valeur
1. Survolez un champ
2. Cliquez sur l'icône 📋 (copier)
3. ✅ "Valeur copiée"

#### Afficher/Masquer un Mot de Passe
1. Survolez un champ de type password
2. Cliquez sur l'icône 👁️ pour afficher
3. Cliquez sur 🙈 pour masquer

#### Copier Tous les Champs
1. Cliquez sur l'icône 📋 en haut à droite du tableau
2. Tous les champs sont copiés au format `clé: valeur`

## ⚠️ IMPORTANT : Synchronisation et Backup

**Dès maintenant**, protégez votre Master Key avec l'une de ces deux méthodes :

### Option 1 : Synchronisation Chrome ☁️ (RECOMMANDÉ)

**La plus simple pour un usage multi-appareils !**

1. **Options** → Section "☁️ Synchronisation Chrome"
2. **Cochez** "Activer la synchronisation Chrome"
3. **Entrez votre PIN**
4. ✅ **Votre Master Key est synchronisée automatiquement !**

**Avantages :**
- ✅ Automatique entre tous vos PC Chrome
- ✅ Récupération instantanée sur nouveau PC
- ✅ Aucune configuration à refaire

📖 Guide complet : [GUIDE-SYNC-CHROME.md](GUIDE-SYNC-CHROME.md)

### Option 2 : Backup Manuel 📁

**Pour sécurité ultime !**

1. **Options** → Section "🔐 Gestion de la Master Key"
2. **Cliquez** "📥 Télécharger Master Key"
3. **Stockez le fichier** dans un endroit sûr

📖 Guide complet : [GUIDE-BACKUP-MASTERKEY.md](GUIDE-BACKUP-MASTERKEY.md)

💡 **Conseil** : Activez la **Sync Chrome** ET faites un **backup manuel** pour double protection !

---

## Fonctionnalités Avancées 🎯

### Gestion des Catégories

- **Créer** : Bouton `+` à côté du menu déroulant
- **Supprimer** : Bouton 🗑️ à côté du menu déroulant
- **Sélectionner** : Menu déroulant principal

### Génération de Mots de Passe

1. Cliquez sur "Générer mot de passe"
2. Un champ `password` avec un mot de passe de 16 caractères est créé
3. Modifiez la clé si nécessaire
4. Sauvegardez

### Options de Configuration

1. Cliquez sur l'icône ⚙️ en haut à droite
2. Modifiez l'URL Vault si nécessaire
3. Changez le mount path KV (par défaut : votre entity_name)
4. Connectez-vous avec un nouveau token si nécessaire

## 🔒 Comprendre le Chiffrement

### Ce qui est Chiffré

✅ **Toutes les valeurs de secrets** :
```
Avant chiffrement : "mon-super-mot-de-passe"
Après chiffrement : {"iv":"...","ciphertext":"...","tag":"..."}
```

✅ **Votre token Vault** (chiffré avec votre PIN)

✅ **Votre Master Key** (chiffrée avec votre PIN)

### Ce qui N'est PAS Chiffré

❌ Les **noms de clés** (ex: "username", "password")
❌ Les **noms de catégories** (ex: "Réseaux Sociaux")
❌ Les **métadonnées** Vault (dates, versions)

### Pourquoi C'est Sécurisé

1. **Chiffrement local** : Les secrets sont chiffrés AVANT d'être envoyés à Vault
2. **Clés uniques** : Chaque secret a sa propre clé de chiffrement
3. **Authentification** : Les modifications sont automatiquement détectées
4. **Zero-knowledge** : Même si Vault est compromis, vos secrets restent chiffrés

## 🛠️ Résolution de Problèmes

### ❌ "Code incorrect"
- Vérifiez que vous entrez le bon PIN à 4 chiffres
- Si vous l'avez oublié, réinitialisez l'extension (Options → Réinitialiser)

### ❌ "Master key not initialized"
- La Master Key n'a pas été créée
- Allez dans Options → Réinitialisez → Créez un nouveau PIN

### ❌ "Token invalide"
- Votre token Vault a expiré
- Allez dans Options → Connectez-vous à nouveau avec Google ou entrez un nouveau token

### ❌ "Erreur de déchiffrement"
- Le secret a été créé avec une ancienne version non chiffrée
- Ouvrez le secret, modifiez-le légèrement, et sauvegardez-le pour le re-chiffrer

### ❌ Les secrets s'affichent en JSON
- Cela signifie que le secret est bien chiffré mais pas déchiffré correctement
- Vérifiez que vous utilisez le bon PIN
- Vérifiez que la Master Key existe

## 📊 Vérifier que le Chiffrement Fonctionne

### Test 1 : Vérifier dans Vault (Interface Web)

1. Connectez-vous à Vault via l'interface web
2. Naviguez vers votre secret (ex: `passwords/Réseaux Sociaux`)
3. Vous devriez voir quelque chose comme :
```json
{
  "username": "{\"iv\":\"...\",\"ciphertext\":\"...\",\"tag\":\"...\"}"
}
```
✅ Si vous voyez ce format JSON, c'est chiffré !

### Test 2 : Vérifier dans la Console Chrome

1. Ouvrez l'extension
2. Appuyez sur F12 pour ouvrir les DevTools
3. Allez dans l'onglet Console
4. Sauvegardez un secret
5. Vous devriez voir : `Secret {nom} chiffré avec succès`

### Test 3 : Test de Déchiffrement

1. Créez un secret avec une valeur connue (ex: "test123")
2. Fermez et réouvrez l'extension
3. Entrez votre PIN
4. Le secret devrait s'afficher correctement (pas en JSON)
5. Vous devriez voir : `Secret {nom} déchiffré avec succès` dans la console

## 🔐 Bonnes Pratiques

### Sécurité du PIN

✅ **À faire** :
- Choisir un PIN que vous retiendrez
- Ne pas partager votre PIN
- Utiliser un PIN différent de vos autres codes

❌ **À éviter** :
- Utiliser `0000`, `1234`, `1111`
- Noter votre PIN dans un fichier texte
- Partager votre écran pendant que vous entrez le PIN

### Gestion des Secrets

✅ **À faire** :
- Utiliser des catégories pour organiser
- Générer des mots de passe forts
- Sauvegarder régulièrement vos secrets (backup Vault)
- Tester le déchiffrement après chaque sauvegarde

❌ **À éviter** :
- Stocker des informations ultra-sensibles sans backup
- Utiliser des mots de passe faibles
- Partager votre token Vault

### Maintenance

- **Mise à jour** : Rechargez l'extension après mise à jour du code
- **Backup** : Exportez vos secrets depuis Vault régulièrement
- **Token** : Renouvelez votre token Vault périodiquement

## 🎓 Ressources Supplémentaires

- **Guide sync Chrome** : [GUIDE-SYNC-CHROME.md](GUIDE-SYNC-CHROME.md) ⭐ **NOUVEAU**
- **Guide backup manuel** : [GUIDE-BACKUP-MASTERKEY.md](GUIDE-BACKUP-MASTERKEY.md) ⭐ **IMPORTANT**
- **Documentation technique** : [CRYPTO-SYSTEM.md](CRYPTO-SYSTEM.md)
- **Tests interactifs** : Ouvrez `test-crypto-system.html` dans Chrome
- **Changelog** : [CHANGELOG.md](CHANGELOG.md)
- **README complet** : [README.md](README.md)

## 🆘 Besoin d'Aide ?

Si vous rencontrez un problème :

1. Consultez la section "Résolution de Problèmes" ci-dessus
2. Vérifiez les logs dans la console Chrome (F12)
3. Lisez la documentation technique
4. Vérifiez que vous utilisez la dernière version

---

**Temps de configuration : ~5 minutes**  
**Temps pour créer un premier secret : ~30 secondes**  
**Niveau de sécurité : 🔐🔐🔐🔐🔐**

Bon usage ! 🚀

