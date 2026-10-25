package com.eod.updater.model;

public class DeveloperTicketDetail {
    private String ticketId;
    private double totalHours;
    private int entryCount;
    private boolean completed;
    private String lastCompletedDescription;
    private String lastCompletedDate;
    private String latestDescription;
    private String latestDate;

    public DeveloperTicketDetail() {}

    public DeveloperTicketDetail(String ticketId, double totalHours, int entryCount, boolean completed,
                                 String lastCompletedDescription, String lastCompletedDate,
                                 String latestDescription, String latestDate) {
        this.ticketId = ticketId;
        this.totalHours = totalHours;
        this.entryCount = entryCount;
        this.completed = completed;
        this.lastCompletedDescription = lastCompletedDescription;
        this.lastCompletedDate = lastCompletedDate;
        this.latestDescription = latestDescription;
        this.latestDate = latestDate;
    }

    public String getTicketId() {
        return ticketId;
    }

    public void setTicketId(String ticketId) {
        this.ticketId = ticketId;
    }

    public double getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(double totalHours) {
        this.totalHours = totalHours;
    }

    public int getEntryCount() {
        return entryCount;
    }

    public void setEntryCount(int entryCount) {
        this.entryCount = entryCount;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public String getLastCompletedDescription() {
        return lastCompletedDescription;
    }

    public void setLastCompletedDescription(String lastCompletedDescription) {
        this.lastCompletedDescription = lastCompletedDescription;
    }

    public String getLastCompletedDate() {
        return lastCompletedDate;
    }

    public void setLastCompletedDate(String lastCompletedDate) {
        this.lastCompletedDate = lastCompletedDate;
    }

    public String getLatestDescription() {
        return latestDescription;
    }

    public void setLatestDescription(String latestDescription) {
        this.latestDescription = latestDescription;
    }

    public String getLatestDate() {
        return latestDate;
    }

    public void setLatestDate(String latestDate) {
        this.latestDate = latestDate;
    }
}
