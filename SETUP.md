# Pashuraksha - Onboarding & Developer Guide

Welcome to **Pashuraksha**! This guide contains step-by-step instructions for new developers on how to set up, compile, and run the project locally.

---

## 📁 Repository Structure

The project is split into two primary components:
- **`frontend/`**: Next.js 16 web application with React 19 & Tailwind CSS.
- **`backend/`**: Express.js server with TypeScript & Prisma ORM connected to PostgreSQL / Supabase.

---

## ⚙️ Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: `v18.x` or higher (v20+ recommended)
- **npm**: `v9.x` or higher
- **Git**: Latest version

---

## 🚀 Step 1: Install Dependencies

You must install dependencies for both the frontend and backend.

### 1. Root & Frontend Dependencies
```bash
npm install
```

### 2. Backend Dependencies
```bash
cd backend
npm install
cd ..
```

---

## 🔑 Step 2: Environment Setup

1. Copy `.env.example` to `.env` in the project root/backend:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required database connection strings and secret keys in `.env`.

---

## 🗄️ Step 3: Database & Prisma Setup

Before starting the backend, initialize the Prisma schema:

```bash
cd backend

# Generate Prisma Client types
npm run prisma:generate

# Push schema changes to your database
npm run prisma:push

cd ..
```

---

## 💻 Step 4: Starting the Development Servers

Open two terminal windows to run both servers:

### Terminal 1: Backend (Express API)
```bash
cd backend
npm run dev
```
*Backend runs on port `5000` (or as configured in `.env`).*

### Terminal 2: Frontend (Next.js)
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🏗️ Step 5: Compiling / Building for Production

To test or generate production builds:

### 1. Compile Backend (TypeScript to JS)
```bash
cd backend
npm run build
```
*Output is compiled into `backend/dist/`.*

### 2. Compile Frontend (Next.js Build)
```bash
cd frontend
npm run build
```
*Output is generated in `.next/`.*

---

## 🟢 Step 6: Running Production Builds

Once compiled, you can run the production builds:

### Start Backend Production Server
```bash
cd backend
npm run start
```

### Start Frontend Production Server
```bash
cd frontend
npm run start
```

---

## 🔍 Common Commands Summary

| Action | Backend (`cd backend`) | Frontend (`cd frontend`) |
| :--- | :--- | :--- |
| **Install** | `npm install` | `npm install` |
| **Dev Mode** | `npm run dev` | `npm run dev` |
| **Compile/Build** | `npm run build` | `npm run build` |
| **Production Start** | `npm run start` | `npm run start` |
| **Prisma Generate** | `npm run prisma:generate` | N/A |
| **Prisma Push** | `npm run prisma:push` | N/A |
