package com.eod.updater.model;

public class EodEntry {
    private String date;
    private String name;
    private String ticket;
    private String category;
    private Double timeInHrs;
    private String description;

    public EodEntry() {
    }

    public EodEntry(String date, String name, String ticket, String category, Double timeInHrs, String description) {
        this.date = date;
        this.name = name;
        this.ticket = ticket;
        this.category = category;
        this.timeInHrs = timeInHrs;
        this.description = description;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTicket() {
        return ticket;
    }

    public void setTicket(String ticket) {
        this.ticket = ticket;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Double getTimeInHrs() {
        return timeInHrs;
    }

    public void setTimeInHrs(Double timeInHrs) {
        this.timeInHrs = timeInHrs;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
