# API Sentinel

## Real-Time API Reliability Monitoring Platform

API Sentinel is a web-based API monitoring platform designed to monitor API availability, response time, failures, and recovery events from a centralized dashboard.

The application allows users to configure APIs dynamically, monitor their health, track incidents, and manage monitored endpoints through a simple interface.

Built using Node.js, Express.js, PostgreSQL, HTML, CSS, and JavaScript, and deployed on Zerops.

---

## Live Demo

https://nodejs-2dd9-5000.prg1.zerops.app/

---

## Zerops Challenge

API Sentinel was developed and deployed as part of the Zerops Challenge.

The project demonstrates a multi-service application architecture with a frontend, Node.js/Express backend, PostgreSQL database, and external API monitoring.

---

## Problem Statement

Modern applications often depend on multiple APIs for authentication, payments, data processing, third-party integrations, and internal services.

When an API becomes unavailable or experiences increased response times, it can directly affect application reliability.

API Sentinel provides a centralized solution for monitoring these APIs and identifying failures quickly.

---

## Key Features

### API Monitoring

Monitor multiple HTTP/HTTPS endpoints from a centralized dashboard.

### Health Monitoring

Each configured API is monitored and classified as:

- Healthy
- Down
- Unknown

### Response Time Monitoring

Displays the response time of each monitored API in milliseconds.

### Add API

Users can dynamically add APIs by providing:

- API Name
- API URL

The API is stored in PostgreSQL and becomes available for monitoring immediately.

### Remove API

Users can remove APIs directly from the dashboard.

The corresponding API record is removed from the PostgreSQL database.

### Check All APIs

Checks all configured APIs and updates their current health status and response time.

### Incident Tracking

Records API failures and recovery events and displays recent incidents on the dashboard.

### Dashboard Statistics

Provides an overview of:

- Total APIs
- Healthy APIs
- Down APIs
- Total Incidents

### Automatic Dashboard Refresh

The dashboard periodically refreshes API information to keep the displayed status up to date.

---

## Architecture

```text
                    Frontend
                 HTML / CSS / JS
                        |
                        | HTTP
                        v
                Node.js / Express
                    Backend
                        |
                        | SQL
                        v
                  PostgreSQL
                    Database
                        |
                        |
                        v
                External APIs
                Health Checks
