const API_URL = "https://nodejs-2dd9-5000.prg1.zerops.app";

async function loadDashboard() {
    try {
        const [apisResponse, incidentsResponse] = await Promise.all([
            fetch(`${API_URL}/api/apis`),
            fetch(`${API_URL}/api/incidents`)
        ]);

        if (!apisResponse.ok || !incidentsResponse.ok) {
            throw new Error("Backend request failed");
        }

        const apiData = await apisResponse.json();
        const incidentData = await incidentsResponse.json();

        renderApis(apiData.apis || []);
        renderIncidents(incidentData.incidents || []);
        updateStats(
            apiData.apis || [],
            incidentData.incidents || []
        );

        const status = document.querySelector(".status");

        if (status) {
            status.innerHTML =
                `<span class="dot"></span> System Operational`;
        }

    } catch (error) {
        console.error("Dashboard error:", error);

        const status = document.querySelector(".status");

        if (status) {
            status.innerHTML =
                `<span class="dot" style="background:#ff6262"></span> Backend Offline`;
        }
    }
}

function updateStats(apis, incidents) {
    const healthy = apis.filter(
        api => api.status === "healthy"
    ).length;

    const down = apis.filter(
        api => api.status === "down"
    ).length;

    const totalApis = document.getElementById("totalApis");
    const healthyApis = document.getElementById("healthyApis");
    const downApis = document.getElementById("downApis");
    const incidentCount = document.getElementById("incidentCount");

    if (totalApis) {
        totalApis.textContent = apis.length;
    }

    if (healthyApis) {
        healthyApis.textContent = healthy;
    }

    if (downApis) {
        downApis.textContent = down;
    }

    if (incidentCount) {
        incidentCount.textContent = incidents.length;
    }
}

function renderApis(apis) {
    const apiList = document.getElementById("apiList");

    if (!apiList) return;

    apiList.innerHTML = "";

    if (apis.length === 0) {
        apiList.innerHTML = `
            <div class="incident">
                <div class="incident-icon">!</div>
                <div>
                    <strong>No APIs configured</strong>
                    <p>Add an API to start monitoring.</p>
                </div>
            </div>
        `;
        return;
    }

    apis.forEach(api => {
        const statusClass =
            api.status === "healthy"
                ? "healthy"
                : "down";

        const statusText =
            api.status === "healthy"
                ? "Healthy"
                : api.status === "down"
                    ? "Down"
                    : "Unknown";

        const response =
            api.responseTime !== null &&
            api.responseTime !== undefined &&
            api.responseTime > 0
                ? `${api.responseTime}ms`
                : "--";

        const card = document.createElement("div");

        card.className = "api-card";

        card.innerHTML = `
            <div class="api-info">
                <div class="api-icon">🌐</div>

                <div>
                    <h4>${escapeHtml(api.name)}</h4>
                    <p>${escapeHtml(api.url)}</p>
                </div>
            </div>

            <div class="api-status ${statusClass}">
                <span></span>
                ${statusText}
            </div>

            <div class="response">
                <strong>${response}</strong>
                <small>Response</small>
            </div>
        `;

        apiList.appendChild(card);
    });
}

function renderIncidents(incidents) {
    const container = document.querySelector(".incident-list");

    if (!container) return;

    container.innerHTML = "";

    if (incidents.length === 0) {
        container.innerHTML = `
            <div class="incident">
                <div class="incident-icon">✓</div>

                <div>
                    <strong>No incidents detected</strong>
                    <p>All monitored APIs are operating normally.</p>
                </div>
            </div>
        `;

        return;
    }

    incidents.slice(0, 5).forEach(incident => {
        const div = document.createElement("div");

        div.className = "incident";

        div.innerHTML = `
            <div class="incident-icon">!</div>

            <div>
                <strong>
                    ${escapeHtml(incident.apiName)}
                </strong>

                <p>
                    ${escapeHtml(incident.message)}
                </p>
            </div>

            <span>
                ${formatTime(incident.timestamp)}
            </span>
        `;

        container.appendChild(div);
    });
}

async function checkAllApis() {
    const button = document.getElementById("checkAllBtn");

    if (!button) return;

    button.textContent = "Checking...";
    button.disabled = true;

    try {
        const response = await fetch(
            `${API_URL}/api/check-all`,
            {
                method: "POST"
            }
        );

        if (!response.ok) {
            throw new Error("Check failed");
        }

        await loadDashboard();

    } catch (error) {
        console.error("Check error:", error);
        alert("Unable to contact API Sentinel backend.");

    } finally {
        button.textContent = "Check All APIs";
        button.disabled = false;
    }
}

function formatTime(timestamp) {
    if (!timestamp) return "--";

    return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(value) {
    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}

const checkButton = document.getElementById("checkAllBtn");

if (checkButton) {
    checkButton.addEventListener(
        "click",
        checkAllApis
    );
}

// Initial load
loadDashboard();

// Refresh every 15 seconds
setInterval(
    loadDashboard,
    15000
);