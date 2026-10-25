package com.eod.updater.model;

import java.util.List;
import java.util.Map;

public class DailyEffortPoint {
    private String date;
    private double totalHours;
    private double devHours;
    private double callHours;
    private double otherHours;
    private int entryCount;
    private List<String> contributors;
    private Map<String, Double> developerHours;

    public DailyEffortPoint() {}

    public DailyEffortPoint(String date, double totalHours, double devHours, double callHours,
                            double otherHours, int entryCount, List<String> contributors,
                            Map<String, Double> developerHours) {
        this.date = date;
        this.totalHours = totalHours;
        this.devHours = devHours;
        this.callHours = callHours;
        this.otherHours = otherHours;
        this.entryCount = entryCount;
        this.contributors = contributors;
        this.developerHours = developerHours;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public double getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(double totalHours) {
        this.totalHours = totalHours;
    }

    public double getDevHours() {
        return devHours;
    }

    public void setDevHours(double devHours) {
        this.devHours = devHours;
    }

    public double getCallHours() {
        return callHours;
    }

    public void setCallHours(double callHours) {
        this.callHours = callHours;
    }

    public double getOtherHours() {
        return otherHours;
    }

    public void setOtherHours(double otherHours) {
        this.otherHours = otherHours;
    }

    public int getEntryCount() {
        return entryCount;
    }

    public void setEntryCount(int entryCount) {
        this.entryCount = entryCount;
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
}
