import sys
import os
sys.path.append('backend')

from db.database import Base, engine, SessionLocal
from db.models import Internship, User, Company, ResumeSummary
from datetime import datetime

def init_database():
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully")
        
        # Add some sample internships
        db = SessionLocal()
        
        # Check if internships already exist
        existing_internships = db.query(Internship).count()
        if existing_internships == 0:
            print("Adding sample internships...")
            
            sample_internships = [
                Internship(
                    title="Software Developer Intern",
                    description="Develop web applications using React and Python. Work on frontend and backend development.",
                    skills_required="Python, React, JavaScript, HTML, CSS, SQL",
                    location="Remote",
                    stipend="5000",
                    duration="3 months"
                ),
                Internship(
                    title="Data Science Intern",
                    description="Analyze data and build machine learning models. Work with large datasets and statistical analysis.",
                    skills_required="Python, Machine Learning, Statistics, Pandas, NumPy, SQL",
                    location="Hybrid",
                    stipend="6000",
                    duration="6 months"
                ),
                Internship(
                    title="UI/UX Design Intern",
                    description="Design user interfaces and user experiences for web and mobile applications.",
                    skills_required="Figma, Adobe Creative Suite, HTML, CSS, JavaScript, User Research",
                    location="On-site",
                    stipend="4000",
                    duration="4 months"
                )
            ]
            
            for internship in sample_internships:
                db.add(internship)
            
            db.commit()
            print(f"Added {len(sample_internships)} sample internships")
        else:
            print(f"Database already has {existing_internships} internships")
        
        db.close()
        print("Database initialization completed successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    init_database()
