#!/bin/bash

# Speech-to-Text API - Test Script
# Description: Tests the API with a sample audio file

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:8000"

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Speech-to-Text API - Test Suite      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local method=$3

    echo -e "${YELLOW}Testing: ${name}${NC}"

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ ${name} - OK (${http_code})${NC}"
        echo -e "${GREEN}  Response: ${body}${NC}"
    else
        echo -e "${RED}✗ ${name} - FAILED (${http_code})${NC}"
        echo -e "${RED}  Response: ${body}${NC}"
    fi
    echo ""
}

# Test 1: Check if server is running
echo -e "${BLUE}[1/4] Checking if API is running...${NC}"
if ! curl -s "$API_URL/docs" > /dev/null 2>&1; then
    echo -e "${RED}✗ API is not running${NC}"
    echo -e "${YELLOW}  Start the server with: ./dev.sh${NC}"
    exit 1
fi
echo -e "${GREEN}✓ API is running${NC}"
echo ""

# Test 2: Check docs
echo -e "${BLUE}[2/4] Checking API documentation...${NC}"
test_endpoint "GET /docs" "$API_URL/docs" "GET"

# Test 3: Try to upload without file (should fail)
echo -e "${BLUE}[3/4] Testing error handling (no file)...${NC}"
response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/speech-to-text")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "422" ]; then
    echo -e "${GREEN}✓ Error handling works correctly (422)${NC}"
else
    echo -e "${YELLOW}⚠️  Expected 422, got ${http_code}${NC}"
fi
echo ""

# Test 4: Test with real audio file
echo -e "${BLUE}[4/4] Testing with audio file...${NC}"

# Check if user has a test audio file
if [ ! -z "$1" ] && [ -f "$1" ]; then
    AUDIO_FILE=$1
    echo -e "${GREEN}Using provided audio file: ${AUDIO_FILE}${NC}"
else
    # Create a simple test audio file if ffmpeg is available
    if command -v ffmpeg &> /dev/null; then
        echo -e "${YELLOW}Creating test audio file...${NC}"
        AUDIO_FILE="test_audio.mp3"

        # Generate 2 seconds of silence as test audio
        ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 2 -q:a 9 -acodec libmp3lame "$AUDIO_FILE" -y &> /dev/null

        if [ -f "$AUDIO_FILE" ]; then
            echo -e "${GREEN}✓ Created test audio file${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No audio file provided and ffmpeg not available${NC}"
        echo -e "${YELLOW}  Usage: ./test-api.sh <path-to-audio-file.mp3>${NC}"
        echo -e "${YELLOW}  Skipping audio upload test${NC}"
        echo ""
        echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  Manual Test Instructions             ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "1. Get an audio file (MP3, WAV, M4A, etc.)"
        echo -e "2. Run: ${BLUE}./test-api.sh your-audio.mp3${NC}"
        echo ""
        echo -e "Or test via curl:"
        echo -e "${BLUE}curl -X POST http://localhost:8000/speech-to-text \\${NC}"
        echo -e "${BLUE}  -F \"file=@your-audio.mp3\" \\${NC}"
        echo -e "${BLUE}  -F \"language=en\"${NC}"
        echo ""
        exit 0
    fi
fi

# Test with actual audio file
if [ -f "$AUDIO_FILE" ]; then
    echo -e "${YELLOW}Uploading: ${AUDIO_FILE}${NC}"

    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/speech-to-text" \
        -F "file=@$AUDIO_FILE" \
        -F "language=en")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Transcription successful!${NC}"
        echo -e "${GREEN}  Response:${NC}"
        echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
    else
        echo -e "${RED}✗ Transcription failed (${http_code})${NC}"
        echo -e "${RED}  Response: ${body}${NC}"
    fi

    # Cleanup test file if we created it
    if [ "$AUDIO_FILE" = "test_audio.mp3" ]; then
        rm -f "$AUDIO_FILE"
    fi
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Test Complete                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
