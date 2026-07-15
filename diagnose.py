import os
from dotenv import load_dotenv
import google.generativeai as genai

# 1. Load environment variables
load_dotenv()

# 2. Retrieve the API Key
api_key = os.getenv("GEMINI_API_KEY")

if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
    print("❌ ERROR: No API Key found in your .env file.")
    print("Please make sure you have created a .env file and pasted your key: GEMINI_API_KEY=AIzaSy...")
    exit(1)

print(f"🔑 Found API Key starting with: {api_key[:6]}...")

# 3. Configure Gemini
genai.configure(api_key=api_key)

print("\n🔍 Checking connection to Gemini API...")
try:
    # 4. Try listing available models
    models = list(genai.list_models())
    print("✅ Connection Successful! Here are the models available for your API Key:\n")
    for m in models:
        # Check if generateContent is supported by the model
        if 'generateContent' in m.supported_generation_methods:
            print(f"  - {m.name} (Supports content generation)")
            
except Exception as e:
    print("\n❌ API CONNECTION FAILED!")
    print(f"\nError Details:\n{str(e)}")
    print("\n💡 Common Fixes:")
    print("1. Double-check that you copied the API key correctly. Make sure there are no accidental spaces.")
    print("2. Ensure you generated a 'Gemini API Key' from Google AI Studio, not a general Google Cloud credential.")
    print("3. Check if your network has any firewall blocking requests to https://generativelanguage.googleapis.com")
