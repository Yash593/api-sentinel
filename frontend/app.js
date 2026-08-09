const API_URL = "https://nodejs-2dd9-5000.prg1.zerops.app";


/* =====================================================
   LOAD DASHBOARD
   ===================================================== */

async function loadDashboard() {

    try {

        const [apisResponse, incidentsResponse] =
            await Promise.all([
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


/* =====================================================
   UPDATE DASHBOARD STATS
   ===================================================== */

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


/* =====================================================
   RENDER MONITORED APIS
   ===================================================== */

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
                : api.status === "down"
                    ? "down"
                    : "unknown";

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

                <div class="api-icon">
                    🌐
                </div>

                <div>
                    <h4>
                        ${escapeHtml(api.name)}
                    </h4>

                    <p>
                        ${escapeHtml(api.url)}
                    </p>
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

            <button
                class="remove-api-btn"
                type="button"
            >
                Remove
            </button>
        `;


        /* Remove button */

        const removeButton =
            card.querySelector(".remove-api-btn");

        if (removeButton) {

            removeButton.addEventListener(
                "click",
                () => {
                    removeApi(
                        api.id,
                        api.name
                    );
                }
            );
        }

        apiList.appendChild(card);
    });
}


/* =====================================================
   RENDER INCIDENTS
   ===================================================== */

function renderIncidents(incidents) {

    const container =
        document.querySelector(".incident-list");

    if (!container) return;

    container.innerHTML = "";

    if (incidents.length === 0) {

        container.innerHTML = `
            <div class="incident">

                <div class="incident-icon">
                    ✓
                </div>

                <div>
                    <strong>
                        No incidents detected
                    </strong>

                    <p>
                        All monitored APIs are operating normally.
                    </p>
                </div>

            </div>
        `;

        return;
    }

    incidents
        .slice(0, 5)
        .forEach(incident => {

            const div =
                document.createElement("div");

            div.className = "incident";

            div.innerHTML = `
                <div class="incident-icon">
                    !
                </div>

                <div>

                    <strong>
                        ${escapeHtml(
                            incident.apiName
                        )}
                    </strong>

                    <p>
                        ${escapeHtml(
                            incident.message
                        )}
                    </p>

                </div>

                <span>
                    ${formatTime(
                        incident.timestamp
                    )}
                </span>
            `;

            container.appendChild(div);
        });
}


/* =====================================================
   CHECK ALL APIS
   ===================================================== */

async function checkAllApis() {

    const button =
        document.getElementById("checkAllBtn");

    if (!button) return;

    button.textContent = "Checking...";
    button.disabled = true;

    try {

        const response =
            await fetch(
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

        console.error(
            "Check error:",
            error
        );

        alert(
            "Unable to contact API Sentinel backend."
        );

    } finally {

        button.textContent =
            "Check All APIs";

        button.disabled = false;
    }
}


/* =====================================================
   REMOVE API
   ===================================================== */

async function removeApi(id, name) {

    const confirmed =
        confirm(
            `Are you sure you want to remove "${name}"?`
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/api/apis/${id}`,
                {
                    method: "DELETE"
                }
            );


        /*
         * IMPORTANT:
         * Do not directly use response.json().
         *
         * If the backend returns an HTML error page,
         * response.json() causes:
         *
         * Unexpected token '<'
         */

        const responseText =
            await response.text();

        let data = {};

        try {

            if (responseText) {
                data = JSON.parse(responseText);
            }

        } catch {

            console.error(
                "Remove API returned non-JSON response:",
                responseText
            );
        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                `Failed to remove API (HTTP ${response.status})`
            );
        }


        /*
         * Reload dashboard after successful deletion
         */

        await loadDashboard();


        alert(
            `${name} removed successfully.`
        );


    } catch (error) {

        console.error(
            "Remove API error:",
            error
        );

        alert(
            error.message ||
            "Unable to remove API."
        );
    }
}


/* =====================================================
   ADD API MODAL
   ===================================================== */

function createAddApiModal() {

    if (
        document.getElementById("addApiModal")
    ) {
        return;
    }

    const modal =
        document.createElement("div");

    modal.id = "addApiModal";

    modal.innerHTML = `

        <div class="add-api-overlay">

            <div class="add-api-modal">

                <div class="add-api-header">

                    <div>

                        <h2>
                            Add API
                        </h2>

                        <p>
                            Add an API endpoint to monitor.
                        </p>

                    </div>

                    <button
                        type="button"
                        id="closeAddApi"
                        class="close-add-api"
                    >
                        ×
                    </button>

                </div>


                <form id="addApiForm">

                    <div class="form-group">

                        <label for="apiName">
                            API Name
                        </label>

                        <input
                            type="text"
                            id="apiName"
                            placeholder="Example: GitHub API"
                            autocomplete="off"
                        >

                    </div>


                    <div class="form-group">

                        <label for="apiUrl">
                            API URL
                        </label>

                        <input
                            type="url"
                            id="apiUrl"
                            placeholder="https://api.github.com"
                            autocomplete="off"
                        >

                    </div>


                    <div
                        id="addApiError"
                        class="add-api-error"
                    ></div>


                    <div class="add-api-actions">

                        <button
                            type="button"
                            id="cancelAddApi"
                            class="cancel-api-btn"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            id="submitAddApi"
                            class="submit-api-btn"
                        >
                            Add API
                        </button>

                    </div>

                </form>

            </div>

        </div>
    `;


    document.body.appendChild(modal);

    addModalStyles();


    document
        .getElementById("closeAddApi")
        .addEventListener(
            "click",
            closeAddApiModal
        );


    document
        .getElementById("cancelAddApi")
        .addEventListener(
            "click",
            closeAddApiModal
        );


    document
        .getElementById("addApiForm")
        .addEventListener(
            "submit",
            addApi
        );
}


/* =====================================================
   OPEN ADD API MODAL
   ===================================================== */

function openAddApiModal() {

    createAddApiModal();

    const modal =
        document.getElementById(
            "addApiModal"
        );

    modal.style.display = "flex";

    document
        .getElementById("apiName")
        .focus();
}


/* =====================================================
   CLOSE ADD API MODAL
   ===================================================== */

function closeAddApiModal() {

    const modal =
        document.getElementById(
            "addApiModal"
        );

    if (!modal) return;

    modal.style.display = "none";

    const form =
        document.getElementById(
            "addApiForm"
        );

    if (form) {
        form.reset();
    }

    const error =
        document.getElementById(
            "addApiError"
        );

    if (error) {
        error.textContent = "";
    }
}


/* =====================================================
   ADD API
   ===================================================== */

async function addApi(event) {

    event.preventDefault();

    const nameInput =
        document.getElementById("apiName");

    const urlInput =
        document.getElementById("apiUrl");

    const errorBox =
        document.getElementById("addApiError");

    const submitButton =
        document.getElementById("submitAddApi");

    const name =
        nameInput.value.trim();

    const url =
        urlInput.value.trim();


    errorBox.textContent = "";


    if (!name) {

        errorBox.textContent =
            "Please enter an API name.";

        nameInput.focus();

        return;
    }


    if (!url) {

        errorBox.textContent =
            "Please enter an API URL.";

        urlInput.focus();

        return;
    }


    let validUrl;

    try {

        validUrl =
            new URL(url);

    } catch {

        errorBox.textContent =
            "Please enter a valid URL.";

        urlInput.focus();

        return;
    }


    if (
        validUrl.protocol !== "http:" &&
        validUrl.protocol !== "https:"
    ) {

        errorBox.textContent =
            "URL must start with http:// or https://";

        urlInput.focus();

        return;
    }


    submitButton.disabled = true;
    submitButton.textContent = "Adding...";


    try {

        const response =
            await fetch(
                `${API_URL}/api/apis`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        url: url
                    })
                }
            );


        const responseText =
            await response.text();

        let data = {};

        try {

            if (responseText) {
                data = JSON.parse(responseText);
            }

        } catch {

            console.error(
                "Add API returned non-JSON response:",
                responseText
            );
        }


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.message ||
                `Failed to add API (HTTP ${response.status})`
            );
        }


        closeAddApiModal();

        await loadDashboard();

        alert(
            "API added successfully!"
        );


    } catch (error) {

        console.error(
            "Add API error:",
            error
        );

        errorBox.textContent =
            error.message ||
            "Unable to add API.";

    } finally {

        submitButton.disabled = false;
        submitButton.textContent = "Add API";
    }
}


/* =====================================================
   MODAL + BUTTON STYLING
   ===================================================== */

function addModalStyles() {

    if (
        document.getElementById(
            "add-api-modal-styles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");

    style.id =
        "add-api-modal-styles";


    style.textContent = `

        #addApiModal {
            display: none;
        }


        .add-api-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.75);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            padding: 20px;
        }


        .add-api-modal {
            width: 100%;
            max-width: 500px;
            background: #111722;
            border: 1px solid #293246;
            border-radius: 16px;
            padding: 28px;
            box-shadow:
                0 25px 80px rgba(0, 0, 0, 0.6);
            color: #ffffff;
        }


        .add-api-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 25px;
        }


        .add-api-header h2 {
            margin: 0 0 7px 0;
            font-size: 24px;
        }


        .add-api-header p {
            margin: 0;
            color: #8993a7;
            font-size: 14px;
        }


        .close-add-api {
            background: transparent;
            border: none;
            color: #9aa4b8;
            font-size: 30px;
            cursor: pointer;
            line-height: 1;
        }


        .close-add-api:hover {
            color: #ffffff;
        }


        .form-group {
            margin-bottom: 20px;
        }


        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            font-weight: 600;
            color: #dce2ed;
        }


        .form-group input {
            width: 100%;
            box-sizing: border-box;
            padding: 13px 14px;
            border-radius: 9px;
            border: 1px solid #30394c;
            background: #0b1019;
            color: #ffffff;
            font-size: 14px;
            outline: none;
        }


        .form-group input:focus {
            border-color: #2878ff;

            box-shadow:
                0 0 0 2px
                rgba(40, 120, 255, 0.15);
        }


        .form-group input::placeholder {
            color: #667085;
        }


        .add-api-error {
            min-height: 20px;
            margin-bottom: 12px;
            color: #ff6262;
            font-size: 13px;
        }


        .add-api-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }


        .cancel-api-btn,
        .submit-api-btn {
            padding: 11px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
        }


        .cancel-api-btn {
            background: #1a2130;
            border: 1px solid #30394c;
            color: #dce2ed;
        }


        .cancel-api-btn:hover {
            background: #242c3b;
        }


        .submit-api-btn {
            background: #2878ff;
            border: 1px solid #2878ff;
            color: white;
        }


        .submit-api-btn:hover {
            background: #1d67df;
        }


        .submit-api-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }


        /* =================================================
           REMOVE API BUTTON
           ================================================= */

        .remove-api-btn {
            width: auto !important;
            min-width: 0 !important;
            max-width: fit-content !important;

            display: inline-flex !important;

            align-items: center;
            justify-content: center;

            margin: 10px 0 0 15px;

            padding: 7px 14px !important;

            border-radius: 7px !important;

            border:
                1px solid #5a2630 !important;

            background:
                #24151a !important;

            color:
                #ff7272 !important;

            cursor: pointer;

            font-size: 12px !important;

            font-weight: 600;

            line-height: 1.2;
        }


        .remove-api-btn:hover {
            background: #351a21 !important;
            border-color: #ff6262 !important;
            color: #ff8a8a !important;
        }


        .remove-api-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

    `;


    document.head.appendChild(style);
}


/* =====================================================
   ADD API BUTTON
   ===================================================== */

const addApiButton =
    document.querySelector("#addApiBtn");


if (addApiButton) {

    addApiButton.addEventListener(
        "click",
        openAddApiModal
    );

} else {

    console.warn(
        "Add API button not found."
    );
}


/* =====================================================
   CHECK ALL BUTTON
   ===================================================== */

const checkButton =
    document.getElementById(
        "checkAllBtn"
    );


if (checkButton) {

    checkButton.addEventListener(
        "click",
        checkAllApis
    );
}


/* =====================================================
   HELPERS
   ===================================================== */

function formatTime(timestamp) {

    if (!timestamp) {
        return "--";
    }

    return new Date(
        timestamp
    ).toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


function escapeHtml(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


/* =====================================================
   INITIAL LOAD
   ===================================================== */

loadDashboard();


/* =====================================================
   AUTO REFRESH
   ===================================================== */

setInterval(
    loadDashboard,
    15000
);