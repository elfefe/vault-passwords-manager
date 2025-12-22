# 📘 Documentation Complète - Vault Password Manager

## 1. Vue d'ensemble et Fonctionnalités

**Vault Password Manager** est une extension Chrome (Manifest V3) conçue pour gérer les mots de passe dans HashiCorp Vault (KV v2) avec un niveau de sécurité élevé grâce au chiffrement de bout en bout.

### Fonctionnalités Principales
* **Chiffrement de bout en bout (E2EE) :** Les secrets sont chiffrés localement (client-side) avant d'être envoyés au serveur Vault. Le serveur ne voit jamais vos données en clair.
* **Sécurité Cryptographique :** Utilisation des algorithmes **ChaCha20-Poly1305** pour le chiffrement et **BLAKE3** pour la dérivation de clés.
* **Gestion KV v2 :** Lister, lire, créer, mettre à jour et supprimer des secrets.
* **Authentification Flexible :** Supporte l'authentification via Token manuel ou Google OIDC.
* **Renouvellement Automatique des Tokens :** Les tokens Vault renouvelables sont automatiquement prolongés jusqu'à leur durée maximale (Max Lease TTL) lors de chaque connexion, évitant les ré-authentifications fréquentes.
* **Sauvegarde Automatique des Formulaires :** Détecte automatiquement les formulaires remplis sur n'importe quelle page web et propose de sauvegarder les informations (nom d'utilisateur, email, mot de passe) dans Vault. Compare avec les données existantes pour éviter les doublons.
* **Interface Moderne :** Une UI vibrante avec des animations fluides, inspirée de Magic Patterns.
* **Synchronisation et Backup :** Synchronisation automatique de la Master Key via Chrome ou backup manuel via fichier.

---

## 2. Installation et Configuration Rapide

### Installation
1.  **Générer les icônes (Optionnel) :** Via `icons/generate-icons.html`.
2.  **Charger l'extension :**
    * Ouvrez `chrome://extensions/` et activez le **Mode développeur**.
    * Cliquez sur **Charger l'extension non empaquetée** et sélectionnez le dossier de l'extension.

### Première Configuration
Lors de la première ouverture, vous devez connecter l'extension à votre instance Vault :
1.  **Connexion :**
    * *Option A (Recommandé)* : Cliquez sur "Se connecter avec Google" (OIDC).
    * *Option B* : Entrez manuellement votre token Vault.
2.  **Sécurisation (Création du PIN) :**
    * Définissez un code PIN à 4 chiffres.
    * Ce PIN servira à chiffrer votre **Master Key** et votre Token Vault localement.
    * Le système dérive alors automatiquement une Master Key cryptographiquement sécurisée (256 bits) depuis votre mot de passe utilisateur (authentification manuelle) ou depuis votre identifiant utilisateur (authentification OAuth) en utilisant PBKDF2.

---

## 3. Architecture de Sécurité et Chiffrement

Le cœur de l'extension repose sur une architecture de chiffrement en couches pour garantir que même en cas de compromission du serveur Vault, vos secrets restent illisibles.


### 3.1. La Master Key
* **Génération :** Clé de 256 bits (32 bytes) **dérivée depuis un mot de passe utilisateur** (minimum 12 caractères) ou depuis l'identifiant utilisateur (userId/entity_name) en utilisant **PBKDF2** avec 100 000 itérations et SHA-256. La génération aléatoire (`crypto.getRandomValues`) est obsolète et n'est plus utilisée.
* **Sel déterministe :** Un sel est généré de manière déterministe à partir du `kvMount` (entity_name) de l'utilisateur, garantissant que le même mot de passe + le même `kvMount` produisent toujours la même Master Key. Cela permet la récupération des données après réinstallation de l'extension.
* **Modes d'authentification :**
  * **Authentification OAuth (Google) :** La Master Key est dérivée directement depuis le `userId` (entity_name).
  * **Authentification manuelle (Token) :** La Master Key est dérivée depuis un mot de passe utilisateur (minimum 12 caractères).
* **Stockage :** Elle est stockée dans `chrome.storage.local` (ou sync), chiffrée par votre PIN via AES-GCM. Le sel est également stocké (pour référence, mais peut être régénéré de manière déterministe). Elle n'est jamais stockée en clair.

### 3.2. Système de Dérivation (BLAKE3/HKDF)
Pour éviter la corrélation entre les secrets, une clé unique est dérivée pour chaque secret individuel :
* **Contexte :** `vault-secret-{catégorie}-{nom-du-secret}-{clé-du-champ}` (ex: `vault-secret-passwords-api_key-password`).
* **Algorithme :** BLAKE3 est utilisé pour dériver une sous-clé à partir de la Master Key et du contexte unique du secret. L'implémentation utilise **HKDF-SHA256** comme fallback compatible navigateur pour garantir la compatibilité avec l'API Web Crypto standard.

### 3.3. Chiffrement Authentifié (ChaCha20-Poly1305)
* Chaque valeur est chiffrée avec **ChaCha20-Poly1305**.
* Ce protocole assure la confidentialité et l'intégrité (détection de modification via un Tag d'authentification).
* Format de stockage dans Vault : `{"iv": "...", "ciphertext": "...", "tag": "..."}`.

### 3.4. Sécurité du PIN
L'interface de saisie du PIN a été renforcée pour protéger contre le "shoulder surfing" (regards indiscrets) :
* **Masquage :** Le champ est de type `password`, affichant des points (••••) au lieu des chiffres.
* **Validation :** Validation stricte n'acceptant que les chiffres 0-9.
* **Vérification :** Un bouton "œil" est disponible uniquement lors de la *création* du PIN pour vérifier la saisie. Il est absent lors de l'authentification quotidienne pour maximiser la sécurité.

---

## 4. Utilisation Quotidienne

### Gestion des Secrets
* **Lister :** Sélectionnez une catégorie pour charger automatiquement les secrets.
* **Lire :** Les secrets sont déchiffrés à la volée. Si un secret est détecté comme chiffré (format JSON spécifique), il est déchiffré ; sinon, il est affiché tel quel (compatibilité rétroactive).
* **Sauvegarder :** Tout nouveau secret ou modification est automatiquement chiffré avant l'envoi.
* **Générateur :** Un bouton permet de générer des mots de passe forts de 16 caractères.

### Renouvellement Automatique des Tokens
L'extension gère automatiquement le renouvellement des tokens Vault pour éviter les ré-authentifications fréquentes :

* **Fonctionnement :** Lors de chaque connexion avec le PIN, l'extension vérifie si le token est renouvelable et proche de l'expiration (moins de 24 heures restantes ou TTL initial de 1 heure).
* **Renouvellement :** Si les conditions sont remplies, le token est automatiquement renouvelé jusqu'à sa durée maximale (Max Lease TTL, généralement 99 jours pour OIDC).
* **Transparence :** Le processus est automatique et transparent. Les détails sont disponibles dans la console du navigateur (F12).
* **Avantage :** Avec un Max Lease TTL de 99 jours, vous n'aurez besoin de vous ré-authentifier qu'une fois tous les 99 jours au lieu de toutes les heures.

### Sauvegarde Automatique des Formulaires
L'extension détecte automatiquement les formulaires remplis sur toutes les pages web et propose de sauvegarder les informations :

* **Détection Automatique :** Lorsqu'un formulaire est soumis, l'extension détecte automatiquement les champs remplis (nom d'utilisateur, email, mot de passe, etc.).
* **Proposition de Sauvegarde :** Une notification élégante apparaît en haut à droite de la page pour proposer la sauvegarde.
* **Comparaison Intelligente :** L'extension compare les données avec celles déjà enregistrées dans Vault pour éviter les doublons. Si les informations sont identiques, aucune sauvegarde n'est proposée.
* **Organisation Automatique :** Les secrets sont automatiquement organisés par domaine dans des catégories dédiées.
* **Chiffrement :** Toutes les données sont chiffrées avant d'être sauvegardées dans Vault, garantissant la sécurité même si le serveur est compromis.
* **Workflow :** Après avoir cliqué sur "Sauvegarder", ouvrez l'extension et authentifiez-vous avec votre PIN. Les données seront automatiquement sauvegardées dans la catégorie correspondant au domaine du site.

### Interface Utilisateur (Design)
L'interface a été modernisée (v1.1.2) pour offrir une meilleure expérience :
* **Visuel :** Palette de couleurs vibrante (Violet `#290873`, Rose `#F72585`) et gradients.
* **Interactions :** Animations fluides (fade in, slide up), retours visuels via des "Toast notifications" et effets de survol sur les boutons.
* **Tableau :** Actions rapides (Copier 📋, Afficher/Masquer 👁️, Supprimer 🗑️) accessibles directement sur chaque ligne.

---

## 5. Sauvegarde et Synchronisation

La Master Key est essentielle. Si vous la perdez (ou oubliez le PIN), vos données sont **irrécupérables**. Deux méthodes existent pour sécuriser cette clé.


### 5.1. Synchronisation Chrome (Recommandé)
Cette méthode permet d'avoir vos secrets sur tous vos appareils automatiquement.
* **Fonctionnement :** La Master Key (toujours chiffrée par votre PIN) est stockée dans `chrome.storage.sync`.
* **Sécurité :** Les données sont chiffrées par Google (TLS) lors du transit et du stockage cloud, en plus de votre chiffrement PIN.
* **Activation :**
    1.  Allez dans **Options** → **Synchronisation Chrome**.
    2.  Cochez **"Activer la synchronisation Chrome"**.
    3.  Entrez votre PIN.
* **Récupération :** Sur un nouvel ordinateur, installez l'extension et connectez-vous au même compte Google. La Master Key sera détectée automatiquement depuis `chrome.storage.sync`. **Note :** Grâce au système de dérivation déterministe (sel basé sur le `kvMount`), même si la synchronisation échoue, vous pouvez récupérer vos données en utilisant le même mot de passe et le même `kvMount` lors de la réinitialisation.

### 5.2. Backup Manuel (Export Fichier)
Méthode pour le stockage hors ligne ("Cold Storage").
* **Export :**
    1.  Allez dans **Options** → **Gestion de la Master Key**.
    2.  Cliquez sur **"📥 Télécharger Master Key"** et entrez votre PIN.
    3.  Vous obtenez un fichier JSON contenant la clé en **clair** (Hexadécimal).
* **Import :** Permet de restaurer l'accès en cas de réinitialisation. Le système demandera votre PIN pour re-chiffrer la clé importée.
* **⚠️ Avertissement Critique :** Le fichier exporté contient la clé sans protection. Il doit être stocké dans un gestionnaire de mots de passe ou sur une clé USB chiffrée. Ne jamais l'envoyer par email.

---

## 6. Informations Techniques

### Structure des Fichiers
* `popup.js` / `popup.html` : Interface principale et logique API Vault.
* `crypto-system.js` : Chef d'orchestre du chiffrement (Génération Master Key, appels Crypto).
* `lib/chacha20-poly1305.js` & `lib/blake3.js` : Implémentations cryptographiques pures.

### API Vault Utilisée
L'extension interagit avec l'API KV v2 standard :
* Lecture : `GET /v1/<mount>/data/<path>`
* Écriture : `POST /v1/<mount>/data/<path>`
* Liste : `GET /v1/<mount>/metadata/<path>?list=true`
* Suppression : `DELETE /v1/<mount>/metadata/<path>`.

### Modèle de Menace
* **Protégé contre :** Compromission du serveur Vault, interception réseau (TLS + Chiffrement), accès non autorisé au stockage local (si PIN fort).
* **Non protégé contre :** Malware sur la machine utilisateur (Keylogger), perte du PIN.

---

## 7. Dépannage et Résolution de Problèmes

Cette section regroupe les solutions aux erreurs courantes rencontrées lors de l'utilisation de l'extension, de la synchronisation ou de la gestion des clés.

### 7.1. Problèmes d'Authentification

* **Erreur "Code incorrect" :**
    * Assurez-vous d'entrer le bon PIN à 4 chiffres défini lors de la configuration.
    * Si le PIN est oublié et qu'aucun backup de la Master Key n'existe, les secrets sont perdus. Vous devez réinitialiser l'extension (Options → Réinitialiser).
* **Erreur "Master key not initialized" :**
    * Cela indique que la Master Key n'a pas été créée lors de la première configuration ou a été perdue.
    * **Solution :** Réinitialisez l'extension et créez un nouveau PIN.
* **Erreur "Token invalide" :**
    * Votre token Vault a expiré ou a été révoqué. Reconnectez-vous via Google ou entrez un nouveau token dans les Options.
* **Ré-authentification fréquente (toutes les heures) :**
    * Si votre méthode d'authentification OIDC a un Default Lease TTL de 1 heure mais un Max Lease TTL de 99 jours, l'extension renouvelle automatiquement le token lors de chaque connexion pour atteindre le Max TTL.
    * Le renouvellement se fait automatiquement après l'authentification avec le PIN si le token est renouvelable et proche de l'expiration (moins de 24 heures restantes ou TTL initial de 1 heure).
    * Vérifiez dans la console (F12) les logs de renouvellement pour confirmer que le processus fonctionne correctement.

### 7.2. Problèmes de Chiffrement/Déchiffrement

* **Le déchiffrement échoue :**
    * Vérifiez que le PIN est correct et que la Master Key existe via `hasMasterKey()` dans la console.
    * Assurez-vous que le contexte de dérivation (catégorie/nom du secret) n'a pas changé entre le chiffrement et le déchiffrement.
* **Les secrets s'affichent en JSON (ex: `{"iv":...}`) :**
    * Cela signifie que le secret est chiffré dans Vault mais que l'extension n'a pas réussi à le déchiffrer automatiquement.
    * Vérifiez que vous utilisez la bonne Master Key (celle utilisée pour créer le secret).

### 7.3. Problèmes de Synchronisation Chrome

* **"La synchronisation a échoué" :**
    * Vérifiez votre connexion Internet et assurez-vous que la synchronisation est activée dans les paramètres globaux de votre navigateur Chrome.
    * Essayez de désactiver puis réactiver la synchronisation dans l'extension.
* **"Master Key introuvable sur le nouvel appareil" :**
    * Vérifiez que vous êtes connecté au **même compte Google** sur les deux appareils.
    * Patientez quelques minutes, la propagation via Google peut prendre du temps (1-2 minutes).
    * **Alternative :** Grâce au système de dérivation déterministe, si la synchronisation échoue, vous pouvez récupérer vos données en réinitialisant l'extension et en utilisant le même mot de passe (ou userId pour OAuth) et le même `kvMount` que sur l'appareil d'origine.
* **"Conflit de Master Key" :**
    * Avec le système de dérivation déterministe, si vous utilisez le même mot de passe (ou userId pour OAuth) et le même `kvMount` sur les deux appareils, la Master Key sera identique. Si un conflit survient malgré tout, choisissez l'appareil qui possède la clé valide (celle qui déchiffre vos secrets actuels), forcez une synchronisation (désactiver/réactiver), puis réinitialisez l'autre appareil pour qu'il récupère la bonne clé du cloud.

---

## 8. FAQ (Foire Aux Questions)

### Sécurité
* **Q : Google peut-il voir ma Master Key ?**
    * **R :** Non. La clé est chiffrée deux fois : une première fois par votre PIN (via l'extension) avant de quitter votre ordinateur, et une seconde fois par Google (chiffrement TLS et stockage).
* **Q : Que se passe-t-il si je perds mon PIN ?**
    * **R :** Sans PIN, la Master Key est indéchiffrable. Si vous n'avez pas exporté votre Master Key en clair (backup manuel), vos secrets sont perdus définitivement.
* **Q : Puis-je utiliser des PINs différents sur chaque appareil ?**
    * **R :** Techniquement oui, car le PIN ne quitte jamais l'appareil (il n'est pas synchronisé). Cependant, c'est déconseillé pour éviter la confusion.

### Gestion des Données
* **Q : Dois-je réexporter ma Master Key après avoir ajouté un secret ?**
    * **R :** Non. La Master Key ne change jamais (sauf régénération volontaire). Un seul export suffit pour tous vos futurs secrets.
* **Q : Comment changer mon PIN ?**
    * **R :** Utilisez la fonction `changePinAndReencryptMasterKey(oldPin, newPin)`. Attention, exportez toujours votre clé avant de changer le PIN par sécurité.

---

## 9. Migration et Compatibilité

L'extension gère automatiquement la transition entre les anciens secrets non chiffrés et le nouveau système sécurisé.

### 9.1. Compatibilité Rétroactive
* Les secrets existants stockés en clair (plain text) dans Vault restent **accessibles en lecture**.
* Le système détecte automatiquement le format : si la valeur est un JSON contenant `iv`, `ciphertext` et `tag`, il tente de déchiffrer. Sinon, il affiche le texte brut.

### 9.2. Processus de Migration Automatique
Il n'y a pas de bouton "Tout migrer". La migration se fait naturellement à l'usage :
1.  Ouvrez un secret existant (en clair).
2.  Cliquez sur **"Sauvegarder"**.
3.  L'extension chiffre automatiquement les données avant de les renvoyer à Vault.
4.  Le secret est maintenant sécurisé.

---

## 10. Limites Connues

* **Plateforme :** L'extension (et la synchronisation) fonctionne uniquement sur les versions Desktop de Chrome (Windows, Mac, Linux, ChromeOS). Chrome sur mobile ne supporte pas les extensions.
* **Taille du PIN :** Le PIN est limité à 4 chiffres, offrant 10 000 combinaisons. Cela est jugé acceptable pour une protection locale complémentaire au login de session de l'ordinateur.
* **Rotation de Clé :** Il n'y a pas de système de rotation automatique de la Master Key pour le moment.
* **Limites de Stockage Sync :** Le quota est de 100 KB. La Master Key ne pèse que ~1 KB, le risque de saturation est donc négligeable.

---

## 11. Tests et Validation

L'extension inclut plusieurs outils et fichiers de démonstration pour valider le fonctionnement du chiffrement et la nouvelle interface utilisateur.

### 11.1. Tester la Sécurité Cryptographique
Pour vérifier que le système de chiffrement fonctionne correctement (sans envoyer de données à Vault) :
* **Fichier de test :** Ouvrez le fichier `test-crypto-system.html` dans Chrome.
* **Métriques vérifiées :** Ce fichier teste la génération de la Master Key, la dérivation des sous-clés, le chiffrement/déchiffrement et l'intégrité des données.
* **Console Chrome :** Lors de l'utilisation normale de l'extension, ouvrez les outils de développement (F12) onglet "Console". Vous devriez voir des logs tels que `Secret {nom} chiffré avec succès` ou `Secret {nom} déchiffré avec succès`.

### 11.2. Tester l'Interface Utilisateur (UI)
Pour visualiser le design sans avoir besoin d'une connexion Vault active :
* **Démo Design :** Ouvrez le fichier `demo-new-design.html` dans votre navigateur. Il permet de tester les interactions (boutons, notifications toast, animations).
* **Démo PIN :** Ouvrez `demo-pin-security.html` pour tester spécifiquement le masquage du PIN et le comportement du bouton "œil" lors de la création.
* **Comparaison :** Le fichier `comparaison-design.html` permet de visualiser les différences avant/après la mise à jour graphique.

---

## 12. Ressources et Guides Complémentaires

Cette documentation unifiée résume l'essentiel. Pour des détails techniques approfondis ou des procédures spécifiques, référez-vous aux fichiers markdown inclus dans le projet :

| Sujet | Fichier de référence | Description |
| :--- | :--- | :--- |
| **Démarrage** | `doc/GUIDE-DEMARRAGE-RAPIDE.md` | Guide pas-à-pas pour l'installation et le premier secret. |
| **Synchronisation** | `doc/UIDE-SYNC-CHROME.md` | Détails complets sur la synchronisation cloud et ses mécanismes de sécurité. |
| **Backup Manuel** | `doc/GUIDE-BACKUP-MASTERKEY.md` | Procédure critique pour l'export et l'import de la Master Key. |
| **Cryptographie** | `doc/CRYPTO-SYSTEM.md` | Spécifications techniques du chiffrement (ChaCha20, BLAKE3, HKDF). |
| **Design** | `doc/DESIGN-CHANGES.md` | Détails sur la refonte UI, palette de couleurs et CSS. |
| **Sécurité PIN** | `doc/PIN-SECURITY-UPDATE.md` | Explication des mesures anti-shoulder surfing et validation. |

---

## 13. Support et Contact

Si vous rencontrez des difficultés persistantes :

1.  **Vérifiez les logs :** Ouvrez la console Chrome (F12) pour identifier les erreurs spécifiques (réseau, chiffrement, etc.).
2.  **Consultez la section Dépannage :** Voir section 7 de cette documentation.
3.  **Réinitialisation :** En dernier recours, utilisez l'option de réinitialisation dans les paramètres, après avoir assuré un backup de votre Master Key si possible.

**Note de sécurité finale :** Ne partagez jamais votre fichier de Master Key exporté ni votre PIN sur des canaux non sécurisés.