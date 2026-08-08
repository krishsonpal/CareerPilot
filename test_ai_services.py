# Test AI services directly
import sys
import os
sys.path.append('backend')

from services.resume_parser import extract_resume_summary
from utils.config import get_embeddings_with_fallback

def test_ai_services():
    try:
        print("Testing resume summary extraction...")
        test_text = "This is a test resume with skills in Python, JavaScript, and React. I have experience in web development and data analysis."
        
        summary = extract_resume_summary(test_text)
        print(f"Resume summary: {summary}")
        
        print("Testing embeddings...")
        embeddings_model, embedding_type = get_embeddings_with_fallback()
        print(f"Embeddings model: {embedding_type}")
        
        embedding = embeddings_model.embed_query("Test text for embedding")
        print(f"Embedding generated: {len(embedding)} dimensions")
        
        print("AI services working correctly!")
        
    except Exception as e:
        print(f"Error in AI services: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ai_services()
