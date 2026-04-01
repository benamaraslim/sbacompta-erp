<div align="center">

# SBACOMPTA

### Système ERP complet de gestion d'entreprise

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue?style=for-the-badge&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)

**SBACOMPTA** est un ERP moderne et complet développé avec Next.js 14 et PostgreSQL.
Il centralise la gestion financière, des ressources humaines, du stock et des ventes en une seule application.

[🚀 Démarrage rapide](#installation) · [📦 Modules](#modules) · [🖼️ Screenshots](#screenshots)

</div>

---

## Screenshots

### Tableau de bord
![Tableau de bord](docs/screenshots/dashboard.png)
> Vue d'ensemble en temps réel : chiffre d'affaires, employés actifs, commandes en cours, alertes stock.

### Finance — Factures
![Factures](docs/screenshots/finance-invoices.png)
> Création et suivi des factures avec statuts (Brouillon → Envoyé → Payé), encaissement et relances.

### Finance — Rapports
![Rapports financiers](docs/screenshots/finance-reports.png)
> Graphique CA mensuel, dépenses par catégorie, top 5 clients, résultat net de l'exercice.

### RH — Employés
![Employés](docs/screenshots/hr-employees.png)
> Fiches employés complètes : poste, département, salaire, présences, congés et bulletins de paie.

### Stock — Produits
![Produits & Stock](docs/screenshots/inventory-products.png)
> Catalogue produits avec alertes stock faible automatiques et valorisation en temps réel.

### Ventes — Clients & CRM
![Clients](docs/screenshots/sales-customers.png)
> Portefeuille clients avec historique des commandes, factures et devis associés.

---

## Modules

| Module | Fonctionnalités |
|--------|----------------|
| 📊 **Tableau de bord** | KPIs temps réel, alertes, dernières transactions, synthèse globale |
| 💰 **Finance** | Factures, paiements, dépenses, rapports mensuels, grand livre |
| 👥 **Ressources Humaines** | Employés, présences, congés (approbation), bulletins de paie, départements |
| 📦 **Stock & Inventaire** | Produits, mouvements de stock, fournisseurs, bons de commande |
| 🛒 **Ventes & CRM** | Clients, devis, commandes clients avec workflow de livraison |

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 14 (App Router) + React 18 |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes (REST) |
| ORM | Prisma 5 |
| Base de données | PostgreSQL 17 |
| Langage | TypeScript 5 |
| Icons | Lucide React |

---

## Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+

### 1. Cloner le projet

```bash
git clone https://github.com/benamaraslim/sbacompta-erp.git
cd sbacompta-erp
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer la base de données

```bash
cp .env.example .env
```

Modifier `.env` avec vos identifiants PostgreSQL :

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/sbacompta?schema=public"
```

### 4. Créer les tables et les données de démo

```bash
# Créer toutes les tables
npm run db:push

# (Optionnel) Insérer des données de démonstration
npm run db:seed
```

### 5. Lancer l'application

```bash
npm run dev
```

Ouvrir **http://localhost:3000** dans votre navigateur.

---

## Structure du projet

```
sbacompta-erp/
├── app/
│   ├── page.tsx                  # Dashboard principal
│   ├── finance/                  # Module Finance
│   │   ├── invoices/             # Factures
│   │   ├── payments/             # Paiements
│   │   ├── expenses/             # Dépenses
│   │   └── reports/              # Rapports
│   ├── hr/                       # Module Ressources Humaines
│   │   ├── employees/            # Employés
│   │   ├── attendance/           # Présences / Pointage
│   │   ├── leaves/               # Congés
│   │   ├── payroll/              # Bulletins de paie
│   │   └── departments/          # Départements
│   ├── inventory/                # Module Stock
│   │   ├── products/             # Produits
│   │   ├── movements/            # Mouvements de stock
│   │   ├── suppliers/            # Fournisseurs
│   │   └── purchases/            # Bons de commande
│   ├── sales/                    # Module Ventes & CRM
│   │   ├── customers/            # Clients
│   │   ├── quotes/               # Devis
│   │   └── orders/               # Commandes
│   └── api/                      # API REST (Next.js Route Handlers)
├── components/                   # Composants UI réutilisables
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   ├── StatsCard.tsx
│   ├── Badge.tsx
│   └── Modal.tsx
├── lib/
│   ├── db.ts                     # Client Prisma singleton
│   └── utils.ts                  # Utilitaires (formatCurrency, formatDate...)
├── prisma/
│   ├── schema.prisma             # Schéma base de données (15 modèles)
│   └── seed.ts                   # Données de démonstration
└── docs/
    └── screenshots/              # Captures d'écran
```

---

## Scripts disponibles

```bash
npm run dev           # Serveur de développement → http://localhost:3000
npm run build         # Build de production
npm run db:push       # Synchroniser le schéma Prisma avec la base
npm run db:migrate    # Créer une migration versionnée
npm run db:seed       # Insérer des données de démonstration
npm run db:studio     # Ouvrir Prisma Studio (interface visuelle DB)
```

---

## Fonctionnalités clés

- ✅ **Numérotation automatique** — `FAC-2024-0001`, `CMD-2024-0001`, `DEV-2024-0001`
- ✅ **Workflow statuts complet** — Brouillon → Envoyé → Partiellement payé → Payé
- ✅ **Alertes stock faible** — Notification automatique quand stock ≤ seuil minimum
- ✅ **Génération paie en un clic** — Bulletins de salaire pour tous les employés actifs
- ✅ **Réception commande automatique** — Crée un mouvement de stock à la réception
- ✅ **Rapports financiers** — Graphique CA mensuel + dépenses + top clients
- ✅ **CRM intégré** — Historique complet client (devis, commandes, factures)
- ✅ **Interface 100% en français**

---

<div align="center">

Développé avec ❤️ — **SBACOMPTA v1.0**

</div>
