# Spécification — Page Onboarding BeautyDesk

## Contexte

La création de compte ne collecte que le numéro de téléphone et un code PIN à 6 chiffres.
L'onboarding est donc la **première vraie interaction** de la propriétaire avec le produit.

Il doit :
- Collecter les informations essentielles pour activer le salon
- Être complété en **moins de 5 minutes**
- Mener à un moment de victoire clair : **"Ma page est en ligne. Je l'envoie à ma première cliente."**
- Être **mobile-first** (la majorité des utilisatrices gèrent leur salon depuis leur téléphone)

---

## Design & UX

### Principes généraux
- Une seule question ou action par écran
- Barre de progression visible en haut (ex. : étape 2/4)
- Bouton CTA principal toujours visible, fixé en bas sur mobile
- Pas de scroll nécessaire sur les étapes de sélection
- Couleur principale : orange (#E8510A ou la couleur actuelle du design system)
- Fond clair, typographie lisible, icônes simples et reconnaissables
- Toutes les étapes sont skippables sauf l'étape 1 et l'étape 2 (nom du salon + type)

### Comportement
- Afficher l'onboarding immédiatement après la première connexion (si le salon n'est pas encore configuré)
- Ne plus afficher l'onboarding si l'utilisatrice a déjà complété ou skippé
- Stocker la progression : si l'utilisatrice quitte en cours, reprendre à la même étape
- Sur desktop, centrer le contenu avec une largeur max de 480px pour conserver l'expérience mobile

---

## Flux complet — 4 étapes

---

### ÉTAPE 1 — Bienvenue + Nom du salon

**Objectif :** Personnaliser immédiatement l'expérience.

**Contenu :**
- Titre : `Bienvenue 👋`
- Sous-titre : `Commençons par les bases. Ça prend moins de 5 minutes.`
- Champ texte : `Nom de votre salon ou activité`
  - Placeholder : `Ex : Chez Aïssatou, Glamour Studio, Fatou Beauty...`
  - Autofocus activé
- Bouton CTA : `Continuer →`

**Validation :**
- Champ obligatoire, minimum 2 caractères
- Pas de validation complexe : garder simple

---

### ÉTAPE 2 — Type d'activité

**Objectif :** Comprendre le contexte métier pour personnaliser la suite (suggestions de prestations, vocabulaire, fonctionnalités pertinentes).

**Contenu :**
- Titre : `Vous êtes...`
- Sous-titre : `Cela nous permet de personnaliser votre espace.`

**Deux dimensions à collecter sur le même écran :**

#### Dimension A — Structure
Sélection unique, boutons larges avec icône + label :

| Icône | Label | Sous-label |
|-------|-------|------------|
| 🏠 | **Indépendante** | Vous travaillez seule, à domicile ou en déplacement |
| 💼 | **Salon / Studio** | Vous avez un local et/ou des employées |

#### Dimension B — Spécialité principale
Sélection unique, grille de cartes 2x3 avec icône + label :

| Icône | Label |
|-------|-------|
| ✂️ | Coiffure |
| 💅 | Onglerie |
| 💄 | Maquillage |
| 🧖 | Soins & Beauté |
| 👗 | Mode & Accessoires |
| ✨ | Autre |

Si "Autre" est sélectionné, afficher un champ texte : `Précisez votre activité`

**Bouton CTA :** `Continuer →` (actif uniquement si les deux dimensions sont sélectionnées)

**Usage des données :**
- La **structure** détermine si on propose l'ajout d'employées plus tard dans l'onboarding
- La **spécialité** détermine les suggestions de prestations à l'étape 3

---

### ÉTAPE 3 — Informations du salon

**Objectif :** Rendre la page de réservation visible et crédible.

**Contenu :**
Présenter les champs en deux groupes visuels.

#### Groupe 1 — Visible par les clientes
- `Ville` — champ texte, placeholder : `Ex : Dakar, Abidjan, Douala...`
- `Description courte` — textarea, max 150 caractères, placeholder selon la spécialité :
  - Coiffure : `Ex : Salon de coiffure pour femmes et enfants. Tresses, tissages, soins...`
  - Onglerie : `Ex : Pose d'ongles gel, résine, nail art. Sur rendez-vous.`
  - Maquillage : `Ex : Maquillage professionnel pour mariages, événements et shooting.`
  - Autre : `Ex : Décrivez votre activité en quelques mots...`
- `Numéro WhatsApp du salon` — champ téléphone, pré-rempli avec le numéro utilisé à l'inscription

#### Groupe 2 — Optionnel (clairement indiqué)
- `Logo ou photo du salon` — upload simple, JPG/PNG, max 2 Mo
  - Label : `Ajoutez un logo ou une photo (optionnel)`
  - Sous-label : `Ça rend votre page plus professionnelle`

**Bouton CTA principal :** `Continuer →`
**Lien secondaire :** `Passer cette étape` (en gris, sous le bouton — sauvegarde ce qui est déjà rempli)

---

### ÉTAPE 4 — Première prestation

**Objectif :** Avoir au moins un service pour que la page de réservation soit fonctionnelle.

**Contenu :**
- Titre : `Ajoutez votre première prestation`
- Sous-titre : `Vous pourrez en ajouter d'autres ensuite.`

#### Suggestions rapides (chips/tags cliquables)
Afficher 4 à 6 suggestions selon la spécialité sélectionnée à l'étape 2.
Cliquer sur une suggestion pré-remplit le formulaire.

Exemples par spécialité :
- **Coiffure :** Tresses simples, Tresses avec mèches, Tissage, Coiffure naturelle, Soins capillaires
- **Onglerie :** Pose résine, Pose gel, Nail art, Dépose + repose, Manucure simple
- **Maquillage :** Maquillage mariée, Maquillage événement, Maquillage naturel, Cours maquillage
- **Soins :** Soin visage, Épilation, Massage, Gommage, Soin corps

#### Formulaire
- `Nom de la prestation` — champ texte, pré-rempli si suggestion cliquée
- `Durée` — sélecteur : 30 min / 45 min / 1h / 1h30 / 2h / 2h30 / 3h / Plus de 3h
- `Prix (FCFA)` — champ numérique

**Bouton CTA principal :** `Terminer →`
**Lien secondaire :** `Passer cette étape` (en gris, sous le bouton)

---

### ÉTAPE FINALE — Page de victoire

**Objectif :** Créer le "aha moment". La propriétaire voit sa page en ligne et l'envoie à sa première cliente.

**Contenu :**
- Animation légère à l'entrée (confetti ou pulsation sur l'icône — sobre, pas distrayant)
- Titre : `Votre page est prête ! 🎉`
- Sous-titre : `Partagez ce lien à vos clientes pour qu'elles puissent réserver.`

#### Aperçu de la page
- Miniature (screenshot ou iframe) de la page de réservation du salon, avec le vrai nom et la vraie prestation
- Lien cliquable vers la page réelle (ouvre dans un nouvel onglet)

#### Actions
- **Bouton principal (vert, pleine largeur) :** `📲 Envoyer sur WhatsApp`
  - Ouvre WhatsApp avec un message pré-rédigé :
    `Bonjour ! 👋 Réserve maintenant ta prochaine séance chez [Nom du salon] 👉 [lien]`
- **Bouton secondaire (contour, pleine largeur) :** `Copier le lien`
  - Feedback visuel : le bouton passe à "✓ Lien copié !" pendant 2 secondes

#### Appel à l'action vers le dashboard
- Texte : `Votre tableau de bord est prêt. Vous pouvez ajouter d'autres prestations, vos employées et consulter vos réservations.`
- Bouton texte : `Aller au tableau de bord →`

---

## Checklist persistante dans le Dashboard (post-onboarding)

Afficher un encart en haut du tableau de bord jusqu'à ce que toutes les étapes soient complétées.
Réduire automatiquement l'encart une fois toutes les étapes cochées (ne pas supprimer, juste réduire avec une icône ✅).

### Étapes

| Statut | Action | Lien |
|--------|--------|------|
| ✅ auto | Salon créé | — |
| ✅ auto | Première prestation ajoutée | — |
| ⬜ | Partager votre page avec une cliente | Ouvre WhatsApp |
| ⬜ | Ajouter une employée | → /dashboard/staff |
| ⬜ | Recevoir votre première réservation | — (se coche automatiquement) |

La dernière étape ("Première réservation reçue") se coche automatiquement dès qu'une réservation est enregistrée.

---

## Données à enregistrer en base

À l'issue de l'onboarding, les champs suivants doivent être sauvegardés sur le profil du salon :

| Champ | Étape | Obligatoire |
|-------|-------|-------------|
| `salon_name` | 1 | ✅ |
| `business_type` | 2 | ✅ (`independent` / `salon`) |
| `specialty` | 2 | ✅ (`hair` / `nails` / `makeup` / `beauty` / `fashion` / `other`) |
| `specialty_custom` | 2 | Non (si "Autre") |
| `city` | 3 | Non |
| `description` | 3 | Non |
| `whatsapp` | 3 | Non (pré-rempli depuis l'inscription) |
| `logo_url` | 3 | Non |
| `onboarding_completed` | Finale | ✅ (booléen) |
| `onboarding_completed_at` | Finale | ✅ (timestamp) |

La première prestation est sauvegardée via le modèle `Service` existant.

---

## Comportement conditionnel selon `business_type`

| Situation | `independent` | `salon` |
|-----------|--------------|---------|
| Mention des employées dans la checklist | Masquée ou facultative | Présente |
| Suggestion d'ajouter des employées après l'onboarding | Non (ou optionnel) | Oui, mise en avant |
| Vocabulaire | "Votre activité", "vos clientes" | "Votre salon", "votre équipe" |

---

## Notes pour l'implémentation

- L'onboarding est une route dédiée : `/onboarding`
- Rediriger vers `/onboarding` automatiquement si `onboarding_completed === false` après login
- Stocker la progression en base (champ `onboarding_step: int`) pour reprendre en cas d'interruption
- Ne pas afficher la navigation latérale (sidebar) pendant l'onboarding — écran épuré
- Sur la page de victoire, le lien WhatsApp doit utiliser `https://wa.me/?text=` avec l'URL encodée
- Le message WhatsApp pré-rédigé doit être configurable facilement (variable dans le code)
