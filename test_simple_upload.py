import requests
import os

# Simple test for file upload without AI processing
def test_simple_upload():
    # Login first
    login_url = "http://127.0.0.1:8000/student/login"
    login_data = {
        "student_id": "test123",
        "password": "testpass"
    }
    
    try:
        # Login
        login_response = requests.post(login_url, json=login_data)
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code} - {login_response.text}")
            return
        
        token = login_response.json()["access_token"]
        print(f"Login successful, token: {token[:20]}...")
        
        # Test user info endpoint
        user_info_url = "http://127.0.0.1:8000/student/user-info"
        headers = {"Authorization": f"Bearer {token}"}
        
        user_response = requests.get(user_info_url, headers=headers)
        print(f"User info response: {user_response.status_code} - {user_response.text}")
        
        # Test session status endpoint
        session_url = "http://127.0.0.1:8000/student/session-status"
        session_response = requests.get(session_url, headers=headers)
        print(f"Session status response: {session_response.status_code} - {session_response.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_simple_upload()
