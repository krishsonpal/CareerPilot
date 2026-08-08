import sys
import os
sys.path.append('backend')

from db.vectorstore import build_vectorstore
from db.crud import get_all_internships
from utils.config import get_embeddings_with_fallback

def test_vectorstore_debug():
    try:
        print("Testing vectorstore building with debug info...")
        
        # Check internships
        internships = get_all_internships()
        print(f"Found {len(internships)} internships in database")
        
        if len(internships) == 0:
            print("No internships found!")
            return
        
        # Check embeddings
        embeddings_model, embedding_type = get_embeddings_with_fallback()
        print(f"Using embeddings: {embedding_type}")
        
        # Test embedding a single text
        test_text = "Test text for embedding"
        test_embedding = embeddings_model.embed_query(test_text)
        print(f"Test embedding dimensions: {len(test_embedding)}")
        
        # Build vectorstore
        print("Building vectorstore...")
        build_vectorstore()
        print("Vectorstore built successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_vectorstore_debug()
