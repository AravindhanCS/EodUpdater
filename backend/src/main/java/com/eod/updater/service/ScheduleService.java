package com.eod.updater.service;

import com.eod.updater.model.DayScheduleResponse;
import com.eod.updater.model.EodEntry;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ScheduleService {

    private static final double TARGET_TOTAL_HOURS = 8.0;

    public DayScheduleResponse getScheduleForDate(LocalDate date, String userName) {
        if (date == null) {
            date = LocalDate.now();
        }
        if (userName == null || userName.isBlank()) {
            userName = "Aravindhan";
        }

        DayOfWeek dow = date.getDayOfWeek();
        String dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE);
        List<EodEntry> calls = new ArrayList<>();

        // 1. Daily Internal Standup (Mon - Fri)
        calls.add(new EodEntry(
                dateStr,
                userName,
                "",
                "Internal calls",
                0.5,
                "Internal standup"
        ));

        // 2. Client Calls depending on the Day of Week
        switch (dow) {
            case MONDAY:
            case TUESDAY:
            case WEDNESDAY:
                calls.add(new EodEntry(
                        dateStr,
                        userName,
                        "",
                        "Client calls",
                        1.0,
                        "Technical and standup calls"
                ));
                break;

            case THURSDAY:
                calls.add(new EodEntry(
                        dateStr,
                        userName,
                        "",
                        "Client calls",
                        1.0,
                        "Technical and standup calls"
                ));
                calls.add(new EodEntry(
                        dateStr,
                        userName,
                        "",
                        "Client calls",
                        1.0,
                        "office hours call"
                ));
                break;

            case FRIDAY:
                calls.add(new EodEntry(
                        dateStr,
                        userName,
                        "",
                        "Client calls",
                        0.5,
                        "technical training call"
                ));
                break;

            default:
                // Weekend - no scheduled calls default
                break;
        }

        double totalCalls = calls.stream().mapToDouble(EodEntry::getTimeInHrs).sum();
        double remainingDev = Math.max(0.0, TARGET_TOTAL_HOURS - totalCalls);

        return new DayScheduleResponse(
                dateStr,
                dow.toString(),
                calls,
                totalCalls,
                remainingDev,
                TARGET_TOTAL_HOURS
        );
    }
}
