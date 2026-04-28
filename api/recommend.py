import sys
import os

# Add the ai-service directory to the path so we can import from it
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai-service'))

from main import app

# Vercel needs the app object to be named 'app'
# which it already is in main.py
