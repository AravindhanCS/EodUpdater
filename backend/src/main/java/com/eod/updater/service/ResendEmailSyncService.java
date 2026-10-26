package com.eod.updater.service;

import com.eod.updater.model.EodEntry;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ResendEmailSyncService {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailSyncService.class);
    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    private final ObjectMapper objectMapper;

    @Value("${eod.resend.api-key:}")
    private String apiKey;

    @Value("${eod.resend.from-email:onboarding@resend.dev}")
    private String fromEmail;

    @Value("${eod.resend.to-email:aravindhan.chandrasekaran@psiog.com}")
    private String toEmail;

    @Value("${eod.resend.subject:[EOD-UPDATE]}")
    private String subject;

    public ResendEmailSyncService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = (apiKey != null) ? apiKey.trim() : "";
    }

    public String getFromEmail() {
        return fromEmail;
    }

    public void setFromEmail(String fromEmail) {
        this.fromEmail = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail.trim() : "onboarding@resend.dev";
    }

    public String getToEmail() {
        return toEmail;
    }

    public void setToEmail(String toEmail) {
        this.toEmail = (toEmail != null && !toEmail.isBlank()) ? toEmail.trim() : "aravindhan.chandrasekaran@psiog.com";
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = (subject != null && !subject.isBlank()) ? subject.trim() : "[EOD-UPDATE]";
    }

    public void sendEodUpdateEmail(String targetSheetName, List<EodEntry> entries) throws IOException, InterruptedException {
        sendEodUpdateEmail(this.apiKey, this.toEmail, targetSheetName, entries);
    }

    public void sendEodUpdateEmail(String activeApiKey, String targetRecipient, String targetSheetName, List<EodEntry> entries) throws IOException, InterruptedException {
        if (activeApiKey == null || activeApiKey.isBlank()) {
            throw new IllegalStateException("Resend API key is not configured. Please set the RESEND_API_KEY environment variable on your server (e.g. Render Dashboard -> Environment) or in application.properties.");
        }
        if (targetRecipient == null || targetRecipient.isBlank()) {
            throw new IllegalArgumentException("Target recipient email cannot be empty.");
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sheetName", targetSheetName);
        payload.put("entries", entries);

        String jsonText = objectMapper.writeValueAsString(payload);

        Map<String, Object> resendRequest = new LinkedHashMap<>();
        resendRequest.put("from", this.fromEmail != null && !this.fromEmail.isBlank() ? this.fromEmail : "onboarding@resend.dev");
        resendRequest.put("to", Collections.singletonList(targetRecipient.trim()));
        resendRequest.put("subject", this.subject != null && !this.subject.isBlank() ? this.subject : "[EOD-UPDATE]");
        resendRequest.put("text", jsonText);

        String requestBody = objectMapper.writeValueAsString(resendRequest);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(15))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(RESEND_API_URL))
                .header("Authorization", "Bearer " + activeApiKey.trim())
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();

        log.info("Dispatching EOD update via Resend to {} for sheet {}", targetRecipient, targetSheetName);
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        int statusCode = response.statusCode();
        if (statusCode < 200 || statusCode >= 300) {
            log.error("Resend API failed with HTTP {}: {}", statusCode, response.body());
            throw new IOException("Resend API returned HTTP " + statusCode + ": " + response.body());
        }

        log.info("Successfully sent EOD update email via Resend (HTTP {}): {}", statusCode, response.body());
    }

    public void sendTestEmail(String testKey, String testRecipient) throws IOException, InterruptedException {
        String effectiveKey = (testKey != null && !testKey.isBlank()) ? testKey.trim() : this.apiKey;
        String effectiveRecipient = (testRecipient != null && !testRecipient.isBlank()) ? testRecipient.trim() : this.toEmail;

        List<EodEntry> sampleEntries = Collections.singletonList(
                new EodEntry("10/26/2026", "Test Connection", "TEST-000", "Internal calls", 0.0, "Test ping to verify Resend and Power Automate flow")
        );

        sendEodUpdateEmail(effectiveKey, effectiveRecipient, "TEST_PING", sampleEntries);
    }
}
