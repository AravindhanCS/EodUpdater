package com.eod.updater.model;

public class MissingLogReasonRequest {
    private String sprintName;
    private String developer;
    private String date;
    private String reason;
    private String comment;

    public MissingLogReasonRequest() {}

    public MissingLogReasonRequest(String sprintName, String developer, String date, String reason, String comment) {
        this.sprintName = sprintName;
        this.developer = developer;
        this.date = date;
        this.reason = reason;
        this.comment = comment;
    }

    public String getSprintName() {
        return sprintName;
    }

    public void setSprintName(String sprintName) {
        this.sprintName = sprintName;
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
}
