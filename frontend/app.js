const API_URL =
    "https://nodejs-2dd9-5000.prg1.zerops.app";


// ======================================================
// LOAD DASHBOARD
// ======================================================

async function loadDashboard() {

    try {

        const [
            apisResponse,
            incidentsResponse
        ] = await Promise.all([
            fetch(`${API_URL}/api/apis`),
            fetch(`${API_URL}/api/incidents`)
        ]);

        if (
            !apisResponse.ok ||
            !incidentsResponse.ok
        ) {
            throw new Error(
                "Backend request failed"
            );
        }

        const apiData =
            await apisResponse.json();

        const incidentData =
            await incidentsResponse.json();

        renderApis(
            apiData.apis || []
        );

        renderIncidents(
            incidentData.incidents || []
        );

        updateStats(
            apiData.apis || [],
            incidentData.incidents || []
        );

        const status =
            document.querySelector(".status");

        if (status) {

            status.innerHTML =
                `<span class="dot"></span> System Operational`;
        }

    } catch (error) {

        console.error(
            "Dashboard error:",
            error
        );

        const status =
            document.querySelector(".status");

        if (status) {

            status.innerHTML =
                `<span class="dot" style="background:#ff6262"></span> Backend Offline`;
        }
    }
}


// ======================================================
// UPDATE DASHBOARD STATS
// ======================================================

function updateStats(
    apis,
    incidents
) {

    const healthy =
        apis.filter(
            api => api.status === "healthy"
        ).length;

    const down =
        apis.filter(
            api => api.status === "down"
        ).length;


    const totalApis =
        document.getElementById(
            "totalApis"
        );

    const healthyApis =
        document.getElementById(
            "healthyApis"
        );

    const downApis =
        document.getElementById(
            "downApis"
        );

    const incidentCount =
        document.getElementById(
            "incidentCount"
        );


    if (totalApis) {

        totalApis.textContent =
            apis.length;
    }

    if (healthyApis) {

        healthyApis.textContent =
            healthy;
    }

    if (downApis) {

        downApis.textContent =
            down;
    }

    if (incidentCount) {

        incidentCount.textContent =
            incidents.length;
    }
}


// ======================================================
// RENDER APIs
// ======================================================

function renderApis(apis) {

    const apiList =
        document.getElementById(
            "apiList"
        );

    if (!apiList) return;

    apiList.innerHTML = "";


    if (apis.length === 0) {

        apiList.innerHTML = `
            <div class="incident">
                <div class="incident-icon">!</div>

                <div>
                    <strong>
                        No APIs configured
                    </strong>

                    <p>
                        Add an API to start monitoring.
                    </p>
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


        const card =
            document.createElement(
                "div"
            );

        card.className =
            "api-card";


        card.innerHTML = `

            <div class="api-info">

                <div class="api-icon">
                    🌐
                </div>

                <div>

                    <h4>
                        ${escapeHtml(
                            api.name
                        )}
                    </h4>

                    <p>
                        ${escapeHtml(
                            api.url
                        )}
                    </p>

                </div>

            </div>


            <div class="api-status ${statusClass}">

                <span></span>

                ${statusText}

            </div>


            <div class="response">

                <strong>
                    ${response}
                </strong>

                <small>
                    Response
                </small>

            </div>
        `;


        apiList.appendChild(
            card
        );
    });
}


// ======================================================
// RENDER INCIDENTS
// ======================================================

function renderIncidents(
    incidents
) {

    const container =
        document.querySelector(
            ".incident-list"
        );

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
                        All monitored APIs are
                        operating normally.
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
                document.createElement(
                    "div"
                );

            div.className =
                "incident";


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


            container.appendChild(
                div
            );
        });
}


// ======================================================
// CHECK ALL APIs
// ======================================================

async function checkAllApis() {

    const button =
        document.getElementById(
            "checkAllBtn"
        );

    if (!button) return;


    button.textContent =
        "Checking...";

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

            throw new Error(
                "Check failed"
            );
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

        button.disabled =
            false;
    }
}


// ======================================================
// ADD API MODAL
// ======================================================

function createAddApiModal() {

    // Prevent creating the modal twice
    if (
        document.getElementById(
            "addApiModal"
        )
    ) {
        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "addApiModalStyles";


    style.textContent = `

        #addApiModal {

            position: fixed;

            inset: 0;

            z-index: 9999;

            display: none;

            align-items: center;

            justify-content: center;

            padding: 20px;

            background:
                rgba(0, 0, 0, 0.72);

            backdrop-filter:
                blur(5px);
        }


        #addApiModal.open {

            display: flex;
        }


        .add-api-dialog {

            width:
                min(460px, 100%);

            background:
                #111722;

            border:
                1px solid #273247;

            border-radius:
                16px;

            padding:
                24px;

            box-shadow:
                0 24px 80px
                rgba(0, 0, 0, 0.45);

            color:
                #f5f7fb;
        }


        .add-api-header {

            display:
                flex;

            align-items:
                center;

            justify-content:
                space-between;

            margin-bottom:
                20px;
        }


        .add-api-header h3 {

            margin:
                0;

            font-size:
                22px;
        }


        .add-api-close {

            border:
                0;

            background:
                transparent;

            color:
                #9aa5b5;

            font-size:
                26px;

            cursor:
                pointer;
        }


        .add-api-field {

            margin-bottom:
                16px;
        }


        .add-api-field label {

            display:
                block;

            margin-bottom:
                7px;

            color:
                #c7cfdb;

            font-size:
                14px;
        }


        .add-api-field input {

            width:
                100%;

            box-sizing:
                border-box;

            padding:
                12px 13px;

            border-radius:
                9px;

            border:
                1px solid #303c51;

            background:
                #0a0f18;

            color:
                #ffffff;

            outline:
                none;

            font:
                inherit;
        }


        .add-api-field input:focus {

            border-color:
                #3578ff;
        }


        .add-api-error {

            display:
                none;

            margin:
                10px 0 0;

            color:
                #ff7777;

            font-size:
                13px;
        }


        .add-api-success {

            display:
                none;

            margin:
                10px 0 0;

            color:
                #5ee58a;

            font-size:
                13px;
        }


        .add-api-actions {

            display:
                flex;

            justify-content:
                flex-end;

            gap:
                10px;

            margin-top:
                22px;
        }


        .add-api-actions button {

            border-radius:
                9px;

            padding:
                11px 16px;

            cursor:
                pointer;

            font:
                inherit;
        }


        #addApiCancelBtn {

            border:
                1px solid #303c51;

            background:
                transparent;

            color:
                #d4d9e2;
        }


        #addApiSubmitBtn {

            border:
                0;

            background:
                #2875f5;

            color:
                #ffffff;
        }


        #addApiSubmitBtn:disabled {

            opacity:
                0.6;

            cursor:
                wait;
        }
    `;


    document.head.appendChild(
        style
    );


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "addApiModal";


    modal.innerHTML = `

        <div
            class="add-api-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="addApiTitle"
        >

            <div class="add-api-header">

                <h3 id="addApiTitle">
                    Add New API
                </h3>

                <button
                    type="button"
                    class="add-api-close"
                    id="addApiCloseBtn"
                    aria-label="Close"
                >
                    &times;
                </button>

            </div>


            <form id="addApiForm">

                <div class="add-api-field">

                    <label for="addApiName">
                        API Name
                    </label>

                    <input
                        id="addApiName"
                        name="name"
                        type="text"
                        placeholder="GitHub API"
                        autocomplete="off"
                        required
                    >

                </div>


                <div class="add-api-field">

                    <label for="addApiUrl">
                        API URL
                    </label>

                    <input
                        id="addApiUrl"
                        name="url"
                        type="url"
                        placeholder="https://api.github.com"
                        autocomplete="off"
                        required
                    >

                </div>


                <div
                    class="add-api-error"
                    id="addApiError"
                ></div>


                <div
                    class="add-api-success"
                    id="addApiSuccess"
                >
                    API added successfully.
                </div>


                <div class="add-api-actions">

                    <button
                        type="button"
                        id="addApiCancelBtn"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        id="addApiSubmitBtn"
                    >
                        Add API
                    </button>

                </div>

            </form>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    const form =
        document.getElementById(
            "addApiForm"
        );


    const errorBox =
        document.getElementById(
            "addApiError"
        );


    const successBox =
        document.getElementById(
            "addApiSuccess"
        );


    const submitButton =
        document.getElementById(
            "addApiSubmitBtn"
        );


    function closeModal() {

        modal.classList.remove(
            "open"
        );

        form.reset();

        errorBox.textContent =
            "";

        errorBox.style.display =
            "none";

        successBox.style.display =
            "none";
    }


    document
        .getElementById(
            "addApiCloseBtn"
        )
        .addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "addApiCancelBtn"
        )
        .addEventListener(
            "click",
            closeModal
        );


    // Close when clicking outside
    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {
                closeModal();
            }
        }
    );


    // Close using Escape key
    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                modal.classList.contains(
                    "open"
                )
            ) {
                closeModal();
            }
        }
    );


    // Submit Add API form
    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const name =
                document
                    .getElementById(
                        "addApiName"
                    )
                    .value
                    .trim();


            const url =
                document
                    .getElementById(
                        "addApiUrl"
                    )
                    .value
                    .trim();


            errorBox.textContent =
                "";

            errorBox.style.display =
                "none";

            successBox.style.display =
                "none";


            // Validate name
            if (!name) {

                errorBox.textContent =
                    "API name is required.";

                errorBox.style.display =
                    "block";

                return;
            }


            // Validate URL
            if (!url) {

                errorBox.textContent =
                    "API URL is required.";

                errorBox.style.display =
                    "block";

                return;
            }


            // Parse URL
            let parsedUrl;


            try {

                parsedUrl =
                    new URL(url);

            } catch {

                errorBox.textContent =
                    "Please enter a valid URL.";

                errorBox.style.display =
                    "block";

                return;
            }


            // Only HTTP and HTTPS
            if (
                ![
                    "http:",
                    "https:"
                ].includes(
                    parsedUrl.protocol
                )
            ) {

                errorBox.textContent =
                    "URL must use HTTP or HTTPS.";

                errorBox.style.display =
                    "block";

                return;
            }


            submitButton.disabled =
                true;

            submitButton.textContent =
                "Adding...";


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

                            body:
                                JSON.stringify({
                                    name,
                                    url
                                })
                        }
                    );


                const data =
                    await response
                        .json()
                        .catch(
                            () => ({})
                        );


                if (!response.ok) {

                    throw new Error(
                        data.error ||
                        data.message ||
                        `Unable to add API (${response.status})`
                    );
                }


                // Show success
                successBox.textContent =
                    "API added successfully.";

                successBox.style.display =
                    "block";


                // Refresh dashboard
                await loadDashboard();


                // Close after short delay
                setTimeout(
                    closeModal,
                    500
                );


            } catch (error) {

                console.error(
                    "Add API error:",
                    error
                );


                errorBox.textContent =
                    error.message ||
                    "Failed to add API.";

                errorBox.style.display =
                    "block";

            } finally {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Add API";
            }
        }
    );
}


// ======================================================
// SETUP ADD API BUTTON
// ======================================================

function setupAddApiButton() {

    createAddApiModal();


    let button =
        document.getElementById(
            "addApiBtn"
        );


    // If the button does not have
    // addApiBtn as its ID, find it
    // using its visible text.
    if (!button) {

        button =
            Array.from(
                document.querySelectorAll(
                    "button, a"
                )
            ).find(
                element =>
                    element.textContent
                        .trim()
                        .toLowerCase()
                        .includes(
                            "add api"
                        )
            );
    }


    if (!button) {

        console.warn(
            "Add API button not found."
        );

        return;
    }


    button.addEventListener(
        "click",
        event => {

            event.preventDefault();


            const modal =
                document.getElementById(
                    "addApiModal"
                );


            modal.classList.add(
                "open"
            );


            document
                .getElementById(
                    "addApiName"
                )
                .focus();
        }
    );
}


// ======================================================
// HELPERS
// ======================================================

function formatTime(
    timestamp
) {

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


function escapeHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;
}


// ======================================================
// INITIALIZE
// ======================================================

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


// Setup Add API
setupAddApiButton();


// Initial load
loadDashboard();


// Refresh every 15 seconds
setInterval(
    loadDashboard,
    15000
);