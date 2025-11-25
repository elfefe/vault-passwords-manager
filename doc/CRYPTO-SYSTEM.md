# 🔐 Système de Chiffrement - Vault Password Manager

## Vue d'ensemble

Ce gestionnaire de mots de passe implémente un système de chiffrement à plusieurs niveaux basé sur **ChaCha20-Poly1305** et **BLAKE3** pour sécuriser vos secrets avant de les stocker dans HashiCorp Vault.

## Architecture du Système

### 1. Master Key (Clé Maîtresse)

La **Master Key** est une clé de 256 bits (32 bytes) générée de manière cryptographiquement sécurisée lors de la première configuration.

**Génération :**
```javascript
const masterKey = crypto.getRandomValues(new Uint8Array(32));
```

**Stockage :**
- La Master Key est chiffrée avec votre **PIN à 4 chiffres** (en utilisant AES-GCM)
- Elle est stockée dans `chrome.storage.local` sous forme chiffrée
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

## Flux de Chiffrement/Déchiffrement

### Chiffrement d'un Secret

```
1. PIN utilisateur (4 chiffres)
   ↓
2. Déchiffrement de la Master Key
   ↓
3. Dérivation de la sous-clé avec contexte unique
   ↓
4. Chiffrement de la valeur avec ChaCha20-Poly1305
   ↓
5. Stockage dans Vault au format JSON
```

### Déchiffrement d'un Secret

```
1. PIN utilisateur (4 chiffres)
   ↓
2. Déchiffrement de la Master Key
   ↓
3. Dérivation de la même sous-clé avec le même contexte
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
- Génération et stockage de la Master Key
- Dérivation de sous-clés
- API de chiffrement/déchiffrement de secrets

### `/crypto-utils.js`
Fonctions utilitaires pour :
- Chiffrement/déchiffrement du token Vault avec le PIN (AES-GCM)
- Hash SHA-256 du PIN

## API du Système

### Initialisation

```javascript
// Lors de la première configuration (création du PIN)
await window.cryptoSystem.initializeCryptoSystem(pin);
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

## Sécurité

### ✅ Ce qui est sécurisé

- **Master Key** : Générée aléatoirement avec 256 bits d'entropie
- **Dérivation déterministe** : Chaque secret a sa propre sous-clé unique
- **Chiffrement authentifié** : ChaCha20-Poly1305 empêche les modifications
- **PIN protégé** : Le PIN est hasché (SHA-256) avant stockage
- **Stockage chiffré** : Tout est chiffré dans chrome.storage.local
- **Compatibilité rétroactive** : Les anciens secrets non chiffrés restent accessibles

### ⚠️ Limitations

- **PIN de 4 chiffres** : Seulement 10 000 combinaisons possibles (acceptable pour un usage local)
- **Master Key en mémoire** : Pendant la session, elle est déchiffrée en RAM
- **Pas de rotation automatique** : La Master Key ne change pas automatiquement
- **Dépendance au PIN** : Si vous oubliez le PIN, tous les secrets sont perdus

## Migration des Secrets Existants

Les secrets existants stockés en clair dans Vault restent **accessibles en lecture** mais seront automatiquement **re-chiffrés lors de la prochaine sauvegarde**.

Le système détecte automatiquement si une valeur est chiffrée (format JSON avec `iv`, `ciphertext`, `tag`) ou en clair.

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
- Réinitialisez l'extension et créez un nouveau PIN

### Secrets en clair dans Vault

- Les anciens secrets ne sont pas automatiquement re-chiffrés
- Ouvrez et sauvegardez chaque secret pour le chiffrer

## Références

- [ChaCha20-Poly1305 (RFC 8439)](https://datatracker.ietf.org/doc/html/rfc8439)
- [BLAKE3 Specification](https://github.com/BLAKE3-team/BLAKE3-specs)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [HashiCorp Vault](https://www.vaultproject.io/)

---

**Version :** 1.1  
**Dernière mise à jour :** Novembre 2024

