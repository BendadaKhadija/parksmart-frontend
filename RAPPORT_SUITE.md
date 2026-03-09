# Suite du Rapport ParkSmart - PFE

---

## 3.3. Vision statique : Le Diagramme de Classes

Ce diagramme représente la structure "en dur" de notre application. Autrement dit, il montre toutes les entités (les "objets") du système et comment elles sont reliées entre elles.

### Les principales classes identifiées :

| Classe | Rôle | Attributs principaux |
|--------|------|---------------------|
| **Conducteur** | L'utilisateur qui cherche à se garer | id, nom, prenom, email, password, photo, fcm_token |
| **Gestionnaire** | Le propriétaire du parking | id, nom, prenom, email, password, photo |
| **Parking** | Un lieu de stationnement | id, nom, adresse, latitude, longitude, tarif_horaire, photo, id_gestionnaire |
| **Place** | Une place individuelle dans un parking | id, numero, etage, statut (libre/occupee), id_parking |
| **Reservation** | Une réservation d'un conducteur | id, date_debut, date_fin, statut, id_conducteur, id_place |
| **Paiement** | Le règlement d'une réservation | id, montant, date_paiement, methode, id_reservation |
| **Avis** | Un commentaire laissé sur un parking | id, note, commentaire, date, id_conducteur, id_parking |
| **Notification** | Message envoyé à l'utilisateur | id, titre, message, date_envoi, lu, id_conducteur |

### Les relations entre les classes :

- Un **Gestionnaire** possède **plusieurs Parkings** (1..N)
- Un **Parking** contient **plusieurs Places** (1..N)
- Un **Conducteur** peut effectuer **plusieurs Réservations** (1..N)
- Une **Réservation** concerne **une seule Place** (N..1)
- Une **Réservation** génère **un Paiement** (1..1)
- Un **Conducteur** peut laisser **plusieurs Avis** sur différents parkings (1..N)
- Un **Conducteur** peut recevoir **plusieurs Notifications** (1..N)

> **Note** : Le diagramme complet est disponible en annexe. Il a été réalisé avec l'outil Lucidchart.

---

## 4. Conception de la Base de Données

### 4.1. Choix du Système de Gestion

Pour stocker toutes ces données, nous avons opté pour **MySQL**, un système de base de données relationnelle reconnu pour :
- Sa **fiabilité** : c'est l'un des SGBD les plus utilisés au monde
- Sa **compatibilité** avec Node.js grâce au module `mysql2`
- Sa capacité à gérer les **relations complexes** entre nos tables

### 4.2. Le Modèle Physique de Données (MPD)

Voici le schéma complet de notre base de données avec toutes les tables et leurs relations :

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   GESTIONNAIRE  │       │     PARKING     │       │      PLACE      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id_gestionnaire │◄──────│ id_gestionnaire │       │ id_place        │
│ nom             │   1:N │ id_parking      │◄──────│ id_parking      │
│ prenom          │       │ nom             │   1:N │ numero          │
│ email (UNIQUE)  │       │ adresse         │       │ etage           │
│ password        │       │ latitude        │       │ statut          │
│ photo           │       │ longitude       │       └────────┬────────┘
└─────────────────┘       │ tarif_horaire   │                │
                          │ photo           │                │
                          └─────────────────┘                │
                                   │                         │
                                   │                         │
                                   ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   CONDUCTEUR    │       │      AVIS       │       │   RESERVATION   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id_conducteur   │◄──────│ id_conducteur   │       │ id_reservation  │
│ nom             │   1:N │ id_parking      │───────│ id_conducteur   │
│ prenom          │       │ note (1-5)      │       │ id_place        │
│ email (UNIQUE)  │       │ commentaire     │       │ date_debut      │
│ password        │       │ date_avis       │       │ date_fin        │
│ photo           │       └─────────────────┘       │ statut          │
│ fcm_token       │                                 └────────┬────────┘
└────────┬────────┘                                          │
         │                                                   │
         │                                                   ▼
         │                                          ┌─────────────────┐
         │         ┌─────────────────┐              │    PAIEMENT     │
         │         │   NOTIFICATION  │              ├─────────────────┤
         │         ├─────────────────┤              │ id_paiement     │
         └────────►│ id_conducteur   │              │ id_reservation  │
               1:N │ titre           │              │ montant         │
                   │ message         │              │ date_paiement   │
                   │ date_envoi      │              │ methode         │
                   │ lu              │              └─────────────────┘
                   └─────────────────┘
```

### 4.3. Description détaillée des tables

#### Table `conducteur`
```sql
CREATE TABLE conducteur (
    id_conducteur INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    photo VARCHAR(255) DEFAULT NULL,
    fcm_token VARCHAR(255) DEFAULT NULL  -- Token Firebase pour les notifications push
);
```

#### Table `gestionnaire`
```sql
CREATE TABLE gestionnaire (
    id_gestionnaire INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    photo VARCHAR(255) DEFAULT NULL
);
```

#### Table `parking`
```sql
CREATE TABLE parking (
    id_parking INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(150) NOT NULL,
    adresse VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    tarif_horaire DECIMAL(10, 2),
    photo VARCHAR(255),
    id_gestionnaire INT,
    FOREIGN KEY (id_gestionnaire) REFERENCES gestionnaire(id_gestionnaire)
);
```

#### Table `place`
```sql
CREATE TABLE place (
    id_place INT PRIMARY KEY AUTO_INCREMENT,
    numero VARCHAR(10) NOT NULL,
    etage INT DEFAULT 1,
    statut ENUM('libre', 'occupee', 'reservee') DEFAULT 'libre',
    id_parking INT,
    FOREIGN KEY (id_parking) REFERENCES parking(id_parking)
);
```

#### Table `reservation`
```sql
CREATE TABLE reservation (
    id_reservation INT PRIMARY KEY AUTO_INCREMENT,
    date_debut DATETIME NOT NULL,
    date_fin DATETIME NOT NULL,
    statut ENUM('en_attente', 'confirmee', 'terminee', 'annulee') DEFAULT 'en_attente',
    id_conducteur INT,
    id_place INT,
    FOREIGN KEY (id_conducteur) REFERENCES conducteur(id_conducteur),
    FOREIGN KEY (id_place) REFERENCES place(id_place)
);
```

#### Table `paiement`
```sql
CREATE TABLE paiement (
    id_paiement INT PRIMARY KEY AUTO_INCREMENT,
    montant DECIMAL(10, 2) NOT NULL,
    date_paiement DATETIME DEFAULT CURRENT_TIMESTAMP,
    methode VARCHAR(50) DEFAULT 'en_ligne',
    id_reservation INT,
    FOREIGN KEY (id_reservation) REFERENCES reservation(id_reservation)
);
```

#### Table `avis`
```sql
CREATE TABLE avis (
    id_avis INT PRIMARY KEY AUTO_INCREMENT,
    note INT CHECK (note >= 1 AND note <= 5),
    commentaire TEXT,
    date_avis DATETIME DEFAULT CURRENT_TIMESTAMP,
    id_conducteur INT,
    id_parking INT,
    FOREIGN KEY (id_conducteur) REFERENCES conducteur(id_conducteur),
    FOREIGN KEY (id_parking) REFERENCES parking(id_parking)
);
```

#### Table `notification`
```sql
CREATE TABLE notification (
    id_notification INT PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(200) NOT NULL,
    message TEXT,
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,
    id_conducteur INT,
    FOREIGN KEY (id_conducteur) REFERENCES conducteur(id_conducteur)
);
```

---

## 5. Conclusion du Chapitre 2

Ce chapitre nous a permis de transformer notre vision fonctionnelle en une architecture technique solide. Les diagrammes UML nous ont aidé à visualiser les interactions, et la conception de la base de données garantit que nos données seront bien organisées et faciles à manipuler.

Nous sommes maintenant prêts à passer à la phase de développement dans le chapitre suivant.

---

---

# CHAPITRE 3 : RÉALISATION TECHNIQUE

---

## 1. Introduction

Après avoir posé les bases théoriques dans les chapitres précédents, il est temps de passer à l'action. Ce chapitre est consacré à la réalisation concrète de ParkSmart.

Nous allons d'abord présenter notre environnement de travail et les outils utilisés. Ensuite, nous détaillerons les fonctionnalités clés développées avec des captures d'écran de l'application finale.

---

## 2. Environnement de Développement

### 2.1. Matériel utilisé

Le développement a été réalisé sur un ordinateur portable avec les caractéristiques suivantes :

| Composant | Spécification |
|-----------|---------------|
| **Processeur** | Intel Core i5/i7 (ou équivalent) |
| **RAM** | 8 Go minimum |
| **Système d'exploitation** | Windows 10/11 |
| **Navigateur de test** | Google Chrome, Firefox |

### 2.2. Outils logiciels

| Outil | Version | Utilité |
|-------|---------|---------|
| **Visual Studio Code** | 1.85+ | Éditeur de code principal |
| **Node.js** | 22.x | Environnement d'exécution JavaScript côté serveur |
| **npm** | 10.x | Gestionnaire de paquets |
| **MySQL Workbench** | 8.0 | Administration de la base de données |
| **Git / GitHub** | - | Versioning et hébergement du code |
| **Postman** | - | Test des API REST |
| **Figma** | - | Maquettage des interfaces (optionnel) |
| **Lucidchart** | - | Création des diagrammes UML |

---

## 3. Technologies Utilisées

### 3.1. Frontend (Côté Client)

| Technologie | Rôle |
|-------------|------|
| **React.js 19** | Bibliothèque JavaScript pour construire des interfaces utilisateur dynamiques |
| **Vite** | Outil de build ultra-rapide pour les projets React modernes |
| **React Router DOM** | Gestion de la navigation entre les pages (SPA) |
| **Tailwind CSS** | Framework CSS utilitaire pour un design rapide et responsive |
| **Leaflet + React-Leaflet** | Affichage de cartes interactives avec les parkings |
| **Axios** | Client HTTP pour communiquer avec l'API backend |
| **Recharts** | Graphiques et visualisation des statistiques |
| **React Icons** | Bibliothèque d'icônes (FontAwesome, Material, etc.) |
| **Firebase (Client)** | Réception des notifications push en temps réel |

### 3.2. Backend (Côté Serveur)

| Technologie | Rôle |
|-------------|------|
| **Node.js** | Environnement d'exécution JavaScript côté serveur |
| **Express.js** | Framework minimaliste pour créer des API REST |
| **MySQL2** | Connecteur pour communiquer avec la base MySQL |
| **bcryptjs** | Hachage sécurisé des mots de passe |
| **jsonwebtoken (JWT)** | Génération et vérification des tokens d'authentification |
| **Multer** | Gestion de l'upload de fichiers (photos de profil, parkings) |
| **Firebase Admin SDK** | Envoi des notifications push vers les appareils |
| **node-cron** | Planification de tâches automatiques (vérification des réservations expirées) |
| **dotenv** | Gestion des variables d'environnement |
| **CORS** | Autorisation des requêtes cross-origin |

### 3.3. Base de Données

| Technologie | Rôle |
|-------------|------|
| **MySQL 8.0** | Système de gestion de base de données relationnelle |
| **Railway** (Production) | Hébergement cloud de la base de données |

### 3.4. Hébergement et Déploiement

| Service | Utilisation |
|---------|-------------|
| **Vercel** | Hébergement du Frontend React |
| **Railway** | Hébergement du Backend Node.js + Base de données MySQL |
| **GitHub** | Déploiement continu (CI/CD) via intégration avec Vercel et Railway |

---

## 4. Structure du Projet

### 4.1. Architecture des dossiers (Frontend)

```
frontend-app/
├── public/
│   ├── firebase-messaging-sw.js    # Service Worker pour notifications
│   └── fond.avif                   # Images de fond
├── src/
│   ├── components/                 # Composants réutilisables
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── Footer.jsx
│   │   ├── AboutUs.jsx
│   │   ├── Testimonials.jsx
│   │   ├── Questions.jsx           # FAQ
│   │   ├── ParkingTimer.jsx        # Minuteur de stationnement
│   │   └── solution.jsx
│   ├── pages/                      # Pages principales
│   │   ├── Connexion.jsx           # Page de connexion
│   │   ├── inscription.jsx         # Page d'inscription
│   │   ├── ClientHome.jsx          # Interface conducteur
│   │   ├── DashboardManager.jsx    # Tableau de bord gestionnaire
│   │   ├── Notifications.jsx       # Centre de notifications
│   │   └── ClientHistory.jsx       # Historique des réservations
│   ├── styles/                     # Fichiers CSS
│   ├── firebase.js                 # Configuration Firebase
│   ├── App.jsx                     # Point d'entrée + Routes
│   └── main.jsx                    # Rendu React
├── package.json
├── vite.config.js
└── tailwind.config.js
```

### 4.2. Architecture des dossiers (Backend)

```
backend-api/
├── uploads/                        # Stockage des images uploadées
├── server.js                       # Point d'entrée principal (Express)
├── package.json
├── .env                            # Variables d'environnement (non versionné)
└── firebase-key.json               # Clé Firebase (non versionnée)
```

---

## 5. Fonctionnalités Développées

### 5.1. Système d'Authentification

L'authentification est la porte d'entrée de ParkSmart. Nous avons mis en place un système complet :

#### Inscription
- Formulaire avec validation des champs
- Upload de photo de profil (optionnel)
- Choix du rôle : Conducteur ou Gestionnaire
- Hachage du mot de passe avec **bcrypt** (10 rounds)

#### Connexion
- Vérification email + mot de passe
- Génération d'un **token JWT** valable 24h
- Stockage sécurisé en `sessionStorage` (pas localStorage pour plus de sécurité)
- Redirection automatique selon le rôle

#### Protection des routes
```jsx
// Exemple de protection côté Frontend
function RequireManager({ children }) {
  const userString = sessionStorage.getItem('user'); 
  if (!userString) return <Navigate to="/signin" replace />;
  
  const user = JSON.parse(userString);
  if (user.role !== 'gestionnaire') {
    return <Navigate to="/home" replace />; 
  }
  return children;
}
```

### 5.2. Carte Interactive (Leaflet)

L'une des fonctionnalités phares de ParkSmart est la visualisation des parkings sur une carte.

**Technologies utilisées** : React-Leaflet + OpenStreetMap

**Fonctionnalités implémentées** :
- Affichage de tous les parkings avec des marqueurs personnalisés
- Géolocalisation de l'utilisateur (bouton "Ma position")
- Clic sur un marqueur → affichage des détails du parking
- Animation fluide lors du recentrage (flyTo)
- Rotation de la carte par geste tactile (2 doigts)

```jsx
// Extrait : Recentrage automatique sur la position
function RecenterMap({ position }) { 
  const map = useMap(); 
  useEffect(() => { 
    if (position) map.flyTo(position, 15, { animate: true, duration: 2 }); 
  }, [position, map]); 
  return null; 
}
```

### 5.3. Système de Réservation

Le cœur du métier de ParkSmart :

1. **Sélection du parking** : L'utilisateur clique sur un parking sur la carte
2. **Visualisation des places** : Un plan interactif affiche les places libres/occupées
3. **Choix de la place** : Clic sur une place verte (libre)
4. **Sélection des horaires** : Date de début et de fin
5. **Confirmation et paiement** : Validation de la réservation

**Gestion des statuts** :
- `en_attente` : Réservation créée mais non payée
- `confirmee` : Paiement effectué
- `terminee` : Durée écoulée
- `annulee` : Annulation par l'utilisateur

### 5.4. Tableau de Bord Gestionnaire

Le gestionnaire dispose d'un espace complet pour gérer son activité :

| Section | Fonctionnalités |
|---------|-----------------|
| **Vue d'ensemble** | Statistiques globales (revenus, réservations, taux d'occupation) |
| **Mes Parkings** | Liste des parkings avec options CRUD (Ajouter, Modifier, Supprimer) |
| **Réservations** | Liste en temps réel des réservations en cours |
| **Revenus** | Graphique des gains (par jour/mois) avec Recharts |
| **Avis** | Consultation des notes et commentaires des clients |

**Exemple de graphique des revenus** :
```jsx
<BarChart data={monthlyEarnings}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="jour" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="montant" fill="#4CAF50" />
</BarChart>
```

### 5.5. Notifications Push (Firebase)

Pour tenir les utilisateurs informés en temps réel, nous avons intégré **Firebase Cloud Messaging (FCM)** :

**Côté Frontend** :
- Demande de permission au premier lancement
- Enregistrement du token FCM dans la base de données
- Service Worker pour les notifications en arrière-plan

**Côté Backend** :
```javascript
// Envoi d'une notification push
const message = {
  notification: {
    title: 'Réservation confirmée !',
    body: 'Votre place au parking Centre-Ville est réservée.'
  },
  token: userFcmToken
};
await admin.messaging().send(message);
```

**Cas d'utilisation** :
- Confirmation de réservation
- Rappel avant expiration de la place
- Notification de paiement reçu (pour le gestionnaire)

### 5.6. Système de Notation (Avis)

Les conducteurs peuvent noter les parkings après leur visite :

- Note de 1 à 5 étoiles
- Commentaire textuel optionnel
- Affichage de la moyenne sur la fiche parking
- Le gestionnaire peut consulter tous les avis dans son tableau de bord

---

## 6. API REST Développée

Le backend expose une API RESTful complète. Voici les principales routes :

### 6.1. Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/signup` | Inscription (avec upload photo) |
| POST | `/api/auth/login` | Connexion + génération JWT |

### 6.2. Parkings

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/parkings` | Liste de tous les parkings |
| GET | `/api/parkings/:id` | Détails d'un parking |
| POST | `/api/parkings` | Ajouter un parking (auth requise) |
| PUT | `/api/parkings/:id` | Modifier un parking |
| DELETE | `/api/parkings/:id` | Supprimer un parking |

### 6.3. Places

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/places/parking/:id` | Places d'un parking |
| PUT | `/api/places/:id/status` | Changer le statut d'une place |

### 6.4. Réservations

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reservations/user/:id` | Réservations d'un conducteur |
| GET | `/api/reservations/manager/:id` | Réservations pour un gestionnaire |
| POST | `/api/reservations` | Créer une réservation |
| PUT | `/api/reservations/:id/cancel` | Annuler une réservation |

### 6.5. Paiements

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/paiements` | Enregistrer un paiement |
| GET | `/api/paiements/manager/:id` | Revenus d'un gestionnaire |

### 6.6. Avis

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/avis` | Ajouter un avis |
| GET | `/api/avis/parking/:id` | Avis d'un parking |

---

## 7. Sécurité Mise en Place

La sécurité est primordiale pour une application qui gère des paiements. Voici les mesures implémentées :

| Mesure | Implémentation |
|--------|----------------|
| **Hachage des mots de passe** | bcrypt avec salt (10 rounds) |
| **Authentification par token** | JWT avec expiration de 24h |
| **Protection des routes** | Middleware `authenticateToken` côté serveur |
| **Validation des entrées** | Vérification des champs requis |
| **CORS configuré** | Autorisation des domaines de confiance uniquement |
| **Variables d'environnement** | Clés sensibles stockées dans `.env` (non versionné) |
| **Session Storage** | Préféré à localStorage (durée de vie limitée) |

---

## 8. Captures d'Écran de l'Application

*(Insérer ici vos captures d'écran avec légendes)*

### 8.1. Page d'Accueil
> Figure X : Page d'accueil avec le Hero et les témoignages

### 8.2. Page de Connexion
> Figure X : Formulaire de connexion avec choix du rôle

### 8.3. Interface Conducteur - Carte
> Figure X : Carte interactive avec les parkings disponibles

### 8.4. Interface Conducteur - Réservation
> Figure X : Plan du parking avec sélection de place

### 8.5. Tableau de Bord Gestionnaire
> Figure X : Vue d'ensemble avec statistiques et graphiques

### 8.6. Notifications
> Figure X : Centre de notifications avec messages lus/non lus

---

## 9. Tests et Validation

### 9.1. Tests manuels effectués

| Fonctionnalité | Résultat |
|----------------|----------|
| Inscription Conducteur | ✅ OK |
| Inscription Gestionnaire | ✅ OK |
| Connexion avec mauvais mot de passe | ✅ Erreur affichée |
| Affichage de la carte | ✅ OK |
| Géolocalisation | ✅ OK (avec permission) |
| Réservation d'une place | ✅ OK |
| Paiement | ✅ OK |
| Notifications push | ✅ OK |
| Ajout d'un parking | ✅ OK |
| Consultation des revenus | ✅ OK |

### 9.2. Tests de compatibilité

| Navigateur | Version | Résultat |
|------------|---------|----------|
| Google Chrome | 120+ | ✅ Parfait |
| Mozilla Firefox | 115+ | ✅ OK |
| Microsoft Edge | 120+ | ✅ OK |
| Safari (macOS) | 17+ | ⚠️ Quelques ajustements CSS |

### 9.3. Tests Responsive

| Appareil | Résultat |
|----------|----------|
| Desktop (1920x1080) | ✅ OK |
| Tablette (768px) | ✅ OK |
| Mobile (375px) | ✅ OK |

---

## 10. Difficultés Rencontrées et Solutions

Au cours du développement, nous avons fait face à plusieurs défis :

| Problème | Solution |
|----------|----------|
| **Connexion BDD en production** | Utilisation de `MYSQL_URL` au lieu de variables séparées |
| **Sensibilité de casse MySQL (Linux)** | Conversion de tous les noms de tables en minuscules |
| **Clé Firebase en production** | Stockage JSON compacté dans une variable d'environnement |
| **Performance de la carte** | Lazy loading des marqueurs + optimisation des re-renders |
| **Gestion des fuseaux horaires** | Utilisation de dates UTC côté serveur |

---

## 11. Conclusion du Chapitre 3

Ce chapitre nous a permis de présenter en détail l'implémentation technique de ParkSmart. De l'environnement de développement aux fonctionnalités avancées comme les notifications push, chaque composant a été pensé pour offrir une expérience utilisateur optimale.

L'application est maintenant fonctionnelle et déployée en production sur Vercel (Frontend) et Railway (Backend + BDD).

---

---

# CONCLUSION GÉNÉRALE

---

## 1. Bilan du Projet

Au terme de ce projet de fin d'études, nous pouvons dresser un bilan positif de notre travail sur ParkSmart.

**Ce que nous avons accompli :**

- ✅ Une application web complète et fonctionnelle
- ✅ Deux interfaces distinctes : Conducteur et Gestionnaire
- ✅ Un système de réservation en temps réel
- ✅ Une carte interactive avec géolocalisation
- ✅ Un tableau de bord avec statistiques et graphiques
- ✅ Des notifications push pour informer les utilisateurs
- ✅ Un système de paiement intégré
- ✅ Un déploiement en production (Vercel + Railway)

**Compétences acquises :**

Ce projet m'a permis de consolider mes connaissances en développement FullStack JavaScript. J'ai pu mettre en pratique :
- La création d'API REST avec Node.js et Express
- Le développement d'interfaces modernes avec React
- L'intégration de services tiers (Firebase, Leaflet)
- La gestion d'une base de données relationnelle
- Le déploiement cloud et la gestion des environnements

---

## 2. Limites et Améliorations Futures

Comme tout projet, ParkSmart peut encore être amélioré. Voici quelques pistes pour les versions futures :

### 2.1. Limites actuelles

- **Paiement simulé** : L'intégration avec une vraie passerelle de paiement (Stripe, PayPal) n'a pas été réalisée
- **Pas de capteurs physiques** : La disponibilité des places est gérée manuellement par les réservations
- **Application mobile native** : Actuellement, seule une version web responsive existe

### 2.2. Perspectives d'amélioration

| Amélioration | Description |
|--------------|-------------|
| **Application mobile** | Développer une app native avec React Native |
| **Capteurs IoT** | Intégrer des capteurs pour détecter les places en temps réel |
| **Paiement réel** | Intégrer Stripe ou CMI (pour le Maroc) |
| **Reconnaissance de plaques** | Automatiser l'entrée/sortie des véhicules |
| **Intelligence Artificielle** | Prédire les heures de pointe et optimiser les prix |
| **Multi-langues** | Ajouter l'anglais et l'arabe |

---

## 3. Mot de la Fin

Ce projet a été une expérience enrichissante qui m'a permis de mettre en pratique les connaissances acquises durant ma formation en Ingénierie Logicielle.

ParkSmart répond à un vrai besoin du quotidien : faciliter le stationnement en ville. J'espère que ce travail pourra servir de base à une solution encore plus complète dans le futur.

Je tiens à remercier une nouvelle fois mon encadrante, Madame Hdioud Ferdaous, pour son accompagnement précieux tout au long de ce projet.

---

---

# ANNEXES

---

## Annexe A : Glossaire

| Terme | Définition |
|-------|------------|
| **API** | Application Programming Interface - Interface de programmation |
| **REST** | Representational State Transfer - Architecture pour les API web |
| **JWT** | JSON Web Token - Standard pour l'authentification |
| **CRUD** | Create, Read, Update, Delete - Opérations de base sur les données |
| **SPA** | Single Page Application - Application à page unique |
| **FCM** | Firebase Cloud Messaging - Service de notifications push |
| **SGBD** | Système de Gestion de Base de Données |

## Annexe B : Bibliographie / Webographie

1. Documentation officielle React.js : https://react.dev/
2. Documentation Node.js : https://nodejs.org/docs/
3. Documentation Express.js : https://expressjs.com/
4. Documentation MySQL : https://dev.mysql.com/doc/
5. Documentation Firebase : https://firebase.google.com/docs
6. Documentation Leaflet : https://leafletjs.com/
7. Documentation Tailwind CSS : https://tailwindcss.com/docs
8. Tutoriels YouTube sur le stack MERN

## Annexe C : Diagrammes Complets

*(Insérer ici les diagrammes UML en pleine page)*

- Diagramme de cas d'utilisation complet
- Diagramme de classes complet
- Diagramme de séquence : Inscription
- Diagramme de séquence : Réservation
- Diagramme de séquence : Paiement
- Modèle Physique de Données (MPD)

## Annexe D : Code Source Significatif

*(Optionnel : insérer des extraits de code commentés)*

---

**Fin du Rapport**

---
