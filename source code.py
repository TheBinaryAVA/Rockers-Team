vr_office_ai/
├── app.py
├── requirements.txt
└── templates/
    └── index.html
flask
openai
$env:OPENAI_API_KEY="sk-..."
$env:OPENAI_API_KEY="sk-..."
import os
import json
from flask import Flask, render_template, request, jsonify
import openai

# Initialize Flask
app = Flask(__name__)

# Initialize OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("Please set the OPENAI_API_KEY environment variable before running.")

openai.api_key = OPENAI_API_KEY

@app.route("/")
def index():
    # initial view parameters can be changed via query params if desired
    gender = request.args.get("gender", "male")
    designation = request.args.get("designation", "Employee")
    return render_template("index.html", gender=gender, designation=designation)

@app.route("/get_employee")
def get_employee():
    # Example of a backend-only route; returns simulated employee info
    emp_id = request.args.get("id", "101")
    employees = {
        "101": {"name": "Alice", "designation": "Manager"},
        "102": {"name": "Bob", "designation": "Engineer"},
    }
    return jsonify(employees.get(emp_id, {"name": "Unknown", "designation": "None"}))

@app.route("/ai_suggestion", methods=["POST"])
def ai_suggestion():
    """
    Expects JSON:
    {
      "scenario": "...",
      "options": ["opt1", "opt2", ...]
    }

    Returns:
    {
      "result": "AI text response"
    }
    """
    data = request.get_json(force=True)
    scenario = data.get("scenario", "")
    options = data.get("options", [])

    if not scenario or not options:
        return jsonify({"error": "Missing scenario or options"}), 400

    # Build the prompt (based on user's original prompt)
    prompt = f"""
You are an AI workplace trainer helping employees handle discrimination, unconscious bias, 
and microaggressions with empathy and professionalism.

Scenario: {scenario}

Options:
{chr(10).join([f"{i+1}. {opt}" for i, opt in enumerate(options)])}

Question: Which option is the most inclusive and effective response, and why?
Give your answer in this format:
- Best Option: (number)
- Reason: (short explanation)
"""

    try:
        # Use Chat Completions (new OpenAI python SDK) - adjust model if needed
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",  # user used this in example; change if unavailable
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            temperature=0.2,
        )
        ai_text = response.choices[0].message["content"].strip()
    except Exception as e:
        # return error for frontend to show
        return jsonify({"error": str(e)}), 500

    return jsonify({"result": ai_text})

if __name__ == "__main__":
    # Use host 0.0.0.0 if you want to access from other devices on your LAN (e.g., phone/headset)
    app.run(host="0.0.0.0", port=5000, debug=True)
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>VR Office with AI</title>
    <script src="https://aframe.io/releases/1.2.0/aframe.min.js"></script>
    <style>
      /* Simple overlay UI so you can input scenario/options and choose gender/designation */
      #ui {
        position: fixed;
        right: 12px;
        top: 12px;
        width: 320px;
        background: rgba(255,255,255,0.95);
        padding: 12px;
        border-radius: 8px;
        font-family: Arial, sans-serif;
        z-index: 9999;
        box-shadow: 0 6px 18px rgba(0,0,0,0.2);
      }
      #ui label { font-size: 12px; font-weight: 600; }
      #ui input, #ui select, #ui textarea { width: 100%; margin-bottom: 8px; padding: 6px; box-sizing: border-box; }
      #aiResult { white-space: pre-wrap; background:#f6f6f6; padding:8px; border-radius:6px; max-height:160px; overflow:auto; }
      button { padding:8px 10px; cursor:pointer; }
    </style>
  </head>
  <body>
    <!-- VR Scene -->
    <a-scene>
      <!-- Lighting -->
      <a-entity light="type: ambient; color: #BBB"></a-entity>
      <a-entity light="type: directional; color: #FFF; intensity: 0.6" position="0 10 5"></a-entity>

      <!-- Ground -->
      <a-plane rotation="-90 0 0" width="40" height="40" color="#d3d3d3"></a-plane>

      <!-- Walls (simple) -->
      <a-box position="0 2 -15" depth="0.5" height="4" width="40" color="#ececec"></a-box>
      <a-box position="-20 2 0" depth="40" height="4" width="0.5" color="#ececec"></a-box>
      <a-box position="20 2 0" depth="40" height="4" width="0.5" color="#ececec"></a-box>

      <!-- Window opening so you see trees in the distance -->
      <a-box position="0 2 -14.5" depth="0.1" height="2" width="8" color="#87CEFA" material="opacity:0.2"></a-box>

      <!-- Table -->
      <a-box position="0 0.75 -3" depth="2" height="0.2" width="3" color="#8B4513"></a-box>
      <a-box position="-1.3 0.35 -2" depth="0.2" height="0.7" width="0.2" color="#5A2D0C"></a-box>
      <a-box position="1.3 0.35 -2" depth="0.2" height="0.7" width="0.2" color="#5A2D0C"></a-box>
      <a-box position="-1.3 0.35 -4" depth="0.2" height="0.7" width="0.2" color="#5A2D0C"></a-box>
      <a-box position="1.3 0.35 -4" depth="0.2" height="0.7" width="0.2" color="#5A2D0C"></a-box>

      <!-- Chair -->
      <a-box id="chair-seat" position="0 0.5 -5" depth="1" height="0.1" width="1" color="#333"></a-box>
      <a-box position="0 1 -5" depth="0.1" height="1" width="1" color="#333"></a-box>

      <!-- Trees far away -->
      <a-cylinder position="-10 0 -30" radius="0.5" height="6" color="#8B4513"></a-cylinder>
      <a-sphere position="-10 3 -30" radius="2.5" color="#228B22"></a-sphere>

      <a-cylinder position="10 0 -32" radius="0.6" height="5" color="#8B4513"></a-cylinder>
      <a-sphere position="10 2.6 -32" radius="2.2" color="#2E8B57"></a-sphere>

      <!-- Title board where we will show designation / AI results -->
      <a-plane id="titleBoard" position="0 2 -2" width="6" height="1.2" color="#222"></a-plane>
      <a-text id="titleText" value="Designation: Employee" position="-2.8 2 -1.9" color="#fff" width="8"></a-text>

      <!-- Avatar (simple shapes) -->
      <a-entity id="avatar" position="0 0 -1">
        <!-- head -->
        <a-sphere id="avatar-head" position="0 1.6 0" radius="0.25" color="#87CEEB"></a-sphere>
        <!-- body -->
        <a-box id="avatar-body" position="0 1 0" depth="0.5" height="0.9" width="0.6" color="#4682B4"></a-box>
      </a-entity>

      <!-- Camera -->
      <a-entity camera look-controls wasd-controls position="0 1.6 5"></a-entity>
    </a-scene>

    <!-- Overlay UI (not inside scene) -->
    <div id="ui">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <strong>VR Office • AI Trainer</strong>
        <small style="opacity:0.6">Local</small>
      </div>

      <label for="gender">Avatar Gender</label>
      <select id="gender">
        <option value="male">Male</option>
        <option value="female">Female</option>
      </select>

      <label for="designation">Designation</label>
      <input id="designation" placeholder="e.g., Manager" value="Employee"/>

      <button id="applyBtn">Apply to VR</button>

      <hr/>

      <label for="scenario">Workplace Scenario</label>
      <textarea id="scenario" rows="3" placeholder="Describe the situation...">In a team meeting, a manager repeatedly interrupts a junior employee, not letting them finish their points.</textarea>

      <label for="opts">Options (one per line)</label>
      <textarea id="opts" rows="4">Stay quiet and let the meeting continue.
Interrupt the manager back and point out they are wrong.
Respectfully step in and say: 'I think Alex had a point they were making—can we let them finish?'
Report the incident later to HR without addressing it in the meeting.</textarea>

      <button id="analyzeBtn">Ask AI for suggestion</button>

      <h4 style="margin: 8px 0 6px 0;">AI Suggestion</h4>
      <div id="aiResult">(no result yet)</div>
    </div>

    <script>
      // Helper to set avatar and title
      function applyVRSettings() {
        const gender = document.getElementById("gender").value;
        const designation = document.getElementById("designation").value || "Employee";

        // Update title
        const titleText = document.getElementById("titleText");
        titleText.setAttribute("value", `Designation: ${designation}`);

        // Update avatar colors/shapes
        const head = document.getElementById("avatar-head");
        const body = document.getElementById("avatar-body");
        if (gender === "male") {
          head.setAttribute("color", "#87CEEB");
          body.setAttribute("color", "#4682B4");
        } else {
          head.setAttribute("color", "#FFB6C1");
          body.setAttribute("color", "#DB7093");
        }
      }

      document.getElementById("applyBtn").addEventListener("click", function() {
        applyVRSettings();
      });

      // On load, apply query defaults (if passed from backend)
      window.addEventListener("load", function() {
        // attempt to parse initial designation/gender from server-rendered content if set
        // The server might have passed initial values via template variables (not strictly necessary)
        applyVRSettings();
      });

      // AI analyze button: collect scenario & options, POST to /ai_suggestion
      document.getElementById("analyzeBtn").addEventListener("click", async function() {
        const scenario = document.getElementById("scenario").value.trim();
        const optsText = document.getElementById("opts").value.trim();
        if (!scenario || !optsText) {
          alert("Please fill both scenario and options.");
          return;
        }

        const options = optsText.split("\n").map(s => s.trim()).filter(Boolean);

        // show loading
        const aiBox = document.getElementById("aiResult");
        aiBox.textContent = "Thinking...";

        try {
          const res = await fetch("/ai_suggestion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scenario, options })
          });

          const payload = await res.json();
          if (!res.ok) {
            aiBox.textContent = "Error: " + (payload.error || res.statusText);
            return;
          }
          const resultText = payload.result || "(no result)";
          aiBox.textContent = resultText;

          // Also put part of the result on the title board in VR
          const titleText = document.getElementById("titleText");
          // Keep it short: extract first line or best option line if provided
          const firstLine = resultText.split("\n").find(l => l.trim().length > 0) || resultText;
          // Show truncated on board to avoid overflow
          const truncated = firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine;
          titleText.setAttribute("value", truncated);

        } catch (err) {
          aiBox.textContent = "Error: " + err.toString();
        }
      });
    </script>
  </body>
</html>
python -m venv venv
# macOS/Linux
source venv/bin/activate
# Windows (PowerShell)
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
