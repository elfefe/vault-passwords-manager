# 🔐 Système de Chiffrement - Vault Password Manager

## Vue d'ensemble

Ce gestionnaire de mots de passe implémente un système de chiffrement à plusieurs niveaux basé sur **ChaCha20-Poly1305** et **BLAKE3** pour sécuriser vos secrets avant de les stocker dans HashiCorp Vault.

## Architecture du Système

### 1. Master Key (Clé Maîtresse)

La **Master Key** est une clé de 256 bits (32 bytes) **dérivée depuis un mot de passe utilisateur** en utilisant **PBKDF2** (100 000 itérations, SHA-256).

**Dérivation :**
```javascript
// Le mot de passe utilisateur (minimum 12 caractères) est utilisé pour dériver la Master Key
const { key: masterKey, salt } = await deriveMasterKeyFromPassword(
  password,      // Mot de passe utilisateur
  userId,        // kvMount/entity_name pour sel déterministe
  100000,        // Itérations PBKDF2
  32             // 256 bits
);
```

**Sel déterministe :**
- Le sel est généré de manière **déterministe** à partir du `kvMount` (entity_name) de l'utilisateur
- Cela garantit que le même mot de passe + le même `kvMount` produisent toujours la même Master Key
- **Avantage** : Les données peuvent être récupérées après réinstallation de l'extension avec le même mot de passe et `kvMount`

**Stockage :**
- La Master Key dérivée est chiffrée avec votre **PIN à 4 chiffres** (en utilisant AES-GCM)
- Elle est stockée dans `chrome.storage.local` sous forme chiffrée
- Le sel est également stocké (pour référence, mais peut être régénéré de manière déterministe)
- Elle n'est jamais stockée en clair

### 2. Dérivation de Sous-Clés avec BLAKE3

Pour chaque secret, une **sous-clé unique** est dérivée de la Master Key en utilisant BLAKE3 (implémenté via HKDF-SHA256 comme fallback compatible navigateur).

**Contexte de dérivation :**
```
vault-secret-{catégorie}-{nom-du-secret}
```

Exemple : `vault-secret-passwords-api_key`

Cela garantit que :
- Chaque secret a sa propre clé de chiffrement
- Même si deux secrets ont la même valeur, leurs versions chiffrées seront différentes
- La compromission d'une sous-clé n'affecte pas les autres secrets

### 3. Chiffrement avec ChaCha20-Poly1305

Chaque valeur de secret est chiffrée avec **ChaCha20-Poly1305**, un algorithme de chiffrement authentifié (AEAD).

**Caractéristiques :**
- **Nonce aléatoire** de 12 bytes généré pour chaque chiffrement
- **Tag d'authentification** de 16 bytes pour vérifier l'intégrité
- Résistant aux attaques de modification
- Performances élevées même sans accélération matérielle

**Format de stockage :**
```json
{
  "iv": "base64_encoded_nonce",
  "ciphertext": "base64_encoded_encrypted_data",
  "tag": "base64_encoded_auth_tag"
}
```

## Flux d'Initialisation

### Configuration Initiale

```
1. Récupération du token Vault
   ↓
2. Création du mot de passe Master Key (minimum 12 caractères)
   ↓
3. Dérivation de la Master Key depuis le mot de passe avec PBKDF2
   - Sel déterministe généré depuis le kvMount (entity_name)
   ↓
4. Création du PIN (4 chiffres)
   ↓
5. Chiffrement de la Master Key avec le PIN (AES-GCM)
   ↓
6. Stockage de la Master Key chiffrée dans chrome.storage.local
```

## Flux de Chiffrement/Déchiffrement

### Chiffrement d'un Secret

```
1. PIN utilisateur (4 chiffres)
   ↓
2. Déchiffrement de la Master Key (stockée et chiffrée)
   ↓
3. Dérivation de la sous-clé avec contexte unique (BLAKE3)
   ↓
4. Chiffrement de la valeur avec ChaCha20-Poly1305
   ↓
5. Stockage dans Vault au format JSON
```

### Déchiffrement d'un Secret

```
1. PIN utilisateur (4 chiffres)
   ↓
2. Déchiffrement de la Master Key (stockée et chiffrée)
   ↓
3. Dérivation de la même sous-clé avec le même contexte (BLAKE3)
   ↓
4. Vérification du tag d'authentification
   ↓
5. Déchiffrement de la valeur avec ChaCha20-Poly1305
   ↓
6. Affichage de la valeur en clair
```

## Fichiers du Système

### `/lib/blake3.js`
Implémentation de BLAKE3 pour la dérivation de clés (utilise HKDF-SHA256 comme fallback compatible navigateur).

### `/lib/chacha20-poly1305.js`
Implémentation pure JavaScript de ChaCha20-Poly1305 pour le chiffrement authentifié.

### `/crypto-system.js`
Module principal qui orchestre :
- Dérivation de la Master Key depuis un mot de passe utilisateur (PBKDF2)
- Génération de sel déterministe basé sur le kvMount
- Stockage de la Master Key chiffrée
- Dérivation de sous-clés (BLAKE3)
- API de chiffrement/déchiffrement de secrets

### `/crypto-utils.js`
Fonctions utilitaires pour :
- Chiffrement/déchiffrement du token Vault avec le PIN (AES-GCM)
- Hash SHA-256 du PIN

## API du Système

### Initialisation

```javascript
// Lors de la première configuration (création du mot de passe Master Key et PIN)
await window.cryptoSystem.initializeCryptoSystem(
  password,  // Mot de passe Master Key (minimum 12 caractères)
  pin,       // PIN à 4 chiffres
  userId     // kvMount/entity_name (optionnel, récupéré depuis storage si non fourni)
);
```

### Dérivation de la Master Key

```javascript
// Dériver une Master Key depuis un mot de passe
const { key: masterKey, salt } = await window.cryptoSystem.deriveMasterKeyFromPassword(
  password,  // Mot de passe utilisateur
  userId,    // kvMount/entity_name pour sel déterministe
  salt,      // Sel (optionnel, généré de manière déterministe si userId fourni)
  100000,    // Itérations PBKDF2
  32         // Taille en bytes (256 bits)
);
```

### Chiffrement d'un Secret

```javascript
const encryptedSecret = await window.cryptoSystem.encryptSecret(
  secretValue,  // "mon-mot-de-passe-secret"
  pin,          // "1234"
  context       // "vault-secret-passwords-api_key"
);
// Retourne : { iv, ciphertext, tag }
```

### Déchiffrement d'un Secret

```javascript
const decryptedValue = await window.cryptoSystem.decryptSecret(
  encryptedSecret,  // { iv, ciphertext, tag }
  pin,              // "1234"
  context           // "vault-secret-passwords-api_key"
);
// Retourne : "mon-mot-de-passe-secret"
```

### Vérifier si une Master Key existe

```javascript
const exists = await window.cryptoSystem.hasMasterKey();
```

### Changer le PIN

```javascript
await window.cryptoSystem.changePinAndReencryptMasterKey(oldPin, newPin);
```

### Changer le Mot de passe Master Key

```javascript
await window.cryptoSystem.changeMasterPassword(
  oldPassword,  // Ancien mot de passe
  newPassword,  // Nouveau mot de passe
  pin,          // PIN actuel
  userId        // kvMount/entity_name (optionnel)
);
```

## Sécurité

### ✅ Ce qui est sécurisé

- **Master Key** : Dérivée depuis un mot de passe utilisateur avec PBKDF2 (100 000 itérations, SHA-256)
- **Sel déterministe** : Basé sur le kvMount (entity_name) pour garantir la reproductibilité
- **Dérivation déterministe** : Chaque secret a sa propre sous-clé unique (BLAKE3)
- **Chiffrement authentifié** : ChaCha20-Poly1305 empêche les modifications
- **PIN protégé** : Le PIN est hasché (SHA-256) avant stockage
- **Stockage chiffré** : Tout est chiffré dans chrome.storage.local
- **Récupération après réinstallation** : Le même mot de passe + kvMount permet de recréer la même Master Key
- **Compatibilité rétroactive** : Les anciens secrets non chiffrés restent accessibles

### ⚠️ Limitations

- **PIN de 4 chiffres** : Seulement 10 000 combinaisons possibles (acceptable pour un usage local)
- **Master Key en mémoire** : Pendant la session, elle est déchiffrée en RAM
- **Pas de rotation automatique** : La Master Key ne change pas automatiquement
- **Dépendance au PIN** : Si vous oubliez le PIN, tous les secrets sont perdus
- **Dépendance au mot de passe** : Si vous oubliez le mot de passe Master Key, tous les secrets sont perdus
- **Mot de passe minimum** : 12 caractères requis pour une sécurité suffisante

## Migration des Secrets Existants

Les secrets existants stockés en clair dans Vault restent **accessibles en lecture** mais seront automatiquement **re-chiffrés lors de la prochaine sauvegarde**.

Le système détecte automatiquement si une valeur est chiffrée (format JSON avec `iv`, `ciphertext`, `tag`) ou en clair.

## Récupération après Réinstallation

Grâce au **sel déterministe** basé sur le `kvMount` (entity_name), vous pouvez récupérer vos secrets après réinstallation de l'extension :

1. **Réinstallez l'extension**
2. **Configurez avec le même token Vault** (même `kvMount`/entity_name)
3. **Utilisez le même mot de passe Master Key** (minimum 12 caractères)
4. **Utilisez le même PIN** (4 chiffres)
5. **La même Master Key sera générée** et vos secrets seront accessibles

**Important** : Seuls les secrets créés avec le système de sel déterministe (après cette mise à jour) peuvent être récupérés. Les anciens secrets créés avec un sel aléatoire ne seront pas accessibles après réinstallation.

## Comparaison avec AES-GCM

| Caractéristique | ChaCha20-Poly1305 | AES-GCM (ancien système) |
|----------------|-------------------|--------------------------|
| Algorithme | ChaCha20 stream cipher | AES block cipher |
| Authentification | Poly1305 MAC | GMAC |
| Performances sans AES-NI | ⚡ Rapide | 🐌 Lent |
| Sécurité | ✅ Excellente | ✅ Excellente |
| Support navigateur | ⚠️ Nécessite bibliothèque | ✅ Natif |
| Usage | Secrets dans Vault | Token Vault (PIN) |

## Tests et Validation

Pour tester le système :

1. **Créer un nouveau secret** et vérifier qu'il est chiffré dans Vault
2. **Recharger la page** et vérifier que le secret est correctement déchiffré
3. **Changer le PIN** et vérifier que l'accès fonctionne toujours
4. **Vérifier les logs** dans la console pour voir les étapes de chiffrement

## Dépannage

### Le déchiffrement échoue

- Vérifiez que le PIN est correct
- Vérifiez que la Master Key existe (`hasMasterKey()`)
- Vérifiez que le contexte de dérivation est le même qu'au chiffrement

### "Master key not initialized"

- La Master Key n'a pas été créée lors de la première configuration
- Réinitialisez l'extension et créez un nouveau mot de passe Master Key + PIN

### "Le mot de passe doit contenir au moins 12 caractères"

- Le mot de passe Master Key doit contenir au moins 12 caractères pour des raisons de sécurité
- Utilisez un mot de passe fort avec majuscules, minuscules, chiffres et symboles

### Impossible de déchiffrer après réinstallation

- Vérifiez que vous utilisez le **même mot de passe Master Key**
- Vérifiez que vous utilisez le **même kvMount** (entity_name)
- Vérifiez que vous utilisez le **même PIN**
- Les secrets créés avec l'ancien système (sel aléatoire) ne peuvent pas être récupérés

### Secrets en clair dans Vault

- Les anciens secrets ne sont pas automatiquement re-chiffrés
- Ouvrez et sauvegardez chaque secret pour le chiffrer

## Références

- [ChaCha20-Poly1305 (RFC 8439)](https://datatracker.ietf.org/doc/html/rfc8439)
- [BLAKE3 Specification](https://github.com/BLAKE3-team/BLAKE3-specs)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [HashiCorp Vault](https://www.vaultproject.io/)

## Comparaison : Ancien vs Nouveau Système

| Caractéristique | Ancien Système | Nouveau Système |
|----------------|----------------|-----------------|
| Master Key | Générée aléatoirement | Dérivée depuis mot de passe (PBKDF2) |
| Sel | Aléatoire (stocké) | Déterministe (basé sur kvMount) |
| Récupération après réinstallation | ❌ Impossible | ✅ Possible (même mot de passe + kvMount) |
| Mot de passe utilisateur | ❌ Non requis | ✅ Requis (minimum 12 caractères) |
| Flux d'initialisation | Token → PIN → Master Key | Token → Mot de passe → PIN → Master Key |

---

**Version :** 2.0  
**Dernière mise à jour :** Décembre 2024

