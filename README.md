# AgriVelan 🌾

AgriVelan is a production-grade AgTech application designed to empower farmers and buyers with AI-driven produce quality grading, real-time market prices, and secure transactions.

This project integrates a **React + Vite** frontend with a robust **Flask** backend powering a custom **YOLOv8** Machine Learning pipeline for produce detection and grading.

## 🚀 Key Features

*   **AI Produce Grading**: 3-stage ML pipeline to detect, categorize, and grade fruits and vegetables (Grade A, B, C) based on freshness, color, and defects.
*   **Real-time Market Prices**: Fetches daily mandi prices (Agmarknet) to help farmers price their produce competitively.
*   **Secure Authentication**: Firebase Authentication + Face Lock security integration.
*   **Interactive Maps**: Live order tracking and delivery routes using Leaflet maps.
*   **Velan AI Agent**: Integrated AI assistant for specialized tasks.
*   **Responsive UI**: Modern, aesthetic interface built with Tailwind CSS.

## 🛠 Tech Stack

### Frontend
*   **Framework**: React 19, Vite
*   **Language**: TypeScript
*   **Styling**: TailwindCSS 4
*   **Maps**: React Leaflet
*   **State/Data**: Firebase SDK
*   **Charts**: Chart.js

### Backend
*   **Server**: Flask (Python)
*   **ML Pipeline**:
    *   **Detection**: YOLOv8 (Ultralytics)
    *   **Vision**: OpenCV (cv2)
    *   **Grading**: Custom CNN & Rule-based logic
*   **Database**: SQLite (`prices.db`) & Firebase Firestore
*   **Authentication**: Firebase Admin & DeepFace (experimental)

## 📂 Project Structure

```
agrivelan/
├── backend/                # Flask API & ML Engine
│   ├── ml/                 # ML Pipeline Logic (pipeline_v2.py)
│   ├── detection/          # Detection utilities
│   ├── models/             # YOLOv8 .pt models
│   ├── app.py              # Main Flask Entrypoint
│   └── requirements.txt    # Python Dependencies
├── src/                    # React Frontend Source
│   ├── components/         # Reusable UI Components
│   ├── pages/              # App Pages (Dashboard, Market, etc.)
│   └── firebase.ts         # Firebase Config
├── firebase_backend/       # Firebase Cloud Functions (Node.js)
├── public/                 # Static Assets
└── vite.config.ts          # Vite Configuration
```

## ⚡ Getting Started

### Prerequisites
*   Node.js (v16+)
*   Python (3.9+)

### 1. Frontend Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```
The app will open at `http://localhost:5173`.

### 2. Backend Setup
Navigate to the backend directory:
```bash
cd backend
```

Create a virtual environment (optional but recommended):
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Run the Flask API:
```bash
python app.py
```
The server runs on `http://localhost:5000` (default).

## 🧪 ML Pipeline Details

The system uses a strict **3-Stage Pipeline** to ensure accuracy:
1.  **Input Validation**: Rejects blurry, dark, or invalid images before processing.
2.  **YOLOv8 Detection**: Detects produce type (Tomato, Potato, etc.) with strict confidence thresholds.
3.  **Quality Grading**: Analyzes color uniformity, texture, and visual defects to assign a Grade (A/B/C) and estimate shelf life.

## 📄 License
Private Project.
