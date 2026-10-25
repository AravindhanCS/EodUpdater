package com.eod.updater.model;

public class SheetInfo {
    private String name;
    private int rowCount;
    private boolean activeSprint;

    public SheetInfo() {
    }

    public SheetInfo(String name, int rowCount, boolean activeSprint) {
        this.name = name;
        this.rowCount = rowCount;
        this.activeSprint = activeSprint;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getRowCount() {
        return rowCount;
    }

    public void setRowCount(int rowCount) {
        this.rowCount = rowCount;
    }

    public boolean isActiveSprint() {
        return activeSprint;
    }

    public void setActiveSprint(boolean activeSprint) {
        this.activeSprint = activeSprint;
    }
}
