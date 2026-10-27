package com.eod.updater.service;

import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class SprintCalculationService {

    /**
     * Calculates the sprint sheet name based on the formula:
     * 2.<year_offset>.<month>.<sprint_index>
     * - 2: default constant prefix
     * - year_offset: current year - 2012 (e.g. 2026 -> 14)
     * - month: month of year (1-12)
     * - sprint_index: 2-week sprint in month starting from 0:
     *   Day 1-14 -> 0
     *   Day 15-28 -> 1
     *   Day 29+ -> 2 (for 3-sprint months like 2.14.9.2)
     */
    public String calculateSprintName(LocalDate date) {
        if (date == null) {
            date = LocalDate.now();
        }
        int yearOffset = date.getYear() - 2012;
        int month = date.getMonthValue();
        int day = date.getDayOfMonth();
        int sprintIndex = (day - 1) / 14;

        return String.format("2.%d.%d.%d", yearOffset, month, sprintIndex);
    }

    public String getCurrentSprintName() {
        return calculateSprintName(LocalDate.now());
    }

    private static final java.util.regex.Pattern SPRINT_PATTERN =
            java.util.regex.Pattern.compile("^(\\d+)\\.(\\d+)\\.(\\d+)\\.(\\d+).*$");

    /**
     * Inspects a list of sheet names from an Excel workbook and detects the highest/latest sprint sheet.
     * For example, given ["2.14.9.0", "2.14.9.1", "2.14.10.0", "2.14.10.1", "2.14.11.0", "Arun-Kriti Tickets"],
     * this will return "2.14.11.0".
     */
    public String detectLatestSprintSheet(java.util.List<String> sheetNames, String fallback) {
        if (sheetNames == null || sheetNames.isEmpty()) {
            return (fallback != null && !fallback.isBlank()) ? fallback : getCurrentSprintName();
        }

        return sheetNames.stream()
                .filter(name -> name != null && SPRINT_PATTERN.matcher(name.trim()).matches())
                .max((s1, s2) -> compareSprintNames(s1.trim(), s2.trim()))
                .orElse((fallback != null && !fallback.isBlank()) ? fallback : getCurrentSprintName());
    }

    /**
     * Compares two sprint sheet version strings numerically.
     * e.g. 2.14.11.0 > 2.14.10.1 because month 11 > 10.
     */
    public static int compareSprintNames(String s1, String s2) {
        java.util.regex.Matcher m1 = SPRINT_PATTERN.matcher(s1);
        java.util.regex.Matcher m2 = SPRINT_PATTERN.matcher(s2);
        if (m1.matches() && m2.matches()) {
            for (int i = 1; i <= 4; i++) {
                int v1 = Integer.parseInt(m1.group(i));
                int v2 = Integer.parseInt(m2.group(i));
                if (v1 != v2) {
                    return Integer.compare(v1, v2);
                }
            }
        }
        return s1.compareTo(s2);
    }
}
