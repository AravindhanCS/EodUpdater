# Simplicity EOD Updater — Frontend Documentation

## 1. Overview & Architecture

The **Simplicity EOD Updater Frontend** is a modern, responsive Single Page Application (SPA) built with **React 18** and **Vite 8**. It provides a frictionless interface for software developers to log their daily effort, automatically distribute remaining hours across Azure DevOps work items, monitor live synchronization with Microsoft SharePoint Online, and inspect managerial sprint analytics.

### Key Capabilities
* **Live SharePoint Online Verification Engine**: Listens for cloud email automation events and actively polls the live SharePoint file until submitted rows are verified, accompanied by real-time progress indicators and timeout handling.
* **Smart Hours Distribution**: Automatically calculates daily recurring standups and meeting hours based on the day of the week and splits remaining development hours equally across selected Azure DevOps tickets in clean half-hour intervals.
* **Direct Excel Access on Exception**: Provides one-click access to open the live SharePoint Excel sheet in Excel Online if cloud automation experiences delays.
* **100% Mobile Responsive**: Seamlessly adapts from desktop wide tables to touch-friendly **Mobile Task Cards** on smartphones and tablets.
* **Dual Design System**: Built-in executive Dark Mode and clean Light Mode with glassmorphic cards, custom SVG icons, and celebratory completion micro-animations.

---

## 2. Component Hierarchy & System Architecture

```
src/
├── main.jsx                        # React root entry point
├── App.jsx                         # Main application state hub & router
├── index.css                       # Global design system tokens & theme variables
├── App.css                         # Bespoke CSS stylesheet (8,000+ lines)
├── components/
│   ├── Header.jsx                  # Navigation bar, theme toggle, active sprint pill
│   ├── DailyTaskForm.jsx           # Task logging form, hour stepper, mobile task cards
│   ├── RecentEntriesTable.jsx      # SharePoint-synced table, live monitor, calm sync button
│   ├── SyncStatusModal.jsx         # Verification timeout modal with "Open Excel Sheet" option
│   ├── AdoTicketSelector.jsx       # Azure DevOps work item modal & selector
│   ├── DashboardView.jsx           # Team analytics, velocity rankings & compliance audits
│   ├── ConfigModal.jsx             # Settings dialog for ADO PAT, SharePoint URL & Resend keys
│   └── FileUploadSection.jsx       # Fallback drag-and-drop manual Excel upload/download mode
├── services/
│   └── api.js                      # REST API client connecting to Spring Boot backend
└── utils/
    ├── hoursUtils.js               # Equal distribution & 0.5h rounding algorithms
    └── sprintUtils.js              # Client-side sprint name detection & math
```

---

## 3. Core Components Breakdown

### 3.1. `App.jsx` (Application State Hub)
* **Theme Management**: Persists theme choice (`dark` / `light`) in `localStorage.getItem('eod_theme')` and synchronizes with the document root attribute `data-theme`.
* **SharePoint Live Verification Loop**:
  * Activated when the user clicks **Update EOD Excel**.
  * Spawns a background timer (`verificationSeconds`) counting up to `VERIFICATION_MAX_SECONDS = 50`.
  * Runs a continuous polling interval every 4.5 seconds calling `fetchRecentEntries(targetSheet, '', 50, true)`.
  * Uses fuzzy epsilon matching (`checkEntriesMatchInSharePoint`) comparing `name`, `category`, `ticket`, and `timeInHrs` ($\pm 0.05\text{h}$) to determine when rows appear in the live SharePoint file.
  * **On Match**: Stops polling, fires confetti (`canvas-confetti`), updates the recent entries table, and displays a clean success toast.
  * **On Timeout (50s)**: Stops polling and presents `SyncStatusModal` with diagnostic guidance and a direct **"Open Excel Sheet"** button.

### 3.2. `DailyTaskForm.jsx` (Task Logging & Schedule Engine)
* **Date & Member Selection**: Date picker and team member selector defaulting to the logged-in engineer.
* **Recurring Standup Rules**: Automatically calls `/api/ado/schedule` to populate standup and client calls:
  * **Mon–Wed**: `0.5h` Internal standup + `1.0h` Client calls (Leaves `4.5h` for tickets).
  * **Thursday**: `0.5h` Internal standup + `1.0h` Client calls + `1.0h` Office hours call (Leaves `3.5h` for tickets).
  * **Friday**: `0.5h` Internal standup + `0.5h` Technical training call (Leaves `5.0h` for tickets).
* **Editable Daily Target**: Allows users to click and modify their target daily hours (default `6.0h`), automatically storing it in `localStorage.getItem('eod_target_daily_hours')`.
* **Non-Negative Hours Badge**:
  * Less than target: `X.Xh remaining`.
  * Exactly target: `🎯 Perfect X.Xh Day`.
  * Exceeds target: `🎯 +X.Xh extra` (clean positive indicator).
* **Sanitization on Submit**: Strips all `[\r\n]+` characters and collapses spaces before dispatching payload to eliminate Excel cell newlines.

### 3.3. `RecentEntriesTable.jsx` (SharePoint Verified Entries & Monitor)
* **Live SharePoint Synced Table**: Only renders task rows confirmed in the live SharePoint Online workbook (`forceRefresh=true`).
* **Non-Spinning Sync Button**: Features a calm executive button with subtle breathing status dots (`.ready`, `.syncing`, `.verifying`) and zero rotating icons.
* **Cloud Sync Verification Monitor**: When verification is running, docks an aesthetic card above the table featuring:
  * Live elapsed time counter (`⏱ Checking cloud: 18s / 50s`).
  * Smooth animated gradient shimmer progress fill.
  * Interactive chips for pending tasks.
* **Modern Skeleton Loader**: Replaces generic spinning wheels with pulsing placeholder skeleton rows during initial load or manual refresh.

### 3.4. `SyncStatusModal.jsx` (Timeout & Direct Excel Access)
* **High-Priority Modal**: Styled with `position: fixed; inset: 0; z-index: 9999;` to ensure top-level presentation on all viewports.
* **Direct Excel Access**: Includes an emerald-accented callout card with an **"Open Excel Sheet"** button that opens `Effort Tracker - Simplicity.xlsx` in Excel Online (`_blank`) with download flags stripped.
* **Informative Diagnostics**: Explains Outlook queue delivery times, Microsoft 365 traffic considerations, and instructs developers to verify Power Automate flow run history.
* **Retry Check Button**: Allows immediate re-polling of SharePoint Online without re-submitting duplicate entries.

### 3.5. `AdoTicketSelector.jsx` (Azure DevOps Modal)
* Connects directly to Azure DevOps REST API via Spring Boot backend.
* Displays assigned work items in `Development` state with story points, ticket IDs, and titles.
* Automatically identifies and tags tickets containing unresolved Pull Request review comments (`PR comments`).
* Checkbox selection automatically triggers equal division of available hours.

### 3.6. `DashboardView.jsx` (Managerial Analytics & Compliance Suite)
* **Executive Metrics**: Total logged hours, sprint rows, active velocity, productivity ratio.
* **Leaderboards**: Team ranking by logged hours, task completion volume, and overhead call distribution.
* **Quality & Compliance**: Flags developers with missing logs or non-compliant category/description inputs.
* **Missing Log Reason Dialog**: Allows managers and developers to document official absence/missing log reasons, persisting them to `missing_log_reasons.json`.
* **Story Points vs. Effort Correlation**: Visualizes estimation accuracy by comparing story points against logged hours.

### 3.7. `ConfigModal.jsx` (Application Settings)
* **Tab 1: Azure DevOps**: Configure Organization URL, Project Name, and Personal Access Token (PAT) with live connection testing.
* **Tab 2: Excel & Safety**: Master file path configuration, SharePoint Online URL, Power Automate webhook endpoint, and Resend email credentials with built-in test ping triggers.

---

## 4. Design System & Responsive Philosophy

### 4.1. Design Tokens & CSS Variables (`index.css`)
* `--bg-main`, `--bg-surface`, `--bg-card`: Tiered surface backgrounds with dark glassmorphism.
* `--primary`: `#3b82f6` (Accent blue).
* `--success`: `#10b981` (Emerald green).
* `--warning`: `#f59e0b` (Amber).
* `--danger`: `#ef4444` (Coral red).
* `--font-sans`: Inter, system-ui, sans-serif.
* `--font-mono`: JetBrains Mono, Fira Code, monospace.

### 4.2. Mobile-First Responsiveness (`App.css`)
* **Breakpoints**: Desktop ($>1024\text{px}$), Tablet ($768\text{px} - 1024\text{px}$), Mobile ($\le 768\text{px}$), Small Smartphone ($\le 480\text{px}$).
* **Desktop View**: Wide spreadsheet layout matching Excel column conventions.
* **Mobile View**: Converts table rows into individual card items (`.task-row`), stacking ticket number, category, hours stepper, and description into full-width touch-friendly inputs with 44px minimum touch targets.
* **No Horizontal Scrolling**: Eliminates horizontal overflow on mobile screens.

---

## 5. Local Development & Build Scripts

### 5.1. Requirements
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 5.2. Installation & Running Locally
```bash
# Install dependencies
npm install

# Start Vite development server (HMR enabled)
npm run dev
```
*Accessible at: `http://localhost:5173`*

### 5.3. Production Build
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```
*Build artifacts generated in `/dist`.*

---

## 6. Environment & Deployment Configuration

### 6.1. Proxy Configuration (`vite.config.js`)
When running locally, Vite proxies API requests to the Spring Boot backend:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
});
```

### 6.2. Production Deployment (Netlify)
Configured via `netlify.toml`:
```toml
[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"

[[redirects]]
  from = "/api/*"
  to = "https://eodupdater.onrender.com/api/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```
This enables seamless SPA client-side routing and forwards `/api/*` calls securely to the Render cloud backend.
