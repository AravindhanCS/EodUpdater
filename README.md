# Simplicity EOD • Automated Excel Effort Tracker

A modern, full-stack enterprise application built with **React 18** and **Spring Boot (Java 17 LTS)** to automate daily End-Of-Day (EOD) logging, Azure DevOps integration, and sprint analytics for the **SimplicityCollect** team (`Effort Tracker - Simplicity.xlsx`).

> 📖 **Comprehensive System Documentation**: For exhaustive architectural diagrams, endpoint specifications, and data flow details, view [PROJECT_DOCUMENTATION.md](file:///c:/Users/aravindhan.chandrase/Desktop/important%20notes/Spring%20Boot/Project/EodUpdater/PROJECT_DOCUMENTATION.md).

---

## 🚀 Key Features

* **Azure DevOps Live Import**: Fetches your work items assigned in `Development` state, as well as PR tickets that have unresolved code review comments (`PR comments`) from `simplicitysystems/SimplicityCollect`.
* **Equal Hours Auto-Distribution**: Select any number of tickets, and the system automatically divides your remaining development hours equally across the selected tickets in clean half-hour intervals.
* **Automated Daily Recurring Calls**: Detects the day of the week and pre-populates recurring meetings:
  * **Mon – Wed**: `0.5h` Internal standup + `1.0h` Technical and standup calls (Leaves `4.5h` for dev based on 6.0h target).
  * **Thursday**: `0.5h` Internal standup + `1.0h` Technical and standup calls + `1.0h` office hours call (Leaves `3.5h` for dev).
  * **Friday**: `0.5h` Internal standup + `0.5h` technical training call (Leaves `5.0h` for dev).
* **Configurable Daily Target Hours (6.0h Default)**: The daily target hours is interactive and editable directly on the UI (`Daily Total: [ Total ] / [ 6.0 ] hrs`), persisting automatically in browser `localStorage`.
* **Non-Negative Hours Badge**: When hours exceed the daily target, the badge cleanly indicates **`🎯 +X.Xh extra`** with a green success badge instead of displaying confusing negative values.
* **100% Smartphone Friendly**: On mobile viewports ($\le 768\text{px}$), the table transforms into dedicated **Mobile Task Cards** with full-width inputs, touch-friendly 44px targets, and non-repeating custom SVG chevrons.
* **Managerial Intelligence & Analytics Dashboard**: Features executive KPIs, velocity tracking, quality & compliance audits, reason logging for missing days, and story points estimation comparisons.
* **SharePoint Online Live Sync**: Seamlessly syncs your daily tasks directly into the cloud file on SharePoint (`psiog0-my.sharepoint.com`) using Windows Office SSO and direct web endpoints.
* **Dual Persistence & Safety Backups**: Writes to both the local disk file and the cloud SharePoint tracker simultaneously, creating timestamped `.bak.xlsx` files in `.backups/` before every edit.
* **Auto Sprint Detection**: Calculates active sprint sheet dynamically (`2.<year_offset>.<month>.<sprint_index>`, e.g., `2.14.10.1`).
* **Modern Dual Design System**: Rich Dark and Light themes with high contrast, glassmorphism tokens, and micro-interactions.

---

## 🛠️ Technology Stack

* **Backend**: Spring Boot 3.2.5, Java 17 LTS, Maven 3.8.5, Apache POI 5.2.5 (OOXML Excel engine).
* **Frontend**: React 18, Vite 8, Vanilla CSS Design System, Lucide Icons, Canvas Confetti.
* **Deployments**: Netlify (Frontend) + Render (Backend) with GitHub CI/CD automation.

---

## 🌐 Live Deployments

* **Frontend**: [https://eod-updater-frontend.netlify.app](https://eod-updater-frontend.netlify.app)
* **Backend**: [https://eodupdater.onrender.com](https://eodupdater.onrender.com)
* **Repository**: [https://github.com/AravindhanCS/EodUpdater.git](https://github.com/AravindhanCS/EodUpdater.git)

---

## 🏃 Quick Start (Local Development)

### 1-Click Launch
Double-click [start.bat](file:///c:/Users/aravindhan.chandrase/Desktop/important%20notes/Spring%20Boot/Project/EodUpdater/start.bat) to launch both services simultaneously.

### Manual Launch
```bash
# Terminal 1: Backend (Spring Boot)
cd backend
mvn spring-boot:run

# Terminal 2: Frontend (Vite)
cd frontend
npm install
npm run dev
```

* **Frontend UI**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:8080/api/eod/status](http://localhost:8080/api/eod/status)

---

## 📊 Excel Sheet Format (`Effort Tracker - Simplicity.xlsx`)

| Column | Header | Type | Example |
| :---: | :--- | :--- | :--- |
| **A** | `Date` | Excel Date (`m/d/yyyy`) | `10/26/2026` |
| **B** | `Name` | Text | `Aravindhan` |
| **C** | `Ticket` | Text / Numeric (Optional) | `5146` |
| **D** | `Category` | Dropdown Tag | `Development` |
| **E** | `Time (in hrs)`| Numeric | `4.5` |
| **F** | `Description` | Text | `Implemented sprint analytics dashboard` |
