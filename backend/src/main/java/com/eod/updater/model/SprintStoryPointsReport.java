package com.eod.updater.model;

import java.util.ArrayList;
import java.util.List;

public class SprintStoryPointsReport {
    private String sprintName;
    private double totalSprintStoryPoints;
    private int totalClosedTickets;
    private int totalTestingTickets;
    private int totalTickets;
    private int resourceCount;
    private List<ResourceStoryPoints> resources = new ArrayList<>();
    private boolean success = true;
    private String message;

    public SprintStoryPointsReport() {
    }

    public SprintStoryPointsReport(String sprintName, double totalSprintStoryPoints, int totalClosedTickets, int totalTestingTickets, int totalTickets, int resourceCount, List<ResourceStoryPoints> resources) {
        this.sprintName = sprintName;
        this.totalSprintStoryPoints = totalSprintStoryPoints;
        this.totalClosedTickets = totalClosedTickets;
        this.totalTestingTickets = totalTestingTickets;
        this.totalTickets = totalTickets;
        this.resourceCount = resourceCount;
        this.resources = resources != null ? resources : new ArrayList<>();
        this.success = true;
    }

    public static SprintStoryPointsReport error(String sprintName, String message) {
        SprintStoryPointsReport report = new SprintStoryPointsReport();
        report.setSprintName(sprintName);
        report.setSuccess(false);
        report.setMessage(message);
        return report;
    }

    public String getSprintName() {
        return sprintName;
    }

    public void setSprintName(String sprintName) {
        this.sprintName = sprintName;
    }

    public double getTotalSprintStoryPoints() {
        return totalSprintStoryPoints;
    }

    public void setTotalSprintStoryPoints(double totalSprintStoryPoints) {
        this.totalSprintStoryPoints = totalSprintStoryPoints;
    }

    public int getTotalClosedTickets() {
        return totalClosedTickets;
    }

    public void setTotalClosedTickets(int totalClosedTickets) {
        this.totalClosedTickets = totalClosedTickets;
    }

    public int getTotalTestingTickets() {
        return totalTestingTickets;
    }

    public void setTotalTestingTickets(int totalTestingTickets) {
        this.totalTestingTickets = totalTestingTickets;
    }

    public int getTotalTickets() {
        return totalTickets;
    }

    public void setTotalTickets(int totalTickets) {
        this.totalTickets = totalTickets;
    }

    public int getResourceCount() {
        return resourceCount;
    }

    public void setResourceCount(int resourceCount) {
        this.resourceCount = resourceCount;
    }

    public List<ResourceStoryPoints> getResources() {
        return resources;
    }

    public void setResources(List<ResourceStoryPoints> resources) {
        this.resources = resources;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
