import os
import sys

# Add parent directory to sys.path so Django modules can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from config.wsgi import app

# Export app for Vercel Serverless Function handler
app = app
