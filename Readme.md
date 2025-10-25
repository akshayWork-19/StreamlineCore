# 🎬 Mega Media Platform API(STREMALINECORE)

![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Appwrite](https://img.shields.io/badge/Appwrite-FF2D20?style=for-the-badge&logo=appwrite&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

A **full-featured backend API** for a **video-sharing and social interaction platform** — similar to YouTube or X (Twitter) — built using **Node.js**, **Express.js**, **Cloudinary**and **JWT Authentication** .  
This project includes **modular route design**, **file uploads**, **MongoDB integration**, and **complete CRUD APIs** for users, videos, comments, playlists, likes, and tweets.

---

## 📚 Table of Contents

- [⚙️ Tech Stack](#️-tech-stack)
- [🧩 Features Overview](#-features-overview)
  - [👤 Authentication & Users](#-authentication--users)
  - [🎥 Videos](#-videos)
  - [💬 Comments](#-comments)
  - [❤️ Likes](#️-likes)
  - [📜 Playlists](#-playlists)
  - [📡 Subscriptions](#-subscriptions)
  - [🐦 Tweets](#-tweets)
  - [📊 Analytics](#-analytics)
- [🔐 Middleware](#-middleware)
- [🚀 Getting Started](#-getting-started)
- [🧱 Project Structure](#-project-structure)
- [👨‍💻 Author](#-author)

---

## ⚙️ Tech Stack

| **Category**           | **Technology / Library**   | **Purpose**                             |
| ---------------------- | -------------------------- | --------------------------------------- |
| **Runtime**            | Node.js                    | Server-side JavaScript runtime          |
| **Framework**          | Express.js                 | Fast, minimalist backend framework      |
| **Authentication**     | JSON Web Token (JWT)       | Secure user authentication              |
| **Database / Backend** | Cloudinary/ MongoDB        | Storage for users, videos, and metadata |
| **File Uploads**       | Multer                     | Upload avatars, thumbnails, and videos  |
| **Middleware**         | Custom (verifyJWT, upload) | Route protection and file handling      |

---

## 🧩 Features Overview

### 👤 Authentication & Users

| **Route**          | **Method** | **Description**                                            |
| ------------------ | ---------- | ---------------------------------------------------------- |
| `/register`        | `POST`     | Register a new user (supports avatar & cover image upload) |
| `/login`           | `POST`     | Authenticate user and generate JWT                         |
| `/logout`          | `POST`     | Logout user and invalidate session                         |
| `/refresh-tokens`  | `POST`     | Regenerate access token using refresh token                |
| `/change-password` | `POST`     | Change current user password (JWT protected)               |
| `/current-user`    | `GET`      | Get details of the logged-in user                          |
| `/update-details`  | `PATCH`    | Update user details                                        |
| `/avatar`          | `PATCH`    | Update user avatar image                                   |
| `/coverImage`      | `PATCH`    | Update user cover image                                    |
| `/c/:username`     | `GET`      | Get a user’s public channel profile                        |
| `/history`         | `GET`      | Retrieve the watch history for a user                      |

---

### 🎥 Videos

| **Route**                  | **Method** | **Description**                                         |
| -------------------------- | ---------- | ------------------------------------------------------- |
| `/`                        | `GET`      | Fetch all videos                                        |
| `/`                        | `POST`     | Upload and publish a new video (thumbnail + video file) |
| `/:videoId`                | `GET`      | Get details of a video by ID                            |
| `/:videoId`                | `DELETE`   | Delete a specific video                                 |
| `/:videoId`                | `PATCH`    | Update thumbnail or metadata of a video                 |
| `/toggle/publish/:videoId` | `PATCH`    | Toggle publish/unpublish status of a video              |

---

### 💬 Comments

| **Route**       | **Method** | **Description**              |
| --------------- | ---------- | ---------------------------- |
| `/:videoId`     | `GET`      | Get all comments for a video |
| `/:videoId`     | `POST`     | Add a comment to a video     |
| `/c/:commentId` | `PATCH`    | Update a specific comment    |
| `/c/:commentId` | `DELETE`   | Delete a comment             |

---

### ❤️ Likes

| **Route**              | **Method** | **Description**                   |
| ---------------------- | ---------- | --------------------------------- |
| `/toggle/v/:videoId`   | `POST`     | Like/Unlike a video               |
| `/toggle/c/:commentId` | `POST`     | Like/Unlike a comment             |
| `/toggle/t/:tweetId`   | `POST`     | Like/Unlike a tweet               |
| `/videos`              | `GET`      | Fetch all liked videos for a user |

---

### 📜 Playlists

| **Route**                      | **Method** | **Description**                     |
| ------------------------------ | ---------- | ----------------------------------- |
| `/`                            | `POST`     | Create a new playlist               |
| `/:playlistId`                 | `GET`      | Get details of a playlist           |
| `/:playlistId`                 | `PATCH`    | Update playlist info                |
| `/:playlistId`                 | `DELETE`   | Delete a playlist                   |
| `/add/:videoId/:playlistId`    | `PATCH`    | Add a video to a playlist           |
| `/remove/:videoId/:playlistId` | `PATCH`    | Remove a video from a playlist      |
| `/user/:userId`                | `GET`      | Get all playlists created by a user |

---

### 📡 Subscriptions

| **Route**          | **Method** | **Description**                          |
| ------------------ | ---------- | ---------------------------------------- |
| `/c/:channelId`    | `GET`      | Get all channels a user is subscribed to |
| `/c/:channelId`    | `POST`     | Subscribe / Unsubscribe to a channel     |
| `/u/:subscriberId` | `GET`      | Get all subscribers of a channel         |

---

### 🐦 Tweets

| **Route**       | **Method** | **Description**          |
| --------------- | ---------- | ------------------------ |
| `/`             | `POST`     | Create a new tweet       |
| `/user/:userId` | `GET`      | Get all tweets by a user |
| `/:tweetId`     | `PATCH`    | Update a tweet           |
| `/:tweetId`     | `DELETE`   | Delete a tweet           |

---

### 📊 Analytics

| **Route** | **Method** | **Description**                             |
| --------- | ---------- | ------------------------------------------- |
| `/stats`  | `GET`      | Get channel statistics (views, likes, etc.) |
| `/videos` | `GET`      | Get all videos uploaded by a channel        |
| `/`       | `GET`      | Healthcheck route for API                   |

---

## 🔐 Middleware

| **Middleware** | **Purpose**                                               |
| -------------- | --------------------------------------------------------- |
| `verifyJWT`    | Protects private routes by validating access tokens       |
| `upload`       | Handles file uploads via Multer                           |
| `multer`       | Manages form-data parsing for avatars, videos, and images |

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone git@github.com:akshayWork-19/StreamlineCore.git
cd StreamlineCore

```

### 2️⃣ Install Dependencies

```
npm install

```

### 3️⃣ Configure ENVs

```
DB_PASSWORD=
PORT=
CORS_ORIGIN=
MONGODB_URI=
ACCESS_TOKEN_SECRET=
ACCESS_TOKEN_EXPIRY=
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRY=
CLOUDINARY_API_SECRET=
CLOUDINARY_API_KEY=
CLOUD_NAME=
```

### 4️⃣ Run the Server

```
npm run dev
```

### Project Structure

```
chai-backend/
│
├── node_modules/ # Installed dependencies
├── public/ # Static assets (if any)
│
├── src/ # Application source code
│ ├── controllers/ # Route controller logic
│ ├── db/ # Database configuration and connection
│ ├── middlewares/ # Express middlewares (e.g., auth, logging)
│ ├── models/ # Database models and schemas
│ ├── routes/ # API route definitions
│ ├── utils/ # Helper functions and utilities
│ │
│ ├── app.js # Express app setup
│ ├── constants.js # Global constants or environment configs
│ └── index.js # Entry point for initializing the server
│
├── .env # Environment variables
├── .gitignore # Ignored files and folders for Git
├── .prettierignore # Files ignored by Prettier
├── .prettierrc # Prettier configuration
│
├── package.json # Project metadata and dependencies
├── package-lock.json # Dependency lock file
└── Readme.md # Project documentation
```

### 👨‍💻 Author

Akshay Kumar
💻 Full Stack Developer | React • Node.js • Appwrite • MongoDB

📫 Email: akshay.1904kumar@gmail.com
