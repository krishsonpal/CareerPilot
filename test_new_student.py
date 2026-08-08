import requests
import os

# Test with a new student ID
def test_new_student_upload():
    # First, create a new student
    signup_url = "http://127.0.0.1:8000/student/signup"
    signup_data = {
        "name": "Test User 2",
        "email": "test2@example.com",
        "student_id": "test456",
        "password": "testpass"
    }
    
    try:
        # Signup
        signup_response = requests.post(signup_url, json=signup_data)
        print(f"Signup response: {signup_response.status_code} - {signup_response.text}")
        
        if signup_response.status_code != 200:
            print("Signup failed, trying to login with existing user")
            student_id = "test123"
        else:
            student_id = "test456"
        
        # Login
        login_url = "http://127.0.0.1:8000/student/login"
        login_data = {
            "student_id": student_id,
            "password": "testpass"
        }
        
        login_response = requests.post(login_url, json=login_data)
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code} - {login_response.text}")
            return
        
        token = login_response.json()["access_token"]
        print(f"Login successful for {student_id}, token: {token[:20]}...")
        
        # Test resume upload
        upload_url = "http://127.0.0.1:8000/student/analyze_resume/"
        headers = {"Authorization": f"Bearer {token}"}
        
        # Create a test file
        with open("test_resume_new.txt", "w") as f:
            f.write("This is a new test resume content for testing purposes. It contains more detailed information about skills and experience.")
        
        # Upload file
        with open("test_resume_new.txt", "rb") as f:
            files = {"file": ("test_resume_new.txt", f, "text/plain")}
            upload_response = requests.post(upload_url, headers=headers, files=files)
        
        print(f"Upload response: {upload_response.status_code}")
        print(f"Upload response body: {upload_response.text}")
        
        # Clean up
        if os.path.exists("test_resume_new.txt"):
            os.remove("test_resume_new.txt")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_new_student_upload()
