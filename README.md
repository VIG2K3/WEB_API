# TravelSmart Penang - WEB API Project

A full-stack travel planner app for Penang, built with React (frontend) and Node.js/Express (backend).

## Project Structure

```
WEB_API_arranged/
├── backend/           # Node.js + Express REST API
│   ├── models/        # MongoDB models (Trip, User)
│   ├── routes/        # API routes (auth, trips, search, route)
│   ├── server.js      # Entry point
│   └── package.json
├── frontend/          # React + Vite + TypeScript
│   ├── src/           # Pages, components, services
│   ├── public/
│   ├── index.html
│   └── package.json
├── .env               # Environment variables (DO NOT push to GitHub)
└── README.md
```

---

## Prerequisites

Make sure you have these installed:
- [Node.js](https://nodejs.org/) (v18 or above)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally)

---

## How to Run

### Step 1 — Install dependencies

Open a terminal in the project root folder.

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ../frontend
npm install
```

---

### Step 2 — Start MongoDB

Make sure MongoDB is running. On Windows, open a new terminal and run:
```bash
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
```
Or start it from Windows Services if already installed as a service.

---

### Step 3 — Start the Backend

Open a terminal in the `backend/` folder:
```bash
cd backend
npm start
```
Backend runs on → **http://localhost:5000**

---

### Step 4 — Start the Frontend

Open a **second terminal** in the `frontend/` folder:
```bash
cd frontend
npm run dev
```
Frontend runs on → **http://localhost:5173**

---

## Open the App

Go to your browser and open: **http://localhost:5173**

---

## Environment Variables

The `.env` file is in the project root and is shared by both frontend and backend.  
**Never push this file to GitHub.**

Key variables:
| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `PORT` | Backend port (default 5000) |
| `JWT_SECRET` | Secret key for authentication |
| `OPENWEATHER_API_KEY` | Weather data API |
| `VITE_GROQ_API_KEY` | Chatbot API |
| `EMAIL_USER` / `EMAIL_PASS` | Gmail for password reset |

