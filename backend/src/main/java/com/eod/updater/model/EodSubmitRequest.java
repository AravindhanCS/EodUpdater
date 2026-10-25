package com.eod.updater.model;

import java.util.List;

public class EodSubmitRequest {
    private String filePath;
    private String sheetName;
    private Boolean createSheetIfMissing;
    private List<EodEntry> entries;

    public EodSubmitRequest() {
    }

    public EodSubmitRequest(String filePath, String sheetName, Boolean createSheetIfMissing, List<EodEntry> entries) {
        this.filePath = filePath;
        this.sheetName = sheetName;
        this.createSheetIfMissing = createSheetIfMissing;
        this.entries = entries;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public String getSheetName() {
        return sheetName;
    }

    public void setSheetName(String sheetName) {
        this.sheetName = sheetName;
    }

    public Boolean getCreateSheetIfMissing() {
        return createSheetIfMissing;
    }

    public void setCreateSheetIfMissing(Boolean createSheetIfMissing) {
        this.createSheetIfMissing = createSheetIfMissing;
    }

    public List<EodEntry> getEntries() {
        return entries;
    }

    public void setEntries(List<EodEntry> entries) {
        this.entries = entries;
    }
}
