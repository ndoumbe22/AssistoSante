import requests

# Test the public articles endpoint
response = requests.get("http://127.0.0.1:8000/api/articles/")
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")