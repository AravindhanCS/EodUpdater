package com.eod.updater.model;

import java.util.ArrayList;
import java.util.List;

public class ResourceStoryPoints {
    private String resourceName;
    private double totalStoryPoints;
    private int closedCount;
    private int testingCount;
    private int totalCount;
    private List<AdoStoryPointTicket> tickets = new ArrayList<>();

    public ResourceStoryPoints() {
    }

    public ResourceStoryPoints(String resourceName, double totalStoryPoints, int closedCount, int testingCount, int totalCount, List<AdoStoryPointTicket> tickets) {
        this.resourceName = resourceName;
        this.totalStoryPoints = totalStoryPoints;
        this.closedCount = closedCount;
        this.testingCount = testingCount;
        this.totalCount = totalCount;
        this.tickets = tickets != null ? tickets : new ArrayList<>();
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public double getTotalStoryPoints() {
        return totalStoryPoints;
    }

    public void setTotalStoryPoints(double totalStoryPoints) {
        this.totalStoryPoints = totalStoryPoints;
    }

    public int getClosedCount() {
        return closedCount;
    }

    public void setClosedCount(int closedCount) {
        this.closedCount = closedCount;
    }

    public int getTestingCount() {
        return testingCount;
    }

    public void setTestingCount(int testingCount) {
        this.testingCount = testingCount;
    }

    public int getTotalCount() {
        return totalCount;
    }

    public void setTotalCount(int totalCount) {
        this.totalCount = totalCount;
    }

    public List<AdoStoryPointTicket> getTickets() {
        return tickets;
    }

    public void setTickets(List<AdoStoryPointTicket> tickets) {
        this.tickets = tickets;
    }
}
