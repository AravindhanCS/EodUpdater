package com.eod.updater.model;

public class DeveloperCompletionRank {
    private int rank;
    private String name;
    private int completedTicketsCount;
    private int totalTicketsWorked;
    private double completionRate;
    private double totalHours;

    public DeveloperCompletionRank() {}

    public DeveloperCompletionRank(int rank, String name, int completedTicketsCount,
                                   int totalTicketsWorked, double completionRate, double totalHours) {
        this.rank = rank;
        this.name = name;
        this.completedTicketsCount = completedTicketsCount;
        this.totalTicketsWorked = totalTicketsWorked;
        this.completionRate = completionRate;
        this.totalHours = totalHours;
    }

    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getCompletedTicketsCount() {
        return completedTicketsCount;
    }

    public void setCompletedTicketsCount(int completedTicketsCount) {
        this.completedTicketsCount = completedTicketsCount;
    }

    public int getTotalTicketsWorked() {
        return totalTicketsWorked;
    }

    public void setTotalTicketsWorked(int totalTicketsWorked) {
        this.totalTicketsWorked = totalTicketsWorked;
    }

    public double getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(double completionRate) {
        this.completionRate = completionRate;
    }

    public double getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(double totalHours) {
        this.totalHours = totalHours;
    }
}
