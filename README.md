# 🚗 EV Connect

EV Connect is a comprehensive platform designed for Electric Vehicle (EV) owners. It integrates real-time charging station discovery, AI-driven predictive maintenance, and a community hub for EV enthusiasts to connect and share insights.

## ✨ Key Features

### 📍 Charging Assistance & Interactive Maps
- **Find Charging Stations**: Interactive maps powered by Leaflet to locate nearby EV charging stations.
- **Real-time Availability**: View station details, connector types, and availability (managed via Firebase/Node.js backend).

### 🤖 AI Predictive Maintenance (AI4I)
- **Sensor Analysis**: A sophisticated Machine Learning backend (Flask, Pandas, Numpy) analyzes key vehicle metrics including:
  - Battery Temperature & Voltage
  - Motor RPM, Torque, and Vibration
  - State of Charge (SoC) & State of Health (SoH)
  - Brake Pad Wear & Degradation Rates
- **Risk Prediction**: Predicts potential maintenance risks and breakdowns before they occur, categorizing sensor data into `optimal`, `warning`, and `critical` states.
- **Interactive Dashboards**: Visualizes battery health and mechanical performance using Chart.js.

### 💬 Community & Peer-to-Peer Chat
- **Real-time Chat**: Built with Socket.io, allowing EV owners to connect, share route plans, and discuss EV tips.
- **AI Chatbot Support**: An integrated chatbot for quick assistance and FAQs regarding EV maintenance and charging.

## 🛠️ Technology Stack

- **Frontend**: React.js (TypeScript), Tailwind CSS, React-Leaflet, Chart.js
- **Backend (Real-time & API)**: Node.js, Express, Socket.io
- **Backend (AI / Machine Learning)**: Python, Flask, Scikit-Learn (Pickle models)
- **Database & Authentication**: Firebase (Firestore & Auth)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python 3.8+
- Firebase Account (for environment variables)

### 1. Frontend Setup (React)
```bash
cd client
npm install
npm start
```
*Runs the client app on `http://localhost:3000`*

### 2. Real-time Chat & Server Setup (Node.js)
```bash
cd server/chat_system
npm install
node server.js
```

### 3. Predictive Maintenance AI Setup (Python)
```bash
cd maintenance-ai
pip install -r requirements.txt # (Ensure Flask, Pandas, Numpy, Flask-CORS are installed)
python app.py
```
*Runs the AI service on port `5000` (or as configured in `app.py`)*

## 📦 Project Structure

- `/client`: React frontend containing the UI, maps, charts, and community interfaces.
- `/server`: Node.js backend for handling the Socket.io chat server and APIs.
- `/maintenance-ai`: Python Flask application that serves the `.pkl` machine learning models for predicting EV maintenance risks.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit a pull request.

## 📄 License

This project is licensed under the MIT License.
