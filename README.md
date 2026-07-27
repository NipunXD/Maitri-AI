# Maitri AI

Maitri AI is a sophisticated, offline-first AI companion designed to support the psychological and physical well-being of astronauts during long-duration space missions. It provides a conversational interface for mental health check-ins, psychological assessments, and emotional support, helping to mitigate the challenges of isolation and stress in space.

## Key Features

- **Conversational AI Companion:** Engage in empathetic, therapeutic conversations with Maitri, powered by a local LLM (Llama 3.2 via Ollama) for privacy and offline functionality.
- **Automated Psychological Assessments:** Conducts standardized psychological evaluations through natural conversation, including NASA-TLX, POMS, and ISS-ISQ protocols.
- **Sentiment Analysis:** Analyzes verbal responses in real-time to gauge the astronaut's emotional state and log sentiment scores for trend analysis.
- **Facial Emotion & Identity Recognition:** Utilizes `deepface` for both facial identity verification for login and video analysis to detect dominate emotions during sessions.
- **Interactive 3D Visualizer:** A dynamic, futuristic globe interface built with Three.js that responds to the astronaut's voice and the AI's speech, enhancing user engagement.
- **Comprehensive Crew Dashboard:** An advanced analytics dashboard for mission control to review psychological trends, detailed session logs, assessment results, and mood distribution over time.
- **Offline-First PWA:** Built as a Progressive Web App to ensure full functionality in environments with limited or no internet connectivity.
- **Secure Data Logging:** All session data, including conversations, sentiment analysis, and assessment results, are saved locally as structured JSON files for mission analysis.

## Architecture

Maitri AI is a full-stack application built with a focus on local processing and offline capabilities.

- **Frontend:** A Next.js application using React and TypeScript for the user interface.
  - **Visualization:** `@react-three/fiber` for the interactive 3D globe.
  - **Data Charting:** `recharts` for the analytics dashboards.
  - **Offline Support:** `next-pwa` for Progressive Web App capabilities.
- **Backend & AI:**
  - **API:** Next.js API Routes handle session data management.
  - **Conversational AI:** Integrates with a local [Ollama](https://ollama.com/) instance running Llama 3.2 for generating intelligent and empathetic responses.
  - **Voice Processing:**
    - **Speech-to-Text:** Uses the browser's native `webkitSpeechRecognition` API.
    - **Text-to-Speech:** Uses the browser's native `SpeechSynthesis` API.
  - **Emotion & Face Analysis:** Python scripts are used for computationally intensive tasks:
    - A Flask service (`face-service.py`) provides an API for real-time face verification.
    - A script (`analyze_emotions.py`) processes recorded video sessions to generate a frame-by-frame emotion timeline using `deepface`.

## Getting Started

### Prerequisites

- Node.js (v20 or later)
- Python (v3.8 or later)
- [Ollama](https://ollama.com/) installed and running with the `llama3.2` model (`ollama run llama3.2`).

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/nipunxd/Maitri-AI.git
    cd Maitri-AI
    ```

2.  **Install frontend dependencies:**
    ```bash
    npm install
    ```

3.  **Install backend dependencies:**
    It is recommended to use a virtual environment for Python.
    ```bash
    # Create and activate a virtual environment (optional but recommended)
    python -m venv .venv
    source .venv/bin/activate  # On Windows, use `.venv\Scripts\activate`

    # Install Python packages
    pip install Flask opencv-python deepface numpy
    ```

### Running the Application

1.  **Start the Flask face recognition service (in a separate terminal):**
    ```bash
    python src/app/api/face-service.py
    ```
    This will start the service on `http://localhost:8000`.

2.  **Start the Next.js development server:**
    ```bash
    npm run dev
    ```

3.  Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1.  **Landing Page:** The application starts with an animated introduction.
2.  **Dashboard:** Navigate to the `/dashboard` page. Here you can:
    - **Log in via Face Recognition:** Use the "Start Face Recognition" feature to verify your identity using your webcam.
    - **Manual Start:** Manually start a session or view your analytics profile.
3.  **Maitri Session:** After logging in, you will be directed to the main interaction screen.
    - Use the "Speak to Maitri" button to activate the microphone and talk to the AI.
    - Respond to the psychological assessment questions.
    - Engage in open conversation.
4.  **End Session:** Click the "END SESSION" button. Your conversation log and assessment data will be compiled and saved as a JSON file in the `src/app/data/sessions` directory. Your recorded video session will be downloaded to your local machine.
5.  **Crew Analytics:** Visit the `/crew-dashboard` to see a detailed visualization of all logged session data, including sentiment trends, assessment scores, and mood distribution.
