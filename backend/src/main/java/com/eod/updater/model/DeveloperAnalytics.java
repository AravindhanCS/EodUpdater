package com.eod.updater.model;

import java.util.List;
import java.util.Map;

public class DeveloperAnalytics {
    private String name;
    private double totalHours;
    private double ticketHours;
    private double callHours;
    private double productiveHours;
    private double overheadHours;
    private double productivePercentage;
    private double overheadPercentage;
    private int uniqueTicketsCount;
    private int completedTicketsCount;
    private double completionRate;
    private Map<String, Double> categoryHours;
    private List<DeveloperTicketDetail> tickets;
    private Map<String, Double> dailyHours;

    public DeveloperAnalytics() {}

    public DeveloperAnalytics(String name, double totalHours, double ticketHours, double callHours,
                              double productiveHours, double overheadHours,
                              double productivePercentage, double overheadPercentage,
                              int uniqueTicketsCount, int completedTicketsCount, double completionRate,
                              Map<String, Double> categoryHours, List<DeveloperTicketDetail> tickets,
                              Map<String, Double> dailyHours) {
        this.name = name;
        this.totalHours = totalHours;
        this.ticketHours = ticketHours;
        this.callHours = callHours;
        this.productiveHours = productiveHours;
        this.overheadHours = overheadHours;
        this.productivePercentage = productivePercentage;
        this.overheadPercentage = overheadPercentage;
        this.uniqueTicketsCount = uniqueTicketsCount;
        this.completedTicketsCount = completedTicketsCount;
        this.completionRate = completionRate;
        this.categoryHours = categoryHours;
        this.tickets = tickets;
        this.dailyHours = dailyHours;
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

    public double getProductiveHours() {
        return productiveHours;
    }

    public void setProductiveHours(double productiveHours) {
        this.productiveHours = productiveHours;
    }

    public double getOverheadHours() {
        return overheadHours;
    }

    public void setOverheadHours(double overheadHours) {
        this.overheadHours = overheadHours;
    }

    public double getProductivePercentage() {
        return productivePercentage;
    }

    public void setProductivePercentage(double productivePercentage) {
        this.productivePercentage = productivePercentage;
    }

    public double getOverheadPercentage() {
        return overheadPercentage;
    }

    public void setOverheadPercentage(double overheadPercentage) {
        this.overheadPercentage = overheadPercentage;
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

    public double getCompletionRate() {
        return completionRate;
    }

    public void setCompletionRate(double completionRate) {
        this.completionRate = completionRate;
    }

    public Map<String, Double> getCategoryHours() {
        return categoryHours;
    }

    public void setCategoryHours(Map<String, Double> categoryHours) {
        this.categoryHours = categoryHours;
    }

    public List<DeveloperTicketDetail> getTickets() {
        return tickets;
    }

    public void setTickets(List<DeveloperTicketDetail> tickets) {
        this.tickets = tickets;
    }

    public Map<String, Double> getDailyHours() {
        return dailyHours;
    }

    public void setDailyHours(Map<String, Double> dailyHours) {
        this.dailyHours = dailyHours;
    }
}
