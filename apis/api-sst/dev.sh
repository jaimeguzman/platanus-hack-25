#!/bin/bash

# Speech-to-Text API - Development Server
# Description: Starts the FastAPI development server with hot reload

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Speech-to-Text API - Dev Server      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env file not found${NC}"
    echo -e "${YELLOW}   Creating .env from .env.example...${NC}"

    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo -e "${GREEN}✓ Created .env file${NC}"
        echo -e "${RED}⚠️  IMPORTANT: Edit .env and add your OPENAI_API_KEY${NC}"
        echo ""
    else
        echo -e "${RED}✗ Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Check if OPENAI_API_KEY is set in .env file
if ! grep -q "^OPENAI_API_KEY=sk-" .env 2>/dev/null; then
    echo -e "${RED}✗ Error: OPENAI_API_KEY not configured in .env${NC}"
    echo -e "${YELLOW}  Get your API key from: https://platform.openai.com/api-keys${NC}"
    echo -e "${YELLOW}  Edit .env and set: OPENAI_API_KEY=sk-your-key-here${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Environment variables configured${NC}"

# Check if Python 3.11+ is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Error: Python 3 not found${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo -e "${GREEN}✓ Python version: $PYTHON_VERSION${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found${NC}"
    echo -e "${YELLOW}   Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
fi

# Activate virtual environment
# echo -e "${GREEN}✓ Activating virtual environment${NC}"
# source venv/bin/activate

# Install/upgrade dependencies
# echo -e "${GREEN}✓ Installing dependencies...${NC}"
# pip install --upgrade pip -q

# # Check if uvicorn is installed
# if ! python -c "import uvicorn" 2>/dev/null; then
#     echo -e "${YELLOW}⚠️  Installing missing dependencies...${NC}"
#     pip install -r requirements.txt
# else
#     pip install -r requirements.txt -q
# fi

# echo -e "${GREEN}✓ Dependencies installed${NC}"
# echo ""

# Start server
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🚀 Starting development server...     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📍 API running at: http://localhost:8000${NC}"
echo -e "${GREEN}📚 API docs at: http://localhost:8000/docs${NC}"
echo -e "${GREEN}📖 ReDoc at: http://localhost:8000/redoc${NC}"
echo ""
echo -e "${YELLOW}Press CTRL+C to stop the server${NC}"
echo ""

# Run uvicorn with hot reload
# --env-file .env loads environment variables via python-dotenv
uvicorn main:app --reload --host 0.0.0.0 --port 8000 --env-file .env
