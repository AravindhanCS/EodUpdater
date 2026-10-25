package com.eod.updater.model;

public class CategoryEffort {
    private String category;
    private double hours;
    private double percentage;
    private int entryCount;

    public CategoryEffort() {}

    public CategoryEffort(String category, double hours, double percentage, int entryCount) {
        this.category = category;
        this.hours = hours;
        this.percentage = percentage;
        this.entryCount = entryCount;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getHours() {
        return hours;
    }

    public void setHours(double hours) {
        this.hours = hours;
    }

    public double getPercentage() {
        return percentage;
    }

    public void setPercentage(double percentage) {
        this.percentage = percentage;
    }

    public int getEntryCount() {
        return entryCount;
    }

    public void setEntryCount(int entryCount) {
        this.entryCount = entryCount;
    }
}
