package com.eod.updater.model;

public class AdoWorkItem {
    private String id;
    private String title;
    private String type;
    private String state;
    private String category;
    private boolean isPrComment;
    private Integer prId;
    private String prTitle;
    private int unresolvedCommentsCount;
    private String url;

    public AdoWorkItem() {
    }

    public AdoWorkItem(String id, String title, String type, String state, String category, boolean isPrComment, Integer prId, String prTitle, int unresolvedCommentsCount, String url) {
        this.id = id;
        this.title = title;
        this.type = type;
        this.state = state;
        this.category = category;
        this.isPrComment = isPrComment;
        this.prId = prId;
        this.prTitle = prTitle;
        this.unresolvedCommentsCount = unresolvedCommentsCount;
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public boolean isPrComment() {
        return isPrComment;
    }

    public void setPrComment(boolean prComment) {
        isPrComment = prComment;
    }

    public Integer getPrId() {
        return prId;
    }

    public void setPrId(Integer prId) {
        this.prId = prId;
    }

    public String getPrTitle() {
        return prTitle;
    }

    public void setPrTitle(String prTitle) {
        this.prTitle = prTitle;
    }

    public int getUnresolvedCommentsCount() {
        return unresolvedCommentsCount;
    }

    public void setUnresolvedCommentsCount(int unresolvedCommentsCount) {
        this.unresolvedCommentsCount = unresolvedCommentsCount;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }
}
