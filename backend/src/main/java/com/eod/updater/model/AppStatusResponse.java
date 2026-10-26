package com.eod.updater.model;

import java.util.List;

public class AppStatusResponse {
    private String configuredFilePath;
    private boolean fileExists;
    private String activeSprintName;
    private List<SheetInfo> sheets;
    private List<String> teamMembers;
    private List<String> categories;
    private String currentUser;
    private boolean sharePointConnected;
    private String sharePointUrl;
    private String powerAutomateWebhookUrl;
    private boolean resendConfigured;
    private String resendToEmail;

    public AppStatusResponse() {
    }

    public String getConfiguredFilePath() {
        return configuredFilePath;
    }

    public void setConfiguredFilePath(String configuredFilePath) {
        this.configuredFilePath = configuredFilePath;
    }

    public boolean isFileExists() {
        return fileExists;
    }

    public void setFileExists(boolean fileExists) {
        this.fileExists = fileExists;
    }

    public String getActiveSprintName() {
        return activeSprintName;
    }

    public void setActiveSprintName(String activeSprintName) {
        this.activeSprintName = activeSprintName;
    }

    public List<SheetInfo> getSheets() {
        return sheets;
    }

    public void setSheets(List<SheetInfo> sheets) {
        this.sheets = sheets;
    }

    public List<String> getTeamMembers() {
        return teamMembers;
    }

    public void setTeamMembers(List<String> teamMembers) {
        this.teamMembers = teamMembers;
    }

    public List<String> getCategories() {
        return categories;
    }

    public void setCategories(List<String> categories) {
        this.categories = categories;
    }

    public String getCurrentUser() {
        return currentUser;
    }

    public void setCurrentUser(String currentUser) {
        this.currentUser = currentUser;
    }

    public boolean isSharePointConnected() {
        return sharePointConnected;
    }

    public void setSharePointConnected(boolean sharePointConnected) {
        this.sharePointConnected = sharePointConnected;
    }

    public String getSharePointUrl() {
        return sharePointUrl;
    }

    public void setSharePointUrl(String sharePointUrl) {
        this.sharePointUrl = sharePointUrl;
    }

    public String getPowerAutomateWebhookUrl() {
        return powerAutomateWebhookUrl;
    }

    public void setPowerAutomateWebhookUrl(String powerAutomateWebhookUrl) {
        this.powerAutomateWebhookUrl = powerAutomateWebhookUrl;
    }

    public boolean isResendConfigured() {
        return resendConfigured;
    }

    public void setResendConfigured(boolean resendConfigured) {
        this.resendConfigured = resendConfigured;
    }

    public String getResendToEmail() {
        return resendToEmail;
    }

    public void setResendToEmail(String resendToEmail) {
        this.resendToEmail = resendToEmail;
    }
}
