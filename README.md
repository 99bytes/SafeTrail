# 🛡️ SafeTrail

**SafeTrail** is a full-stack, real-time safety tracking and incident management application designed for national parks, hiking trails, and tourist areas. 

It bridges the gap between tourists and park authorities by providing real-time location tracking, dynamic SOS alerts, and verifiable digital identities.

Live Link --  https://safetrail-1-vz96.onrender.com

---

## ✨ Key Features

- **Real-Time Incident Reporting:** Built with `socket.io` to instantly push SOS alerts and reports to authority dashboards without requiring page reloads.
- **Interactive Geospatial Mapping:** Utilizes `leaflet` and `turf.js` to render interactive maps where authorities can draw, manage, and monitor custom geographic zones (Safe, Caution, Restricted).
- **Role-Based Access Control (RBAC):** Distinct dashboards and capabilities for two types of users:
  - **Tourists:** Can trigger SOS alerts, report non-urgent incidents, and view their current location relative to safety zones.
  - **Authorities:** Can monitor the entire park map in real-time, update incident statuses, and create dynamic safety zones.
- **Digital Tourist IDs:** Dynamically generates QR code-based digital identities for tourists using `qrcode.react`, allowing authorities to quickly verify a tourist's credentials in the field.
- **Responsive Design:** A sleek, mobile-friendly interface designed to work smoothly on both desktop monitors in a control room and mobile phones out on the trail.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** (Bootstrapped with **Vite**)
- **React Router** for client-side navigation
- **Leaflet & React-Leaflet** for interactive maps
- **Axios** for API requests
- **Socket.io-client** for real-time WebSockets
- **Vanilla CSS** with modern responsive layouts and media queries

### Backend
- **Node.js** & **Express**
- **MongoDB** & **Mongoose** (Database)
- **Socket.io** (Real-time event broadcasting)
- **Turf.js** (Geospatial calculations and point-in-polygon checks)
- **JSON Web Tokens (JWT)** & **Bcrypt.js** (Authentication & Security)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites
- Node.js (v16 or higher)
- MongoDB instance (local or Atlas)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/safetrail.git
cd safetrail
```

### 2. Setup the Backend
Open a terminal and navigate to the backend directory:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory and add the following:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```

Start the backend server:
```bash
npm run dev
```

### 3. Setup the Frontend
Open a new terminal tab and navigate to the frontend directory:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

### 4. Open the App
Navigate to `http://localhost:5173` in your browser. You can register an account as either a Tourist or an Authority to explore the different dashboards.

---

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! 
Feel free to check the issues page if you want to contribute.

## 📝 License
This project is licensed under the ISC License.
