# 🔐 Guide de Backup du Mot de passe Master Key

## Pourquoi Sauvegarder le Mot de passe Master Key ?

Le **mot de passe Master Key** est utilisé pour dériver la clé qui permet de déchiffrer tous vos secrets. Si vous l'oubliez (par exemple en réinitialisant l'extension ou en changeant d'ordinateur), **tous vos secrets deviendront inaccessibles définitivement**.

**Note importante** : Grâce au système de sel déterministe, vous pouvez récupérer vos secrets après réinstallation en utilisant le même mot de passe Master Key et le même `kvMount` (entity_name). Cependant, il est **fortement recommandé** d'exporter le mot de passe pour plus de sécurité.

### Situations où vous aurez besoin du backup :

✅ **Migration vers un nouvel ordinateur**  
✅ **Réinstallation de Chrome ou de l'extension**  
✅ **Synchronisation entre plusieurs ordinateurs**  
✅ **Récupération après une perte de données**  
✅ **Partage de secrets avec une équipe** (avec précautions)

---

## 📥 Export du Mot de passe Master Key

### Étapes

1. **Ouvrez la page de configuration**
   - Faites un clic droit sur l'icône de l'extension → "Options"
   - Ou allez dans `chrome://extensions/` → Vault Password Manager → "Options"

2. **Allez dans la section "Gestion du Mot de passe Master Key"**
   - Faites défiler vers le bas

3. **Cliquez sur "📥 Exporter le mot de passe"**
   - Un modal s'ouvre pour demander votre mot de passe Master Key

4. **Entrez votre mot de passe Master Key**
   - C'est le mot de passe que vous avez créé lors de la configuration initiale
   - Minimum 12 caractères

5. **Entrez votre PIN à 4 chiffres**
   - Pour vérifier votre identité

6. **Le fichier est téléchargé**
   - Nom du fichier : `vault-master-password-{timestamp}.txt`
   - Format : JSON avec métadonnées

### Format du Fichier Exporté

```json
{
  "version": "2.0",
  "type": "vault-password-manager-master-password",
  "exportDate": "2024-12-21T10:30:00.000Z",
  "masterPassword": "votre-mot-de-passe-en-clair",
  "warning": "HAUTEMENT CONFIDENTIEL - Ne partagez jamais ce fichier"
}
```

⚠️ **ATTENTION** : Le fichier contient votre mot de passe Master Key **en clair**. Protégez-le absolument !

---

## 📤 Import du Mot de passe Master Key

### Étapes

1. **Ouvrez la page de configuration**

2. **Allez dans la section "Gestion du Mot de passe Master Key"**

3. **Cliquez sur "📤 Importer le mot de passe"**
   - Un sélecteur de fichier s'ouvre

4. **Sélectionnez votre fichier de backup**
   - Format : `.txt` ou `.key`
   - Doit être au format JSON valide

5. **Confirmez l'import**
   - ⚠️ Un message d'avertissement explique les conséquences
   - Lisez attentivement avant de confirmer

6. **Entrez votre PIN**
   - La Master Key dérivée sera chiffrée avec ce PIN

7. **Import terminé !**
   - ✅ La Master Key sera dérivée depuis le mot de passe importé
   - ✅ Vous pouvez maintenant déchiffrer vos secrets

### ⚠️ Avertissements lors de l'Import

L'import d'un mot de passe Master Key va :

- ✅ **Remplacer** votre mot de passe Master Key actuel (si il existe)
- ✅ **Dériver une nouvelle Master Key** depuis ce mot de passe
- ✅ Vous permettre de **déchiffrer les secrets** créés avec ce mot de passe
- ❌ Rendre **inaccessibles** les secrets créés avec l'ancien mot de passe

**Assurez-vous d'importer le bon mot de passe Master Key !**

---

## 🔒 Sécurité du Fichier de Backup

### Niveau de Sensibilité : 🔴 CRITIQUE

Le fichier de backup contient votre mot de passe Master Key **en clair** (non chiffré). Toute personne qui possède ce fichier peut :

- 🔓 Déchiffrer tous vos secrets stockés dans Vault (si elle a aussi accès à votre compte Vault)
- 🔓 Créer de nouveaux secrets chiffrés avec votre Master Key
- 🔓 Usurper votre identité dans le système de chiffrement

**Note** : Pour déchiffrer vos secrets, il faut également :
- Le mot de passe Master Key (dans le fichier)
- Le PIN (4 chiffres)
- L'accès au compte Vault (token)

### Bonnes Pratiques

#### ✅ À FAIRE

1. **Stocker dans un gestionnaire de mots de passe**
   - KeePass, 1Password, Bitwarden, etc.
   - Meilleure option : chiffrement fort + sync cloud sécurisé

2. **Chiffrer avec GPG/PGP**
   ```bash
   gpg -c vault-master-key-12345.txt
   # Crée vault-master-key-12345.txt.gpg
   ```

3. **Stocker sur une clé USB chiffrée**
   - BitLocker (Windows), FileVault (Mac), LUKS (Linux)
   - Garder la clé USB dans un coffre-fort physique

4. **Imprimer et stocker physiquement**
   - Dans un coffre-fort
   - Dans un endroit sûr chez vous
   - ⚠️ Assurez-vous que personne ne peut le photographier

5. **Utiliser un coffre-fort cloud chiffré**
   - Cryptomator
   - Tresorit
   - ProtonDrive

#### ❌ À NE JAMAIS FAIRE

1. ❌ **Envoyer par email** (même chiffré)
2. ❌ **Stocker sur Google Drive / Dropbox** sans chiffrement supplémentaire
3. ❌ **Laisser dans le dossier Téléchargements**
4. ❌ **Partager sur Slack / Teams / Discord**
5. ❌ **Copier/coller dans une note non chiffrée**
6. ❌ **Enregistrer dans un dépôt Git** (même privé)
7. ❌ **Stocker sur un téléphone non chiffré**

---

## 🔄 Cas d'Usage

### Cas 1 : Migration vers un Nouvel Ordinateur

**Sur l'ancien ordinateur :**
1. Exportez votre Master Key
2. Stockez-la de manière sécurisée (clé USB chiffrée, gestionnaire de mots de passe)

**Sur le nouveau ordinateur :**
1. Installez l'extension Vault Password Manager
2. Configurez avec le même token Vault (même `kvMount`/entity_name)
3. **Option A - Avec backup** :
   - Allez dans Options → Gestion du Mot de passe Master Key
   - Importez votre mot de passe Master Key
   - Entrez un PIN (peut être le même qu'avant ou un nouveau)
4. **Option B - Sans backup** :
   - Utilisez le même mot de passe Master Key lors de la configuration
   - Utilisez le même PIN
   - La même Master Key sera générée grâce au sel déterministe
5. ✅ Tous vos secrets sont accessibles !

### Cas 2 : Synchronisation entre Plusieurs Ordinateurs

Si vous voulez utiliser l'extension sur plusieurs ordinateurs avec les **mêmes secrets** :

**Méthode 1 - Avec backup** :
1. **Ordinateur 1** : Configurez l'extension normalement
2. **Ordinateur 1** : Exportez le mot de passe Master Key
3. **Ordinateur 2** : Installez l'extension
4. **Ordinateur 2** : Configurez avec le même token Vault
5. **Ordinateur 2** : Importez le mot de passe Master Key
6. ✅ Les deux ordinateurs utilisent la même Master Key

**Méthode 2 - Sans backup** :
1. **Ordinateur 1** : Configurez avec mot de passe Master Key + PIN
2. **Ordinateur 2** : Installez l'extension
3. **Ordinateur 2** : Configurez avec le même token Vault
4. **Ordinateur 2** : Utilisez le même mot de passe Master Key + PIN
5. ✅ La même Master Key sera générée automatiquement (sel déterministe)

**⚠️ Important :** Utilisez le même token Vault (même `kvMount`/entity_name) sur les deux ordinateurs.

### Cas 3 : Partage avec une Équipe

Si vous voulez partager des secrets avec une équipe (avec **précautions extrêmes**) :

1. Créez un compte Vault dédié à l'équipe
2. Configurez avec un mot de passe Master Key partagé
3. Exportez le mot de passe Master Key
4. Partagez-le de manière **ultra-sécurisée** :
   - En personne
   - Via un canal chiffré de bout en bout (Signal)
   - Via un gestionnaire de mots de passe d'équipe

⚠️ **Attention** : Toute personne ayant le mot de passe Master Key peut déchiffrer **tous** les secrets. Ne partagez qu'avec des personnes de confiance.

### Cas 4 : Récupération après Perte du PIN

**Situation** : Vous avez oublié votre PIN mais vous avez un backup du mot de passe Master Key.

**Solution** :
1. Allez dans Options → "Réinitialiser"
2. Supprimez toute la configuration
3. Reconfigurez avec le même token Vault
4. Importez votre mot de passe Master Key
5. Créez un **nouveau PIN**
6. ✅ Vous retrouvez l'accès à vos secrets !

**⚠️ Sans backup du mot de passe Master Key** : Si vous perdez le PIN ET que vous n'avez pas de backup, vous pouvez toujours récupérer en utilisant le même mot de passe Master Key + token Vault (grâce au sel déterministe).

---

## 🧪 Test de Votre Backup

### Procédure de Test (Recommandé)

Pour vous assurer que votre backup fonctionne :

1. **Créez un secret de test**
   - Catégorie : "Test-Backup"
   - Clé : "test"
   - Valeur : "valeur-secrete-123"

2. **Exportez votre Master Key**

3. **Réinitialisez l'extension**
   - Options → Réinitialiser

4. **Importez votre Master Key**

5. **Vérifiez que le secret de test est accessible**
   - Sélectionnez la catégorie "Test-Backup"
   - Le secret devrait être déchiffré correctement

✅ Si ça fonctionne, votre backup est valide !

---

## 📊 Checklist de Sécurité

Avant de considérer votre backup comme sûr, vérifiez :

- [ ] Le fichier est stocké dans au moins **2 endroits différents**
- [ ] Au moins **1 emplacement est hors ligne** (clé USB, papier)
- [ ] Le fichier est **chiffré** ou dans un gestionnaire de mots de passe
- [ ] Vous avez **testé** l'import sur un autre navigateur/ordinateur
- [ ] Personne d'autre n'a **accès** au fichier
- [ ] Le fichier n'est **pas dans votre dossier Téléchargements**
- [ ] Vous savez **où se trouve** le backup en cas d'urgence

---

## 🆘 FAQ

### Q : Puis-je avoir plusieurs backups ?

✅ Oui ! C'est même **recommandé**. Exportez la Master Key plusieurs fois et stockez-la à différents endroits.

### Q : Dois-je re-exporter après chaque modification ?

❌ Non ! Le mot de passe Master Key **ne change jamais** (sauf si vous le changez volontairement). Un seul export suffit.

### Q : Puis-je changer le PIN sans exporter la Master Key ?

✅ Oui, mais c'est risqué. Si vous changez le PIN et que vous l'oubliez, vous perdrez l'accès à vos secrets. **Exportez toujours avant de changer le PIN**.

### Q : Que se passe-t-il si quelqu'un trouve mon backup ?

🔴 **Danger critique** : Cette personne peut déchiffrer tous vos secrets. Changez immédiatement tous vos mots de passe et générez une nouvelle Master Key.

### Q : Puis-je utiliser plusieurs Master Keys ?

⚠️ Techniquement oui, mais **très risqué**. Les secrets créés avec la Master Key A ne pourront pas être déchiffrés avec la Master Key B. Utilisez une seule Master Key par instance de l'extension.

### Q : Comment changer le mot de passe Master Key ?

Options → Gestion du Mot de passe Master Key → Utilisez la fonction de changement de mot de passe (à venir) ou réinitialisez complètement l'extension.

⚠️ **Attention** : Si vous changez le mot de passe Master Key, les anciens secrets créés avec l'ancien mot de passe ne pourront plus être déchiffrés !

---

## 📞 En Cas de Problème

### Erreur : "Format de fichier invalide"

- Vérifiez que le fichier est bien au format JSON
- Ouvrez-le avec un éditeur de texte pour vérifier le contenu
- Assurez-vous qu'il n'a pas été corrompu

### Erreur : "Le mot de passe doit contenir au moins 12 caractères"

- Le mot de passe Master Key doit contenir au moins 12 caractères
- Vérifiez que le fichier contient bien le mot de passe complet

### Les secrets ne se déchiffrent pas après l'import

- ✅ Vérifiez que c'est bien le bon mot de passe Master Key
- ✅ Vérifiez que vous utilisez le même `kvMount` (entity_name)
- ✅ Vérifiez que les secrets ont été créés avec ce mot de passe Master Key
- ✅ Regardez la console Chrome (F12) pour voir les erreurs de déchiffrement

---

**Temps estimé pour un backup complet : ~2 minutes**  
**Fréquence recommandée : Immédiatement après configuration, puis après chaque changement majeur**  
**Niveau de sécurité du backup : Dépend de vous ! 🔒**

Sauvegardez maintenant, vous nous remercierez plus tard ! 🚀

