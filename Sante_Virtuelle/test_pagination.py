import requests
import json

# Test the pagination feature
base_url = "http://localhost:8000/api/articles/"

# Test 1: Get first page with 5 articles
params = {"page": 1, "page_size": 5}
response = requests.get(base_url, params=params)

print("=== Test 1: First page with 5 articles ===")
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    try:
        data = response.json()
        print(f"Response type: {type(data)}")
        if isinstance(data, dict) and 'results' in data:
            print(f"Total count: {data.get('count', 'N/A')}")
            print(f"Next page: {data.get('next', 'N/A')}")
            print(f"Previous page: {data.get('previous', 'N/A')}")
            print(f"Number of articles in this page: {len(data['results'])}")
            print("First article title:", data['results'][0]['titre'] if data['results'] else 'No articles')
        else:
            print("Response is not paginated format")
            print(f"Number of articles: {len(data) if isinstance(data, list) else 'N/A'}")
    except json.JSONDecodeError:
        print("Response is not valid JSON")
        print("Response content:", response.text[:200])

print("\n" + "="*50 + "\n")

# Test 2: Get second page with 5 articles
params = {"page": 2, "page_size": 5}
response = requests.get(base_url, params=params)

print("=== Test 2: Second page with 5 articles ===")
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    try:
        data = response.json()
        if isinstance(data, dict) and 'results' in data:
            print(f"Total count: {data.get('count', 'N/A')}")
            print(f"Next page: {data.get('next', 'N/A')}")
            print(f"Previous page: {data.get('previous', 'N/A')}")
            print(f"Number of articles in this page: {len(data['results'])}")
            print("First article title:", data['results'][0]['titre'] if data['results'] else 'No articles')
        else:
            print("Response is not paginated format")
    except json.JSONDecodeError:
        print("Response is not valid JSON")

print("\n" + "="*50 + "\n")

# Test 3: Get all articles without pagination (old method)
response = requests.get(base_url)

print("=== Test 3: All articles without pagination ===")
print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    try:
        data = response.json()
        print(f"Response type: {type(data)}")
        if isinstance(data, dict) and 'results' in data:
            print("Response is paginated format (unexpected for this test)")
            print(f"Total count: {data.get('count', 'N/A')}")
            print(f"Number of articles in this page: {len(data['results'])}")
        else:
            print("Response is list format (expected for this test)")
            print(f"Number of articles: {len(data) if isinstance(data, list) else 'N/A'}")
    except json.JSONDecodeError:
        print("Response is not valid JSON")