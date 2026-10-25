# Simplicity EOD • Automated Excel Effort Tracker

A modern, full-stack application built with **React.js** and **Spring Boot (Java 17)** to automate daily End-Of-Day (EOD) logging into your team's sprint Excel tracker (`Effort Tracker - Simplicity.xlsx`).

---

## 🚀 Key Features

* **Azure DevOps Live Import**: Fetches your work items assigned in `Development` state, as well as PR tickets that have unresolved code review comments (`PR comments`) from `simplicitysystems/SimplicityCollect`.
* **Equal Hours Auto-Distribution**: Check any number of tickets, and the system automatically divides your remaining development hours equally across the selected tickets.
* **Automated Daily Recurring Calls**: Automatically detects day of week and pre-populates calls:
  * **Mon – Wed**: `0.5h` Internal standup + `1.0h` Technical and standup calls (Leaves `6.5h` for tickets).
  * **Thursday**: `0.5h` Internal standup + `1.0h` Technical and standup calls + `1.0h` office hours call (Leaves `5.5h` for tickets).
  * **Friday**: `0.5h` Internal standup + `0.5h` technical training call (Leaves `7.0h` for tickets).
* **SharePoint Online Live Sync**: Seamlessly syncs your daily tasks directly into the cloud file on SharePoint (`psiog0-my.sharepoint.com`) using Windows Office SSO — no API keys or Azure app registration needed!
* **Dual Persistence**: Saves to both your local backup Excel file and commits to the live cloud SharePoint tracker simultaneously.
* **Auto Sprint Detection**: Automatically calculates current sprint sheet based on your formula `2.<year_offset>.<month>.<sprint_index>` (e.g., `2.14.10.1` for October 2026, 2nd sprint).
* **Multi-Task Daily Logging**: Add dynamic task rows for the day with Ticket IDs, Categories, Hours stepper, and Descriptions.
* **Daily Total Hours Gauge**: Live animated progress bar showing daily hours target (`8.0 hrs`) with overtime and completion badges.
* **Quick Task Templates**: 1-click presets for Standup (`0.5h`), Client Calls (`1.0h`), PR Reviews (`1.0h`), and QA Testing.
* **Dual Access Modes**:
  1. **Direct File Sync**: Updates local or OneDrive/SharePoint synced Excel files directly on disk.
  2. **Upload & Download**: Upload any workbook, append rows, and download the updated spreadsheet.
* **Live Recent Entries**: Browse and search recent team entries, filter by *"My Entries Only"*, and view color-coded category tags.
* **Automatic Safety Backups**: Creates a timestamped `.bak.xlsx` backup in `.backups/` before any write operation.
* **Modern UI & Dark/Light Theme**: Glassmorphism design tokens, subtle animations, and instant theme switching.

---

## 🛠️ Technology Stack

* **Backend**: Spring Boot 3.2.5, Java 17 LTS, Maven 3.8.5, Apache POI 5.2.5 (OOXML Excel engine).
* **Frontend**: React 18, Vite 8, Vanilla CSS Design System, Lucide Icons, Canvas Confetti.

---

## 🏃 Quick Start

Both servers are currently active:
* **Frontend UI**: [http://localhost:5173](http://localhost:5173)
* **Backend API**: [http://localhost:8080/api/eod/status](http://localhost:8080/api/eod/status)

To launch the app at any time:
Double-click [start.bat](file:///c:/Users/aravindhan.chandrase/Desktop/important%20notes/Spring%20Boot/Project/EodUpdater/start.bat) or run:
```bash
# Terminal 1: Backend
cd backend
mvn spring-boot:run

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 📊 Excel Sheet Format

| Column | Header | Type | Example |
| :--- | :--- | :--- | :--- |
| **A** | `Date` | Excel Date (`m/d/yyyy`) | `10/20/2026` |
| **B** | `Name` | Text | `Aravindhan` |
| **C** | `Ticket` | Text / Numeric (Optional) | `5146` |
| **D** | `Category` | Dropdown Tag | `Development` |
| **E** | `Time (in hrs)`| Numeric | `4.0` |
| **F** | `Description` | Text | `EOD Automation App verification` |
