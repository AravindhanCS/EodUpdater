package com.eod.updater.service;

import com.eod.updater.model.*;
import java.util.regex.Pattern;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;

@Service
public class ExcelService {

    private static final Logger log = LoggerFactory.getLogger(ExcelService.class);

    private final SprintCalculationService sprintService;
    private final ObjectMapper objectMapper;

    @Value("${eod.sharepoint.enabled:true}")
    private boolean sharePointEnabled;

    @Value("${eod.sharepoint.url:}")
    private String sharePointUrl;

    @Value("${eod.sharepoint.script-path:}")
    private String sharePointScriptPath;

    private static final String REASONS_FILE = "missing_log_reasons.json";
    private final Map<String, Map<String, String>> missingLogReasons = new java.util.concurrent.ConcurrentHashMap<>();

    public ExcelService(SprintCalculationService sprintService, ObjectMapper objectMapper) {
        this.sprintService = sprintService;
        this.objectMapper = objectMapper;
        loadMissingLogReasons();
    }

    public List<SheetInfo> getSheets(String filePath) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            return Collections.emptyList();
        }

        String currentSprint = sprintService.getCurrentSprintName();
        List<SheetInfo> list = new ArrayList<>();

        try (FileInputStream fis = new FileInputStream(file);
             Workbook workbook = WorkbookFactory.create(fis)) {
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                Sheet sheet = workbook.getSheetAt(i);
                String name = sheet.getSheetName();
                int rowCount = sheet.getPhysicalNumberOfRows();
                boolean isActive = name.equalsIgnoreCase(currentSprint);
                list.add(new SheetInfo(name, rowCount, isActive));
            }
        }
        return list;
    }

    public List<String> getTeamMembers(String filePath) {
        Set<String> members = new LinkedHashSet<>(Arrays.asList(
                "Aravindhan", "Akshaya", "Arun", "Kriti", "Abinaya", "Uma"
        ));

        File file = new File(filePath);
        if (file.exists()) {
            try (FileInputStream fis = new FileInputStream(file);
                 Workbook workbook = WorkbookFactory.create(fis)) {
                for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                    Sheet sheet = workbook.getSheetAt(s);
                    for (int r = 1; r <= Math.min(sheet.getLastRowNum(), 150); r++) {
                        Row row = sheet.getRow(r);
                        if (row != null) {
                            Cell cell = row.getCell(1);
                            if (cell != null && cell.getCellType() == CellType.STRING) {
                                String val = cell.getStringCellValue().trim();
                                if (!val.isEmpty()) {
                                    members.add(val);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Could not extract team members: {}", e.getMessage());
            }
        }
        return new ArrayList<>(members);
    }

    public List<String> getCategories(String filePath) {
        Set<String> categories = new LinkedHashSet<>(Arrays.asList(
                "Development", "QA", "Internal calls", "Client calls", "Dev chat issue", "PR comments", "N/A"
        ));

        File file = new File(filePath);
        if (file.exists()) {
            try (FileInputStream fis = new FileInputStream(file);
                 Workbook workbook = WorkbookFactory.create(fis)) {
                for (int s = 0; s < workbook.getNumberOfSheets(); s++) {
                    Sheet sheet = workbook.getSheetAt(s);
                    for (int r = 1; r <= Math.min(sheet.getLastRowNum(), 150); r++) {
                        Row row = sheet.getRow(r);
                        if (row != null) {
                            Cell cell = row.getCell(3); // Column D
                            if (cell != null && cell.getCellType() == CellType.STRING) {
                                String val = cell.getStringCellValue().trim();
                                if (!val.isEmpty()) {
                                    categories.add(val);
                                }
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Could not extract categories: {}", e.getMessage());
            }
        }
        return new ArrayList<>(categories);
    }

    public List<EodEntry> getRecentEntries(String filePath, String sheetName, int limit) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            return Collections.emptyList();
        }

        List<EodEntry> entries = new ArrayList<>();
        try (FileInputStream fis = new FileInputStream(file);
             Workbook workbook = WorkbookFactory.create(fis)) {
            Sheet sheet = (sheetName != null && !sheetName.isBlank())
                    ? workbook.getSheet(sheetName)
                    : workbook.getSheet(sprintService.getCurrentSprintName());

            if (sheet == null && workbook.getNumberOfSheets() > 0) {
                sheet = workbook.getSheetAt(workbook.getNumberOfSheets() - 1);
            }
            if (sheet == null) {
                return Collections.emptyList();
            }

            int lastRow = sheet.getLastRowNum();
            int startRow = Math.max(1, lastRow - limit + 1);

            DataFormatter formatter = new DataFormatter();
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");

            for (int r = lastRow; r >= startRow; r--) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String dateStr = "";
                Cell dateCell = row.getCell(0);
                if (dateCell != null) {
                    if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
                        Date d = dateCell.getDateCellValue();
                        if (d != null) {
                            dateStr = d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate().format(dateFormatter);
                        }
                    } else {
                        dateStr = formatter.formatCellValue(dateCell);
                    }
                }

                String name = formatter.formatCellValue(row.getCell(1));
                String ticket = formatter.formatCellValue(row.getCell(2));
                String category = formatter.formatCellValue(row.getCell(3));

                double hrs = 0.0;
                Cell hrsCell = row.getCell(4);
                if (hrsCell != null) {
                    if (hrsCell.getCellType() == CellType.NUMERIC) {
                        hrs = hrsCell.getNumericCellValue();
                    } else {
                        try {
                            hrs = Double.parseDouble(formatter.formatCellValue(hrsCell).trim());
                        } catch (Exception ignored) {}
                    }
                }

                String desc = formatter.formatCellValue(row.getCell(5));

                if (!name.isEmpty() || !desc.isEmpty()) {
                    entries.add(new EodEntry(dateStr, name, ticket, category, hrs, desc));
                }
            }
        }
        return entries;
    }

    public synchronized EodSubmitResponse appendEntries(String filePath, String targetSheetName,
                                                        boolean createSheetIfMissing,
                                                        List<EodEntry> entries) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new FileNotFoundException("Excel file not found at path: " + filePath);
        }

        // 1. Create a safe backup before writing
        String backupPath = createBackup(file);

        if (targetSheetName == null || targetSheetName.isBlank()) {
            targetSheetName = sprintService.getCurrentSprintName();
        }

        int rowsAdded = 0;
        double totalHoursAdded = 0.0;
        int totalRows;
        byte[] updatedBytes;

        try (FileInputStream fis = new FileInputStream(file);
             Workbook workbook = WorkbookFactory.create(fis)) {

            Sheet sheet = workbook.getSheet(targetSheetName);
            if (sheet == null) {
                if (createSheetIfMissing) {
                    sheet = createSprintSheet(workbook, targetSheetName);
                } else {
                    throw new IllegalArgumentException("Sheet '" + targetSheetName + "' does not exist in workbook");
                }
            }

            // Cell Styles for new data rows
            CellStyle dateStyle = createDateCellStyle(workbook);
            CellStyle textStyle = createTextCellStyle(workbook);
            CellStyle numStyle = createNumericCellStyle(workbook);

            int nextRowIndex = getNextEmptyRowIndex(sheet);

            for (EodEntry entry : entries) {
                Row row = sheet.createRow(nextRowIndex++);

                // Col 0: Date
                Cell c0 = row.createCell(0);
                LocalDate d = parseLocalDate(entry.getDate());
                Date dateVal = Date.from(d.atStartOfDay(ZoneId.systemDefault()).toInstant());
                c0.setCellValue(dateVal);
                c0.setCellStyle(dateStyle);

                // Col 1: Name
                Cell c1 = row.createCell(1, CellType.STRING);
                c1.setCellValue(entry.getName() != null ? entry.getName().trim() : "");
                c1.setCellStyle(textStyle);

                // Col 2: Ticket
                Cell c2 = row.createCell(2, CellType.STRING);
                c2.setCellValue(entry.getTicket() != null ? entry.getTicket().trim() : "");
                c2.setCellStyle(textStyle);

                // Col 3: Category
                Cell c3 = row.createCell(3, CellType.STRING);
                c3.setCellValue(entry.getCategory() != null ? entry.getCategory().trim() : "");
                c3.setCellStyle(textStyle);

                // Col 4: Time (in hrs)
                Cell c4 = row.createCell(4, CellType.NUMERIC);
                double hrs = entry.getTimeInHrs() != null ? entry.getTimeInHrs() : 0.0;
                c4.setCellValue(hrs);
                c4.setCellStyle(numStyle);
                totalHoursAdded += hrs;

                // Col 5: Description
                Cell c5 = row.createCell(5, CellType.STRING);
                c5.setCellValue(entry.getDescription() != null ? entry.getDescription().trim() : "");
                c5.setCellStyle(textStyle);

                rowsAdded++;
            }

            totalRows = sheet.getPhysicalNumberOfRows();

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                workbook.write(baos);
                updatedBytes = baos.toByteArray();
            }
        }

        boolean localUpdated = false;
        try {
            Files.write(file.toPath(), updatedBytes, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
            localUpdated = true;
        } catch (Exception e) {
            log.warn("Local file is locked (e.g. open in WPS Office / Excel): {}", e.getMessage());
        }

        boolean sharePointSynced = false;
        String message = localUpdated
                ? "Successfully updated local file"
                : "Local file is currently open in Excel/WPS";

        if (sharePointEnabled && sharePointUrl != null && !sharePointUrl.isBlank()) {
            try {
                log.info("Triggering direct cloud sync to SharePoint Online: {}", sharePointUrl);
                syncToSharePoint(targetSheetName, entries);
                sharePointSynced = true;
                message = "Successfully updated SharePoint Online Effort Tracker" + (localUpdated ? " and local copy!" : "!");
            } catch (Exception e) {
                log.error("Failed to sync directly to SharePoint: {}", e.getMessage(), e);
                message += " (Note: SharePoint sync failed: " + e.getMessage() + ")";
            }
        }

        return new EodSubmitResponse(
                true,
                message,
                targetSheetName,
                rowsAdded,
                totalHoursAdded,
                totalRows,
                backupPath,
                sharePointSynced
        );
    }

    public void syncToSharePoint(String targetSheetName, List<EodEntry> entries) throws IOException, InterruptedException {
        File tempJson = File.createTempFile("eod_entries_", ".json");
        try {
            objectMapper.writeValue(tempJson, entries);
            String scriptPath = (sharePointScriptPath != null && !sharePointScriptPath.isBlank())
                    ? sharePointScriptPath
                    : new File("sync_sharepoint.ps1").getAbsolutePath();

            ProcessBuilder pb = new ProcessBuilder(
                    "powershell.exe",
                    "-ExecutionPolicy", "Bypass",
                    "-File", scriptPath,
                    "-JsonFile", tempJson.getAbsolutePath(),
                    "-TargetSheet", targetSheetName,
                    "-SharePointUrl", sharePointUrl
            );
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                    log.info("[SharePointSync] {}", line);
                }
            }
            int exitCode = process.waitFor();
            if (exitCode != 0 || !output.toString().contains("SYNC_SUCCESS")) {
                throw new RuntimeException("PowerShell sync failed (exit code " + exitCode + "): " + output);
            }
        } finally {
            tempJson.delete();
        }
    }

    public void pullLatestFromSharePoint(String filePath) throws IOException, InterruptedException {
        File file = new File(filePath);
        String backupPath = createBackup(file);
        log.info("Created backup before SharePoint pull: {}", backupPath);

        String scriptPath = new File("pull_sharepoint.ps1").getAbsolutePath();
        ProcessBuilder pb = new ProcessBuilder(
                "powershell.exe",
                "-ExecutionPolicy", "Bypass",
                "-File", scriptPath,
                "-SharePointUrl", sharePointUrl,
                "-DestinationPath", filePath
        );
        pb.redirectErrorStream(true);
        Process process = pb.start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                log.info("[SharePointPull] {}", line);
            }
        }
        int exitCode = process.waitFor();
        if (exitCode != 0 || !output.toString().contains("LIVE_SHAREPOINT_PULL_SUCCESS")) {
            throw new RuntimeException("SharePoint pull failed (exit code " + exitCode + "): " + output);
        }
    }

    public byte[] appendEntriesToStream(InputStream inputStream, String targetSheetName,
                                        boolean createSheetIfMissing,
                                        List<EodEntry> entries) throws IOException {
        if (targetSheetName == null || targetSheetName.isBlank()) {
            targetSheetName = sprintService.getCurrentSprintName();
        }

        try (Workbook workbook = WorkbookFactory.create(inputStream);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.getSheet(targetSheetName);
            if (sheet == null) {
                if (createSheetIfMissing) {
                    sheet = createSprintSheet(workbook, targetSheetName);
                } else {
                    throw new IllegalArgumentException("Sheet '" + targetSheetName + "' does not exist");
                }
            }

            CellStyle dateStyle = createDateCellStyle(workbook);
            CellStyle textStyle = createTextCellStyle(workbook);
            CellStyle numStyle = createNumericCellStyle(workbook);

            int nextRowIndex = getNextEmptyRowIndex(sheet);

            for (EodEntry entry : entries) {
                Row row = sheet.createRow(nextRowIndex++);

                Cell c0 = row.createCell(0);
                LocalDate d = parseLocalDate(entry.getDate());
                Date dateVal = Date.from(d.atStartOfDay(ZoneId.systemDefault()).toInstant());
                c0.setCellValue(dateVal);
                c0.setCellStyle(dateStyle);

                Cell c1 = row.createCell(1, CellType.STRING);
                c1.setCellValue(entry.getName() != null ? entry.getName().trim() : "");
                c1.setCellStyle(textStyle);

                Cell c2 = row.createCell(2, CellType.STRING);
                c2.setCellValue(entry.getTicket() != null ? entry.getTicket().trim() : "");
                c2.setCellStyle(textStyle);

                Cell c3 = row.createCell(3, CellType.STRING);
                c3.setCellValue(entry.getCategory() != null ? entry.getCategory().trim() : "");
                c3.setCellStyle(textStyle);

                Cell c4 = row.createCell(4, CellType.NUMERIC);
                c4.setCellValue(entry.getTimeInHrs() != null ? entry.getTimeInHrs() : 0.0);
                c4.setCellStyle(numStyle);

                Cell c5 = row.createCell(5, CellType.STRING);
                c5.setCellValue(entry.getDescription() != null ? entry.getDescription().trim() : "");
                c5.setCellStyle(textStyle);
            }

            workbook.write(baos);
            return baos.toByteArray();
        }
    }

    private Sheet createSprintSheet(Workbook workbook, String sheetName) {
        Sheet sheet = workbook.createSheet(sheetName);

        // Header style: Calibri 12pt Bold White with #4472C4 fill
        XSSFCellStyle headerStyle = (XSSFCellStyle) workbook.createCellStyle();
        XSSFFont headerFont = (XSSFFont) workbook.createFont();
        headerFont.setFontName("Calibri");
        headerFont.setFontHeightInPoints((short) 12);
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(headerFont);

        byte[] rgb = new byte[]{(byte) 0x44, (byte) 0x72, (byte) 0xC4};
        headerStyle.setFillForegroundColor(new XSSFColor(rgb, null));
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.LEFT);
        headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        Row headerRow = sheet.createRow(0);
        headerRow.setHeightInPoints(24);

        String[] headers = new String[]{"Date", "Name", "Ticket", "Category", "Time (in hrs)", "Description"};
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Set column widths matching original template
        for (int i = 0; i < 5; i++) {
            sheet.setColumnWidth(i, 14 * 256);
        }
        sheet.setColumnWidth(5, 76 * 256); // Description column

        return sheet;
    }

    private int getNextEmptyRowIndex(Sheet sheet) {
        int lastRow = sheet.getLastRowNum();
        if (lastRow == 0 && sheet.getRow(0) == null) {
            return 0;
        }
        // Scan backwards to ensure row actually has content
        for (int r = lastRow; r >= 0; r--) {
            Row row = sheet.getRow(r);
            if (row != null) {
                boolean hasContent = false;
                for (int c = 0; c < 6; c++) {
                    Cell cell = row.getCell(c);
                    if (cell != null && cell.getCellType() != CellType.BLANK) {
                        hasContent = true;
                        break;
                    }
                }
                if (hasContent) {
                    return r + 1;
                }
            }
        }
        return 1;
    }

    private CellStyle createDateCellStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        CreationHelper ch = workbook.getCreationHelper();
        style.setDataFormat(ch.createDataFormat().getFormat("m/d/yyyy"));
        Font font = workbook.createFont();
        font.setFontName("Calibri");
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        return style;
    }

    private CellStyle createTextCellStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontName("Calibri");
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        return style;
    }

    private CellStyle createNumericCellStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontName("Calibri");
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        return style;
    }

    private LocalDate parseLocalDate(String str) {
        if (str == null || str.isBlank()) {
            return LocalDate.now();
        }
        str = str.trim();
        List<DateTimeFormatter> formatters = Arrays.asList(
                DateTimeFormatter.ISO_LOCAL_DATE, // yyyy-MM-dd
                DateTimeFormatter.ofPattern("MM/dd/yyyy"),
                DateTimeFormatter.ofPattern("M/d/yyyy"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("d/M/yyyy")
        );
        for (DateTimeFormatter fmt : formatters) {
            try {
                return LocalDate.parse(str, fmt);
            } catch (DateTimeParseException ignored) {}
        }
        return LocalDate.now();
    }

    private String createBackup(File file) {
        try {
            File backupDir = new File(file.getParentFile(), ".backups");
            if (!backupDir.exists()) {
                backupDir.mkdirs();
            }
            String timestamp = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").format(java.time.LocalDateTime.now());
            File backupFile = new File(backupDir, file.getName().replace(".xlsx", "") + "_" + timestamp + ".bak.xlsx");
            Files.copy(file.toPath(), backupFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
            return backupFile.getAbsolutePath();
        } catch (Exception e) {
            log.warn("Failed to create backup: {}", e.getMessage());
            return null;
        }
    }

    private static final Pattern COMPLETION_PATTERN = Pattern.compile("(?i)\\b(completed|complete|done|finished|closed|resolved)\\b");

    public boolean isCompletedText(String text) {
        if (text == null || text.isBlank()) return false;
        return COMPLETION_PATTERN.matcher(text).find();
    }

    public boolean isValidTicket(String ticket) {
        if (ticket == null) return false;
        String t = ticket.trim().toUpperCase();
        if (t.isEmpty() || t.equals("N/A") || t.equals("NA") || t.equals("-") || t.equals("NONE") || t.equals("0")) {
            return false;
        }
        return true;
    }

    public boolean isOverhead(String category, String description) {
        String cat = (category != null) ? category.toLowerCase().trim() : "";
        String desc = (description != null) ? description.toLowerCase().trim() : "";

        if (cat.contains("call") || cat.contains("standup") || cat.contains("n/a") || cat.equals("na") || cat.isEmpty()) {
            return true;
        }
        if (desc.contains("standup") || desc.contains("internal call") || desc.contains("client call")) {
            return true;
        }
        return false;
    }

    public String makeReasonKey(String sprintName, String developer, String date) {
        String s = (sprintName != null && !sprintName.isBlank()) ? sprintName.trim() : "";
        String dev = (developer != null) ? developer.trim().toLowerCase() : "";
        String d = (date != null) ? date.trim() : "";
        return s + "_" + dev + "_" + d;
    }

    public synchronized void saveMissingLogReason(String sprintName, String developer, String date, String reason, String comment) {
        if (developer == null || developer.isBlank() || date == null || date.isBlank()) return;
        loadMissingLogReasons();
        String key = makeReasonKey(sprintName, developer, date);
        Map<String, String> data = new LinkedHashMap<>();
        data.put("sprintName", sprintName != null ? sprintName.trim() : "");
        data.put("developer", developer.trim());
        data.put("date", date.trim());
        data.put("reason", reason != null ? reason.trim() : "");
        data.put("comment", comment != null ? comment.trim() : "");
        data.put("updatedAt", java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

        missingLogReasons.put(key, data);
        persistMissingLogReasons();
        log.info("Saved missing log reason for developer='{}', date='{}', reason='{}'", developer, date, reason);
    }

    public synchronized void deleteMissingLogReason(String sprintName, String developer, String date) {
        if (developer == null || date == null) return;
        loadMissingLogReasons();
        String key = makeReasonKey(sprintName, developer, date);
        missingLogReasons.remove(key);
        // Also remove fallback key without sprint
        missingLogReasons.remove("_" + developer.trim().toLowerCase() + "_" + date.trim());
        persistMissingLogReasons();
        log.info("Deleted missing log reason for developer='{}', date='{}'", developer, date);
    }

    private synchronized void persistMissingLogReasons() {
        try {
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(new File(REASONS_FILE), missingLogReasons);
        } catch (Exception e) {
            log.warn("Could not save persistent missing log reasons: {}", e.getMessage());
        }
    }

    private synchronized void loadMissingLogReasons() {
        try {
            File f = new File(REASONS_FILE);
            if (f.exists()) {
                com.fasterxml.jackson.core.type.TypeReference<Map<String, Map<String, String>>> typeRef =
                        new com.fasterxml.jackson.core.type.TypeReference<>() {};
                Map<String, Map<String, String>> map = objectMapper.readValue(f, typeRef);
                if (map != null) {
                    missingLogReasons.clear();
                    missingLogReasons.putAll(map);
                }
            }
        } catch (Exception e) {
            log.warn("Could not load missing log reasons: {}", e.getMessage());
        }
    }

    private double round1(double val) {
        return Math.round(val * 10.0) / 10.0;
    }

    public List<EodEntry> getAllSheetEntries(String filePath, String sheetName) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            return Collections.emptyList();
        }

        List<EodEntry> entries = new ArrayList<>();
        try (FileInputStream fis = new FileInputStream(file);
             Workbook workbook = WorkbookFactory.create(fis)) {
            Sheet sheet = (sheetName != null && !sheetName.isBlank())
                    ? workbook.getSheet(sheetName)
                    : workbook.getSheet(sprintService.getCurrentSprintName());

            if (sheet == null && workbook.getNumberOfSheets() > 0) {
                sheet = workbook.getSheetAt(workbook.getNumberOfSheets() - 1);
            }
            if (sheet == null) {
                return Collections.emptyList();
            }

            int lastRow = sheet.getLastRowNum();
            DataFormatter formatter = new DataFormatter();
            DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("MM/dd/yyyy");

            for (int r = 1; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null) continue;

                String dateStr = "";
                Cell dateCell = row.getCell(0);
                if (dateCell != null) {
                    if (dateCell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(dateCell)) {
                        Date d = dateCell.getDateCellValue();
                        if (d != null) {
                            dateStr = d.toInstant().atZone(ZoneId.systemDefault()).toLocalDate().format(dateFormatter);
                        }
                    } else {
                        dateStr = formatter.formatCellValue(dateCell);
                    }
                }

                String name = formatter.formatCellValue(row.getCell(1)).trim();
                String ticket = formatter.formatCellValue(row.getCell(2)).trim();
                String category = formatter.formatCellValue(row.getCell(3)).trim();

                double hrs = 0.0;
                Cell hrsCell = row.getCell(4);
                if (hrsCell != null) {
                    if (hrsCell.getCellType() == CellType.NUMERIC) {
                        hrs = hrsCell.getNumericCellValue();
                    } else {
                        try {
                            hrs = Double.parseDouble(formatter.formatCellValue(hrsCell).trim());
                        } catch (Exception ignored) {}
                    }
                }

                String desc = formatter.formatCellValue(row.getCell(5)).trim();

                if (!name.isEmpty() || !desc.isEmpty() || !ticket.isEmpty()) {
                    entries.add(new EodEntry(dateStr, name, ticket, category, hrs, desc));
                }
            }
        }
        return entries;
    }

    public SprintAnalyticsResponse getSprintAnalytics(String filePath, String sheetName) throws IOException {
        File file = new File(filePath);
        if (!file.exists()) {
            throw new FileNotFoundException("Excel file not found at path: " + filePath);
        }

        List<String> availableSprints = new ArrayList<>();
        String targetSprint = (sheetName != null && !sheetName.isBlank())
                ? sheetName.trim()
                : sprintService.getCurrentSprintName();

        try (FileInputStream fis = new FileInputStream(file);
             Workbook workbook = WorkbookFactory.create(fis)) {
            for (int i = 0; i < workbook.getNumberOfSheets(); i++) {
                availableSprints.add(workbook.getSheetAt(i).getSheetName());
            }
        }

        List<EodEntry> entries = getAllSheetEntries(filePath, targetSprint);

        SprintAnalyticsResponse resp = new SprintAnalyticsResponse();
        resp.setSprintName(targetSprint);
        resp.setAvailableSprints(availableSprints);
        resp.setTotalRows(entries.size());

        if (entries.isEmpty()) {
            resp.setTotalHours(0);
            resp.setTotalUniqueTickets(0);
            resp.setTotalCompletedTickets(0);
            resp.setCompletionRate(0);
            resp.setActiveDevelopersCount(0);
            resp.setAvgHoursPerDeveloper(0);
            resp.setAvgHoursPerTicket(0);
            resp.setHoursLeaderboard(Collections.emptyList());
            resp.setCompletionLeaderboard(Collections.emptyList());
            resp.setDeveloperAnalytics(Collections.emptyList());
            resp.setCategoryBreakdown(Collections.emptyList());
            resp.setHighEffortTickets(Collections.emptyList());
            resp.setDailyVelocity(Collections.emptyList());
            return resp;
        }

        double sprintTotalHours = 0.0;
        double sprintTicketHours = 0.0;
        Map<String, Double> categoryHoursMap = new LinkedHashMap<>();
        Map<String, Integer> categoryCountMap = new LinkedHashMap<>();
        Map<String, List<EodEntry>> developerEntriesMap = new LinkedHashMap<>();
        Map<String, List<EodEntry>> ticketEntriesMap = new LinkedHashMap<>();
        Map<String, List<EodEntry>> dailyEntriesMap = new LinkedHashMap<>();

        Set<String> uniqueTicketIds = new LinkedHashSet<>();

        for (EodEntry e : entries) {
            double hrs = e.getTimeInHrs() != null ? e.getTimeInHrs() : 0.0;
            sprintTotalHours += hrs;

            String cat = (e.getCategory() != null && !e.getCategory().isBlank()) ? e.getCategory().trim() : "N/A";
            categoryHoursMap.put(cat, categoryHoursMap.getOrDefault(cat, 0.0) + hrs);
            categoryCountMap.put(cat, categoryCountMap.getOrDefault(cat, 0) + 1);

            String devName = (e.getName() != null && !e.getName().isBlank()) ? e.getName().trim() : "Unknown";
            developerEntriesMap.computeIfAbsent(devName, k -> new ArrayList<>()).add(e);

            String ticket = e.getTicket();
            if (isValidTicket(ticket)) {
                uniqueTicketIds.add(ticket.trim());
                sprintTicketHours += hrs;
                ticketEntriesMap.computeIfAbsent(ticket.trim(), k -> new ArrayList<>()).add(e);
            }

            String date = (e.getDate() != null && !e.getDate().isBlank()) ? e.getDate().trim() : "Unknown";
            dailyEntriesMap.computeIfAbsent(date, k -> new ArrayList<>()).add(e);
        }

        resp.setTotalHours(round1(sprintTotalHours));
        resp.setTotalUniqueTickets(uniqueTicketIds.size());
        resp.setActiveDevelopersCount(developerEntriesMap.size());
        resp.setAvgHoursPerDeveloper(developerEntriesMap.size() > 0
                ? round1(sprintTotalHours / developerEntriesMap.size()) : 0.0);
        resp.setAvgHoursPerTicket(uniqueTicketIds.size() > 0
                ? round1(sprintTicketHours / uniqueTicketIds.size()) : 0.0);

        // 1. Category Breakdown
        List<CategoryEffort> categoryBreakdown = new ArrayList<>();
        for (Map.Entry<String, Double> entry : categoryHoursMap.entrySet()) {
            double hours = round1(entry.getValue());
            double pct = sprintTotalHours > 0 ? round1(entry.getValue() * 100.0 / sprintTotalHours) : 0.0;
            int count = categoryCountMap.getOrDefault(entry.getKey(), 0);
            categoryBreakdown.add(new CategoryEffort(entry.getKey(), hours, pct, count));
        }
        categoryBreakdown.sort((a, b) -> Double.compare(b.getHours(), a.getHours()));
        resp.setCategoryBreakdown(categoryBreakdown);

        // 2. Developer Analytics & Metrics
        List<DeveloperAnalytics> devAnalyticsList = new ArrayList<>();
        List<DeveloperHoursRank> hoursLeaderboard = new ArrayList<>();
        List<DeveloperCompletionRank> completionLeaderboard = new ArrayList<>();

        int totalSprintCompletedTickets = 0;

        for (Map.Entry<String, List<EodEntry>> devEntry : developerEntriesMap.entrySet()) {
            String devName = devEntry.getKey();
            List<EodEntry> dEntries = devEntry.getValue();

            double devTotalHrs = 0.0;
            double devTicketHrs = 0.0;
            double devCallHrs = 0.0;
            double devProductiveHrs = 0.0;
            double devOverheadHrs = 0.0;
            Map<String, Double> devCatHours = new LinkedHashMap<>();
            Map<String, Double> devDailyHours = new LinkedHashMap<>();
            Map<String, List<EodEntry>> devTicketMap = new LinkedHashMap<>();

            for (EodEntry e : dEntries) {
                double hrs = e.getTimeInHrs() != null ? e.getTimeInHrs() : 0.0;
                devTotalHrs += hrs;

                String cat = (e.getCategory() != null && !e.getCategory().isBlank()) ? e.getCategory().trim() : "N/A";
                devCatHours.put(cat, round1(devCatHours.getOrDefault(cat, 0.0) + hrs));

                if (isOverhead(e.getCategory(), e.getDescription())) {
                    devOverheadHrs += hrs;
                } else {
                    devProductiveHrs += hrs;
                }

                if (cat.toLowerCase().contains("call")) {
                    devCallHrs += hrs;
                }

                String date = (e.getDate() != null && !e.getDate().isBlank()) ? e.getDate().trim() : "Unknown";
                devDailyHours.put(date, round1(devDailyHours.getOrDefault(date, 0.0) + hrs));

                if (isValidTicket(e.getTicket())) {
                    devTicketHrs += hrs;
                    devTicketMap.computeIfAbsent(e.getTicket().trim(), k -> new ArrayList<>()).add(e);
                }
            }

            List<DeveloperTicketDetail> devTickets = new ArrayList<>();
            int devCompletedCount = 0;

            for (Map.Entry<String, List<EodEntry>> ticketGroup : devTicketMap.entrySet()) {
                String ticketId = ticketGroup.getKey();
                List<EodEntry> tEntries = ticketGroup.getValue();

                double tHours = 0.0;
                boolean completed = false;
                String lastCompletedDesc = null;
                String lastCompletedDate = null;
                String latestDesc = null;
                String latestDate = null;

                for (EodEntry te : tEntries) {
                    double th = te.getTimeInHrs() != null ? te.getTimeInHrs() : 0.0;
                    tHours += th;
                    latestDesc = te.getDescription();
                    latestDate = te.getDate();

                    if (isCompletedText(te.getDescription()) || isCompletedText(te.getCategory())) {
                        completed = true;
                        lastCompletedDesc = te.getDescription();
                        lastCompletedDate = te.getDate();
                    }
                }

                if (completed) {
                    devCompletedCount++;
                }

                devTickets.add(new DeveloperTicketDetail(
                        ticketId,
                        round1(tHours),
                        tEntries.size(),
                        completed,
                        lastCompletedDesc,
                        lastCompletedDate,
                        latestDesc,
                        latestDate
                ));
            }

            // Sort developer tickets descending by hours spent
            devTickets.sort((a, b) -> Double.compare(b.getTotalHours(), a.getTotalHours()));

            int uniqueTicketsCount = devTickets.size();
            double completionRate = uniqueTicketsCount > 0
                    ? round1(devCompletedCount * 100.0 / uniqueTicketsCount) : 0.0;

            double productivePct = devTotalHrs > 0 ? round1(devProductiveHrs * 100.0 / devTotalHrs) : 0.0;
            double overheadPct = devTotalHrs > 0 ? round1(devOverheadHrs * 100.0 / devTotalHrs) : 0.0;

            devAnalyticsList.add(new DeveloperAnalytics(
                    devName,
                    round1(devTotalHrs),
                    round1(devTicketHrs),
                    round1(devCallHrs),
                    round1(devProductiveHrs),
                    round1(devOverheadHrs),
                    productivePct,
                    overheadPct,
                    uniqueTicketsCount,
                    devCompletedCount,
                    completionRate,
                    devCatHours,
                    devTickets,
                    devDailyHours
            ));

            hoursLeaderboard.add(new DeveloperHoursRank(
                    0,
                    devName,
                    round1(devTotalHrs),
                    round1(devTicketHrs),
                    round1(devCallHrs),
                    uniqueTicketsCount,
                    devCompletedCount,
                    sprintTotalHours > 0 ? round1(devTotalHrs * 100.0 / sprintTotalHours) : 0.0
            ));

            completionLeaderboard.add(new DeveloperCompletionRank(
                    0,
                    devName,
                    devCompletedCount,
                    uniqueTicketsCount,
                    completionRate,
                    round1(devTotalHrs)
            ));
        }

        // Sort Hours Leaderboard
        hoursLeaderboard.sort((a, b) -> Double.compare(b.getTotalHours(), a.getTotalHours()));
        for (int i = 0; i < hoursLeaderboard.size(); i++) {
            hoursLeaderboard.get(i).setRank(i + 1);
        }

        // Sort Completion Leaderboard
        completionLeaderboard.sort((a, b) -> {
            int cmp = Integer.compare(b.getCompletedTicketsCount(), a.getCompletedTicketsCount());
            if (cmp != 0) return cmp;
            int cmpRate = Double.compare(b.getCompletionRate(), a.getCompletionRate());
            if (cmpRate != 0) return cmpRate;
            return Double.compare(b.getTotalHours(), a.getTotalHours());
        });
        for (int i = 0; i < completionLeaderboard.size(); i++) {
            completionLeaderboard.get(i).setRank(i + 1);
        }

        // Calculate Team-level Completed Tickets (distinct tickets completed across the team)
        for (Map.Entry<String, List<EodEntry>> ticketGroup : ticketEntriesMap.entrySet()) {
            boolean ticketCompleted = false;
            for (EodEntry te : ticketGroup.getValue()) {
                if (isCompletedText(te.getDescription()) || isCompletedText(te.getCategory())) {
                    ticketCompleted = true;
                    break;
                }
            }
            if (ticketCompleted) {
                totalSprintCompletedTickets++;
            }
        }
        resp.setTotalCompletedTickets(totalSprintCompletedTickets);
        resp.setCompletionRate(uniqueTicketIds.size() > 0
                ? round1(totalSprintCompletedTickets * 100.0 / uniqueTicketIds.size()) : 0.0);

        // 3. High-Effort Ticket Spotlight
        List<TicketEffortSpotlight> highEffortTickets = new ArrayList<>();
        for (Map.Entry<String, List<EodEntry>> tEntry : ticketEntriesMap.entrySet()) {
            String ticketId = tEntry.getKey();
            List<EodEntry> tEntries = tEntry.getValue();

            double tHours = 0.0;
            boolean completed = false;
            String lastCompletedDesc = null;
            String latestDesc = null;
            String latestDate = null;
            Set<String> contributors = new LinkedHashSet<>();
            Map<String, Double> devHoursOnTicket = new LinkedHashMap<>();

            for (EodEntry te : tEntries) {
                double th = te.getTimeInHrs() != null ? te.getTimeInHrs() : 0.0;
                tHours += th;
                latestDesc = te.getDescription();
                latestDate = te.getDate();

                String dev = te.getName() != null ? te.getName().trim() : "Unknown";
                contributors.add(dev);
                devHoursOnTicket.put(dev, round1(devHoursOnTicket.getOrDefault(dev, 0.0) + th));

                if (isCompletedText(te.getDescription()) || isCompletedText(te.getCategory())) {
                    completed = true;
                    lastCompletedDesc = te.getDescription();
                }
            }

            highEffortTickets.add(new TicketEffortSpotlight(
                    ticketId,
                    round1(tHours),
                    tEntries.size(),
                    completed,
                    new ArrayList<>(contributors),
                    devHoursOnTicket,
                    latestDesc,
                    lastCompletedDesc,
                    latestDate
            ));
        }

        highEffortTickets.sort((a, b) -> Double.compare(b.getTotalHours(), a.getTotalHours()));
        // Keep top 12 high effort tickets
        if (highEffortTickets.size() > 12) {
            highEffortTickets = highEffortTickets.subList(0, 12);
        }
        resp.setHighEffortTickets(highEffortTickets);

        // 4. Daily Effort Velocity Timeline
        List<DailyEffortPoint> dailyVelocity = new ArrayList<>();
        for (Map.Entry<String, List<EodEntry>> dayEntry : dailyEntriesMap.entrySet()) {
            String date = dayEntry.getKey();
            List<EodEntry> dayList = dayEntry.getValue();

            double dayTotal = 0.0;
            double dayDev = 0.0;
            double dayCall = 0.0;
            double dayOther = 0.0;
            Set<String> contributors = new LinkedHashSet<>();
            Map<String, Double> devDayHours = new LinkedHashMap<>();

            for (EodEntry de : dayList) {
                double dh = de.getTimeInHrs() != null ? de.getTimeInHrs() : 0.0;
                dayTotal += dh;

                String dev = de.getName() != null ? de.getName().trim() : "Unknown";
                contributors.add(dev);
                devDayHours.put(dev, round1(devDayHours.getOrDefault(dev, 0.0) + dh));

                String cat = de.getCategory() != null ? de.getCategory().toLowerCase() : "";
                if (cat.contains("call")) {
                    dayCall += dh;
                } else if (cat.contains("development") || isValidTicket(de.getTicket())) {
                    dayDev += dh;
                } else {
                    dayOther += dh;
                }
            }

            dailyVelocity.add(new DailyEffortPoint(
                    date,
                    round1(dayTotal),
                    round1(dayDev),
                    round1(dayCall),
                    round1(dayOther),
                    dayList.size(),
                    new ArrayList<>(contributors),
                    devDayHours
            ));
        }

        // Sort Daily Velocity chronologically
        dailyVelocity.sort((a, b) -> {
            LocalDate d1 = parseLocalDate(a.getDate());
            LocalDate d2 = parseLocalDate(b.getDate());
            return d1.compareTo(d2);
        });
        resp.setDailyVelocity(dailyVelocity);

        // Sort Developer Analytics by total hours descending
        devAnalyticsList.sort((a, b) -> Double.compare(b.getTotalHours(), a.getTotalHours()));
        resp.setDeveloperAnalytics(devAnalyticsList);
        resp.setHoursLeaderboard(hoursLeaderboard);
        resp.setCompletionLeaderboard(completionLeaderboard);

        // Team-level Productive vs Overhead totals
        double teamProdHrs = 0.0;
        double teamOverHrs = 0.0;
        for (DeveloperAnalytics da : devAnalyticsList) {
            teamProdHrs += da.getProductiveHours();
            teamOverHrs += da.getOverheadHours();
        }
        resp.setTeamProductiveHours(round1(teamProdHrs));
        resp.setTeamOverheadHours(round1(teamOverHrs));
        resp.setTeamProductivePercentage(sprintTotalHours > 0 ? round1(teamProdHrs * 100.0 / sprintTotalHours) : 0.0);
        resp.setTeamOverheadPercentage(sprintTotalHours > 0 ? round1(teamOverHrs * 100.0 / sprintTotalHours) : 0.0);

        // 5. Quality & Compliance Checks
        List<MissingLogAlert> missingLogs = new ArrayList<>();
        List<LoggingHoursAlert> hoursAnomalies = new ArrayList<>();
        List<MissingFieldAlert> missingFields = new ArrayList<>();

        // (A) Missing logs: Flag any person-day with no entry (if no person logged on that date, ignore that date)
        List<String> activeDates = new ArrayList<>(dailyEntriesMap.keySet());
        activeDates.sort((a, b) -> parseLocalDate(a).compareTo(parseLocalDate(b)));
        Set<String> allSprintDevs = developerEntriesMap.keySet();

        for (String dateStr : activeDates) {
            List<EodEntry> dayEntries = dailyEntriesMap.getOrDefault(dateStr, Collections.emptyList());
            Set<String> devsLoggedOnDate = new HashSet<>();
            for (EodEntry de : dayEntries) {
                if (de.getName() != null && !de.getName().isBlank()) {
                    devsLoggedOnDate.add(de.getName().trim());
                }
            }

            LocalDate ld = parseLocalDate(dateStr);
            String dayOfWeek = ld != null ? ld.getDayOfWeek().toString() : "UNKNOWN";
            if (dayOfWeek.length() > 1) {
                dayOfWeek = dayOfWeek.substring(0, 1).toUpperCase() + dayOfWeek.substring(1).toLowerCase();
            }

            for (String dev : allSprintDevs) {
                if (!devsLoggedOnDate.contains(dev)) {
                    String reasonKey = makeReasonKey(targetSprint, dev, dateStr);
                    Map<String, String> reasonData = missingLogReasons.get(reasonKey);
                    if (reasonData == null) {
                        reasonData = missingLogReasons.get("_" + dev.trim().toLowerCase() + "_" + dateStr.trim());
                    }
                    String reason = reasonData != null ? reasonData.get("reason") : null;
                    String comment = reasonData != null ? reasonData.get("comment") : null;
                    String updatedAt = reasonData != null ? reasonData.get("updatedAt") : null;

                    missingLogs.add(new MissingLogAlert(dev, dateStr, dayOfWeek, reason, comment, updatedAt));
                }
            }
        }

        // (B) Under- and over-logging: Flag days under 4h or over 10h
        for (DeveloperAnalytics da : devAnalyticsList) {
            for (Map.Entry<String, Double> dayEntry : da.getDailyHours().entrySet()) {
                String dDate = dayEntry.getKey();
                double dHours = dayEntry.getValue();

                if (dHours < 4.0) {
                    hoursAnomalies.add(new LoggingHoursAlert(
                            da.getName(),
                            dDate,
                            dHours,
                            "UNDER_LOGGING",
                            "Logged only " + dHours + "h (threshold: < 4.0h)"
                    ));
                } else if (dHours > 10.0) {
                    hoursAnomalies.add(new LoggingHoursAlert(
                            da.getName(),
                            dDate,
                            dHours,
                            "OVER_LOGGING",
                            "Logged " + dHours + "h (threshold: > 10.0h)"
                    ));
                }
            }
        }

        // Sort hours anomalies chronologically
        hoursAnomalies.sort((a, b) -> parseLocalDate(b.getDate()).compareTo(parseLocalDate(a.getDate())));

        // (C) Missing fields: Flag rows with no category or no description (N/A is treated as a valid category, not an anomaly)
        for (EodEntry e : entries) {
            boolean noCat = (e.getCategory() == null || e.getCategory().trim().isEmpty() || e.getCategory().trim().equals("-"));
            boolean noDesc = (e.getDescription() == null || e.getDescription().trim().isEmpty() || e.getDescription().trim().equals("-"));

            if (noCat || noDesc) {
                String missingField = (noCat && noDesc) ? "CATEGORY_AND_DESCRIPTION" : (noCat ? "CATEGORY" : "DESCRIPTION");
                missingFields.add(new MissingFieldAlert(
                        e.getName() != null && !e.getName().isBlank() ? e.getName() : "Unknown",
                        e.getDate() != null ? e.getDate() : "",
                        e.getTicket() != null ? e.getTicket() : "",
                        missingField,
                        e.getCategory() != null ? e.getCategory() : "",
                        e.getDescription() != null ? e.getDescription() : ""
                ));
            }
        }

        int totalIssues = missingLogs.size() + hoursAnomalies.size() + missingFields.size();
        int totalPersonDays = activeDates.size() * allSprintDevs.size();
        double complianceScore = totalPersonDays > 0
                ? Math.max(0.0, Math.min(100.0, round1((totalPersonDays - missingLogs.size() - hoursAnomalies.size()) * 100.0 / totalPersonDays)))
                : 100.0;

        int missingWithoutReason = 0;
        int missingWithReason = 0;
        for (MissingLogAlert alert : missingLogs) {
            if (alert.getReason() != null && !alert.getReason().isBlank()) {
                missingWithReason++;
            } else {
                missingWithoutReason++;
            }
        }

        ComplianceReport compReport = new ComplianceReport(
                totalIssues,
                missingLogs.size(),
                missingWithoutReason,
                missingWithReason,
                hoursAnomalies.size(),
                missingFields.size(),
                complianceScore,
                missingLogs,
                hoursAnomalies,
                missingFields
        );
        resp.setComplianceReport(compReport);

        return resp;
    }
}
