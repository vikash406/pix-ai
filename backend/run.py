import os
import uvicorn

if __name__ == "__main__":
    # Render environmental variable 'PORT' use karta hai
    port = int(os.environ.get("PORT", 8000)) 
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=port,
        reload=False  # Production mein reload False rakhein
    )