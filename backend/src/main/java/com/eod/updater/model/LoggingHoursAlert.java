package com.eod.updater.model;

public class LoggingHoursAlert {
    private String developer;
    private String date;
    private double hours;
    private String type; // "UNDER_LOGGING" | "OVER_LOGGING"
    private String message;

    public LoggingHoursAlert() {}

    public LoggingHoursAlert(String developer, String date, double hours, String type, String message) {
        this.developer = developer;
        this.date = date;
        this.hours = hours;
        this.type = type;
        this.message = message;
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

    public double getHours() {
        return hours;
    }

    public void setHours(double hours) {
        this.hours = hours;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
