# Empathy & Inclusion VR/AR Platform

## Project Description
This project is an **interactive VR/AR platform designed to enhance empathy, awareness, and inclusion in organizations**. It addresses the problem of **undetected bias, microaggressions, and low-empathy behaviors**, which can harm organizational culture, reduce collaboration, and create legal or ethical risks.

Through **immersive VR/AR simulations**, employees can experience real-world scenarios involving bias or microaggressions, practice inclusive responses, and receive **real-time feedback**. The platform also tracks **behavioral analytics** like engagement metrics, enabling organizations to **benchmark performance, personalize learning paths, and foster a more collaborative, inclusive, and high-performing workplace**.

---

## Installation

### Prerequisites
- Python 3.9+
- Node.js 16+ & npm
- Git (optional)
- Browser with **WebXR/WebGL support** for VR/AR

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd <repository-folder>
```

### 2. Backend Setup (Flask)
1. Create a virtual environment:  
```bash
python -m venv venv
```
2. Activate the environment:  
```bash
# macOS/Linux
source venv/bin/activate
# Windows
venv\Scripts\activate
```
3. Install dependencies:  
```bash
pip install -r requirements.txt
```
4. Run the backend:  
```bash
python app.py
```
- Backend will start at `http://localhost:5000`

### 3. Frontend Setup (React/Lovable + VR/AR)
1. Navigate to the frontend folder:  
```bash
cd frontend
```
2. Install dependencies:  
```bash
npm install
```
- For VR/AR support, ensure Three.js or A-Frame is installed:  
```bash
npm install three aframe
```
3. Run the frontend development server:  
```bash
npm start
```
- Frontend runs at `http://localhost:3000` and connects to the Flask backend.

### 4. Production Build
1. Build the frontend:  
```bash
npm run build
```
2. Move the build folder into Flask’s static folder:  
```bash
cp -r build ../backend/static
```
3. Serve the frontend from Flask:
```python
@app.route("/")
def serve_index():
    return send_from_directory(app.static_folder, "index.html")
```
4. Run Flask:  
```bash
python app.py
```
- Full site is now available at `http://localhost:5000`

### 5. VR/AR Testing
- Open the site in a **WebXR-compatible browser** (Chrome, Edge, Oculus Browser).  
- Connect your VR/AR device and interact with immersive simulations.

---

## Usage

### 1. Accessing the Platform
- Open your browser at `http://localhost:3000` during development, or `http://localhost:5000` if serving via Flask.  
- Use a **WebXR/WebGL-compatible browser** for VR/AR simulations.
- Connect your VR/AR device for immersive experiences.

### 2. Exploring Features
- **Dashboard:** View real-time metrics on empathy, inclusion, and engagement.
- **Interactive Simulations:** Practice responding to bias or microaggressions in VR/AR scenarios.
- **Instant Feedback:** Receive suggestions for alternate, inclusive responses during simulations.
- **Behavioral Analytics:** Track engagement metrics, eye-tracking data, and learning progress.
- **Analytics & Benchmarking:** Compare team performance and diversity metrics using interactive dashboards.
- **Personalized Learning Paths:** Follow recommendations based on your previous interactions and training results.

### 3. Adding Notes / Data (Optional)
- Use the input panel to log observations or reflections during simulations.
- Data is automatically sent to the backend and reflected in dashboards.

### 4. Export & Reporting
- Download performance reports as **CSV or PDF** from the Analytics page for HR review.
- Use visual dashboards to track improvement in empathy, inclusion, and collaboration over time.

---

## Lovable AI Integration
Use the following prompt for Lovable.ai to generate the interactive site:

```
Create an interactive, professional web platform to improve empathy, awareness, and inclusion in organizations.

Features:
- Real-time analysis of organizational culture highlighting bias, low empathy, and potential conflict.
- Interactive simulations where employees experience scenarios with bias or microaggressions.
- Instant feedback and alternate responses during training.
- Behavioral analytics like engagement metrics and eye-tracking to track learning.
- Dashboards and charts for HR and diversity benchmarking.
- Personalized learning paths using organizational datasets.
- Warm, inviting UI with soft colors, intuitive navigation, and gamified elements.
- Fully responsive for desktop and mobile.

Include the following pages and components: Homepage with key metrics, Real-Time Analysis Panel, Interactive Simulation Page, Analytics & Benchmarking Page, Settings & Personalization, and Footer as described.
```
