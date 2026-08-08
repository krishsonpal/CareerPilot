import sys
import os
sys.path.append('backend')

from utils.config import get_embeddings_with_fallback

def test_embeddings():
    try:
        print("Testing embeddings...")
        embeddings_model, embedding_type = get_embeddings_with_fallback()
        print(f"Embeddings model: {embedding_type}")
        
        # Test embedding a simple text
        test_text = "This is a test text for embedding"
        embedding = embeddings_model.embed_query(test_text)
        print(f"Embedding generated: {len(embedding)} dimensions")
        print(f"First few values: {embedding[:5]}")
        
        # Test embedding multiple texts
        texts = ["Text 1", "Text 2", "Text 3"]
        embeddings = embeddings_model.embed_documents(texts)
        print(f"Multiple embeddings generated: {len(embeddings)} embeddings")
        print(f"Each embedding has {len(embeddings[0])} dimensions")
        
    except Exception as e:
        print(f"Error testing embeddings: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_embeddings()
