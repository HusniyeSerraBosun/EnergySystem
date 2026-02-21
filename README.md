# ⚡ Energy Trading & Plant Management System (EnergySys)

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Python](https://img.shields.io/badge/Python-3.9%2B-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95%2B-009688)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)

## 📖 Overview
EnergySys is a full-stack web application developed for energy system and market analysis. It provides a comprehensive platform to manage power plants, simulate energy generation, track real-time consumption, and monitor market clearing prices (PTF) and system marginal prices (SMP). The project features a fully automated background simulation engine built directly into the database.

* **Live Demo:** [https://energysys-ggcj.onrender.com/](https://energysys-ggcj.onrender.com/) 
*(Note: The backend service goes to sleep if unused; it may take 30-60 seconds to wake up on the first load).*

## 📸 Dashboard Preview

![EnergySys Dashboard](dashboard_screenshot.png)

## 🔑 Test Credentials
To explore the live system safely without altering the database integrity, a read-only account is provided:

* **Analyst (Read-Only):** Username: `nova_analyst1` | Password: `123456`
*(Note: Super Admin and Admin credentials are not publicly shared to protect the live database from unauthorized data manipulation.)*

## 🚀 Key Features & Modules

### 1. Role-Based Access Control (RBAC) & Security
* **Stateless Authentication:** Secured via JWT (JSON Web Tokens) using OAuth2PasswordBearer.
* **Hierarchical Roles:**
  * **Super Admin:** Full access to all organizations, plants, users, and market data.
  * **Admin:** Can manage operations and view data exclusively within their own organization.
  * **Analyst:** Read-only access to generation/market data and dashboards for their organization.

### 2. Asset Management
* **Organizations:** Super Admins can register and list energy companies, ensuring unique EIC (Energy Identification Code) compliance.
* **Power Plants:** Register plants with specifications like Installed Capacity (MW), Fuel Type, YEKDEM, and RES status. 

### 3. Power Plant Status & Incident Monitoring
* **Event Tracking:** Admins and Super Admins can report plant failures or maintenance events.
* **Business Logic:** Affected capacity cannot exceed the plant's total installed capacity. The system automatically updates the plant's operational status and triggers real-time data recalculations in the database.

### 4. Transparency Platform (Market & Consumption Tracking)
* **Real-Time Consumption:** Displays actual consumption data. 
* **Demand Forecast:** Tracks national demand forecasts.
* **Market Prices:** Tracks Market Clearing Price (PTF) and System Marginal Price (SMP).

## 🧠 System Architecture & Database Automation

This project utilizes advanced database-level automation to simulate a living energy market, avoiding heavy backend processing overhead.

* **Simulation Engine (PL/PGSQL):** A custom PostgreSQL function (`simulate_daily_energy_data`) dynamically calculates consumption deviations, PTF/SMF price fluctuations, and plant generation based on active maintenance/failure events.
* **Cron Jobs (`pg_cron`):**
  * **Daily Generator:** Runs at `00:00 UTC` to populate the database with realistic hourly energy data for the day.
  * **Data Retention Policy:** An automated cleanup function (`delete_old_data`) runs at `03:30 UTC` to delete simulation data older than 7 days, ensuring the free-tier database does not exceed its row limits.

## 🛠️ Tech Stack

* **Backend:** Python, FastAPI, Pydantic
* **Frontend:** React.js
* **Database:** PostgreSQL, SQLAlchemy ORM
* **Security:** JWT (JSON Web Tokens), Python-Jose, FastAPI OAuth2
* **Deployment:** Render.com

## ⚙️ Local Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/HusniyeSerraBosun/EnergySystem.git](https://github.com/HusniyeSerraBosun/EnergySystem.git)
   cd EnergySystem
   ```
2. **Set up a virtual environment:**
    ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. **Install dependencies:**
    ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables:**
    ```bash
    DATABASE_URL=postgresql://username:password@localhost:5432/energysys
    SECRET_KEY=your_super_secret_jwt_key
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```
5. **Run the backend application:**
    ```bash
   uvicorn main:app --reload
   ```