const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

const PORT = process.env.PORT || 5000;

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Initialize database
async function initializeDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS apis (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                url TEXT NOT NULL UNIQUE,
                status VARCHAR(50) DEFAULT 'unknown',
                response_time INTEGER DEFAULT 0,
                last_checked TIMESTAMPTZ
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS incidents (
                id SERIAL PRIMARY KEY,
                api_id INTEGER REFERENCES apis(id) ON DELETE CASCADE,
                api_name VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                message TEXT,
                timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Seed initial APIs
        await pool.query(
            `
            INSERT INTO apis (name, url, status)
            VALUES
                ($1, $2, 'unknown'),
                ($3, $4, 'unknown')
            ON CONFLICT (url) DO NOTHING
            `,
            [
                "API Sentinel Backend",
                "https://nodejs-2dd9-5000.prg1.zerops.app/api/health",
                "JSONPlaceholder",
                "https://jsonplaceholder.typicode.com/posts/1"
            ]
        );

        console.log("PostgreSQL database initialized successfully");

    } catch (error) {
        console.error(
            "Database initialization failed:",
            error.message
        );

        process.exit(1);
    }
}


// ======================================================
// ROOT / FRONTEND
// ======================================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "../frontend/index.html")
    );
});


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {
    res.json({
        status: "healthy",
        service: "api-sentinel-backend",
        timestamp: new Date().toISOString()
    });
});


// ======================================================
// GET ALL MONITORED APIS
// ======================================================

app.get("/api/apis", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                id,
                name,
                url,
                status,
                response_time AS "responseTime",
                last_checked AS "lastChecked"
            FROM apis
            ORDER BY id
        `);

        res.json({
            count: result.rows.length,
            apis: result.rows
        });

    } catch (error) {

        res.status(500).json({
            error: "Failed to fetch APIs",
            message: error.message
        });
    }
});


// ======================================================
// GET INCIDENTS
// ======================================================

app.get("/api/incidents", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                id,
                api_id AS "apiId",
                api_name AS "apiName",
                type,
                message,
                timestamp
            FROM incidents
            ORDER BY timestamp DESC
            LIMIT 20
        `);

        res.json({
            count: result.rows.length,
            incidents: result.rows
        });

    } catch (error) {

        res.status(500).json({
            error: "Failed to fetch incidents",
            message: error.message
        });
    }
});


// ======================================================
// ADD NEW API
// ======================================================

app.post("/api/apis", async (req, res) => {

    const { name, url } = req.body;

    // Validate name and URL
    if (!name || !url) {

        return res.status(400).json({
            error: "name and url are required"
        });
    }

    const cleanName = String(name).trim();
    const cleanUrl = String(url).trim();

    if (!cleanName || !cleanUrl) {

        return res.status(400).json({
            error: "name and url are required"
        });
    }

    // Validate URL
    try {

        const parsedUrl = new URL(cleanUrl);

        if (
            !["http:", "https:"].includes(
                parsedUrl.protocol
            )
        ) {
            throw new Error("Invalid protocol");
        }

    } catch {

        return res.status(400).json({
            error: "Invalid URL"
        });
    }

    // Insert into existing PostgreSQL table
    try {

        const result = await pool.query(
            `
            INSERT INTO apis (name, url)
            VALUES ($1, $2)
            RETURNING
                id,
                name,
                url,
                status,
                response_time AS "responseTime",
                last_checked AS "lastChecked"
            `,
            [cleanName, cleanUrl]
        );

        res.status(201).json({
            message: "API added successfully",
            api: result.rows[0]
        });

    } catch (error) {

        // Duplicate URL
        if (error.code === "23505") {

            return res.status(409).json({
                error: "API with this URL already exists"
            });
        }

        console.error(
            "Failed to add API:",
            error.message
        );

        res.status(500).json({
            error: "Failed to add API",
            message: error.message
        });
    }
});


// ======================================================
// CHECK ONE API
// ======================================================

app.post("/api/check/:id", async (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {

        return res.status(400).json({
            error: "Invalid API ID"
        });
    }

    try {

        const result = await pool.query(
            `
            SELECT *
            FROM apis
            WHERE id = $1
            `,
            [id]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "API not found"
            });
        }

        const resultData =
            await checkApi(result.rows[0]);

        res.json(resultData);

    } catch (error) {

        res.status(500).json({
            error: "Failed to check API",
            message: error.message
        });
    }
});


// ======================================================
// CHECK ALL APIS
// ======================================================

app.post("/api/check-all", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT *
            FROM apis
            ORDER BY id
        `);

        const results = [];

        for (const api of result.rows) {

            const checkResult =
                await checkApi(api);

            results.push(checkResult);
        }

        res.json({
            checkedAt: new Date().toISOString(),
            results
        });

    } catch (error) {

        res.status(500).json({
            error: "Failed to check APIs",
            message: error.message
        });
    }
});


// ======================================================
// API MONITORING FUNCTION
// ======================================================

async function checkApi(api) {

    const start = Date.now();

    try {

        const controller =
            new AbortController();

        const timeout = setTimeout(() => {
            controller.abort();
        }, 8000);

        const response = await fetch(api.url, {
            method: "GET",
            signal: controller.signal
        });

        clearTimeout(timeout);

        const responseTime =
            Date.now() - start;

        const newStatus =
            response.ok
                ? "healthy"
                : "down";


        // Update API status
        await pool.query(
            `
            UPDATE apis
            SET
                status = $1,
                response_time = $2,
                last_checked = CURRENT_TIMESTAMP
            WHERE id = $3
            `,
            [
                newStatus,
                responseTime,
                api.id
            ]
        );


        // Create incident only when status changes
        if (api.status !== newStatus) {

            await pool.query(
                `
                INSERT INTO incidents
                    (api_id, api_name, type, message)
                VALUES
                    ($1, $2, $3, $4)
                `,
                [
                    api.id,
                    api.name,

                    newStatus === "healthy"
                        ? "recovered"
                        : "down",

                    newStatus === "healthy"
                        ? "API recovered"
                        : `HTTP ${response.status}`
                ]
            );
        }


        return {

            id: api.id,

            name: api.name,

            status: newStatus,

            responseTime: responseTime,

            httpStatus: response.status,

            checkedAt:
                new Date().toISOString()
        };


    } catch (error) {

        const responseTime =
            Date.now() - start;


        // Update API as down
        await pool.query(
            `
            UPDATE apis
            SET
                status = 'down',
                response_time = $1,
                last_checked = CURRENT_TIMESTAMP
            WHERE id = $2
            `,
            [
                responseTime,
                api.id
            ]
        );


        // Create incident only if it wasn't already down
        if (api.status !== "down") {

            await pool.query(
                `
                INSERT INTO incidents
                    (api_id, api_name, type, message)
                VALUES
                    ($1, $2, 'down', $3)
                `,
                [
                    api.id,
                    api.name,

                    error.name === "AbortError"
                        ? "Request timeout"
                        : error.message
                ]
            );
        }


        return {

            id: api.id,

            name: api.name,

            status: "down",

            responseTime: responseTime,

            error:
                error.name === "AbortError"
                    ? "Request timeout"
                    : error.message,

            checkedAt:
                new Date().toISOString()
        };
    }
}


// ======================================================
// START SERVER
// ======================================================

async function startServer() {

    await initializeDatabase();

    app.listen(
        PORT,
        "0.0.0.0",
        () => {

            console.log(
                `API Sentinel backend running on port ${PORT}`
            );
        }
    );
}

startServer();