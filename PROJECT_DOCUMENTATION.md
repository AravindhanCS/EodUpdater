# Simplicity EOD Updater — Master System Documentation

---

## 1. Executive Summary & Purpose

The **Simplicity EOD Updater** is an enterprise-grade full-stack productivity and automation system developed for the engineering team on the **SimplicityCollect** project (`simplicitysystems` on Azure DevOps). It transforms daily End-of-Day (EOD) effort tracking from a manual, error-prone chore into a streamlined 1-click cloud-synced workflow.

### 1.1. The Problem Space
Historically, engineering teams tracked effort manually in a shared cloud spreadsheet (`Effort Tracker - Simplicity.xlsx`) on Microsoft SharePoint Online:
1. **Manual Friction**: Engineers had to manually look up ticket numbers on Azure DevOps, compute sprint sheet names, remember recurring daily meeting durations, manually divide remaining hours across tasks, and type rows into Excel.
2. **Spreadsheet Corruption & Line Break Bugs**: Concurrent editing and plain-text email parsing caused line wraps at word boundaries (e.g., `"Internal\ncalls"`, `"Client\ncalls"`), breaking row heights and cell formatting.
3. **Data Inconsistency & Stale Views**: Team members viewed out-of-date local files or speculative entries that had not yet been confirmed in SharePoint.
4. **Managerial Visibility Gaps**: Engineering leads lacked an automated dashboard to track sprint velocity, log compliance, missing effort reasons, and story point accuracy.
5. **Mobile Inaccessibility**: Excel Online on mobile devices is cumbersome, preventing developers from updating their effort while commuting or away from their workstations.

### 1.2. The Solution
The **Simplicity EOD Updater** unites a **React 18 + Vite** smartphone-friendly frontend with a **Spring Boot 3 (Java 17 LTS)** backend. It integrates **Azure DevOps**, **Microsoft SharePoint Online**, **Resend Cloud Email Automation**, and **Microsoft Power Automate** into an automated pipeline with live verification and diagnostic recovery tools.

---

## 2. End-to-End System Architecture

```mermaid
flowchart TD
    subgraph Client ["Frontend Client (React 18 + Vite SPA)"]
        UI["Modern Web & Mobile UI"]
        DailyForm["DailyTaskForm<br/>(Recurring Rules & Sanitization)"]
        AdoModal["AdoTicketSelector<br/>(WIQL Tickets & PR Comments)"]
        Monitor["SharePoint Live Verification Monitor<br/>(Polling & Epsilon Matching)"]
        Dashboard["DashboardView<br/>(Analytics, Compliance, Audits)"]
        SyncModal["SyncStatusModal<br/>(Direct Excel Access on Timeout)"]
    end

    subgraph Backend ["Spring Boot Backend Service (:8080)"]
        EodCtrl["EodController & AdoController"]
        ExcelSvc["ExcelService<br/>(Apache POI & HTTP Sync Engine)"]
        AdoSvc["AzureDevOpsService<br/>(REST API Client + PAT Storage)"]
        ResendSvc["ResendEmailSyncService<br/>(Cloud MIME Email Generator)"]
        SchedSvc["ScheduleService<br/>(Meeting Allocations)"]
        SprintSvc["SprintCalculationService<br/>(2.YY.MM.S Formula Engine)"]
    end

    subgraph CloudAutomation ["Cloud Automation Infrastructure"]
        Resend["Resend Cloud API<br/>(api.resend.com)"]
        Outlook["Microsoft 365 Exchange<br/>(aravindhan.chandrasekaran@psiog.com)"]
        PowerAutomate["Microsoft Power Automate<br/>(EOD Tracker Sync Flow)"]
        OfficeScript["Excel Online Office Script<br/>(AppendEodRow — Batch Optimized)"]
        SharePoint["SharePoint Online Cloud Excel<br/>(Effort Tracker - Simplicity.xlsx)"]
    end

    subgraph External ["Azure DevOps Cloud"]
        ADO["Azure DevOps API<br/>(simplicitysystems / SimplicityCollect)"]
    end

    UI --> DailyForm
    DailyForm -->|Submit JSON| EodCtrl
    AdoModal <-->|Query Tickets| AdoSvc
    AdoSvc <-->|WIQL & PR REST API| ADO

    EodCtrl --> ResendSvc
    EodCtrl --> ExcelSvc
    ExcelSvc --> SprintSvc
    EodCtrl --> SchedSvc

    ResendSvc -->|HTTPS POST| Resend
    Resend -->|MIME Email [EOD-UPDATE]| Outlook
    Outlook -->|Email Trigger V3| PowerAutomate
    PowerAutomate -->|Parse JSON & Run Script| OfficeScript
    OfficeScript -->|Atomic 2D Batch Write| SharePoint

    Monitor -->|Continuous Polling every 4.5s| EodCtrl
    EodCtrl -->|Direct HTTP Sync with download=1| SharePoint
    Monitor -->|Timeout (>50s)| SyncModal
    SyncModal -->|Direct Excel Online URL| SharePoint
```

---

## 3. Four Synchronization Modes

The system supports four distinct operational modes designed for maximum resilience across cloud and local environments:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SYNCHRONIZATION MODES                           │
├────────────────────────────────┬───────────────────────────────────────┤
│ 1. Cloud Email Automation      │ • Production Default                  │
│    (Resend + Power Automate)   │ • Works from Render/Cloud & Windows   │
│                                │ • Triggers Office Script in Excel Web │
├────────────────────────────────┼───────────────────────────────────────┤
│ 2. Direct Webhook Mode         │ • Alternative Cloud Flow              │
│    (Power Automate Webhook)    │ • Direct HTTP POST to MS Flow webhook │
├────────────────────────────────┼───────────────────────────────────────┤
│ 3. Windows Desktop COM Mode    │ • Local Windows Fallback              │
│    (PowerShell + Excel.App)    │ • Uses corporate Windows SSO token    │
├────────────────────────────────┼───────────────────────────────────────┤
│ 4. Offline / Upload Mode       │ • Standalone Offline Mode             │
│    (Apache POI + Backups)      │ • Local disk file + manual download   │
└────────────────────────────────┴───────────────────────────────────────┘
```

### Mode 1: Cloud Email Automation (Primary Production Pipeline)
1. **Frontend Dispatch**: Engineer clicks **Update EOD Excel**.
2. **Backend Dispatch**: `ResendEmailSyncService.java` serializes the sanitized payload into JSON, wraps it inside `<pre style="white-space:pre-wrap;font-family:monospace;">`, and sends an email via `https://api.resend.com/emails` from `onboarding@resend.dev` to `aravindhan.chandrasekaran@psiog.com` with subject `[EOD-UPDATE]`.
3. **Power Automate Trigger**: Microsoft Power Automate flow triggers on `When a new email arrives (V3)` filtered by subject `[EOD-UPDATE]`.
4. **Execution**: Flow executes `Html to text` $\rightarrow$ `Parse JSON` $\rightarrow$ `Run script` calling the optimized ExcelScript `AppendEodRow` in SharePoint Online.
5. **No Local Speculative Pollution**: The local file is **not** speculatively updated with unconfirmed entries. SharePoint Online remains the single source of truth.

### Mode 2: Power Automate Direct Webhook
If `eod.powerautomate.webhook-url` is configured, Spring Boot executes an HTTP POST request directly against the Power Automate HTTP trigger endpoint, passing JSON payload without email intermediate.

### Mode 3: Local Windows COM Automation (`sync_sharepoint.ps1`)
Used on local Windows machines when running in corporate intranet:
* Launches PowerShell with execution policy bypass.
* Initializes `$excel = New-Object -ComObject Excel.Application`.
* Opens workbook via SharePoint WebDAV URL with existing Windows SSO credentials.
* Injects rows and executes workbook save.

### Mode 4: Standalone Offline & Manual Upload/Download
* Saves rows directly into the local master Excel file via Apache POI `XSSFWorkbook`.
* Creates an automated timestamped backup in `.backups/*.bak.xlsx` before writing.
* If file is locked by WPS Office or Excel, cleanly reports lock status.
* Supports **Upload & Download mode** where users drag-and-drop their Excel file and download the updated workbook directly.

---

## 4. Nuance Deep Dive: Cell Line Break & CRLF Elimination

### 4.1. The Root Cause Analysis
In earlier releases, cells in SharePoint Online showed awkward line breaks (e.g., `"Internal\ncalls"`, `"Client\ncalls"`, `"PIN\n1581 - Auth..."`).
Investigation proved the issue stemmed from a multi-hop pipeline behavior:
1. **MIME RFC Plain Text Wrapping**: Standard SMTP / MIME mail format automatically breaks plaintext lines at 70–78 characters.
2. **Power Automate `Html to text` Behavior**: When Power Automate converts email HTML to plain text, it inserts line break characters (`\r\n` or `\n`) at whitespace boundaries.
3. **JSON Parse Persistence**: `Parse JSON` in Power Automate treats those newline characters as valid string literals inside JSON properties.
4. **Excel Cell Multi-Line Rendering**: When Office Script wrote these strings to cells without sanitization, Excel Online formatted them as multi-line wrapped text.

### 4.2. The 4-Layer Defense Solution
To permanently eliminate cell newlines, a 4-layer defense was engineered across the stack:

| Layer | Component | Mechanism |
| :--- | :--- | :--- |
| **Layer 1** | Frontend (`DailyTaskForm.jsx`) | `cleanStr(s)` regex replaces all `[\r\n]+` with a space and collapses multiple spaces before submitting. |
| **Layer 2** | Backend (`ResendEmailSyncService.java`) | `cleanText(s)` sanitizes all fields, and wraps JSON payload inside `<pre style="white-space:pre-wrap;font-family:monospace;">` to prevent Outlook MIME wrapping. |
| **Layer 3** | Backend (`ExcelService.java`) | `cleanCellStr(s)` strips all `\r` and `\n` characters during both reading (`getRecentEntries`) and writing (`appendEntries`, `appendEntriesToStream`). |
| **Layer 4** | Office Script (`AppendEodRow`) | TypeScript `clean()` function sanitizes all inputs and explicitly calls `targetRange.getFormat().setWrapText(false)`. |

---

## 5. Nuance Deep Dive: Office Script (`AppendEodRow`)

### 5.1. Enterprise Tenant Strict Typing (`no-explicit-any`)
Microsoft 365 Excel Online enforces strict TypeScript compilation rules in enterprise tenants. Any usage of `val: any` triggers:
> `Bad Request Linter error: Explicit Any is not allowed`

The Office Script is strictly typed using union types `string | number | boolean | undefined` with **zero** `any` keywords.

### 5.2. Batch Writing Optimization (5x–10x Speedup)
* **Traditional Antipattern**: Calling `sheet.getRangeByIndexes()` and `rowRange.setValues()` in a `for` loop makes a separate synchronous REST roundtrip for every row.
* **Batch Architecture**: The script maps all entries in memory into a 2D matrix `(string | number | boolean)[][]` and issues a **single atomic `.setValues(rows)` call**. This executes in under 2 seconds and prevents Power Automate timeout errors.

### 5.3. Production-Ready Office Script Source Code

```typescript
function main(workbook: ExcelScript.Workbook, sheetName: string, entries: Entry[]) {
    // 1. Guard against empty or null entries
    if (!entries || entries.length === 0) {
        return;
    }

    // 2. Get or create target sprint worksheet
    let sheet = workbook.getWorksheet(sheetName);
    if (!sheet) {
        sheet = workbook.addWorksheet(sheetName);
        let header = sheet.getRange("A1:F1");
        header.setValues([["Date", "Name", "Ticket", "Category", "Time (in hrs)", "Description"]]);
        header.getFormat().getFont().setBold(true);
        header.getFormat().getFill().setColor("#4472C4");
        header.getFormat().getFont().setColor("#FFFFFF");
    }

    // 3. Helper to strip line breaks and collapse spaces (strictly typed without 'any')
    function clean(val: string | number | boolean | undefined): string {
        if (val === undefined || val === null) {
            return "";
        }
        return String(val)
            .replace(/[\r\n]+/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    // 4. Find the next empty row index (0-indexed)
    let usedRange = sheet.getUsedRange();
    let nextRow = usedRange ? usedRange.getRowCount() : 1;

    // 5. BATCH OPTIMIZATION: Prepare 2D array in memory
    let rows: (string | number | boolean)[][] = entries.map(entry => [
        clean(entry.date),
        clean(entry.name),
        clean(entry.ticket),
        clean(entry.category),
        typeof entry.timeInHrs === "number" ? entry.timeInHrs : (parseFloat(clean(entry.timeInHrs)) || 0),
        clean(entry.description)
    ]);

    // 6. SINGLE ATOMIC WRITE: Write all rows in one operation
    let targetRange = sheet.getRangeByIndexes(nextRow, 0, rows.length, 6);
    targetRange.setValues(rows);

    // 7. Prevent Excel from wrapping text into multiple vertical lines
    targetRange.getFormat().setWrapText(false);
}

interface Entry {
    date: string;
    name: string;
    ticket: string;
    category: string;
    timeInHrs: number;
    description: string;
}
```

---

## 6. Nuance Deep Dive: Live SharePoint Verification Engine

### 6.1. The User Flow
1. **User clicks "Update EOD Excel"**:
   * Form dispatches entries to `/api/eod/submit`.
   * Form enters `isSubmitting = false` and activates `isVerifying = true`.
2. **Cloud Sync Monitor Appears**:
   * The **Recent Sprint Entries** card docks a glassmorphic monitor above the table.
   * A live elapsed counter starts: `⏱ Checking cloud: 14s / 50s`.
   * An animated gradient shimmer bar indicates active progress.
   * Chips represent each submitted task (e.g. `[#5144 Development • 2.5h]`).
3. **Non-Spinning Sync Button**:
   * Traditional spinning wheels are replaced with a calm executive style.
   * Status dots: `.ready` (green glow), `.syncing` (cyan pulse), `.verifying` (violet breathing glow).
4. **Continuous Cloud Polling**:
   * Every 4.5 seconds, the frontend polls `/api/eod/recent-entries?sheetName=...&forceRefresh=true`.
   * Backend bypasses its 20-second cache and pulls directly from SharePoint Online via HTTP.
5. **Epsilon Task Matching Algorithm**:
   ```javascript
   const checkEntriesMatchInSharePoint = (fetchedEntries, submittedEntries) => {
     if (!submittedEntries || submittedEntries.length === 0) return true;
     if (!fetchedEntries || fetchedEntries.length === 0) return false;

     return submittedEntries.every(sub => {
       return fetchedEntries.some(item => {
         const userMatch = item.name && sub.name && item.name.trim().toLowerCase() === sub.name.trim().toLowerCase();
         const catMatch = item.category && sub.category && item.category.trim().toLowerCase() === sub.category.trim().toLowerCase();
         const subTicket = (sub.ticket || '').trim().toLowerCase();
         const itemTicket = (item.ticket || '').trim().toLowerCase();
         const ticketMatch = (!subTicket && !itemTicket) || (subTicket === itemTicket);
         const subHrs = parseFloat(sub.timeInHrs) || 0;
         const itemHrs = parseFloat(item.timeInHrs) || 0;
         const hrsMatch = Math.abs(subHrs - itemHrs) < 0.05;
         return userMatch && catMatch && ticketMatch && hrsMatch;
       });
     });
   };
   ```
6. **On Confirmation (Match Found)**:
   * Verification loop stops.
   * Confetti celebration triggers.
   * Simple, professional toast notification displays:
     > *"Successfully synced with SharePoint Online! 4 task(s) confirmed in sheet '2.14.11.0'."*
   * Table updates with live SharePoint rows. No heavy modal interrupts the user.
7. **On Safety Timeout (50s threshold)**:
   * Verification loop stops.
   * Opens `SyncStatusModal` with `type="timeout"`.
   * Shows a prominent **"Open Excel Sheet"** button opening `Effort Tracker - Simplicity.xlsx` in Excel Online so the developer can update manually if Microsoft 365 is lagging.
   * Provides a **"Check SharePoint Again"** button to re-poll without resubmitting duplicate rows.

---

## 7. Nuance Deep Dive: Direct HTTP SharePoint Download

### 7.1. Cross-Platform Direct Download
In `ExcelService.java`, the method `pullLatestFromSharePoint(filePath)` downloads the workbook directly across Windows, Linux, and Docker environments:
1. Appends `download=1` query parameter to the SharePoint sharing link.
2. Initializes an `HttpClient` with an permissive `CookieManager` (`CookiePolicy.ACCEPT_ALL`) and redirect following.
3. Sets standard Chrome user-agent headers to bypass basic crawler checks.
4. Validates ZIP magic bytes (`PK\x03\x04` = `0x50, 0x4B, 0x03, 0x04`). If a Microsoft login page or HTML redirection is detected, it throws an actionable exception instructing the user to configure the sharing link to *"Anyone with the link can view"*.
5. Caches the workbook for 20 seconds (`SHAREPOINT_PULL_INTERVAL_MS = 20000`) to keep UI navigation fast and responsive.
6. Automatically pulls on Spring Boot startup via `@PostConstruct` or background task.

---

## 8. Nuance Deep Dive: Azure DevOps & Daily Schedule Engine

### 8.1. Azure DevOps Integration (`AzureDevOpsService.java`)
* **Authentication**: Uses Personal Access Tokens (PAT) stored encrypted/persisted in `ado_config.json` or `EOD_ADO_PAT` environment variable.
* **WIQL Queries**: Executes Work Item Query Language:
  ```sql
  SELECT [System.Id], [System.Title], [System.State], [Microsoft.VSTS.Scheduling.StoryPoints]
  FROM WorkItems
  WHERE [System.TeamProject] = 'SimplicityCollect'
    AND [System.AssignedTo] = @Me
    AND [System.State] = 'Development'
  ORDER BY [System.ChangedDate] DESC
  ```
* **Pull Request Code Review Tracking**: Inspects `/repositories/SimplicityCollect/pullRequests` for active PRs where the developer has unresolved reviewer comments, automatically categorizing those tickets as `PR comments`.

### 8.2. Daily Recurring Standup & Call Rules (`ScheduleService.java`)
The schedule service detects the day of the week and pre-populates recurring meetings:

| Day of Week | Meeting 1 | Meeting 2 | Meeting 3 | Dev Hours Remainder (6.0h Target) |
| :--- | :--- | :--- | :--- | :---: |
| **Monday** | 0.5h Internal standup | 1.0h Tech & standup calls | — | **4.5h** |
| **Tuesday** | 0.5h Internal standup | 1.0h Tech & standup calls | — | **4.5h** |
| **Wednesday** | 0.5h Internal standup | 1.0h Tech & standup calls | — | **4.5h** |
| **Thursday** | 0.5h Internal standup | 1.0h Tech & standup calls | 1.0h Office hours call | **3.5h** |
| **Friday** | 0.5h Internal standup | 0.5h Tech training call | — | **5.0h** |

### 8.3. Equal Half-Hour Distribution Algorithm (`hoursUtils.js`)
When $N$ tickets are selected, remaining developer hours are divided equally in half-hour increments:
```javascript
export function distributeHoursInHalfHours(totalHours, count) {
  if (count <= 0) return [];
  const totalHalfHours = Math.round(totalHours * 2);
  const base = Math.floor(totalHalfHours / count);
  let remainder = totalHalfHours % count;

  const result = [];
  for (let i = 0; i < count; i++) {
    let halfUnits = base;
    if (remainder > 0) {
      halfUnits += 1;
      remainder -= 1;
    }
    result.push(halfUnits / 2);
  }
  return result;
}
```

---

## 9. Nuance Deep Dive: Sprint Sheet Calculation & Detection

### 9.1. Sprint Sheet Formula
The active sprint sheet name follows the convention:
$$\text{Sprint Name} = 2.\langle\text{year\_offset}\rangle.\langle\text{month}\rangle.\langle\text{sprint\_index}\rangle$$
* `year_offset`: $\text{Year} - 2012$ (e.g., $2026 - 2012 = 14$).
* `month`: Calendar month ($1$ to $12$).
* `sprint_index`: $0$ for first sprint of the month, $1$ for second sprint.
* Example: `2.14.11.0` represents Sprint 0 of November 2026.

### 9.2. Sheet Auto-Detection & Sorting
When loading the workbook, the system parses all sheet names matching `/^(\d+)\.(\d+)\.(\d+)\.(\d+)/`, sorts them hierarchically by version numbers in descending order, and defaults to the newest sprint sheet.

---

## 10. Managerial Analytics & Compliance Suite (`DashboardView.jsx`)

The Analytics dashboard provides team leaders with actionable sprint intelligence:
* **Executive Metrics**: Total logged hours, sprint row count, team velocity, productivity index.
* **Velocity Leaderboard**: Ranks team members by total logged hours and ticket completion volume.
* **Overhead Distribution**: Visualizes ratio of Development vs. QA vs. Internal/Client calls.
* **Compliance & Audit Engine**:
  * Scans each team member for missing log dates within the active sprint.
  * Identifies entries lacking Azure DevOps ticket IDs or vague descriptions.
* **Official Missing Log Reason Logging**:
  * Developers or managers can document explanations for missing log days (e.g. sick leave, training, public holiday).
  * Reasons are stored in `missing_log_reasons.json` and rendered in compliance audits.
* **Story Points vs. Logged Effort Correlation**:
  * Compares Azure DevOps story points against actual Excel logged hours to measure estimation accuracy.

---

## 11. Complete REST API Reference

### 11.1. EOD & Spreadsheet Endpoints (`/api/eod`)

#### `GET /api/eod/status`
Returns server operational health, active sprint, configured paths, and SharePoint status.
* **Response**:
  ```json
  {
    "status": "UP",
    "configuredFilePath": "Effort Tracker - Simplicity.xlsx",
    "activeSprintName": "2.14.11.0",
    "sharePointUrl": "https://psiog0-my.sharepoint.com/:x:/...",
    "sheets": [
      { "name": "2.14.11.0", "rowCount": 45, "active": true }
    ],
    "teamMembers": ["Aravindhan", "Akshaya", "Arun", "Kriti", "Abinaya", "Uma"],
    "categories": ["Development", "QA", "Internal calls", "Client calls", "PR comments"]
  }
  ```

#### `GET /api/eod/recent-entries`
Fetches verified entries from the active sheet.
* **Parameters**:
  * `sheetName` (String): Sprint sheet name.
  * `filePath` (String, optional): Custom path.
  * `limit` (int, default 40): Number of recent entries.
  * `forceRefresh` (boolean, default false): Force SharePoint live download.

#### `POST /api/eod/submit`
Submits daily entries and dispatches cloud automation.
* **Request Body**:
  ```json
  {
    "sheetName": "2.14.11.0",
    "createSheetIfMissing": true,
    "entries": [
      {
        "date": "2026-10-27",
        "name": "Aravindhan",
        "ticket": "5144",
        "category": "Development",
        "timeInHrs": 2.5,
        "description": "Implemented payment authorization logic"
      }
    ]
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "message": "Successfully dispatched to SharePoint Online via Cloud Email Automation!",
    "sheetName": "2.14.11.0",
    "rowsAdded": 1,
    "totalHoursAdded": 2.5,
    "totalRows": 46,
    "backupPath": ".backups/Effort_Tracker_20261027_094000.bak.xlsx",
    "sharePointSynced": true
  }
  ```

#### `GET /api/eod/analytics`
Aggregates team rankings, compliance flags, and sprint KPIs.
* **Parameters**: `sheetName` (String), `filePath` (String, optional).

#### `POST /api/eod/missing-log-reason`
Records an official absence or missing log reason.
* **Request Body**:
  ```json
  {
    "developerName": "Aravindhan",
    "date": "2026-10-26",
    "reason": "Attended company security workshop"
  }
  ```

---

### 11.2. Azure DevOps & Scheduling Endpoints (`/api/ado`)

#### `GET /api/ado/tickets`
Fetches assigned tickets in `Development` state and PR review tickets for user.
* **Parameters**: `assignedTo` (String, default: current user).

#### `GET /api/ado/schedule`
Calculates recurring meetings and remaining dev hours for a date.
* **Parameters**: `date` (YYYY-MM-DD), `developerName` (String).

#### `GET /api/ado/config` & `POST /api/ado/config`
Retrieves or updates Azure DevOps organization URL, project name, and PAT.

#### `POST /api/ado/test`
Validates Azure DevOps connectivity and token validity.

---

## 12. Complete Environment Variables Specification

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | Optional | `8080` | Spring Boot HTTP listening port. |
| `EOD_SHAREPOINT_URL` | Recommended | Built-in Simplicity URL | Sharing URL for `Effort Tracker - Simplicity.xlsx`. |
| `RESEND_API_KEY` | Recommended | `""` | Resend API key for cloud email automation. |
| `RESEND_FROM_EMAIL` | Optional | `onboarding@resend.dev` | Sender address verified in Resend. |
| `RESEND_TO_EMAIL` | Optional | `aravindhan.chandrasekaran@psiog.com` | Target recipient address monitored by Power Automate. |
| `RESEND_SUBJECT` | Optional | `[EOD-UPDATE]` | Email subject trigger filter. |
| `POWER_AUTOMATE_WEBHOOK_URL`| Optional | `""` | HTTP POST webhook URL for direct flow trigger. |
| `EOD_ADO_PAT` | Optional | Loaded from `ado_config.json` | Azure DevOps Personal Access Token. |
| `ADO_ORG` | Optional | `https://dev.azure.com/simplicitysystems` | Azure DevOps organization URL. |
| `ADO_PROJECT` | Optional | `SimplicityCollect` | Azure DevOps project name. |
| `EOD_FILE_PATH` | Optional | `Effort Tracker - Simplicity.xlsx` | Default local master Excel path. |

---

## 13. Production Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 PRODUCTION CLOUD TOPOLOGY                   │
├──────────────────────────────┬──────────────────────────────┤
│ Frontend (Netlify SPA)       │ Backend (Render Container)   │
│ URL: eod-updater-frontend.   │ URL: eodupdater.onrender.com │
│      netlify.app             │ Runtime: Java 17 / Maven     │
│ Rewrites: /api/* -> Render   │ Dockerfile / render.yaml     │
└──────────────────────────────┴──────────────────────────────┘
```

### 13.1. Netlify Frontend (`netlify.toml`)
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

### 13.2. Render Backend (`render.yaml`)
```yaml
services:
  - type: web
    name: eod-updater-backend
    runtime: image
    image:
      url: maven:3.9.6-eclipse-temurin-17
    plan: free
    buildCommand: mvn clean package -DskipTests
    startCommand: java -jar target/eod-updater-backend-1.0.0.jar
```

---

## 14. Troubleshooting & Diagnostic Guide

### 14.1. Power Automate Linter Error: `Explicit Any is not allowed`
* **Symptom**: Power Automate run fails with `Bad Request: Linter error: Explicit Any is not allowed`.
* **Cause**: Enterprise Microsoft 365 tenant disallows TypeScript `any` in Office Scripts.
* **Solution**: Replace Office Script in Excel Online with the typed version in Section 5.3 (uses `string | number | boolean | undefined`).

### 14.2. SharePoint Verification Timeout (>50s)
* **Symptom**: Verification monitor reaches 50s and presents timeout modal.
* **Causes**:
  1. High Microsoft 365 Outlook delivery traffic delaying email arrival.
  2. Power Automate flow run failure (check run history in `make.powerautomate.com`).
* **Actions**:
  1. Click **"Open Excel Sheet"** inside the modal to view or update SharePoint directly.
  2. Click **"Check SharePoint Again"** to re-poll without resubmitting duplicate entries.

### 14.3. Excel Cells Displaying Newlines / Multi-Line Wrapped Text
* **Symptom**: Text appears split vertically in Excel cells.
* **Cause**: Office Script is running older code without line break sanitization.
* **Solution**: Ensure Office Script contains the `clean()` function and `targetRange.getFormat().setWrapText(false)`.

### 14.4. Local File Locked by WPS Office or Excel
* **Symptom**: `Local file is currently open in Excel/WPS`.
* **Cause**: Windows file system lock on `.xlsx` files during write operations.
* **Solution**: Close the local file in WPS Office or Excel, or switch to Cloud Email Automation mode.
