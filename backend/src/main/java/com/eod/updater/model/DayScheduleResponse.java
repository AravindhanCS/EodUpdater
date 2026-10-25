package com.eod.updater.model;

import java.util.List;

public class DayScheduleResponse {
    private String date;
    private String dayOfWeek;
    private List<EodEntry> scheduledCalls;
    private double totalScheduledHours;
    private double remainingDevHours;
    private double targetTotalHours;

    public DayScheduleResponse() {
    }

    public DayScheduleResponse(String date, String dayOfWeek, List<EodEntry> scheduledCalls, double totalScheduledHours, double remainingDevHours, double targetTotalHours) {
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.scheduledCalls = scheduledCalls;
        this.totalScheduledHours = totalScheduledHours;
        this.remainingDevHours = remainingDevHours;
        this.targetTotalHours = targetTotalHours;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public List<EodEntry> getScheduledCalls() {
        return scheduledCalls;
    }

    public void setScheduledCalls(List<EodEntry> scheduledCalls) {
        this.scheduledCalls = scheduledCalls;
    }

    public double getTotalScheduledHours() {
        return totalScheduledHours;
    }

    public void setTotalScheduledHours(double totalScheduledHours) {
        this.totalScheduledHours = totalScheduledHours;
    }

    public double getRemainingDevHours() {
        return remainingDevHours;
    }

    public void setRemainingDevHours(double remainingDevHours) {
        this.remainingDevHours = remainingDevHours;
    }

    public double getTargetTotalHours() {
        return targetTotalHours;
    }

    public void setTargetTotalHours(double targetTotalHours) {
        this.targetTotalHours = targetTotalHours;
    }
}
