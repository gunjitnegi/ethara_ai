# 🌌 Ethara AI: Premium Task & Project Manager

![Ethara AI Banner](https://img.shields.io/badge/Ethara--AI-Task--Management-blueviolet?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production--Ready-success?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/MERN-Stack-blue?style=for-the-badge)

Ethara AI is a high-performance, real-time collaboration platform designed for modern teams. Built with the MERN stack, it offers a stunning UI/UX coupled with enterprise-grade security features.

---

## ✨ Key Features

- 📊 **Dynamic Dashboard**: Real-time visualization of task progress and project status.
- 🛡️ **Security Hardening**:
  - **XSS Protection**: Full sanitization of user-controlled inputs.
  - **IDOR Prevention**: Membership-level verification for all project data.
  - **Rate Limiting**: Protection against brute-force and DDoS attacks.
- 👥 **Role-Based Access**: Specialized views and permissions for Admins and Team Members.
- 📈 **Team Analytics**: Visual leaderboard tracking task completion and efficiency.
- 📱 **Session Management**: Real-time tracking and revocation of active device sessions.
- ⚡ **High Performance**: Optimized search and filtered views for large datasets.

---

## 🛠️ Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React.js, Vite, TailwindCSS |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose) |
| **Icons** | Lucide React |
| **Security** | JWT, Helmet, XSS-Clean, Mongo-Sanitize |

---

## 🔒 Security Posture

Ethara AI is built with a "Security-First" mindset. Key implementations include:

1. **Authentication**: Secure token-based access via JWT.
2. **Input Sanitization**: Multi-layer cleaning of data to prevent Injection and XSS attacks.
3. **Data Isolation**: Custom middleware ensures users can only access their assigned projects.
4. **Error Handling**: Hardened global error handling to prevent sensitive information leakage in production.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas Account

### 2. Installation

**Backend Setup:**
```bash
cd backend
npm install
# Create a .env file based on .env.example
npm start
```

**Frontend Setup:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📬 Environment Variables

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas Connection String |
| `JWT_SECRET` | Secure string for token signing |
| `ADMIN_SECRET` | Secret key for Admin registration |
| `FRONTEND_URL` | Production URL of the frontend |

---

## 📝 License

Designed and developed by **Gunjit Negi** &copy; 2026. Optimized for deployment on **Railway**.
