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
}
