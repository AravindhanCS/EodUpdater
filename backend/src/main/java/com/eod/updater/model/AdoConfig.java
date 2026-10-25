package com.eod.updater.model;

public class AdoConfig {
    private String orgUrl;
    private String project;
    private String pat;
    private String targetState;
    private boolean hasPat;
    private String userName;

    public AdoConfig() {
    }

    public AdoConfig(String orgUrl, String project, String pat, String targetState, boolean hasPat) {
        this(orgUrl, project, pat, targetState, hasPat, null);
    }

    public AdoConfig(String orgUrl, String project, String pat, String targetState, boolean hasPat, String userName) {
        this.orgUrl = orgUrl;
        this.project = project;
        this.pat = pat;
        this.targetState = targetState;
        this.hasPat = hasPat;
        this.userName = userName;
    }

    public String getOrgUrl() {
        return orgUrl;
    }

    public void setOrgUrl(String orgUrl) {
        this.orgUrl = orgUrl;
    }

    public String getProject() {
        return project;
    }

    public void setProject(String project) {
        this.project = project;
    }

    public String getPat() {
        return pat;
    }

    public void setPat(String pat) {
        this.pat = pat;
    }

    public String getTargetState() {
        return targetState;
    }

    public void setTargetState(String targetState) {
        this.targetState = targetState;
    }

    public boolean isHasPat() {
        return hasPat;
    }

    public void setHasPat(boolean hasPat) {
        this.hasPat = hasPat;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }
}
