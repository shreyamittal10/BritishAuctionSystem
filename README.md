# 🚀 RFQ British Auction System

A full-stack web application that simulates a **British Auction–based RFQ (Request for Quotation) system**, where suppliers compete by continuously lowering bids and auctions automatically extend based on configurable rules.

---

## 🧠 Features

### 🟢 RFQ Management

* Create RFQs with:

  * Start Time
  * Bid Close Time
  * Forced Close Time
  * Trigger Window (X)
  * Extension Duration (Y)
  * Trigger Type

---

### 💰 Bidding System

* Suppliers can place bids with:

  * Freight, Origin, Destination charges
  * Transit Time
  * Validity
* Total price auto-calculated
* Each supplier maintains **latest bid only**

---

### ⏱ Auction Extension Logic

Auction extends automatically based on:

* **ANY_BID** → Any bid within trigger window
* **ANY_RANK_CHANGE** → Ranking changes
* **L1_CHANGE** → Lowest bidder changes

---

### 🚫 Forced Close Logic

* Auction **never exceeds forced close time**
* Logs when:

  * Extension applied
  * Extension blocked

---

### 📊 UI Features

* RFQ listing with:

  * Lowest bid
  * Status (Active / Closed / Force Closed)
* RFQ details:

  * Live ranking (L1, L2, ...)
  * Activity logs
* Modal-based UI for:

  * Creating RFQ
  * Placing bids

---

### 📜 Activity Logs

* Bid submissions
* Auction extensions
* Reasons for extensions
* Human-readable timestamps

---

## 🏗 Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS

### Backend

* Node.js
* Express.js

### Database

* PostgreSQL

---

# ⚙️ Complete Setup Instructions

## 📌 Prerequisites

Make sure you have installed:

* Node.js (v18+ recommended)
* PostgreSQL
* Git

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/shreyamittal10/BritishAuctionSystem.git
cd BritishAuctionSystem
```

---

## 2️⃣ Backend Setup

```bash
cd backend
npm install
```

### ▶️ Create `.env` file inside backend folder

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=username
DB_PASSWORD=password
DB_NAME=db_name

PORT=5000
```

👉 Replace:

* `username`
* `password`
* `db_name`

---

### ▶️ Start Backend

```bash
npm run dev
```

Backend runs on:
👉 http://localhost:5000

---

## 3️⃣ Frontend Setup

Open new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
👉 http://localhost:5173

---

## 🚀 How to Use

1. Create a new RFQ
2. Open RFQ details
3. Place bids from different suppliers
4. Observe:

   * Ranking updates (L1, L2…)
   * Auto extension of auction time
   * Logs updating in real-time

---

## 📊 Database Design Overview

* **rfq** → auction configuration
* **bids** → supplier bids
* **suppliers** → supplier info
* **logs** → activity tracking

---

## 👩‍💻 Author

Shreya Mittal
