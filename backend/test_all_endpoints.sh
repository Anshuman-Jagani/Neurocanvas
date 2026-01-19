#!/bin/bash

# NeuroCanvas Backend API Testing Script
# This script tests all API endpoints systematically

BASE_URL="http://localhost:5001"
PASS_COUNT=0
FAIL_COUNT=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "\n${YELLOW}Testing: ${description}${NC}"
    echo "Endpoint: ${method} ${endpoint}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "${data}" "${BASE_URL}${endpoint}")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "${data}" "${BASE_URL}${endpoint}")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "${BASE_URL}${endpoint}")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP ${http_code})"
        echo "Response: ${body}" | head -c 200
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP ${http_code})"
        echo "Response: ${body}"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo "========================================="
echo "NeuroCanvas Backend API Test Suite"
echo "========================================="

# Basic Health Checks
echo -e "\n${YELLOW}=== BASIC HEALTH CHECKS ===${NC}"
test_endpoint "GET" "/" "Root endpoint"
test_endpoint "GET" "/health" "Health check"

# NLP Routes
echo -e "\n${YELLOW}=== NLP ROUTES ===${NC}"
test_endpoint "POST" "/api/nlp/analyze" '{"prompt":"A beautiful sunset over mountains"}' "Analyze prompt"
test_endpoint "POST" "/api/nlp/enhance" '{"prompt":"cat in space"}' "Enhance prompt"
test_endpoint "POST" "/api/nlp/keywords" '{"prompt":"A beautiful sunset over mountains"}' "Extract keywords"
test_endpoint "POST" "/api/nlp/sentiment" '{"prompt":"happy beautiful day"}' "Analyze sentiment"
test_endpoint "GET" "/api/nlp/presets" "Get prompt presets"
test_endpoint "GET" "/api/nlp/history?limit=5" "Get prompt history"

# Style Transfer Routes
echo -e "\n${YELLOW}=== STYLE TRANSFER ROUTES ===${NC}"
test_endpoint "GET" "/api/style-transfer/styles" "Get available styles"
test_endpoint "GET" "/api/style-transfer/history?userId=test123&limit=5" "Get style transfer history"

# Diffusion Routes
echo -e "\n${YELLOW}=== DIFFUSION ROUTES ===${NC}"
test_endpoint "GET" "/api/diffusion/presets" "Get diffusion presets"
test_endpoint "GET" "/api/diffusion/history?userId=test123&limit=5" "Get diffusion history"

# Generation Routes
echo -e "\n${YELLOW}=== GENERATION ROUTES ===${NC}"
test_endpoint "GET" "/api/generate/stats" "Get queue statistics"
test_endpoint "GET" "/api/generate/history?userId=test123&limit=5" "Get generation history"

# Feedback Routes
echo -e "\n${YELLOW}=== FEEDBACK ROUTES ===${NC}"
test_endpoint "GET" "/api/feedback/stats?userId=test123" "Get user statistics"
test_endpoint "GET" "/api/feedback/recommendations?userId=test123&count=3" "Get recommendations"

# LLM Routes
echo -e "\n${YELLOW}=== LLM ROUTES ===${NC}"
test_endpoint "POST" "/api/llm/refine" '{"prompt":"beautiful landscape"}' "Refine prompt"
test_endpoint "POST" "/api/llm/suggest" '{"prompt":"sunset","count":3}' "Get suggestions"
test_endpoint "POST" "/api/llm/explain" '{"concept":"impressionism"}' "Explain concept"
test_endpoint "POST" "/api/llm/variations" '{"prompt":"mountain scene","count":3}' "Generate variations"
test_endpoint "GET" "/api/llm/conversations?limit=5" "Get conversations"

# Summary
echo -e "\n========================================="
echo -e "Test Results Summary"
echo -e "========================================="
echo -e "${GREEN}Passed: ${PASS_COUNT}${NC}"
echo -e "${RED}Failed: ${FAIL_COUNT}${NC}"
echo -e "Total: $((PASS_COUNT + FAIL_COUNT))"
echo -e "========================================="

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    exit 1
fi
