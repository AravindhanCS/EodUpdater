package com.eod.updater.model;

import java.util.List;

public class ComplianceReport {
    private int totalIssues;
    private int missingLogsCount;
    private int missingLogsWithoutReasonCount;
    private int missingLogsWithReasonCount;
    private int hoursAnomaliesCount;
    private int missingFieldsCount;
    private double complianceScore; // 0 to 100 percentage
    private List<MissingLogAlert> missingLogs;
    private List<LoggingHoursAlert> hoursAnomalies;
    private List<MissingFieldAlert> missingFields;

    public ComplianceReport() {}

    public ComplianceReport(int totalIssues, int missingLogsCount, int missingLogsWithoutReasonCount,
                            int missingLogsWithReasonCount, int hoursAnomaliesCount,
                            int missingFieldsCount, double complianceScore,
                            List<MissingLogAlert> missingLogs, List<LoggingHoursAlert> hoursAnomalies,
                            List<MissingFieldAlert> missingFields) {
        this.totalIssues = totalIssues;
        this.missingLogsCount = missingLogsCount;
        this.missingLogsWithoutReasonCount = missingLogsWithoutReasonCount;
        this.missingLogsWithReasonCount = missingLogsWithReasonCount;
        this.hoursAnomaliesCount = hoursAnomaliesCount;
        this.missingFieldsCount = missingFieldsCount;
        this.complianceScore = complianceScore;
        this.missingLogs = missingLogs;
        this.hoursAnomalies = hoursAnomalies;
        this.missingFields = missingFields;
    }

    public int getTotalIssues() {
        return totalIssues;
    }

    public void setTotalIssues(int totalIssues) {
        this.totalIssues = totalIssues;
    }

    public int getMissingLogsCount() {
        return missingLogsCount;
    }

    public void setMissingLogsCount(int missingLogsCount) {
        this.missingLogsCount = missingLogsCount;
    }

    public int getMissingLogsWithoutReasonCount() {
        return missingLogsWithoutReasonCount;
    }

    public void setMissingLogsWithoutReasonCount(int missingLogsWithoutReasonCount) {
        this.missingLogsWithoutReasonCount = missingLogsWithoutReasonCount;
    }

    public int getMissingLogsWithReasonCount() {
        return missingLogsWithReasonCount;
    }

    public void setMissingLogsWithReasonCount(int missingLogsWithReasonCount) {
        this.missingLogsWithReasonCount = missingLogsWithReasonCount;
    }

    public int getHoursAnomaliesCount() {
        return hoursAnomaliesCount;
    }

    public void setHoursAnomaliesCount(int hoursAnomaliesCount) {
        this.hoursAnomaliesCount = hoursAnomaliesCount;
    }

    public int getMissingFieldsCount() {
        return missingFieldsCount;
    }

    public void setMissingFieldsCount(int missingFieldsCount) {
        this.missingFieldsCount = missingFieldsCount;
    }

    public double getComplianceScore() {
        return complianceScore;
    }

    public void setComplianceScore(double complianceScore) {
        this.complianceScore = complianceScore;
    }

    public List<MissingLogAlert> getMissingLogs() {
        return missingLogs;
    }

    public void setMissingLogs(List<MissingLogAlert> missingLogs) {
        this.missingLogs = missingLogs;
    }

    public List<LoggingHoursAlert> getHoursAnomalies() {
        return hoursAnomalies;
    }

    public void setHoursAnomalies(List<LoggingHoursAlert> hoursAnomalies) {
        this.hoursAnomalies = hoursAnomalies;
    }

    public List<MissingFieldAlert> getMissingFields() {
        return missingFields;
    }

    public void setMissingFields(List<MissingFieldAlert> missingFields) {
        this.missingFields = missingFields;
    }
}
