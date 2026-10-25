package com.eod.updater.model;

import java.util.List;

public class SprintAnalyticsResponse {
    private String sprintName;
    private List<String> availableSprints;
    private int totalRows;
    private double totalHours;
    private int totalUniqueTickets;
    private int totalCompletedTickets;
    private double completionRate;
    private int activeDevelopersCount;
    private double avgHoursPerDeveloper;
    private double avgHoursPerTicket;
    private double teamProductiveHours;
    private double teamOverheadHours;
    private double teamProductivePercentage;
    private double teamOverheadPercentage;
    private List<DeveloperHoursRank> hoursLeaderboard;
    private List<DeveloperCompletionRank> completionLeaderboard;
    private List<DeveloperAnalytics> developerAnalytics;
    private List<CategoryEffort> categoryBreakdown;
    private List<TicketEffortSpotlight> highEffortTickets;
    private List<DailyEffortPoint> dailyVelocity;
    private ComplianceReport complianceReport;

    public SprintAnalyticsResponse() {}

    public String getSprintName() {
        return sprintName;
    }

    public void setSprintName(String sprintName) {
        this.sprintName = sprintName;
    }

    public List<String> getAvailableSprints() {
        return availableSprints;
    }

    public void setAvailableSprints(List<String> availableSprints) {
        this.availableSprints = availableSprints;
    }

    public int getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(int totalRows) {
        this.totalRows = totalRows;
    }

    public double getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(double totalHours) {
        this.totalHours = totalHours;
    }

    public int getTotalUniqueTickets() {
        return totalUniqueTickets;
    }

    public void setTotalUniqueTickets(int totalUniqueTickets) {
        this.totalUniqueTickets = totalUniqueTickets;
    }

    public int getTotalCompletedTickets() {
        return totalCompletedTickets;
    }

    public void setTotalCompletedTickets(int totalCompletedTickets) {
        this.totalCompletedTickets = totalCompletedTickets;
    }

    public double getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(double completionRate) {
        this.completionRate = completionRate;
    }

    public int getActiveDevelopersCount() {
        return activeDevelopersCount;
    }

    public void setActiveDevelopersCount(int activeDevelopersCount) {
        this.activeDevelopersCount = activeDevelopersCount;
    }

    public double getAvgHoursPerDeveloper() {
        return avgHoursPerDeveloper;
    }

    public void setAvgHoursPerDeveloper(double avgHoursPerDeveloper) {
        this.avgHoursPerDeveloper = avgHoursPerDeveloper;
    }

    public double getAvgHoursPerTicket() {
        return avgHoursPerTicket;
    }

    public void setAvgHoursPerTicket(double avgHoursPerTicket) {
        this.avgHoursPerTicket = avgHoursPerTicket;
    }

    public double getTeamProductiveHours() {
        return teamProductiveHours;
    }

    public void setTeamProductiveHours(double teamProductiveHours) {
        this.teamProductiveHours = teamProductiveHours;
    }

    public double getTeamOverheadHours() {
        return teamOverheadHours;
    }

    public void setTeamOverheadHours(double teamOverheadHours) {
        this.teamOverheadHours = teamOverheadHours;
    }

    public double getTeamProductivePercentage() {
        return teamProductivePercentage;
    }

    public void setTeamProductivePercentage(double teamProductivePercentage) {
        this.teamProductivePercentage = teamProductivePercentage;
    }

    public double getTeamOverheadPercentage() {
        return teamOverheadPercentage;
    }

    public void setTeamOverheadPercentage(double teamOverheadPercentage) {
        this.teamOverheadPercentage = teamOverheadPercentage;
    }

    public List<DeveloperHoursRank> getHoursLeaderboard() {
        return hoursLeaderboard;
    }

    public void setHoursLeaderboard(List<DeveloperHoursRank> hoursLeaderboard) {
        this.hoursLeaderboard = hoursLeaderboard;
    }

    public List<DeveloperCompletionRank> getCompletionLeaderboard() {
        return completionLeaderboard;
    }

    public void setCompletionLeaderboard(List<DeveloperCompletionRank> completionLeaderboard) {
        this.completionLeaderboard = completionLeaderboard;
    }

    public List<DeveloperAnalytics> getDeveloperAnalytics() {
        return developerAnalytics;
    }

    public void setDeveloperAnalytics(List<DeveloperAnalytics> developerAnalytics) {
        this.developerAnalytics = developerAnalytics;
    }

    public List<CategoryEffort> getCategoryBreakdown() {
        return categoryBreakdown;
    }

    public void setCategoryBreakdown(List<CategoryEffort> categoryBreakdown) {
        this.categoryBreakdown = categoryBreakdown;
    }

    public List<TicketEffortSpotlight> getHighEffortTickets() {
        return highEffortTickets;
    }

    public void setHighEffortTickets(List<TicketEffortSpotlight> highEffortTickets) {
        this.highEffortTickets = highEffortTickets;
    }

    public List<DailyEffortPoint> getDailyVelocity() {
        return dailyVelocity;
    }

    public void setDailyVelocity(List<DailyEffortPoint> dailyVelocity) {
        this.dailyVelocity = dailyVelocity;
    }

    public ComplianceReport getComplianceReport() {
        return complianceReport;
    }

    public void setComplianceReport(ComplianceReport complianceReport) {
        this.complianceReport = complianceReport;
    }
}
