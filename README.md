# 🛒 ShopMaster - Super Shop Management System

ShopMaster is a comprehensive, production-grade Management System and Point of Sale (POS) solution designed for retail super shops. Built with high-performance modern web technologies, it features rich inventory tracking, barcode scanning, POS checkout, real-time sales reports, analytics dashboards, offline synchronization, secure multi-user role management, and context-aware Voice Assistant integration.

---

## ✨ Features

### 1. 📊 Interactive POS & Checkout
*   **Intuitive Checkout Canvas:** Fast product searching, automatic pricing calculation, real-time discount applications, VAT/tax handling, and split payment methods (Cash, bKash, Nagad, Card, or Bank transfer).
*   **Flexible Serial/Barcode & QR Code Search:** Real-time lookup of items via camera scanning (integrated through `html5-qrcode`) or thermal barcode guns.
*   **Flexible Receipt Configurations:** Tailored layout sizing supporting both **58mm** and **80mm** thermal roll printing with customized multi-lingual footer structures.

### 2. 📦 Robust Inventory & Category Systems
*   **Sub-item Category Architectures:** Structured management of category tags with custom descriptions and categorization metrics.
*   **Comprehensive Stock Management:** Stock tracking with real-time depletion logs, batch details, expiration warning markers, and adjustment histories.
*   **Automated Recycle Bin Protection:** Soft-delete preservation architecture for items, invoices, and expenses with timed expiration routines.

### 3. 🎙️ Advanced Jarvis Voice Assistant & Voice Search
*   **Intelligent Hands-free Operations:** High-accuracy phonetic search matching (covering English and Bengali terminology translation layers).
*   **Dynamic Operations:** Perform math voice parsing, bulk items stock additions, and POS basket edits using hands-free voice commands.

### 4. 🔒 Multi-Tenant Security & Firebase Integration
*   **Attribute-Based Access Control (ABAC):** Multi-role hierarchy (Admin, Manager, Assistant Manager, Sales Specialist, and Warehouse Team).
*   **Enterprise-Grade Database Architecture:** Fully integrated with Google Cloud Firestore, deploying bulletproof security boundaries preventing identity spoofing or state shortcutting.
*   **Network Resilience & Memory Chained Storage:** Configured long-polling cache strategies that prevent client-side interruptions even during offline connectivity loss.

---

## 🛠️ Architecture & Core Dependencies

*   **Runtime:** Node.js (via custom Express server integrated with Vite backend proxy).
*   **Frontend Framework:** React 19 (TypeScript) configured with Vite 6.
*   **Styling Engine:** Tailwind CSS 4.0.
*   **Animations:** `motion/react` for buttery-smooth visual feedback loops.
*   **Data Visualization:** `recharts` for fluid analytics graphing and interactive vector tracking.
*   **PDF Generation:** `jspdf` and `jspdf-autotable` for digital invoice exporting.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (version 18 or above recommended)
*   npm or yarn package managers

### Installation

1.  Clone the repository:
    ```bash
    git clone <your-repository-url>
    cd <your-repository-folder>
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure your environment variables by copying `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```

4.  Configure your Firebase credentials inside the `firebase-applet-config.json` configuration file at the root of the project workspace.

### Running in Development

Run the localized dev server on port `3000`:
```bash
npm run dev
```

### Production Build & Deployment

To bundle both client assets and server scripts into production-ready standalone packages:
```bash
npm run build
```

This generates:
*   `/dist/` containing pre-built, optimized, static SPA files.
*   `/dist/server.cjs` which bundles your backend Express handler into a self-contained CommonJS target to bypass ES Modules resolver constraints during deployment.

Start your deployed instance with:
```bash
npm run start
```

---

## 📈 Release History

### 🟢 Version v4.2.4 (2026-06-11) - current
* **Git Commit Safeguards**: Integrated updated metadata tracking parameters to ensure active working tree modifications are recognized by AI Studio syncing engines.
* **Workspace Synchronization**: Resolved the persistent "no changes to commit" state blocking subsequent live updates.
* **Production Pipeline**: Automated and tuned server assets generation speed for direct Hostinger auto-deployments.

### 🟢 Version v4.2.3 (2026-06-11)
* **Git Synchronization**: Refactored static configurations and package variables to make sure uncommitted configurations are picked up dynamically by GitHub Sync UI.
* **Asset Optimization**: Strengthened build workflow performance on Node runtime.

### 🟢 Version v4.2.2 (2026-06-11)
* **Production Optimization**: Reconfigured the pipeline to use `esbuild` to bundle `server.ts` into a self-contained `dist/server.cjs` bundle with external module mappings.
* **Hostinger Compatibility**: Added explicit guides and directory checks for deployment on `pos.sellerscampus.com` via Hostinger NodeJS app controller.
* **Linter & Syntax Cleanups**: Resolved import conflicts and ensured successful TypeScript builds.

