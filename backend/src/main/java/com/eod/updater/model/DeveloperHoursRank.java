package com.eod.updater.model;

public class DeveloperHoursRank {
    private int rank;
    private String name;
    private double totalHours;
    private double ticketHours;
    private double callHours;
    private int uniqueTicketsCount;
    private int completedTicketsCount;
    private double percentOfTeamHours;

    public DeveloperHoursRank() {}

    public DeveloperHoursRank(int rank, String name, double totalHours, double ticketHours, double callHours,
                              int uniqueTicketsCount, int completedTicketsCount, double percentOfTeamHours) {
        this.rank = rank;
        this.name = name;
        this.totalHours = totalHours;
        this.ticketHours = ticketHours;
        this.callHours = callHours;
        this.uniqueTicketsCount = uniqueTicketsCount;
        this.completedTicketsCount = completedTicketsCount;
        this.percentOfTeamHours = percentOfTeamHours;
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

    public double getTotalHours() {
        return totalHours;
    }

    public void setTotalHours(double totalHours) {
        this.totalHours = totalHours;
    }

    public double getTicketHours() {
        return ticketHours;
    }

    public void setTicketHours(double ticketHours) {
        this.ticketHours = ticketHours;
    }

    public double getCallHours() {
        return callHours;
    }

    public void setCallHours(double callHours) {
        this.callHours = callHours;
    }

    public int getUniqueTicketsCount() {
        return uniqueTicketsCount;
    }

    public void setUniqueTicketsCount(int uniqueTicketsCount) {
        this.uniqueTicketsCount = uniqueTicketsCount;
    }

    public int getCompletedTicketsCount() {
        return completedTicketsCount;
    }

    public void setCompletedTicketsCount(int completedTicketsCount) {
        this.completedTicketsCount = completedTicketsCount;
    }

    public double getPercentOfTeamHours() {
        return percentOfTeamHours;
    }

    public void setPercentOfTeamHours(double percentOfTeamHours) {
        this.percentOfTeamHours = percentOfTeamHours;
    }
}
