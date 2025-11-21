# ☁️ Guide de Synchronisation Chrome Automatique

## Vue d'Ensemble

La **Synchronisation Chrome** permet de synchroniser automatiquement votre Master Key entre tous vos appareils Chrome connectés au même compte Google. C'est la solution la plus simple et la plus transparente pour accéder à vos secrets depuis n'importe quel ordinateur.

## ✨ Avantages

### Par rapport au backup manuel (fichier .txt)

| Caractéristique | Sync Chrome ☁️ | Backup Manuel 📁 |
|-----------------|----------------|------------------|
| **Automatique** | ✅ Instantané | ❌ Manuel |
| **Multi-appareils** | ✅ Tous les Chrome | ❌ Un seul |
| **Mise à jour** | ✅ Temps réel | ❌ Manuelle |
| **Facilité** | ✅ 1 clic | ⚠️ Export/Import |
| **Sécurité** | ✅ Chiffré (PIN) | ✅ Chiffré (PIN) |
| **Backup physique** | ❌ Cloud seul | ✅ Fichier local |

### Idéal pour

- ✅ **Utilisateurs multi-appareils** : PC bureau + PC portable + etc.
- ✅ **Synchronisation transparente** : Aucune configuration à refaire
- ✅ **Récupération facile** : Nouveau PC ? Installez Chrome et l'extension
- ✅ **Mise à jour automatique** : Changement de Master Key ? Sync automatique

### Moins adapté pour

- ⚠️ **Usage unique** : Un seul ordinateur (backup manuel suffit)
- ⚠️ **Partage d'équipe** : Plusieurs personnes (backup manuel + partage sécurisé)
- ⚠️ **Méfiance du cloud** : Si vous ne voulez aucune donnée dans le cloud (même chiffrée)

---

## 🚀 Activation de la Synchronisation

### Prérequis

1. **Compte Google** : Vous devez être connecté à Chrome avec votre compte Google
2. **Sync Chrome activée** : Dans Chrome, Paramètres → Vous → Activer la synchronisation
3. **Master Key existante** : L'extension doit déjà être configurée avec une Master Key

### Étapes

1. **Ouvrez les Options de l'extension**
   - Clic droit sur l'icône → Options
   - Ou `chrome://extensions/` → Vault Password Manager → Options

2. **Allez dans la section "☁️ Synchronisation Chrome Automatique"**

3. **Cochez la case "Activer la synchronisation Chrome"**

4. **Entrez votre PIN** quand demandé

5. **✅ Terminé !**
   - Message de confirmation : "Synchronisation activée avec succès !"
   - Statut affiché : "✅ Synchronisation active - Dernière sync: [date/heure]"

---

## 🔄 Utilisation sur Plusieurs Appareils

### Scénario 1 : Configuration Initiale sur PC1

**Sur votre PC principal :**

1. Installez l'extension
2. Configurez-la normalement (token Vault + PIN)
3. Activez la synchronisation Chrome (comme ci-dessus)
4. ✅ Votre Master Key est maintenant dans le cloud !

**Sur votre PC2, PC3, etc. :**

1. Installez l'extension
2. **NE CRÉEZ PAS** de nouvelle Master Key
3. Ouvrez l'extension → Un modal apparaît "Master Key trouvée dans le cloud"
4. Entrez votre PIN (le même que sur PC1)
5. ✅ Tous vos secrets sont accessibles !

### Scénario 2 : Nouveau PC (Récupération)

**Situation** : Vous achetez un nouveau PC et voulez récupérer vos secrets.

1. **Installez Chrome** sur le nouveau PC
2. **Connectez-vous** avec votre compte Google
3. **Installez l'extension** Vault Password Manager
4. **Ouvrez l'extension** → Entrez votre PIN
5. ✅ La Master Key est automatiquement récupérée depuis la sync !

**Temps total** : ~2 minutes

### Scénario 3 : Changement de Master Key

**Situation** : Vous voulez changer votre Master Key (rotation de sécurité).

1. **Sur un appareil**, générez une nouvelle Master Key
2. **La synchronisation se fait automatiquement**
3. **Sur les autres appareils** :
   - Fermez et rouvrez l'extension
   - Entrez votre PIN
   - ✅ Nouvelle Master Key chargée automatiquement

---

## 🔒 Sécurité

### Ce qui est Synchronisé

✅ **Master Key chiffrée** : Stockée dans `chrome.storage.sync`  
✅ **Métadonnées** : Date de dernière synchronisation  
✅ **Flag d'activation** : Indique que la sync est active

### Ce qui N'est PAS Synchronisé

❌ **Votre PIN** : Reste local à chaque appareil  
❌ **Les secrets** : Restent dans Vault (pas dans Chrome)  
❌ **Le token Vault** : Reste local (chiffré par le PIN)

### Modèle de Sécurité

```
┌─────────────────────────────────────┐
│  Master Key (256 bits)              │
│  Chiffrée avec votre PIN            │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  chrome.storage.sync                │
│  Synchronisation Google Chrome      │
│  Chiffré par Google (TLS)           │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│  PC1, PC2, PC3, ...                 │
│  Déchiffré avec votre PIN local     │
└─────────────────────────────────────┘
```

### Niveau de Protection

#### Couche 1 : Chiffrement par PIN
- La Master Key est **toujours chiffrée** avec votre PIN
- Même si quelqu'un accède à `chrome.storage.sync`, il ne peut **pas** déchiffrer sans le PIN

#### Couche 2 : Chiffrement Google
- Les données dans `chrome.storage.sync` sont chiffrées par Google avec TLS
- Transmission sécurisée entre vos appareils

#### Couche 3 : Authentification Google
- Seuls **vos appareils** connectés au **même compte Google** peuvent accéder
- Authentification à 2 facteurs recommandée

### Risques et Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Accès non autorisé au compte Google | ⚠️ Faible | 🔴 Élevé | ✅ 2FA sur Google |
| Vol de session Chrome | ⚠️ Faible | 🟡 Moyen | ✅ PIN requis pour déchiffrer |
| Compromission de Google | 🟢 Très faible | 🟡 Moyen | ✅ Master Key chiffrée |
| Oubli du PIN | 🟡 Moyen | 🔴 Élevé | ✅ Backup manuel en plus |

---

## 🛠️ Gestion Avancée

### Désactiver la Synchronisation

**Pourquoi ?**
- Vous ne voulez plus synchroniser entre appareils
- Vous passez à un backup manuel uniquement
- Vous voulez supprimer la Master Key du cloud Google

**Comment ?**

1. Options → Synchronisation Chrome
2. **Décochez** "Activer la synchronisation Chrome"
3. Entrez votre PIN
4. Confirmation : "Synchronisation désactivée"

⚠️ **Note** : La Master Key reste disponible **en local** sur cet appareil.

### Vérifier le Statut de Synchronisation

Dans **Options → Synchronisation Chrome**, vous verrez :

- ✅ **Synchronisation active** : Tout fonctionne, dernière sync affichée
- ⚠️ **Master Key trouvée mais sync désactivée** : Réactivez la sync
- ⚪ **Synchronisation désactivée** : La Master Key est uniquement en local
- ❌ **Erreur** : Problème de connexion ou de permissions

### Forcer une Re-synchronisation

Si vous pensez que la sync ne fonctionne pas :

1. **Désactivez** la synchronisation
2. **Réactivez-la** immédiatement
3. Entrez votre PIN
4. ✅ Synchronisation forcée

### Synchronisation Manuelle vs Automatique

| Type | Quand l'utiliser |
|------|------------------|
| **Automatique (Sync Chrome)** | Usage quotidien multi-appareils |
| **Manuelle (Export/Import)** | Backup de sécurité, partage contrôlé |

💡 **Recommandation** : Utilisez **les deux** :
- Sync Chrome pour le quotidien
- Backup manuel 1 fois/mois pour sécurité ultime

---

## 🐛 Résolution de Problèmes

### ❌ "La synchronisation a échoué"

**Causes possibles** :
- Connexion Internet interrompue
- Synchronisation Chrome désactivée dans les paramètres
- Quota de stockage `chrome.storage.sync` dépassé

**Solution** :
1. Vérifiez votre connexion Internet
2. Chrome → Paramètres → Vous → Vérifiez que "Tout synchroniser" est activé
3. Désactivez puis réactivez la sync dans l'extension

### ❌ "Master Key introuvable sur le nouvel appareil"

**Causes possibles** :
- Vous n'êtes pas connecté au même compte Google
- La synchronisation Chrome n'est pas activée
- La sync de l'extension n'était pas activée sur l'appareil d'origine

**Solution** :
1. Vérifiez que vous êtes bien connecté au même compte Google Chrome
2. Activez la synchronisation Chrome dans les paramètres
3. Patientez 1-2 minutes pour que la sync se propage
4. Si ça ne fonctionne pas, utilisez le backup manuel (Import de fichier)

### ❌ "PIN incorrect sur le nouvel appareil"

**Cause** : Le PIN est **local à chaque appareil** et n'est **pas synchronisé**.

**Solution** : Vous devez utiliser le **même PIN** sur tous vos appareils, ou :
- Changez le PIN sur le nouvel appareil dans Options → Réinitialiser
- Re-chiffrez la Master Key avec le nouveau PIN

### ⚠️ "Conflit de Master Key"

**Situation** : Vous avez créé une Master Key différente sur 2 appareils.

**Symptôme** : Les secrets ne se déchiffrent pas correctement.

**Solution** :
1. Choisissez quel appareil a la "bonne" Master Key (celui avec tous vos secrets)
2. Sur cet appareil, désactivez puis réactivez la sync (forcer la sync)
3. Sur les autres appareils :
   - Réinitialisez l'extension
   - Laissez la Master Key se synchroniser depuis le cloud
   - Entrez le même PIN

---

## 📊 Limites Techniques

### Limites de chrome.storage.sync

- **Taille maximale par item** : 8 KB (largement suffisant pour la Master Key)
- **Nombre maximum d'items** : 512 (nous n'en utilisons que 3)
- **Quota total** : 100 KB (nous utilisons ~1 KB)
- **Quota de writes** : 1800/heure (nous en faisons ~1-2)

✅ **Conclusion** : Aucune limitation pratique pour notre usage.

### Délai de Synchronisation

- **Théorique** : Instantané à quelques secondes
- **Pratique** : 1-2 minutes en moyenne
- **Maximum observé** : 5-10 minutes (connexion lente)

💡 **Astuce** : Si vous êtes pressé, désactivez/réactivez la sync pour forcer.

---

## 🔄 Comparaison des Méthodes de Backup

### Matrice de Décision

| Critère | Sync Chrome ☁️ | Backup Manuel 📁 | Google Drive* |
|---------|----------------|------------------|---------------|
| **Facilité** | 🟢🟢🟢 | 🟡🟡 | 🟡 |
| **Automatique** | 🟢🟢🟢 | 🔴 | 🟢🟢 |
| **Multi-appareils** | 🟢🟢🟢 | 🟡 | 🟢🟢🟢 |
| **Contrôle** | 🟡🟡 | 🟢🟢🟢 | 🟡🟡 |
| **Sécurité** | 🟢🟢 | 🟢🟢🟢 | 🟢🟢 |
| **Backup physique** | 🔴 | 🟢🟢🟢 | 🔴 |
| **Partage équipe** | 🔴 | 🟢🟢🟢 | 🟢🟢 |

*Google Drive = fonctionnalité supprimée précédemment

### Recommandations par Profil

#### 👤 Utilisateur Solo Multi-Appareils
✅ **Sync Chrome** (principal) + Backup manuel (1x/mois)

#### 👥 Équipe
✅ **Backup manuel** + Partage sécurisé du fichier

#### 🏢 Entreprise
✅ **Backup manuel** + Stockage dans coffre-fort d'équipe (KeePass, 1Password Business)

#### 🔐 Ultra-Sécurisé
✅ **Backup manuel uniquement** + Clé USB chiffrée + Coffre physique

---

## ❓ FAQ

### Q : La Master Key est-elle chiffrée dans le cloud ?

✅ **Oui, doublement** :
1. Chiffrée avec votre PIN (par l'extension)
2. Chiffrée par Google (TLS + chiffrement au repos)

### Q : Google peut-il voir ma Master Key ?

❌ **Non**. Google voit uniquement des données chiffrées incompréhensibles sans votre PIN.

### Q : Que se passe-t-il si je perds mon PIN ?

🔴 **Problème** : Vous ne pouvez plus déchiffrer la Master Key.

✅ **Solution** : Utilisez votre backup manuel (fichier .txt) si vous en avez un.

### Q : Puis-je utiliser des PINs différents sur chaque appareil ?

⚠️ **Oui**, mais **déconseillé**. Cela complique la gestion et peut causer des erreurs.

### Q : La sync consomme-t-elle de la batterie/données ?

🟢 **Négligeable**. La Master Key fait ~1 KB et se synchronise rarement.

### Q : Puis-je sync sur Android/iOS ?

❌ **Non**. Chrome sur mobile ne supporte pas les extensions. Uniquement desktop (Windows, Mac, Linux, ChromeOS).

### Q : Combien d'appareils puis-je synchroniser ?

✅ **Illimité**. Tous vos appareils Chrome connectés au même compte Google.

---

## 🎯 Bonnes Pratiques

### ✅ À FAIRE

1. **Activez la 2FA** sur votre compte Google
2. **Utilisez le même PIN** sur tous vos appareils
3. **Faites aussi un backup manuel** 1 fois/mois minimum
4. **Testez la récupération** sur un 2ème appareil avant d'en avoir besoin
5. **Vérifiez le statut de sync** régulièrement dans Options

### ❌ À ÉVITER

1. **Ne désactivez pas** la synchronisation Chrome dans les paramètres
2. **Ne créez pas** de nouvelle Master Key sur chaque appareil
3. **Ne partagez pas** votre compte Google Chrome
4. **N'utilisez pas** la sync comme seul backup (faites aussi un manuel)
5. **Ne paniquez pas** si la sync met 2-3 minutes (c'est normal)

---

## 📞 Support

### Vérifier que tout fonctionne

1. **Options → Synchronisation Chrome**
2. Statut devrait afficher : "✅ Synchronisation active"
3. Une date de dernière sync devrait être visible

### Si ça ne fonctionne pas

1. Vérifiez la console Chrome (F12) pour les erreurs
2. Vérifiez les paramètres de synchronisation de Chrome
3. Essayez de désactiver/réactiver la sync
4. En dernier recours, utilisez le backup manuel

---

**Version** : 1.1.1  
**Dernière mise à jour** : Novembre 2024  
**Compatibilité** : Chrome 88+, Edge 88+, Brave 1.20+

