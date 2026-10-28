# Simplicity EOD • Automated Excel Effort Tracker

[![Java 17](https://img.shields.io/badge/Java-17%20LTS-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2.5-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-purple.svg)](https://vitejs.dev/)
[![Apache POI](https://img.shields.io/badge/Apache%20POI-5.2.5-red.svg)](https://poi.apache.org/)
[![Netlify Status](https://img.shields.io/badge/Netlify-Deployed-00C7B7.svg)](https://eod-updater-frontend.netlify.app)
[![Render Status](https://img.shields.io/badge/Render-Active-46E3B7.svg)](https://eodupdater.onrender.com)

An enterprise-grade full-stack system built with **React 18** and **Spring Boot (Java 17 LTS)** that automates daily End-Of-Day (EOD) logging, Azure DevOps work item importing, sprint effort calculations, and direct synchronization with Microsoft SharePoint Online (`Effort Tracker - Simplicity.xlsx`).

> 📖 **Master Technical Documentation**: For exhaustive architectural diagrams, endpoint specifications, linter guidelines, and algorithm proofs, view [PROJECT_DOCUMENTATION.md](file:///c:/Users/aravindhan.chandrase/Desktop/important%20notes/Spring%20Boot/Project/EodUpdater/PROJECT_DOCUMENTATION.md).  
> 💻 **Frontend Architecture Guide**: For component trees, design system tokens, and state flow, view [frontend/README.md](file:///c:/Users/aravindhan.chandrase/Desktop/important%20notes/Spring%20Boot/Project/EodUpdater/frontend/README.md).

---

## 🚀 Key Highlights & Nuances

### 1. Cloud Email Automation & Multi-Tier Sync
* **Resend + Power Automate Integration**: Dispatches structured JSON email payloads via the Resend API to Microsoft 365, triggering a Power Automate flow that executes an Excel Online Office Script (`AppendEodRow`).
* **Direct Webhook Alternative**: Supports direct HTTP POST webhook invocation to trigger Power Automate without intermediate email.
* **Windows Desktop COM Automation**: Local fallback using PowerShell COM automation (`New-Object -ComObject Excel.Application`) utilizing existing Windows SSO corporate credentials.
* **Pure Offline Mode**: Standalone Apache POI spreadsheet engine with automated timestamped safety backups in `.backups/*.bak.xlsx`.

### 2. Live SharePoint Verification Engine
* **Real-Time Verification Monitor**: When clicking **Update EOD Excel**, Recent Entries docks an executive glassmorphic monitor with an elapsed timer (`⏱ Checking cloud: 14s / 50s`), gradient shimmer progress fill, and interactive task chips.
* **Continuous Cloud Polling**: Automatically polls SharePoint Online every 4.5s (`forceRefresh=true`) and runs fuzzy epsilon matching ($\Delta < 0.05\text{h}$) against submitted tasks.
* **Streamlined Success & Confetti**: Upon confirmation, triggers celebratory confetti and displays a simple, professional success notification without heavy modal interruptions.
* **Smart Timeout & Direct Excel Access**: If Microsoft 365 experiences queue lag (>50s), presents a diagnostic modal featuring a direct **"Open Excel Sheet"** button opening `Effort Tracker - Simplicity.xlsx` in Excel Online so developers can log manually if desired.
* **Calm Non-Spinning Sync**: Replaces generic spinning icons with calm, pulsing executive status dots (`.ready`, `.syncing`, `.verifying`).

### 3. Cell Line Break & CRLF Elimination (4-Layer Defense)
* Permanently solves the issue of multi-line stacked text (`"Internal\ncalls"`, `"Client\ncalls"`, `"PIN\n1581"`) caused by MIME wrapping and Power Automate `Html to text`.
* Enforces sanitization across all layers: Frontend regex (`cleanStr`), backend Resend pre-formatting (`<pre>` wrapper + `cleanText`), Spring Boot cell cleaning (`cleanCellStr`), and Office Script text wrapping prohibition (`setWrapText(false)`).

### 4. Fully Typed Office Script (Strict `no-explicit-any` Compliant)
* Complies with Microsoft 365 enterprise tenant linter rule (`Explicit Any is not allowed`).
* **Atomic 2D Batch Write**: Compiles all rows in memory into a 2D matrix `(string | number | boolean)[][]` and performs a single `.setValues(rows)` call (5x–10x faster than traditional loops, preventing Power Automate timeouts).

### 5. Azure DevOps Live Work Item Integration
* **Automated Ticket Fetching**: Uses WIQL to fetch assigned work items in `Development` state from `simplicitysystems/SimplicityCollect`.
* **Pull Request Code Review Tracking**: Automatically inspects active PRs and tags tickets with open review feedback as `PR comments`.
* **Equal Half-Hour Distribution**: Automatically splits remaining development hours equally across selected tickets in clean `0.5h` increments.

### 6. Automated Daily Recurring Meetings
Pre-populates recurring standups based on the day of the week:
* **Mon – Wed**: `0.5h` Internal standup + `1.0h` Client calls (Leaves `4.5h` for dev based on 6.0h target).
* **Thursday**: `0.5h` Internal standup + `1.0h` Client calls + `1.0h` Office hours call (Leaves `3.5h` for dev).
* **Friday**: `0.5h` Internal standup + `0.5h` Technical training call (Leaves `5.0h` for dev).
* **Editable Daily Target (6.0h Default)**: Target hours are editable directly on the UI and persist in `localStorage`.
* **Non-Negative Hours Badge**: When hours exceed the daily target, displays **`🎯 +X.Xh extra`** with a green badge instead of negative numbers.

### 7. 100% Smartphone Friendly (Mobile Task Cards)
* On screens $\le 768\text{px}$, spreadsheet tables transform into touch-friendly **Mobile Task Cards**.
* Features full-width inputs, touch-friendly 44px targets, non-repeating custom SVG chevrons, and zero horizontal scrolling.

### 8. Managerial Analytics & Compliance Dashboard
* **Executive Metrics**: Total logged hours, sprint row volume, team velocity, productivity index.
* **Team Leaderboards**: Velocity rankings, task completion counts, and overhead call distribution.
* **Compliance Audits**: Flags missing logs, missing descriptions, and missing tickets.
* **Official Missing Log Reason Logging**: Allows documenting absence/leave reasons, persisting to `missing_log_reasons.json`.
* **Story Points vs. Effort Accuracy**: Correlates Azure DevOps story points against logged Excel effort to evaluate estimation accuracy.

---

## 🛠️ Technology Stack

| Domain | Technology | Key Libraries & Specifications |
| :--- | :--- | :--- |
| **Backend** | Java 17 LTS | Spring Boot 3.2.5, Spring Web, Jackson JSON |
| **Excel Engine** | Apache POI 5.2.5 | OOXML (`XSSFWorkbook`), cell styling, date formats |
| **Cloud Automation** | Resend + MS Power Automate | REST API, MIME Email Trigger V3, Office Scripts |
| **Frontend** | React 18 + Vite 8 | SPA architecture, fast HMR, CSS design system |
| **Iconography & Effects**| Lucide React + Canvas Confetti | Bespoke SVG icons, celebratory micro-animations |
| **Deployment** | Netlify + Render | Automated GitHub CI/CD continuous deployment |

---

## 🌐 Live Deployments

* **Frontend Web App**: [https://eod-updater-frontend.netlify.app](https://eod-updater-frontend.netlify.app)
* **Backend API Service**: [https://eodupdater.onrender.com](https://eodupdater.onrender.com)
* **GitHub Repository**: [https://github.com/AravindhanCS/EodUpdater.git](https://github.com/AravindhanCS/EodUpdater.git)

---

## 🏃 Quick Start (Local Development)

### Prerequisites
* **Java 17 LTS** or higher
* **Maven 3.8+**
* **Node.js 18+** & **npm**

### 1-Click Launch
Double-click [start.bat](file:///c:/Users/aravindhan.chandrase/Desktop/important%20notes/Spring%20Boot/Project/EodUpdater/start.bat) to launch both services simultaneously.

### Manual Launch
```bash
# Terminal 1: Backend (Spring Boot :8080)
cd backend
mvn spring-boot:run

# Terminal 2: Frontend (Vite :5173)
cd frontend
npm install
npm run dev
```

* **Frontend UI**: [http://localhost:5173](http://localhost:5173)
* **Backend Health Check**: [http://localhost:8080/api/eod/status](http://localhost:8080/api/eod/status)

---

## 📊 Excel Sheet Schema (`Effort Tracker - Simplicity.xlsx`)

| Column | Header | Type | Format / Sample |
| :---: | :--- | :--- | :--- |
| **A** | `Date` | Date | `m/d/yyyy` (`10/27/2026`) |
| **B** | `Name` | String | `Aravindhan`, `Akshaya`, `Arun`, `Kriti`, `Abinaya`, `Uma` |
| **C** | `Ticket` | String / Numeric | Azure DevOps ID (`5144` or empty for meetings) |
| **D** | `Category` | String | `Development`, `QA`, `Internal calls`, `Client calls`, `PR comments` |
| **E** | `Time (in hrs)` | Numeric | Half-hour increments (`0.5`, `1.0`, `2.5`, `4.5`) |
| **F** | `Description` | String | Work item summary narrative |

---

## ⚙️ Environment Variables Specification

| Variable Name | Description | Recommended / Example Value |
| :--- | :--- | :--- |
| `EOD_SHAREPOINT_URL` | SharePoint sharing URL for live workbook | `https://psiog0-my.sharepoint.com/:x:/g/personal/...` |
| `RESEND_API_KEY` | Resend API key for cloud email automation | `re_xxxxxxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | Sender address verified in Resend | `onboarding@resend.dev` |
| `RESEND_TO_EMAIL` | Target email address monitored by Power Automate | `aravindhan.chandrasekaran@psiog.com` |
| `EOD_ADO_PAT` | Azure DevOps Personal Access Token | `YOUR_AZURE_DEVOPS_PAT` |
| `ADO_ORG` | Azure DevOps Organization URL | `https://dev.azure.com/simplicitysystems` |
| `ADO_PROJECT` | Azure DevOps Project Name | `SimplicityCollect` |
| `EOD_FILE_PATH` | Local master Excel file path | `Effort Tracker - Simplicity.xlsx` |
