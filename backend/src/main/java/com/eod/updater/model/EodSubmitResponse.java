package com.eod.updater.model;

public class EodSubmitResponse {
    private boolean success;
    private String message;
    private String sheetName;
    private int rowsAdded;
    private double totalHoursAdded;
    private int totalSheetRows;
    private String backupPath;
    private boolean sharePointSynced;

    public EodSubmitResponse() {
    }

    public EodSubmitResponse(boolean success, String message, String sheetName, int rowsAdded, double totalHoursAdded, int totalSheetRows, String backupPath, boolean sharePointSynced) {
        this.success = success;
        this.message = message;
        this.sheetName = sheetName;
        this.rowsAdded = rowsAdded;
        this.totalHoursAdded = totalHoursAdded;
        this.totalSheetRows = totalSheetRows;
        this.backupPath = backupPath;
        this.sharePointSynced = sharePointSynced;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getSheetName() {
        return sheetName;
    }

    public void setSheetName(String sheetName) {
        this.sheetName = sheetName;
    }

    public int getRowsAdded() {
        return rowsAdded;
    }

    public void setRowsAdded(int rowsAdded) {
        this.rowsAdded = rowsAdded;
    }

    public double getTotalHoursAdded() {
        return totalHoursAdded;
    }

    public void setTotalHoursAdded(double totalHoursAdded) {
        this.totalHoursAdded = totalHoursAdded;
    }

    public int getTotalSheetRows() {
        return totalSheetRows;
    }

    public void setTotalSheetRows(int totalSheetRows) {
        this.totalSheetRows = totalSheetRows;
    }

    public String getBackupPath() {
        return backupPath;
    }

    public void setBackupPath(String backupPath) {
        this.backupPath = backupPath;
    }

    public boolean isSharePointSynced() {
        return sharePointSynced;
    }

    public void setSharePointSynced(boolean sharePointSynced) {
        this.sharePointSynced = sharePointSynced;
    }
}
