# CodeMentor AI

An interactive, AI-powered programming tutor built with Flask and Google's Gemini API. Pick a language, work through concepts, get AI-generated lessons and practice challenges, request hints, and get your code automatically reviewed and scored.

## Features

- **Language selection** — Python, JavaScript, C++, and Java
- **AI-generated lessons** — clear explanations and code examples for core programming concepts (variables, conditionals, loops, functions, arrays)
- **Practice challenges** — hands-on coding exercises with a built-in code editor
- **AI hints** — get unstuck without being handed the full answer
- **AI code verification** — automatic scoring, feedback, and an optimized reference solution
- **Developer console** — inspect the raw prompts sent to and responses received from the Gemini API
- **Bring-your-own-key** — configure your Gemini API key client-side, or fall back to a server-side key

## Tech stack

- **Backend:** Python, Flask, Flask-CORS, `google-generativeai` (Gemini `gemini-2.5-flash`)
- **Frontend:** Vanilla HTML/CSS/JavaScript, [marked.js](https://marked.js.org/) for markdown rendering, Font Awesome icons

## Setup

1. Clone the repo and install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Create a `.env` file in the project root (see `.env.example`) and add your [Gemini API key](https://aistudio.google.com/):

   ```
   PORT=5000
   GEMINI_API_KEY=your_key_here
   ```

   Alternatively, skip this step and paste your API key into the "Configure API Key" modal in the app itself — it's stored in your browser and sent per-request, never touching the server's `.env`.

3. Run the app:

   ```bash
   python app.py
   ```

4. Open `http://127.0.0.1:5000` in your browser.

## Project structure

```
.
├── app.py              # Flask backend + Gemini API integration
├── diagnose.py          # Standalone script to verify your API key/connection
├── requirements.txt
├── static/
│   ├── index.html
│   ├── style.css
│   └── app.js
└── .env                 # Local secrets (git-ignored)
```

## API endpoints

- `POST /api/lesson` — generates a lesson for a given language + concept
- `POST /api/hint` — generates a hint for the student's current code
- `POST /api/verify` — grades submitted code and returns feedback + an optimized solution
