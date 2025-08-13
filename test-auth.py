import requests
import json

# Configuration
url = "http://localhost:3005/api/auth/login"
credentials = {
    "email": "admin@topsteel.tech",
    "password": "TopSteel44!"
}

# Faire la requête
response = requests.post(url, json=credentials)

# Afficher le résultat
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")

# Si succès, afficher le token
if response.status_code == 200 or response.status_code == 201:
    data = response.json()
    if 'accessToken' in data:
        print(f"\nToken: {data['accessToken']}")
    elif 'token' in data:
        print(f"\nToken: {data['token']}")
    elif 'access_token' in data:
        print(f"\nToken: {data['access_token']}")