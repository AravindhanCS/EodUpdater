package com.eod.updater.model;

public class MissingLogAlert {
    private String developer;
    private String date;
    private String dayOfWeek;
    private String reason;
    private String comment;
    private String updatedAt;

    public MissingLogAlert() {}

    public MissingLogAlert(String developer, String date, String dayOfWeek) {
        this.developer = developer;
        this.date = date;
        this.dayOfWeek = dayOfWeek;
    }

    public MissingLogAlert(String developer, String date, String dayOfWeek, String reason, String comment, String updatedAt) {
        this.developer = developer;
        this.date = date;
        this.dayOfWeek = dayOfWeek;
        this.reason = reason;
        this.comment = comment;
        this.updatedAt = updatedAt;
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

    public String getDayOfWeek() {
        return dayOfWeek;
    }

    public void setDayOfWeek(String dayOfWeek) {
        this.dayOfWeek = dayOfWeek;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
