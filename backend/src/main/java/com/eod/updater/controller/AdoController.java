package com.eod.updater.controller;

import com.eod.updater.model.AdoConfig;
import com.eod.updater.model.AdoWorkItem;
import com.eod.updater.model.DayScheduleResponse;
import com.eod.updater.model.SprintStoryPointsReport;
import com.eod.updater.service.AzureDevOpsService;
import com.eod.updater.service.ScheduleService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ado")
public class AdoController {

    private final AzureDevOpsService adoService;
    private final ScheduleService scheduleService;

    public AdoController(AzureDevOpsService adoService, ScheduleService scheduleService) {
        this.adoService = adoService;
        this.scheduleService = scheduleService;
    }

    @GetMapping("/tickets")
    public ResponseEntity<List<AdoWorkItem>> getTickets(@RequestParam(required = false) String user) {
        try {
            return ResponseEntity.ok(adoService.fetchAllTickets(user));
        } catch (Exception e) {
            return ResponseEntity.ok(Collections.emptyList());
        }
    }

    @GetMapping("/story-points")
    public ResponseEntity<SprintStoryPointsReport> getSprintStoryPoints(
            @RequestParam(required = false) String sprintName) {
        return ResponseEntity.ok(adoService.calculateSprintStoryPoints(sprintName));
    }

    @GetMapping("/schedule")
    public ResponseEntity<DayScheduleResponse> getSchedule(
            @RequestParam(required = false) String date,
            @RequestParam(required = false, defaultValue = "Aravindhan") String user) {
        LocalDate localDate = (date != null && !date.isBlank()) ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(scheduleService.getScheduleForDate(localDate, user));
    }

    @GetMapping("/config")
    public ResponseEntity<AdoConfig> getConfig() {
        return ResponseEntity.ok(adoService.getConfig());
    }

    @PostMapping("/config")
    public ResponseEntity<Map<String, Object>> updateConfig(@RequestBody AdoConfig config) {
        adoService.updateConfig(config);
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", true);
        resp.put("message", "Azure DevOps configuration updated successfully");
        resp.put("config", adoService.getConfig());
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testConnection(@RequestBody AdoConfig config) {
        boolean ok = adoService.testConnection(config.getOrgUrl(), config.getProject(), config.getPat());
        Map<String, Object> resp = new HashMap<>();
        resp.put("success", ok);
        resp.put("message", ok ? "Successfully connected to Azure DevOps!" : "Could not connect to Azure DevOps. Check PAT and permissions.");
        return ResponseEntity.ok(resp);
    }
}
