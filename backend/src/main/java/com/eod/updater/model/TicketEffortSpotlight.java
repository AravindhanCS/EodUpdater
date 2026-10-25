package com.eod.updater.model;

import java.util.List;
import java.util.Map;

public class TicketEffortSpotlight {
    private String ticketId;
    private double totalHours;
    private int entryCount;
    private boolean completed;
    private List<String> contributors;
    private Map<String, Double> developerHours;
    private String latestDescription;
    private String lastCompletedDescription;
    private String latestDate;

    public TicketEffortSpotlight() {}

    public TicketEffortSpotlight(String ticketId, double totalHours, int entryCount, boolean completed,
                                 List<String> contributors, Map<String, Double> developerHours,
                                 String latestDescription, String lastCompletedDescription, String latestDate) {
        this.ticketId = ticketId;
        this.totalHours = totalHours;
        this.entryCount = entryCount;
        this.completed = completed;
        this.contributors = contributors;
        this.developerHours = developerHours;
        this.latestDescription = latestDescription;
        this.lastCompletedDescription = lastCompletedDescription;
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

    public List<String> getContributors() {
        return contributors;
    }

    public void setContributors(List<String> contributors) {
        this.contributors = contributors;
    }

    public Map<String, Double> getDeveloperHours() {
        return developerHours;
    }

    public void setDeveloperHours(Map<String, Double> developerHours) {
        this.developerHours = developerHours;
    }

    public String getLatestDescription() {
        return latestDescription;
    }

    public void setLatestDescription(String latestDescription) {
        this.latestDescription = latestDescription;
    }

    public String getLastCompletedDescription() {
        return lastCompletedDescription;
    }

    public void setLastCompletedDescription(String lastCompletedDescription) {
        this.lastCompletedDescription = lastCompletedDescription;
    }

    public String getLatestDate() {
        return latestDate;
    }

    public void setLatestDate(String latestDate) {
        this.latestDate = latestDate;
    }
}
