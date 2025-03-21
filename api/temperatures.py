from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
import requests
from datetime import datetime
import json

def get_city_temperatures(city_name: str):
    try:
        response = requests.get('https://us-central1-mobile-assignment-server.cloudfunctions.net/weather')
        data = response.json()
        
        # Filter temperatures for the specified city
        city_data = [
            {
                'date': item['date'],
                'temperature': item['temp'],
                'unit': item['tempType'],
                'city_picture': item['city']['picture']
            }
            for item in data
            if item['city']['name'].lower() == city_name.lower()
        ]
        
        # Sort by date
        return sorted(city_data, key=lambda x: x['date'])
    
    except requests.RequestException as e:
        return {'error': str(e)}

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Enable CORS
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET')
        self.end_headers()

        # Parse query parameters
        query_components = parse_qs(urlparse(self.path).query)
        city_name = query_components.get('city', [''])[0]

        if not city_name:
            response_data = {'error': 'Please provide a city name'}
        else:
            response_data = get_city_temperatures(city_name)

        self.wfile.write(json.dumps(response_data).encode())
        return 