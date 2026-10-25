package com.eod.updater.service;

import com.eod.updater.model.AdoConfig;
import com.eod.updater.model.AdoStoryPointTicket;
import com.eod.updater.model.AdoWorkItem;
import com.eod.updater.model.ResourceStoryPoints;
import com.eod.updater.model.SprintStoryPointsReport;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Service
public class AzureDevOpsService {

    private static final Logger log = LoggerFactory.getLogger(AzureDevOpsService.class);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    private String orgUrl;
    private String project;
    private String pat;
    private String targetState;

    private String currentUserId = null;
    private String currentUserName = null;

    private final Map<String, String> userCache = new java.util.concurrent.ConcurrentHashMap<>();

    private static final String CONFIG_FILE = "ado_config.json";

    public AzureDevOpsService(ObjectMapper objectMapper,
                              @Value("${eod.ado.org-url:https://dev.azure.com/simplicitysystems}") String defaultOrgUrl,
                              @Value("${eod.ado.project:SimplicityCollect}") String defaultProject,
                              @Value("${eod.ado.pat:}") String defaultPat,
                              @Value("${eod.ado.state:Development}") String defaultState) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .build();

        this.orgUrl = defaultOrgUrl;
        this.project = defaultProject;
        this.pat = defaultPat;
        this.targetState = defaultState;

        // Initialize known team members cache
        userCache.put("aravindhan", "a5fba53b-84a9-4409-8257-0288e033c7e2");
        userCache.put("akshaya", "9054254b-b1b7-4303-8516-5c789d37cdff");
        userCache.put("abinayasundari", "62b49eaf-825e-4f4e-b153-969de090997c");
        userCache.put("abinaya", "62b49eaf-825e-4f4e-b153-969de090997c");
        userCache.put("ahash", "76a66c6f-e37d-400c-a19b-7b81f30c1409");
        userCache.put("uma", "f1102a1c-d15d-4026-9b89-7db6d5a6b17f");
        userCache.put("sai sruthi", "92c6153a-e9e7-601b-bcf9-81448388566d");
        userCache.put("neema", "499358e9-a5c5-60b8-b251-dca2a6895e6a");

        loadPersistentConfig();
    }

    public synchronized void updateConfig(AdoConfig config) {
        if (config.getOrgUrl() != null && !config.getOrgUrl().isBlank()) {
            this.orgUrl = config.getOrgUrl().trim();
        }
        if (config.getProject() != null && !config.getProject().isBlank()) {
            this.project = config.getProject().trim();
        }
        if (config.getPat() != null && !config.getPat().isBlank()) {
            this.pat = config.getPat().trim();
        }
        if (config.getTargetState() != null && !config.getTargetState().isBlank()) {
            this.targetState = config.getTargetState().trim();
        }
        this.currentUserId = null;
        this.currentUserName = null;
        savePersistentConfig();
    }

    public AdoConfig getConfig() {
        if (this.currentUserName == null && this.pat != null && !this.pat.isBlank()) {
            getAuthenticatedUserId();
        }
        return new AdoConfig(this.orgUrl, this.project, null, this.targetState, this.pat != null && !this.pat.isBlank(), this.currentUserName);
    }

    public synchronized String getAuthenticatedUserId() {
        if (this.currentUserId != null && !this.currentUserId.isBlank()) {
            return this.currentUserId;
        }
        if (this.pat == null || this.pat.isBlank()) {
            return null;
        }
        try {
            String cleanOrg = this.orgUrl.replaceAll("/+$", "");
            String connUrl = cleanOrg + "/_apis/connectionData";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(connUrl))
                    .header("Authorization", getAuthHeader(this.pat))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode authUser = root.path("authenticatedUser");
                this.currentUserId = authUser.path("id").asText(null);
                String name = authUser.path("providerDisplayName").asText("");
                if (name.isBlank()) name = authUser.path("customDisplayName").asText("");
                if (name.isBlank()) name = authUser.path("displayName").asText(null);
                this.currentUserName = name.isBlank() ? null : name;
                if (this.currentUserName != null && this.currentUserId != null) {
                    userCache.put(this.currentUserName.toLowerCase(), this.currentUserId);
                    userCache.put(this.currentUserName.split(" ")[0].toLowerCase(), this.currentUserId);
                }
                log.info("Authenticated Azure DevOps user: '{}' (ID: {})", this.currentUserName, this.currentUserId);
                return this.currentUserId;
            } else {
                log.warn("Failed to get connectionData from ADO: HTTP {}", response.statusCode());
            }
        } catch (Exception e) {
            log.warn("Could not retrieve authenticated user ID from ADO: {}", e.getMessage());
        }
        return null;
    }

    public String resolveUserId(String targetUser) {
        if (targetUser == null || targetUser.isBlank()) {
            return getAuthenticatedUserId();
        }
        String key = targetUser.trim().toLowerCase();
        if (userCache.containsKey(key)) {
            return userCache.get(key);
        }
        for (Map.Entry<String, String> entry : userCache.entrySet()) {
            if (entry.getKey().contains(key) || key.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        // If not in cache yet, discover active PR creators across the project
        cacheAllPrCreators();
        if (userCache.containsKey(key)) {
            return userCache.get(key);
        }
        for (Map.Entry<String, String> entry : userCache.entrySet()) {
            if (entry.getKey().contains(key) || key.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private synchronized void cacheAllPrCreators() {
        try {
            String cleanOrg = this.orgUrl.replaceAll("/+$", "");
            String cleanProject = this.project.replaceAll("/+$", "");
            String prsUrl = cleanOrg + "/" + cleanProject + "/_apis/git/pullrequests?searchCriteria.status=active&api-version=7.0";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(prsUrl))
                    .header("Authorization", getAuthHeader(this.pat))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode prArray = root.path("value");
                if (prArray.isArray()) {
                    for (JsonNode pr : prArray) {
                        JsonNode creator = pr.path("createdBy");
                        String dName = creator.path("displayName").asText("");
                        String cId = creator.path("id").asText("");
                        if (!dName.isBlank() && !cId.isBlank()) {
                            userCache.put(dName.toLowerCase(), cId);
                            String firstName = dName.split(" ")[0].toLowerCase();
                            userCache.put(firstName, cId);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not cache PR creators: {}", e.getMessage());
        }
    }

    public List<AdoWorkItem> fetchAllTickets() throws Exception {
        return fetchAllTickets(null);
    }

    public List<AdoWorkItem> fetchAllTickets(String targetUser) throws Exception {
        if (this.pat == null || this.pat.isBlank()) {
            log.warn("Azure DevOps PAT not configured. Returning sample tickets for initial setup.");
            return getFallbackSampleTickets();
        }

        boolean isSelf = (targetUser == null || targetUser.isBlank()
                || (this.currentUserName != null && this.currentUserName.toLowerCase().contains(targetUser.trim().toLowerCase()))
                || "aravindhan".equalsIgnoreCase(targetUser.trim()));

        String queryUser = isSelf ? null : targetUser.trim();
        log.info("Fetching ADO tickets for: '{}' (isSelf={})", (targetUser != null ? targetUser : "Self/@Me"), isSelf);

        Map<String, AdoWorkItem> ticketMap = new LinkedHashMap<>();

        // 1. Fetch tickets assigned to target user in target state (Development / In Progress / Active)
        try {
            List<AdoWorkItem> devItems = fetchDevWorkItems(queryUser, isSelf);
            for (AdoWorkItem item : devItems) {
                ticketMap.put(item.getId(), item);
            }
        } catch (Exception e) {
            log.error("Failed to fetch dev work items from ADO for {}: {}", targetUser, e.getMessage(), e);
        }

        // 2. Fetch work items explicitly linked to active PRs created by the user with unresolved comments
        try {
            List<AdoWorkItem> prItems = fetchPrWorkItemsWithUnresolvedComments(queryUser, isSelf);
            for (AdoWorkItem item : prItems) {
                if (ticketMap.containsKey(item.getId())) {
                    AdoWorkItem existing = ticketMap.get(item.getId());
                    existing.setPrComment(true);
                    existing.setCategory("PR comments");
                    existing.setPrId(item.getPrId());
                    existing.setPrTitle(item.getPrTitle());
                    existing.setUnresolvedCommentsCount(item.getUnresolvedCommentsCount());
                } else {
                    ticketMap.put(item.getId(), item);
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch PR comment work items from ADO for {}: {}", targetUser, e.getMessage(), e);
        }

        if (ticketMap.isEmpty()) {
            log.info("No active tickets found in ADO for user: {}", targetUser != null ? targetUser : "Self");
            return Collections.emptyList();
        }

        return new ArrayList<>(ticketMap.values());
    }

    private List<AdoWorkItem> fetchDevWorkItems(String queryUser, boolean isSelf) throws Exception {
        String cleanOrg = this.orgUrl.replaceAll("/+$", "");
        String cleanProject = this.project.replaceAll("/+$", "");
        String wiqlUrl = cleanOrg + "/" + cleanProject + "/_apis/wit/wiql?api-version=7.0";

        String assignedClause = isSelf ? "[System.AssignedTo] = @Me" : String.format("[System.AssignedTo] contains '%s'", queryUser);
        String wiql = String.format(
                "Select [System.Id] From WorkItems Where %s and ([System.State] = '%s' or [System.State] = 'In Progress' or [System.State] = 'Active') order by [System.ChangedDate] desc",
                assignedClause,
                this.targetState
        );
        String requestBody = objectMapper.writeValueAsString(Collections.singletonMap("query", wiql));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(wiqlUrl))
                .header("Authorization", getAuthHeader(this.pat))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            throw new RuntimeException("WIQL Query failed with status " + response.statusCode() + ": " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode workItemsNode = root.path("workItems");
        if (!workItemsNode.isArray() || workItemsNode.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> ids = new ArrayList<>();
        for (JsonNode item : workItemsNode) {
            ids.add(item.path("id").asText());
            if (ids.size() >= 30) break; // Limit to 30 items
        }

        return fetchWorkItemDetails(ids, "Development", false, null, null, 0);
    }

    private List<AdoWorkItem> fetchPrWorkItemsWithUnresolvedComments(String queryUser, boolean isSelf) throws Exception {
        String cleanOrg = this.orgUrl.replaceAll("/+$", "");
        String cleanProject = this.project.replaceAll("/+$", "");

        String userId = isSelf ? getAuthenticatedUserId() : resolveUserId(queryUser);
        if (userId == null || userId.isBlank()) {
            log.warn("Cannot filter PRs: Authenticated or target user ID is not available for: {}", queryUser);
            return Collections.emptyList();
        }

        // 1. Fetch active PRs created by the user ONLY
        String prsUrl = cleanOrg + "/" + cleanProject + "/_apis/git/pullrequests?searchCriteria.creatorId=" + userId + "&searchCriteria.status=active&api-version=7.0";
        HttpRequest prRequest = HttpRequest.newBuilder()
                .uri(URI.create(prsUrl))
                .header("Authorization", getAuthHeader(this.pat))
                .timeout(Duration.ofSeconds(15))
                .GET()
                .build();

        HttpResponse<String> prResponse = httpClient.send(prRequest, HttpResponse.BodyHandlers.ofString());
        if (prResponse.statusCode() >= 400) {
            log.warn("Fetching user PRs failed with status: {}", prResponse.statusCode());
            return Collections.emptyList();
        }

        JsonNode prRoot = objectMapper.readTree(prResponse.body());
        JsonNode prArray = prRoot.path("value");
        if (!prArray.isArray() || prArray.isEmpty()) {
            return Collections.emptyList();
        }

        List<AdoWorkItem> prWorkItems = new ArrayList<>();

        for (JsonNode pr : prArray) {
            int prId = pr.path("pullRequestId").asInt();
            String prTitle = pr.path("title").asText();
            String repoId = pr.path("repository").path("id").asText();

            // 2. Check comment threads for unresolved comments
            String threadsUrl = cleanOrg + "/" + cleanProject + "/_apis/git/repositories/" + repoId + "/pullRequests/" + prId + "/threads?api-version=7.0";
            HttpRequest threadReq = HttpRequest.newBuilder()
                    .uri(URI.create(threadsUrl))
                    .header("Authorization", getAuthHeader(this.pat))
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();

            HttpResponse<String> threadResp = httpClient.send(threadReq, HttpResponse.BodyHandlers.ofString());
            int unresolvedCount = 0;
            if (threadResp.statusCode() == 200) {
                JsonNode threadRoot = objectMapper.readTree(threadResp.body());
                JsonNode threads = threadRoot.path("value");
                if (threads.isArray()) {
                    for (JsonNode t : threads) {
                        if (t.path("isDeleted").asBoolean(false)) {
                            continue;
                        }
                        String status = t.path("status").asText("");
                        // status "active" or "pending" indicates unresolved comment thread
                        if ("active".equalsIgnoreCase(status) || "pending".equalsIgnoreCase(status)) {
                            // Ensure thread contains at least one non-system user comment
                            JsonNode comments = t.path("comments");
                            boolean hasRealComment = false;
                            if (comments.isArray()) {
                                for (JsonNode c : comments) {
                                    String commentType = c.path("commentType").asText("text");
                                    String content = c.path("content").asText("");
                                    if (!"system".equalsIgnoreCase(commentType) && !content.isBlank()) {
                                        hasRealComment = true;
                                        break;
                                    }
                                }
                            }
                            if (hasRealComment) {
                                unresolvedCount++;
                            }
                        }
                    }
                }
            }

            if (unresolvedCount > 0) {
                // 3. PR has unresolved comments! Get work items linked to this user's PR
                String workItemsUrl = cleanOrg + "/" + cleanProject + "/_apis/git/repositories/" + repoId + "/pullRequests/" + prId + "/workitems?api-version=7.0";
                HttpRequest wiReq = HttpRequest.newBuilder()
                        .uri(URI.create(workItemsUrl))
                        .header("Authorization", getAuthHeader(this.pat))
                        .timeout(Duration.ofSeconds(10))
                        .GET()
                        .build();

                HttpResponse<String> wiResp = httpClient.send(wiReq, HttpResponse.BodyHandlers.ofString());
                if (wiResp.statusCode() == 200) {
                    JsonNode wiRoot = objectMapper.readTree(wiResp.body());
                    JsonNode linkedItems = wiRoot.path("value");
                    if (linkedItems.isArray() && !linkedItems.isEmpty()) {
                        List<String> ids = new ArrayList<>();
                        for (JsonNode wi : linkedItems) {
                            ids.add(wi.path("id").asText());
                        }
                        List<AdoWorkItem> items = fetchWorkItemDetails(ids, "PR comments", true, prId, prTitle, unresolvedCount);
                        prWorkItems.addAll(items);
                    } else {
                        // PR has comments but no work item linked explicitly -> return PR entry
                        String itemUrl = cleanOrg + "/" + cleanProject + "/_git/" + repoId + "/pullrequest/" + prId;
                        prWorkItems.add(new AdoWorkItem(
                                "PR-" + prId,
                                prTitle,
                                "PullRequest",
                                "Active",
                                "PR comments",
                                true,
                                prId,
                                prTitle,
                                unresolvedCount,
                                itemUrl
                        ));
                    }
                }
            }
        }

        return prWorkItems;
    }

    private List<AdoWorkItem> fetchWorkItemDetails(List<String> ids, String category, boolean isPrComment, Integer prId, String prTitle, int commentsCount) throws Exception {
        if (ids.isEmpty()) return Collections.emptyList();

        String cleanOrg = this.orgUrl.replaceAll("/+$", "");
        String cleanProject = this.project.replaceAll("/+$", "");
        String url = cleanOrg + "/" + cleanProject + "/_apis/wit/workitems?ids=" + String.join(",", ids) + "&api-version=7.0";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", getAuthHeader(this.pat))
                .timeout(Duration.ofSeconds(15))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() >= 400) {
            log.warn("Fetching work items batch failed: {}", response.statusCode());
            return Collections.emptyList();
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode itemsArray = root.path("value");
        List<AdoWorkItem> result = new ArrayList<>();

        if (itemsArray.isArray()) {
            for (JsonNode item : itemsArray) {
                String id = item.path("id").asText();
                JsonNode fields = item.path("fields");
                String title = fields.path("System.Title").asText("Work item #" + id);
                String state = fields.path("System.State").asText("Development");
                String type = fields.path("System.WorkItemType").asText("Task");
                String itemUrl = cleanOrg + "/" + cleanProject + "/_workitems/edit/" + id;

                result.add(new AdoWorkItem(
                        id,
                        title,
                        type,
                        state,
                        category,
                        isPrComment,
                        prId,
                        prTitle,
                        commentsCount,
                        itemUrl
                ));
            }
        }

        return result;
    }

    public boolean testConnection(String testOrgUrl, String testProject, String testPat) {
        try {
            String cleanOrg = testOrgUrl.replaceAll("/+$", "");
            String cleanProject = testProject.replaceAll("/+$", "");
            String url = cleanOrg + "/" + cleanProject + "/_apis/wit/wiql?api-version=7.0";

            String body = "{\"query\":\"Select [System.Id] From WorkItems Where [System.AssignedTo] = @Me\"}";
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", getAuthHeader(testPat))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(8))
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            log.warn("Test ADO connection failed: {}", e.getMessage());
            return false;
        }
    }

    private String getAuthHeader(String token) {
        String auth = ":" + token;
        byte[] encodedAuth = Base64.getEncoder().encode(auth.getBytes(StandardCharsets.UTF_8));
        return "Basic " + new String(encodedAuth, StandardCharsets.UTF_8);
    }

    private void savePersistentConfig() {
        try {
            Map<String, String> map = new HashMap<>();
            map.put("orgUrl", this.orgUrl);
            map.put("project", this.project);
            map.put("pat", this.pat);
            map.put("targetState", this.targetState);
            objectMapper.writeValue(new File(CONFIG_FILE), map);
        } catch (Exception e) {
            log.warn("Could not save persistent ADO config: {}", e.getMessage());
        }
    }

    private void loadPersistentConfig() {
        try {
            File file = new File(CONFIG_FILE);
            if (file.exists()) {
                JsonNode node = objectMapper.readTree(file);
                if (node.hasNonNull("orgUrl")) this.orgUrl = node.get("orgUrl").asText();
                if (node.hasNonNull("project")) this.project = node.get("project").asText();
                if (node.hasNonNull("pat")) this.pat = node.get("pat").asText();
                if (node.hasNonNull("targetState")) this.targetState = node.get("targetState").asText();
                log.info("Loaded ADO config from file: Org={}, Project={}", this.orgUrl, this.project);
            }
        } catch (Exception e) {
            log.warn("Could not read persistent ADO config: {}", e.getMessage());
        }

        // Environment Variable fallback (for Render / Docker cloud deployments)
        if (this.pat == null || this.pat.isBlank()) {
            String envPat = System.getenv("EOD_ADO_PAT");
            if (envPat == null || envPat.isBlank()) envPat = System.getenv("ADO_PAT");
            if (envPat != null && !envPat.isBlank()) {
                this.pat = envPat.trim();
                log.info("Loaded Azure DevOps PAT from environment variable (length: {})", this.pat.length());
            }
        }
    }

    private List<AdoWorkItem> getFallbackSampleTickets() {
        List<AdoWorkItem> sample = new ArrayList<>();
        sample.add(new AdoWorkItem(
                "5146",
                "Investigated payment exception during flow processor execution",
                "Bug",
                "Development",
                "Development",
                false,
                null,
                null,
                0,
                "https://dev.azure.com/simplicitysystems/SimplicityCollect/_workitems/edit/5146"
        ));
        sample.add(new AdoWorkItem(
                "4673",
                "Worked on UsePay integration authentication and validation",
                "User Story",
                "Development",
                "Development",
                false,
                null,
                null,
                0,
                "https://dev.azure.com/simplicitysystems/SimplicityCollect/_workitems/edit/4673"
        ));
        sample.add(new AdoWorkItem(
                "4730",
                "Addressed code review comments on PDC payment flow processor",
                "Bug",
                "Development",
                "PR comments",
                true,
                128,
                "PR 128: Fix PDC flow processor exception",
                2,
                "https://dev.azure.com/simplicitysystems/SimplicityCollect/_workitems/edit/4730"
        ));
        return sample;
    }

    public String getCurrentIterationName() {
        try {
            String cleanOrg = this.orgUrl.replaceAll("/+$", "");
            String cleanProject = this.project.replaceAll("/+$", "");
            String url = cleanOrg + "/" + cleanProject + "/_apis/work/teamsettings/iterations?$timeframe=current&api-version=7.0";
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", getAuthHeader(this.pat))
                    .timeout(Duration.ofSeconds(25))
                    .GET()
                    .build();
            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());
            if (resp.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(resp.body());
                JsonNode value = root.path("value");
                if (value.isArray() && !value.isEmpty()) {
                    return value.get(0).path("name").asText("");
                }
            }
        } catch (Exception e) {
            log.warn("Could not retrieve current iteration: {}", e.getMessage());
        }
        return null;
    }

    public SprintStoryPointsReport calculateSprintStoryPoints(String sprintName) {
        if (this.pat == null || this.pat.isBlank()) {
            return SprintStoryPointsReport.error(sprintName, "Azure DevOps PAT is not configured. Please configure your PAT in Settings.");
        }

        String targetSprint = (sprintName != null && !sprintName.isBlank()) ? sprintName.trim() : "";
        String cleanOrg = this.orgUrl.replaceAll("/+$", "");
        String cleanProject = this.project.replaceAll("/+$", "");

        // If sprintName is not supplied, discover current iteration name
        if (targetSprint.isEmpty()) {
            String cur = getCurrentIterationName();
            targetSprint = (cur != null && !cur.isBlank()) ? cur : "2.14.10.1";
        }

        String iterationPath = targetSprint.startsWith(cleanProject + "\\")
                ? targetSprint
                : cleanProject + "\\" + targetSprint;
        // In WIQL strings, backslashes must be escaped with \\
        String escapedIterationPath = iterationPath.replace("\\", "\\\\");

        log.info("Calculating ADO story points for sprint iteration: '{}'", iterationPath);

        try {
            String wiqlUrl = cleanOrg + "/" + cleanProject + "/_apis/wit/wiql?api-version=7.0";
            String wiql = String.format(
                    "Select [System.Id] From WorkItems Where [System.IterationPath] Under '%s' and ([System.State] = 'Closed' or [System.State] = 'Testing') order by [System.Id] desc",
                    escapedIterationPath
            );

            String requestBody = objectMapper.writeValueAsString(Collections.singletonMap("query", wiql));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(wiqlUrl))
                    .header("Authorization", getAuthHeader(this.pat))
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(35))
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.error("Failed to execute WIQL for story points: HTTP {} - {}", response.statusCode(), response.body());
                return SprintStoryPointsReport.error(targetSprint, "Azure DevOps query failed (HTTP " + response.statusCode() + "). Check sprint name or PAT.");
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode workItemsNode = root.path("workItems");
            if (!workItemsNode.isArray() || workItemsNode.isEmpty()) {
                log.info("No Closed or Testing work items found in sprint: '{}'", iterationPath);
                return new SprintStoryPointsReport(targetSprint, 0.0, 0, 0, 0, 0, new ArrayList<>());
            }

            List<String> allIds = new ArrayList<>();
            for (JsonNode item : workItemsNode) {
                allIds.add(item.path("id").asText());
            }

            // Batch fetch work item details in chunks of 100
            int chunkSize = 100;
            Map<String, ResourceStoryPoints> resourceMap = new LinkedHashMap<>();
            double totalSprintPoints = 0.0;
            int totalClosed = 0;
            int totalTesting = 0;

            String fieldsParam = "System.Id,System.Title,System.State,System.WorkItemType,System.AssignedTo,Microsoft.VSTS.Scheduling.StoryPoints";

            for (int i = 0; i < allIds.size(); i += chunkSize) {
                List<String> chunk = allIds.subList(i, Math.min(i + chunkSize, allIds.size()));
                String chunkIds = String.join(",", chunk);
                String detailsUrl = cleanOrg + "/" + cleanProject + "/_apis/wit/workitems?ids=" + chunkIds + "&fields=" + fieldsParam + "&api-version=7.0";

                HttpRequest detailsReq = HttpRequest.newBuilder()
                        .uri(URI.create(detailsUrl))
                        .header("Authorization", getAuthHeader(this.pat))
                        .timeout(Duration.ofSeconds(35))
                        .GET()
                        .build();

                HttpResponse<String> detailsResp = httpClient.send(detailsReq, HttpResponse.BodyHandlers.ofString());
                if (detailsResp.statusCode() >= 400) {
                    log.warn("Failed to fetch work item batch details: HTTP {}", detailsResp.statusCode());
                    continue;
                }

                JsonNode detailsRoot = objectMapper.readTree(detailsResp.body());
                JsonNode itemsArray = detailsRoot.path("value");
                if (itemsArray.isArray()) {
                    for (JsonNode w : itemsArray) {
                        String id = w.path("id").asText();
                        JsonNode f = w.path("fields");
                        String title = f.path("System.Title").asText("Ticket #" + id);
                        String state = f.path("System.State").asText("Unknown");
                        String type = f.path("System.WorkItemType").asText("Task");

                        String assignedTo = "Unassigned";
                        JsonNode assignedNode = f.path("System.AssignedTo");
                        if (!assignedNode.isMissingNode() && assignedNode.has("displayName")) {
                            assignedTo = assignedNode.path("displayName").asText("Unassigned");
                        }

                        double points = 0.0;
                        JsonNode spNode = f.path("Microsoft.VSTS.Scheduling.StoryPoints");
                        if (!spNode.isMissingNode() && !spNode.isNull()) {
                            points = spNode.asDouble(0.0);
                        }

                        points = Math.round(points * 10.0) / 10.0;

                        String itemUrl = cleanOrg + "/" + cleanProject + "/_workitems/edit/" + id;

                        AdoStoryPointTicket ticket = new AdoStoryPointTicket(
                                id, title, type, state, points, assignedTo, itemUrl
                        );

                        totalSprintPoints += points;
                        if ("Closed".equalsIgnoreCase(state)) {
                            totalClosed++;
                        } else if ("Testing".equalsIgnoreCase(state)) {
                            totalTesting++;
                        }

                        ResourceStoryPoints resource = resourceMap.computeIfAbsent(assignedTo, k -> new ResourceStoryPoints(k, 0.0, 0, 0, 0, new ArrayList<>()));
                        resource.setTotalStoryPoints(Math.round((resource.getTotalStoryPoints() + points) * 10.0) / 10.0);
                        resource.setTotalCount(resource.getTotalCount() + 1);
                        if ("Closed".equalsIgnoreCase(state)) {
                            resource.setClosedCount(resource.getClosedCount() + 1);
                        } else if ("Testing".equalsIgnoreCase(state)) {
                            resource.setTestingCount(resource.getTestingCount() + 1);
                        }
                        resource.getTickets().add(ticket);
                    }
                }
            }

            totalSprintPoints = Math.round(totalSprintPoints * 10.0) / 10.0;

            // Sort resources: highest story points first; "Unassigned" at the end
            List<ResourceStoryPoints> sortedResources = new ArrayList<>(resourceMap.values());
            sortedResources.sort((a, b) -> {
                if ("Unassigned".equalsIgnoreCase(a.getResourceName())) return 1;
                if ("Unassigned".equalsIgnoreCase(b.getResourceName())) return -1;
                int cmp = Double.compare(b.getTotalStoryPoints(), a.getTotalStoryPoints());
                if (cmp != 0) return cmp;
                return a.getResourceName().compareToIgnoreCase(b.getResourceName());
            });

            // Sort tickets inside each resource: points desc, then id desc
            for (ResourceStoryPoints r : sortedResources) {
                r.getTickets().sort((t1, t2) -> {
                    int c = Double.compare(t2.getStoryPoints(), t1.getStoryPoints());
                    if (c != 0) return c;
                    return t2.getId().compareTo(t1.getId());
                });
            }

            return new SprintStoryPointsReport(
                    targetSprint,
                    totalSprintPoints,
                    totalClosed,
                    totalTesting,
                    allIds.size(),
                    sortedResources.size(),
                    sortedResources
            );

        } catch (Exception e) {
            log.error("Exception calculating sprint story points for {}: {}", targetSprint, e.getMessage(), e);
            return SprintStoryPointsReport.error(targetSprint, "Error calculating story points: " + e.getMessage());
        }
    }
}
