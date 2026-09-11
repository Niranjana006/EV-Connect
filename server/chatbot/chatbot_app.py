from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import requests

app = Flask(__name__)
CORS(app)

import os

# Configure Gemini
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-2.5-flash")  # or "gemini-1.5-pro"

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    message = data.get('message', '').strip()
    lat = data.get('lat', 28.6139)  # Default: New Delhi
    lng = data.get('lng', 77.2090)

    if not message:
        return jsonify({'response': 'Please ask something about EV charging!'})

    try:
        # Detect if user is asking about charging stations
        is_location_query = any(keyword in message.lower() 
                                for keyword in ['nearest', 'charger', 'charging', 'station', 'location', 'where'])
        context = ""
        if is_location_query:
            openchargemap_key = os.environ.get("OPENCHARGEMAP_API_KEY", "632427e5-a4de-492e-963a-02ef45862f37")
            stations_url = (
                f"https://api.openchargemap.io/v3/poi/?output=json&maxresults=5"
                f"&key={openchargemap_key}&latitude={lat}"
                f"&longitude={lng}&distance=50&distanceunit=KM"
            )
            stations_res = requests.get(stations_url)
            stations = stations_res.json() if stations_res.ok else []
            context = f"User location: ({lat}, {lng}). Nearby stations: {stations[:2]}"

        prompt = f"You are an EV charging assistant. User asked: '{message}'. " \
                 f"{'Use this context: ' + context if context else 'Answer concisely without location details unless requested.'}"

        response = model.generate_content(prompt)

        return jsonify({'response': response.text})
    except Exception as e:
        return jsonify({'response': f'Sorry, error occurred: {str(e)}'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)