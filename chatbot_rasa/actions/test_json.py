import json

rendez_vous = [{"user_id": "test_user1", "date": "2025-08-17", "heure": "04:00"}]

with open("rendez_vous.json", "w", encoding="utf-8") as f:
    json.dump(rendez_vous, f, ensure_ascii=False, indent=4)
