package com.eod.updater.controller;

import com.eod.updater.model.*;
import com.eod.updater.service.ExcelService;
import com.eod.updater.service.SprintCalculationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.*;

@RestController
@RequestMapping("/api/eod")
public class EodController {

    private final ExcelService excelService;
    private final SprintCalculationService sprintService;
    private final ObjectMapper objectMapper;

    @Value("${eod.excel.default-path}")
    private String defaultFilePath;

    @Value("${eod.default-user:Aravindhan}")
    private String defaultUser;

    @Value("${eod.sharepoint.url:}")
    private String sharePointUrl;

    public EodController(ExcelService excelService,
                         SprintCalculationService sprintService,
                         ObjectMapper objectMapper) {
        this.excelService = excelService;
        this.sprintService = sprintService;
        this.objectMapper = objectMapper;
    }

    private String resolveEffectivePath(String requestedPath) {
        if (requestedPath != null && !requestedPath.isBlank()) {
            File f = new File(requestedPath);
            if (f.exists()) {
                return requestedPath;
            }
        }
        if (defaultFilePath != null && !defaultFilePath.isBlank()) {
            File df = new File(defaultFilePath);
            if (df.exists()) {
                return defaultFilePath;
            }
        }
        File uploaded = new File("data/Effort_Tracker.xlsx");
        if (uploaded.exists()) {
            return uploaded.getAbsolutePath();
        }
        File rootFile = new File("Effort Tracker - Simplicity.xlsx");
        if (rootFile.exists()) {
            return rootFile.getAbsolutePath();
        }
        return (defaultFilePath != null && !defaultFilePath.isBlank()) ? defaultFilePath : "data/Effort_Tracker.xlsx";
    }

    @GetMapping("/status")
    public ResponseEntity<AppStatusResponse> getStatus(@RequestParam(required = false) String path) {
        String effectivePath = resolveEffectivePath(path);
        File file = new File(effectivePath);

        AppStatusResponse resp = new AppStatusResponse();
        resp.setConfiguredFilePath(effectivePath);
        resp.setFileExists(file.exists());
        resp.setActiveSprintName(sprintService.getCurrentSprintName());
        resp.setCurrentUser(defaultUser);
        resp.setSharePointUrl(sharePointUrl);
        resp.setSharePointConnected(sharePointUrl != null && !sharePointUrl.isBlank());

        try {
            resp.setSheets(excelService.getSheets(effectivePath));
            resp.setTeamMembers(excelService.getTeamMembers(effectivePath));
            resp.setCategories(excelService.getCategories(effectivePath));
        } catch (Exception e) {
            resp.setSheets(Collections.emptyList());
            resp.setTeamMembers(Arrays.asList("Aravindhan", "Akshaya", "Arun", "Kriti", "Abinaya", "Uma"));
            resp.setCategories(Arrays.asList("Development", "QA", "Internal calls", "Client calls", "Dev chat issue", "PR comments", "N/A"));
        }

        return ResponseEntity.ok(resp);
    }

    @GetMapping("/sheets")
    public ResponseEntity<List<SheetInfo>> getSheets(@RequestParam(required = false) String path) throws IOException {
        String effectivePath = resolveEffectivePath(path);
        return ResponseEntity.ok(excelService.getSheets(effectivePath));
    }

    @GetMapping("/recent-entries")
    public ResponseEntity<List<EodEntry>> getRecentEntries(
            @RequestParam(required = false) String path,
            @RequestParam(required = false) String sheetName,
            @RequestParam(defaultValue = "30") int limit) throws IOException {
        String effectivePath = resolveEffectivePath(path);
        return ResponseEntity.ok(excelService.getRecentEntries(effectivePath, sheetName, limit));
    }

    @GetMapping("/analytics")
    public ResponseEntity<SprintAnalyticsResponse> getSprintAnalytics(
            @RequestParam(required = false) String path,
            @RequestParam(required = false) String sheetName) throws IOException {
        String effectivePath = resolveEffectivePath(path);
        return ResponseEntity.ok(excelService.getSprintAnalytics(effectivePath, sheetName));
    }

    @PostMapping(value = "/upload-tracker", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadTrackerFile(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Uploaded file is empty"));
        }
        try {
            File dataDir = new File("data");
            if (!dataDir.exists()) {
                dataDir.mkdirs();
            }
            File dest = new File(dataDir, "Effort_Tracker.xlsx");
            file.transferTo(dest);
            this.defaultFilePath = dest.getAbsolutePath();

            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("message", "Effort tracker uploaded successfully!");
            resp.put("filePath", dest.getAbsolutePath());
            resp.put("sheets", excelService.getSheets(dest.getAbsolutePath()));
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", "Failed to save file: " + e.getMessage()));
        }
    }

    @PostMapping("/sharepoint/pull")
    public ResponseEntity<Map<String, Object>> pullFromSharePoint(@RequestParam(required = false) String path) {
        String effectivePath = resolveEffectivePath(path);
        Map<String, Object> resp = new HashMap<>();
        try {
            excelService.pullLatestFromSharePoint(effectivePath);
            resp.put("success", true);
            resp.put("message", "Successfully pulled latest live data from SharePoint Online!");
            return ResponseEntity.ok(resp);
        } catch (UnsupportedOperationException uoe) {
            resp.put("success", false);
            resp.put("isCloudEnvironment", true);
            resp.put("message", uoe.getMessage());
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "Failed to pull from SharePoint: " + e.getMessage());
            return ResponseEntity.status(500).body(resp);
        }
    }

    @PostMapping("/submit")
    public ResponseEntity<EodSubmitResponse> submitEntries(@RequestBody EodSubmitRequest request) {
        String effectivePath = resolveEffectivePath(request.getFilePath());

        String sheetName = (request.getSheetName() != null && !request.getSheetName().isBlank())
                ? request.getSheetName()
                : sprintService.getCurrentSprintName();

        boolean createIfMissing = request.getCreateSheetIfMissing() != null ? request.getCreateSheetIfMissing() : true;

        if (request.getEntries() == null || request.getEntries().isEmpty()) {
            return ResponseEntity.badRequest().body(new EodSubmitResponse(
                    false, "No entries provided to append", sheetName, 0, 0, 0, null, false
            ));
        }

        try {
            EodSubmitResponse response = excelService.appendEntries(
                    effectivePath, sheetName, createIfMissing, request.getEntries()
            );
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(new EodSubmitResponse(
                    false, "Failed to update Excel: " + e.getMessage(), sheetName, 0, 0, 0, null, false
            ));
        }
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAndUpdate(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "sheetName", required = false) String sheetName,
            @RequestParam(value = "createSheetIfMissing", defaultValue = "true") boolean createSheetIfMissing,
            @RequestParam("entries") String entriesJson) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Uploaded file is empty");
        }

        try {
            List<EodEntry> entries = objectMapper.readValue(entriesJson, new TypeReference<List<EodEntry>>() {});
            byte[] updatedWorkbook = excelService.appendEntriesToStream(
                    file.getInputStream(), sheetName, createSheetIfMissing, entries
            );

            String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "Updated_Effort_Tracker.xlsx";

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(updatedWorkbook);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to process file: " + e.getMessage());
        }
    }

    @PostMapping("/config")
    public ResponseEntity<Map<String, String>> updateConfig(@RequestBody Map<String, String> body) {
        if (body.containsKey("filePath") && !body.get("filePath").isBlank()) {
            this.defaultFilePath = body.get("filePath").trim();
        }
        if (body.containsKey("currentUser") && !body.get("currentUser").isBlank()) {
            this.defaultUser = body.get("currentUser").trim();
        }
        Map<String, String> resp = new HashMap<>();
        resp.put("filePath", this.defaultFilePath);
        resp.put("currentUser", this.defaultUser);
        resp.put("message", "Configuration updated successfully");
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/compliance/missing-log-reason")
    public ResponseEntity<Map<String, Object>> saveMissingLogReason(@RequestBody MissingLogReasonRequest req) {
        excelService.saveMissingLogReason(req.getSprintName(), req.getDeveloper(), req.getDate(), req.getReason(), req.getComment());
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Missing log reason recorded successfully");
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/compliance/missing-log-reason")
    public ResponseEntity<Map<String, Object>> deleteMissingLogReason(
            @RequestParam(required = false) String sprintName,
            @RequestParam String developer,
            @RequestParam String date) {
        excelService.deleteMissingLogReason(sprintName, developer, date);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Missing log reason cleared successfully");
        return ResponseEntity.ok(resp);
    }
}
