package com.eod.updater.model;

public class AdoStoryPointTicket {
    private String id;
    private String title;
    private String type;
    private String state;
    private double storyPoints;
    private String assignedTo;
    private String url;

    public AdoStoryPointTicket() {
    }

    public AdoStoryPointTicket(String id, String title, String type, String state, double storyPoints, String assignedTo, String url) {
        this.id = id;
        this.title = title;
        this.type = type;
        this.state = state;
        this.storyPoints = storyPoints;
        this.assignedTo = assignedTo;
        this.url = url;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public double getStoryPoints() {
        return storyPoints;
    }

    public void setStoryPoints(double storyPoints) {
        this.storyPoints = storyPoints;
    }

    public String getAssignedTo() {
        return assignedTo;
    }

    public void setAssignedTo(String assignedTo) {
        this.assignedTo = assignedTo;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
