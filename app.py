import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)  # Enable Cross-Origin Resource Sharing

# We use gemini-2.5-flash as it is fast, modern, and supports JSON output mode
MODEL_NAME = "gemini-2.5-flash"

def configure_api():
    # Check if client passed the key in the Authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        client_key = auth_header[7:].strip()
        if client_key and client_key != "null" and client_key != "":
            genai.configure(api_key=client_key)
            return
            
    # Fallback to server env key
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and api_key != "YOUR_GEMINI_API_KEY_HERE" and api_key != "":
        genai.configure(api_key=api_key)
    else:
        raise ValueError("Gemini API Key is not set. Please click 'Configure API Key' in the top-right corner to set your key.")

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/lesson', methods=['POST'])
def get_lesson():
    try:
        configure_api()
        data = request.json or {}
        language = data.get('language')
        concept = data.get('concept')
        
        if not language or not concept:
            return jsonify({"error": "Language and concept are required"}), 400
            
        prompt = f"""You are an expert programming tutor. Create a detailed, beginner-friendly coding lesson for the programming language '{language}' on the concept of '{concept}'.

Return your response in JSON format matching this schema:
{{
  "title": "Lesson title",
  "explanation": "Clear explanation of the concept with real-world analogies, in markdown format. Keep it engaging but concise.",
  "codeExample": "A complete, commented code example showing how to write this concept in {language}.",
  "challenge": {{
    "title": "Practice Challenge: [Challenge Name]",
    "instructions": "A practical coding exercise instructions for the student, in markdown. Define clear inputs, expected outputs, and constraints.",
    "starterCode": "Initial code structure or template for the student to write their solution, in {language}."
  }}
}}"""

        # Set up model and send request
        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        # Parse the JSON response
        result = json.loads(response.text)
        
        # Return response along with the raw prompt and response for the developer console
        return jsonify({
            "data": result,
            "debug": {
                "prompt": prompt,
                "response": response.text
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/hint', methods=['POST'])
def get_hint():
    try:
        configure_api()
        data = request.json or {}
        language = data.get('language')
        concept = data.get('concept')
        challenge = data.get('challenge')
        user_code = data.get('userCode')
        starter_code = data.get('starterCode')
        
        if not language or not concept or not challenge:
            return jsonify({"error": "Language, concept, and challenge details are required"}), 400
            
        prompt = f"""You are an expert programming tutor helping a student who is stuck on a programming exercise.
Language: {language}
Concept: {concept}
Challenge Instructions: {challenge}
Starter Code: {starter_code}
Student's Current Code: {user_code}

Give a brief, helpful hint that guides them towards the solution without giving away the exact code answer. Focus on logic, logic flow, or common syntax errors. Be encouraging.

Return your response in JSON format matching this schema:
{{
  "hint": "Your short hint here (1-2 sentences)."
}}"""

        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        result = json.loads(response.text)
        return jsonify({
            "data": result,
            "debug": {
                "prompt": prompt,
                "response": response.text
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/verify', methods=['POST'])
def verify_code():
    try:
        configure_api()
        data = request.json or {}
        language = data.get('language')
        concept = data.get('concept')
        challenge = data.get('challenge')
        user_code = data.get('userCode')
        
        if not language or not concept or not challenge or not user_code:
            return jsonify({"error": "Missing required fields for code verification"}), 400
            
        prompt = f"""You are an expert programming tutor grading a student's submission.
Language: {language}
Concept: {concept}
Challenge Instructions: {challenge}
Student's Code: {user_code}

Analyze the student's code for correctness, syntax, logic, and efficiency. Evaluate whether it successfully fulfills the challenge requirements.

Return your response in JSON format matching this schema:
{{
  "isCorrect": true or false,
  "score": an integer from 0 to 100,
  "feedback": "A detailed review of their code in markdown. Mention what they did well and what can be improved. Be constructive and warm.",
  "optimizedSolution": "An optimized, clean, and idiomatic version of the code in {language} that solves the challenge."
}}"""

        model = genai.GenerativeModel(MODEL_NAME)
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        
        result = json.loads(response.text)
        return jsonify({
            "data": result,
            "debug": {
                "prompt": prompt,
                "response": response.text
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
