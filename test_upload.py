import requests
import os

# Test resume upload
def test_resume_upload():
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
        
        # Test resume upload
        upload_url = "http://127.0.0.1:8000/student/analyze_resume/"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a test file
        with open("test_resume.txt", "w") as f:
            f.write("This is a test resume content for testing purposes.")
        
        # Upload file
        with open("test_resume.txt", "rb") as f:
            files = {"file": ("test_resume.txt", f, "text/plain")}
            upload_response = requests.post(upload_url, headers=headers, files=files)
        
        print(f"Upload response: {upload_response.status_code}")
        print(f"Upload response body: {upload_response.text}")
        
        # Clean up
        os.remove("test_resume.txt")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_resume_upload()
