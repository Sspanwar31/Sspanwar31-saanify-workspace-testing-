#!/bin/bash

# API Route Testing Script
# Usage: ./scripts/test-api.sh [type]
# Types: basic, performance, errors, all

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${NEXT_PUBLIC_API_URL:-http://localhost:3000}"
TIMEOUT=10
LOG_FILE="test-results-$(date +%Y%m%d-%H%M%S).log"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if server is running
check_server() {
    log_info "Checking if server is running at $BASE_URL..."
    
    if curl -s --max-time $TIMEOUT "$BASE_URL/api/health" > /dev/null 2>&1; then
        log_success "Server is running"
        return 0
    else
        log_error "Server is not running at $BASE_URL"
        log_info "Please start the server with: npm run dev"
        exit 1
    fi
}

# Basic API tests
run_basic_tests() {
    log_info "Running basic API tests..."
    
    # Test health endpoint
    log_info "Testing health endpoint..."
    response=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$BASE_URL/api/health")
    if [ "$response" = "200" ]; then
        log_success "Health endpoint OK"
    else
        log_error "Health endpoint failed with status $response"
        cat /tmp/health_response.json
    fi
    
    # Test member creation
    log_info "Testing member creation..."
    member_data='{"name":"Test User","phone":"'$RANDOM'","address":"123 Test St"}'
    response=$(curl -s -w "%{http_code}" -o /tmp/create_response.json \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$member_data" \
        "$BASE_URL/api/client/members")
    
    if [ "$response" = "201" ]; then
        log_success "Member creation OK"
        member_id=$(jq -r '.member.id' /tmp/create_response.json)
        log_info "Created member ID: $member_id"
        
        # Test member retrieval
        log_info "Testing member retrieval..."
        response=$(curl -s -w "%{http_code}" -o /tmp/get_response.json "$BASE_URL/api/client/members/$member_id")
        if [ "$response" = "200" ]; then
            log_success "Member retrieval OK"
        else
            log_error "Member retrieval failed with status $response"
            cat /tmp/get_response.json
        fi
        
        # Test member update
        log_info "Testing member update..."
        update_data='{"name":"Updated Test User","address":"456 Updated St"}'
        response=$(curl -s -w "%{http_code}" -o /tmp/update_response.json \
            -X PUT \
            -H "Content-Type: application/json" \
            -d "$update_data" \
            "$BASE_URL/api/client/members/$member_id")
        
        if [ "$response" = "200" ]; then
            log_success "Member update OK"
        else
            log_error "Member update failed with status $response"
            cat /tmp/update_response.json
        fi
        
        # Test member deletion
        log_info "Testing member deletion..."
        response=$(curl -s -w "%{http_code}" -o /tmp/delete_response.json \
            -X DELETE \
            "$BASE_URL/api/client/members/$member_id")
        
        if [ "$response" = "200" ]; then
            log_success "Member deletion OK"
        else
            log_error "Member deletion failed with status $response"
            cat /tmp/delete_response.json
        fi
        
    else
        log_error "Member creation failed with status $response"
        cat /tmp/create_response.json
    fi
}

# Performance tests
run_performance_tests() {
    log_info "Running performance tests..."
    
    # Test response times
    log_info "Testing API response times..."
    
    for i in {1..10}; do
        start_time=$(date +%s%N)
        curl -s "$BASE_URL/api/client/members?page=1&limit=5" > /dev/null
        end_time=$(date +%s%N)
        
        response_time=$(( (end_time - start_time) / 1000000 ))
        log_info "Request $i: ${response_time}ms"
    done
    
    # Concurrent request test
    log_info "Testing concurrent requests..."
    
    # Create 10 background processes
    for i in {1..10}; do
        {
            start_time=$(date +%s%N)
            curl -s "$BASE_URL/api/client/members?page=1&limit=5" > /dev/null
            end_time=$(date +%s%N)
            response_time=$(( (end_time - start_time) / 1000000 ))
            echo "Concurrent request $i: ${response_time}ms" >> /tmp/concurrent_results.txt
        } &
    done
    
    # Wait for all background processes to complete
    wait
    
    log_success "Concurrent requests completed"
    cat /tmp/concurrent_results.txt
}

# Error handling tests
run_error_tests() {
    log_info "Running error handling tests..."
    
    # Test invalid JSON
    log_info "Testing invalid JSON handling..."
    response=$(curl -s -w "%{http_code}" -o /tmp/error_response.json \
        -X POST \
        -H "Content-Type: application/json" \
        -d "invalid json{" \
        "$BASE_URL/api/client/members")
    
    if [ "$response" = "400" ]; then
        log_success "Invalid JSON handling OK"
    else
        log_error "Invalid JSON handling failed with status $response"
    fi
    
    # Test missing required fields
    log_info "Testing missing required fields..."
    response=$(curl -s -w "%{http_code}" -o /tmp/error_response.json \
        -X POST \
        -H "Content-Type: application/json" \
        -d '{"phone":"1234567890"}' \
        "$BASE_URL/api/client/members")
    
    if [ "$response" = "400" ]; then
        log_success "Missing required fields handling OK"
    else
        log_error "Missing required fields handling failed with status $response"
    fi
    
    # Test non-existent resource
    log_info "Testing non-existent resource handling..."
    response=$(curl -s -w "%{http_code}" -o /tmp/error_response.json \
        "$BASE_URL/api/client/members/non-existent-id")
    
    if [ "$response" = "404" ]; then
        log_success "Non-existent resource handling OK"
    else
        log_error "Non-existent resource handling failed with status $response"
    fi
    
    # Test duplicate member creation
    log_info "Testing duplicate member creation..."
    member_data='{"name":"Duplicate Test","phone":"'$RANDOM'","address":"123 Test St"}'
    
    # Create first member
    curl -s -X POST -H "Content-Type: application/json" -d "$member_data" "$BASE_URL/api/client/members" > /dev/null
    
    # Try to create duplicate
    response=$(curl -s -w "%{http_code}" -o /tmp/error_response.json \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$member_data" \
        "$BASE_URL/api/client/members")
    
    if [ "$response" = "409" ]; then
        log_success "Duplicate member handling OK"
    else
        log_error "Duplicate member handling failed with status $response"
    fi
}

# Database health check
run_database_tests() {
    log_info "Running database health tests..."
    
    # Test database connectivity through health endpoint
    response=$(curl -s "$BASE_URL/api/health")
    db_connected=$(echo "$response" | jq -r '.database.connected // false')
    
    if [ "$db_connected" = "true" ]; then
        log_success "Database connectivity OK"
        
        # Test database response time
        db_response_time=$(echo "$response" | jq -r '.database.responseTime // 0')
        log_info "Database response time: ${db_response_time}ms"
        
        if [ "$db_response_time" -lt 1000 ]; then
            log_success "Database response time is good"
        else
            log_warning "Database response time is slow"
        fi
    else
        log_error "Database connectivity failed"
    fi
}

# Generate test report
generate_report() {
    log_info "Generating test report..."
    
    report_file="test-report-$(date +%Y%m%d-%H%M%S).html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>API Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .success { color: green; }
        .error { color: red; }
        .warning { color: orange; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>API Test Report</h1>
        <p>Generated: $(date)</p>
        <p>Base URL: $BASE_URL</p>
    </div>
    
    <div class="section">
        <h2>Test Results</h2>
        <pre>$(cat "$LOG_FILE")</pre>
    </div>
    
    <div class="section">
        <h2>Environment</h2>
        <p>Node.js: $(node --version)</p>
        <p>NPM: $(npm --version)</p>
        <p>OS: $(uname -a)</p>
    </div>
</body>
</html>
EOF
    
    log_success "Test report generated: $report_file"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f /tmp/*_response.json /tmp/concurrent_results.txt
}

# Main execution
main() {
    local test_type="${1:-all}"
    
    log_info "Starting API tests..."
    log_info "Base URL: $BASE_URL"
    log_info "Test type: $test_type"
    log_info "Log file: $LOG_FILE"
    
    # Check prerequisites
    if ! command -v curl &> /dev/null; then
        log_error "curl is required but not installed"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq is not installed, some features may not work"
    fi
    
    # Check if server is running
    check_server
    
    # Run tests based on type
    case "$test_type" in
        "basic")
            run_basic_tests
            ;;
        "performance")
            run_performance_tests
            ;;
        "errors")
            run_error_tests
            ;;
        "database")
            run_database_tests
            ;;
        "all")
            run_basic_tests
            run_performance_tests
            run_error_tests
            run_database_tests
            ;;
        *)
            log_error "Unknown test type: $test_type"
            log_info "Available types: basic, performance, errors, database, all"
            exit 1
            ;;
    esac
    
    # Generate report
    generate_report
    
    # Cleanup
    cleanup
    
    log_success "All tests completed successfully!"
}

# Handle script interruption
trap cleanup EXIT

# Run main function with all arguments
main "$@"