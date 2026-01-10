# NeuroStep - Cognitive Screening Platform

NeuroStep is an advanced web-based platform designed to screen for early signs of autism through interactive cognitive games and AI-driven analysis. It combines React, Firebase, and TensorFlow.js/MediaPipe to deliver a seamless and engaging user experience while collecting critical behavioral data.

## Features

### 🎮 Cognitive Games
1.  **Color Focus Bubble Pop**: Tests attention span and impulse control.
2.  **Routine Sequencer**: Evaluates planning and understanding of structured daily activities.
3.  **Emotion Mirror**: Uses webcam & AI to assess facial expression recognition and mimicry.
4.  **Object Hunt**: Measures visual discrimination and detail orientation.

### 🧠 AI & Analytics
*   **Browser-side ML**: Uses a Multi-Layer Perceptron (MLP) model trained on standard screening datasets to predict risk in real-time.
*   **Digital Biomarkers**: Aggregates game metrics (reaction time, errors, accuracy) into a feature vector compatible with clinical screening tools (AQ-10).
*   **Dashboard**: A glassmorphic UI displaying performance trends, AI risk assessments, and specific behavioral insights.

## Tech Stack
*   **Frontend**: React, Vite, Tailwind CSS v4, Framer Motion
*   **Backend**: Firebase (Auth, Firestore, Analytics)
*   **Machine Learning**: TensorFlow.js, MediaPipe Face Mesh, Scikit-learn (training)
*   **State Management**: Zustand
*   **Charts**: Recharts

## Setup Instructions

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Start Dev Server**
    ```bash
    npm run dev
    ```

3.  **Train ML Model** (Optional)
    If you want to retrain the Python model:
    ```bash
    python src/scripts/train_model.py
    ```

## Project Structure
*   `src/games`: Individual game modules
*   `src/services`: Firebase, ML, and Vision logic
*   `src/store`: Global state (User, Settings)
*   `public/models`: Pre-trained model weights

---
*Built with ❤️ for NeuroStep*
