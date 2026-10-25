package com.eod.updater.model;

public class MissingFieldAlert {
    private String developer;
    private String date;
    private String ticket;
    private String missingField; // "CATEGORY" | "DESCRIPTION" | "BOTH"
    private String category;
    private String description;

    public MissingFieldAlert() {}

    public MissingFieldAlert(String developer, String date, String ticket, String missingField,
                             String category, String description) {
        this.developer = developer;
        this.date = date;
        this.ticket = ticket;
        this.missingField = missingField;
        this.category = category;
        this.description = description;
    }

    public String getDeveloper() {
        return developer;
    }

    public void setDeveloper(String developer) {
        this.developer = developer;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public String getTicket() {
        return ticket;
    }

    public void setTicket(String ticket) {
        this.ticket = ticket;
    }

    public String getMissingField() {
        return missingField;
    }

    public void setMissingField(String missingField) {
        this.missingField = missingField;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
