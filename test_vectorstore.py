import sys
import os
sys.path.append('backend')

from db.vectorstore import build_vectorstore, load_vectorstore
from db.crud import get_all_internships

def test_vectorstore():
    try:
        print("Testing vectorstore...")
        
        # Check if there are internships in the database
        internships = get_all_internships()
        print(f"Found {len(internships)} internships in database")
        
        if len(internships) == 0:
            print("No internships found. Adding a sample internship...")
            # Add a sample internship
            from db.database import SessionLocal
            from db.models import Internship
            from datetime import datetime
            
            db = SessionLocal()
            sample_internship = Internship(
                job_id="sample_001",
                title="Software Developer Intern",
                description="Develop web applications using React and Python",
                skills_required="Python, React, JavaScript, HTML, CSS",
                location="Remote",
                stipend="5000",
                duration="3 months",
                company_id="sample_company",
                created_at=datetime.now().isoformat()
            )
            db.add(sample_internship)
            db.commit()
            db.close()
            print("Sample internship added")
        
        # Try to build vectorstore
        print("Building vectorstore...")
        build_vectorstore()
        print("Vectorstore built successfully")
        
        # Try to load vectorstore
        print("Loading vectorstore...")
        vectorstore = load_vectorstore()
        print(f"Vectorstore loaded successfully: {type(vectorstore)}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_vectorstore()
