WeChat - A Full-Stack Real-Time Chat Application
A feature-rich, 1:1 messaging application built with a scalable Node.js backend and a responsive React Native frontend. This project demonstrates a comprehensive understanding of full-stack development, real-time communication, and modern mobile app architecture.

✨ Key Features
Real-Time Communication
🚀 Instant Messaging: Live, bidirectional text messaging powered by a low-latency Socket.IO engine.

🟢 Online Presence: See real-time online/offline status with a green dot indicator.

🕒 Last Seen Status: View the last active time for offline users.

✍️ Live Typing Indicators: Know when the other user is typing on both the home and chat screens.

✔️✔️ Message Read Receipts: WhatsApp-style ticks for message status (✔ sent, ✔✔ delivered, ✔✔ blue for read).

User & Conversation Management
🔐 Secure Authentication: JWT-based registration and login with industry-standard bcryptjs password hashing.

⚙️ Profile Management: Users can update their username and view account details.

📊 Sorted Conversation List: The home screen is automatically sorted by the most recent message.

💬 Unread Message Count: A badge instantly shows the number of unread messages for each chat.

🔍 Debounced User Search: A performant search bar to find other users without overwhelming the API.

Polished User Experience
💾 Persistent Chat History: All messages are saved to the database for a seamless user experience.

📅 Date Headers: Messages in the chat are grouped by date (e.g., "Today", "Yesterday").

🕰️ Message Timestamps: Every message is timestamped for clarity.

🔒 Secure Logout: Users can securely log out via a confirmation prompt in the settings.

🏛️ Technical Architecture Highlights
This project was built with scalability and efficiency in mind, showcasing professional development practices.

Full-Stack Real-Time Engine: A robust Node.js/Express server powers the REST API, while a dedicated Socket.IO instance handles all live, bidirectional events. This separation ensures stable and low-latency communication.

Efficient Database Operations: Leverages MongoDB Aggregation Pipelines on the backend to efficiently query and sort the user list by last message and calculate unread counts in a single, optimized database call.

Performant Frontend: Implements debouncing on the user search functionality to prevent excessive API requests, ensuring a smooth user experience and reducing server load.

Modern State Management: Uses React Context API to manage global state for authentication and the socket connection, providing a clean and scalable way to share data across components without prop-drilling.

🛠️ Tech Stack
Category

Technology

Frontend

React Native

Backend

Node.js, Express.js

Database

MongoDB, Mongoose

Real-Time

Socket.IO

Navigation

React Navigation

Security

JWT, bcryptjs

🚀 Local Development Setup
Prerequisites
Node.js (v18+)

npm or Yarn

MongoDB (local instance or a free Atlas cluster)

Android Studio / Xcode

A configured React Native development environment.

1. Backend Server (/server)
# Navigate to the server directory
cd chat-app-backend

# Install dependencies
npm install

# Create a .env file and add your environment variables
PORT=8000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key_for_jwt

# Start the development server
npm run dev

The server will be running on http://localhost:8000.

2. Mobile App (/mobile)
# In a new terminal, navigate to the mobile directory
cd ChatApp

# Install dependencies
npm install

# For iOS, link native dependencies
npx pod-install

# Run the app on your emulator or simulator
# For Android
npx react-native run-android

# For iOS
npx react-native run-ios

Sample Users for Testing
You can register new users directly through the app's interface.

User 1: user1@example.com | password123

User 2: user2@example.com | password123
