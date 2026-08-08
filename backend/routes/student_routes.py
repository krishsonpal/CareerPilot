from fastapi import APIRouter, UploadFile, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from db.database import (get_db, Base, engine)
from db import crud
from db.schemas import UserSignup, UserLogin, UserResponse, Token
from services.resume_parser import extract_text_from_pdf, extract_resume_summary, make_concise_summary
from db.vectorstore import build_or_update_student_vectorstore
from utils.config import get_embeddings_with_fallback
from utils.auth import create_access_token, verify_token, get_current_user
from services.recommendation import get_internship_recommendations_by_vector
from services.recommendation import (
    get_internship_recommendations,
    get_internship_recommendations_by_vector,
    answer_with_context,
    detect_intent,
    embed_text,
    average_embeddings,
    augment_recommendations_with_scoring,
    suggest_skills_to_pursue,
)

# Avoid creating tables during import; this is handled in app startup

router = APIRouter()

# Authentication routes
@router.post("/signup", response_model=UserResponse)
async def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """Sign up a new student."""
    # Check if student_id already exists
    if crud.get_user_by_student_id(db, user_data.student_id):
        raise HTTPException(status_code=400, detail="Student ID already registered")
    
    # Check if email already exists
    if crud.get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = crud.create_user(
        db=db,
        student_id=user_data.student_id,
        email=user_data.email,
        password=user_data.password,
        name=user_data.name
    )
    
    return UserResponse(
        student_id=user.student_id,
        email=user.email,
        name=user.name
    )

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login a student."""
    user = crud.authenticate_user(db, login_data.student_id, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid student ID or password")
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user.student_id, "user_type": "student"}
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user_type="student",
        user_id=user.student_id
    )

def _hydrate_session_from_db_if_missing(request: Request, db: Session, student_id: str):
    """Populate session with resume summary and embedding from DB if missing."""
    if not student_id:
        return
    has_summary = bool(request.session.get("resume_summary"))
    has_embed = bool(request.session.get("resume_embedding"))
    if has_summary and has_embed:
        return
    stored = crud.get_resume_summary_with_embedding(db, str(student_id))
    if stored and stored.get_embedding():
        concise = make_concise_summary(stored.summary_text, max_chars=800)
        request.session["resume_summary"] = concise
        request.session["resume_embedding"] = [round(float(x), 4) for x in stored.get_embedding()]
        if "chat_query_embeddings" not in request.session:
            request.session["chat_query_embeddings"] = []


@router.get("/user-info")
async def get_user_info(request: Request, current_user: str = Depends(get_current_user)):
    """Get basic user information plus resume status (hydrated from session/DB)."""
    # Try hydrating resume summary into session if missing
    try:
        db: Session = next(get_db())
        _hydrate_session_from_db_if_missing(request, db, current_user)
    except Exception:
        pass

    has_resume_summary = bool(request.session.get("resume_summary", ""))

    return {
        "student_id": current_user,
        "message": "User authenticated successfully",
        "has_resume_summary": has_resume_summary,
    }

@router.get("/session-status")
async def check_session(request: Request, current_user: str = Depends(get_current_user)):
    """Check what's stored in the current session."""
    student_id = current_user
    # Try hydrating from DB if missing
    try:
        db: Session = next(get_db())
        _hydrate_session_from_db_if_missing(request, db, student_id)
    except Exception:
        pass
    resume_summary = request.session.get("resume_summary", "")
    recommendations = request.session.get("recommendations", [])
    
    return {
        "student_id": student_id,
        "has_resume_summary": bool(resume_summary),
        "resume_summary_length": len(resume_summary) if resume_summary else 0,
        "recommendations_count": len(recommendations) if recommendations else 0,
        "all_session_keys": list(request.session.keys())
    }


@router.post("/analyze_resume/")
async def analyze_resume(
    request: Request,
    file: UploadFile,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    try:
        print(f"Starting resume analysis for student: {current_user}")
        student_id = current_user
        if not student_id:
            raise HTTPException(
                status_code=401,
                detail="Not logged in: invalid token"
            )

        # Save file locally in a temp directory
        import os
        import tempfile
    
        # Create temp directory if it doesn't exist
        temp_dir = "temp_uploads"
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
        file_path = os.path.join(temp_dir, f"{student_id}_{file.filename or 'resume'}{file_extension}")
        
        try:
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            print(f"File saved to: {file_path}")
        except Exception as e:
            print(f"Error saving file: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

        # Extract text from file (PDF or text)
        try:
            file_extension = os.path.splitext(file_path)[1].lower()
            
            if file_extension == '.pdf':
                cv_text = extract_text_from_pdf(file_path)
            elif file_extension in ['.txt', '.doc', '.docx']:
                # For text files, read directly
                with open(file_path, 'r', encoding='utf-8') as f:
                    cv_text = f.read()
            else:
                # Try to read as text file
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        cv_text = f.read()
                except:
                    raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a PDF, TXT, DOC, or DOCX file.")
            
            if not cv_text or len(cv_text.strip()) < 10:
                raise HTTPException(status_code=400, detail="Could not extract text from file. Please ensure the file contains readable text.")
            print(f"Extracted text length: {len(cv_text)}")
        except HTTPException:
            raise
        except Exception as e:
            print(f"Error extracting text from file: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to extract text from file: {str(e)}")

        # ✅ Check if summary and embedding already exist in DB
        stored_data = crud.get_resume_summary_with_embedding(db, student_id)
        if stored_data and stored_data.get_embedding():
            # Use cached data - no API calls needed!
            # Make sure we keep a concise version for chat context
            concise = make_concise_summary(stored_data.summary_text, max_chars=800)
            resume_summary = {"summary": concise}
            resume_embedding = stored_data.get_embedding()
            print(f"✅ Using cached resume data for student {student_id}")
        else:
            # Extract new summary from Gemini (only if not cached)
            resume_summary = extract_resume_summary(cv_text)
            # Compress to concise form before storing/using
            resume_summary["summary"] = make_concise_summary(resume_summary["summary"], max_chars=800)
            
            # Compute embedding (only if not cached) with fallback
            try:
                embeddings_model, embedding_type = get_embeddings_with_fallback()
                resume_embedding = embeddings_model.embed_query(resume_summary["summary"])
                print(f"✅ Generated new embedding for student {student_id} using {embedding_type}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Embedding generation failed: {e}")
            
            # Save to database for future use
            try:
                crud.save_resume_summary_with_embedding(db, student_id, resume_summary["summary"], resume_embedding)
                print(f"✅ Saved resume data to database for student {student_id}")
            except Exception as e:
                print(f"Error saving to database: {e}")
                raise HTTPException(status_code=500, detail=f"Failed to save resume data to database: {str(e)}")

        # ✅ Get recommendations by vector (no additional embedding calls)
        recs = get_internship_recommendations_by_vector(resume_embedding)
        # ✅ Add match % and skill gaps for top 3
        recs = augment_recommendations_with_scoring(resume_summary["summary"], recs, top_n=3)

        # ✅ Store in session for chat use
        request.session["student_id"] = student_id
        request.session["resume_summary"] = resume_summary["summary"]
        # Store a rounded embedding to keep session small
        request.session["resume_embedding"] = [round(float(x), 4) for x in resume_embedding]
        request.session["recommendations"] = recs
        # Initialize chat embeddings list if not present
        if "chat_query_embeddings" not in request.session:
            request.session["chat_query_embeddings"] = []

        # Debug: log what we're storing
        print(f"Storing in session for student {student_id}:")
        print(f"- resume_summary length: {len(resume_summary['summary'])}")
        print(f"- recommendations count: {len(recs)}")
        print(f"- session keys: {list(request.session.keys())}")

        return {
            "resume_summary": resume_summary,
            "recommendations": recs,
            "message": "Resume processed successfully. Use /chat to ask questions.",
            "session_stored": True
        }
    except Exception as e:
        print(f"Error in analyze_resume: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Resume processing failed: {str(e)}")


@router.get("/recommendations_scored")
async def recommendations_scored(request: Request, current_user: str = Depends(get_current_user)):
    student_id = current_user
    if not student_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    # Hydrate from DB if needed
    try:
        db: Session = next(get_db())
        _hydrate_session_from_db_if_missing(request, db, student_id)
    except Exception:
        pass
    resume_summary = request.session.get("resume_summary", "")
    resume_embedding = request.session.get("resume_embedding")
    if not resume_summary or not resume_embedding:
        raise HTTPException(status_code=400, detail="No resume processed. Upload via /analyze_resume/ first.")

    # Fresh recommendations by current vector
    base_recs = get_internship_recommendations_by_vector(resume_embedding)
    recs = augment_recommendations_with_scoring(resume_summary, base_recs, top_n=3)
    request.session["recommendations"] = recs
    return {"recommendations": recs}


@router.post("/chat")
async def chat_with_ai(request: Request, question: str, current_user: str = Depends(get_current_user)):
    """Chat with AI using stored resume summary and recommendations."""
    student_id = current_user
    if not student_id:
        raise HTTPException(status_code=401, detail="Not logged in")

    # Hydrate from DB if needed
    try:
        db: Session = next(get_db())
        _hydrate_session_from_db_if_missing(request, db, student_id)
    except Exception:
        pass
    # Get stored data from session
    resume_summary = request.session.get("resume_summary", "")
    recommendations = request.session.get("recommendations", [])
    resume_embedding = request.session.get("resume_embedding")
    chat_query_embeddings = request.session.get("chat_query_embeddings", [])
    
    # Get conversation context (last few interactions for context, not full history)
    conversation_context = request.session.get("conversation_context", {
        "last_topic": "",
        "last_intent": "",
        "conversation_stage": "initial"  # initial, discussing_internships, discussing_skills, etc.
    })

    # Debug: log session data
    print(f"Session data for student {student_id}:")
    print(f"- resume_summary: {bool(resume_summary)}")
    print(f"- recommendations: {len(recommendations) if recommendations else 0}")
    print(f"- conversation_context: {conversation_context}")

    if not resume_summary:
        raise HTTPException(
            status_code=400, 
            detail="No resume processed. Please upload resume first via /analyze_resume/"
        )

    try:
        # Determine intent
        intent = detect_intent(question)
        
        # Update conversation context
        conversation_context["last_intent"] = intent
        conversation_context["last_topic"] = question[:100]  # Store first 100 chars
        
        # Determine conversation stage based on intent and context
        if intent == "recommend_internships":
            conversation_context["conversation_stage"] = "discussing_internships"
        elif intent == "suggest_skills":
            conversation_context["conversation_stage"] = "discussing_skills"
        elif any(word in question.lower() for word in ["apply", "application", "resume", "interview"]):
            conversation_context["conversation_stage"] = "discussing_applications"
        elif any(word in question.lower() for word in ["career", "path", "future", "goal"]):
            conversation_context["conversation_stage"] = "discussing_career"
        
        # Store updated context
        request.session["conversation_context"] = conversation_context

        if intent == "recommend_internships":
            # Embed current query
            query_vec, provider = embed_text(question)
            query_vec_rounded = [round(float(x), 4) for x in query_vec]

            # Append to session history (cap to last 3)
            chat_query_embeddings.append(query_vec_rounded)
            chat_query_embeddings = chat_query_embeddings[-3:]
            request.session["chat_query_embeddings"] = chat_query_embeddings

            # Combine resume + past chat + current query
            vectors_to_average = []
            if resume_embedding:
                vectors_to_average.append(resume_embedding)
            vectors_to_average.extend(chat_query_embeddings)
            vectors_to_average.append(query_vec_rounded)
            combined_vector = average_embeddings(vectors_to_average)

            # Retrieve & score
            recs = get_internship_recommendations_by_vector(combined_vector)
            recs = augment_recommendations_with_scoring(resume_summary, recs, top_n=3)
            request.session["recommendations"] = recs

            return {
                "intent": intent,
                "provider": provider,
                "recommendations": recs
            }

        if intent == "suggest_skills":
            advice = suggest_skills_to_pursue(question, resume_summary)
            return {
                "intent": intent,
                "advice": advice
            }

        # Default: general QA using available context with conversation awareness
        answer = answer_with_context(student_id, question, resume_summary, recommendations, conversation_context)
        return {
            "intent": intent,
            "question": question,
            "answer": answer,
            "model_used": "gemini-1.5-flash"
        }
    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")