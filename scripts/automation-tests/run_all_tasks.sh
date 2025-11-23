#!/bin/bash

# Run All Tasks Test Script
# Tests all automation tasks to ensure they work correctly

set -e

echo "🔧 Starting Run All Tasks Test..."

# Configuration
API_BASE="http://localhost:3000/api/super-admin/automation"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_task() {
    echo -e "${BLUE}[TASK]${NC} $1"
}

# Array of tasks to test
TASKS=(
    "schema_sync"
    "auto_sync_data"
    "backup"
    "health_check"
)

# Results tracking
declare -A RESULTS
SUCCESS_COUNT=0
TOTAL_COUNT=${#TASKS[@]}

# Test each task
for task in "${TASKS[@]}"; do
    log_task "Testing task: $task"
    
    # Get start time
    START_TIME=$(date +%s%N)
    
    # Execute task
    RESPONSE=$(curl -s -X POST "${API_BASE}/run" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer test_admin_token" \
        -d "{\"task\":\"$task\"}")
    
    # Get end time
    END_TIME=$(date +%s%N)
    DURATION=$(( (END_TIME - START_TIME) / 1000000 )) # Convert to milliseconds
    
    # Check result
    if echo "$RESPONSE" | grep -q '"success":true'; then
        log_info "✅ $task completed successfully (${DURATION}ms)"
        RESULTS[$task]="SUCCESS"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        log_error "❌ $task failed"
        RESULTS[$task]="FAILED"
        echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
    fi
    
    # Wait between tasks to avoid overwhelming the system
    sleep 2
done

# Test system status after running tasks
log_task "Checking system status after task execution..."
STATUS_RESPONSE=$(curl -s -X GET "${API_BASE}/status" \
    -H "Authorization: Bearer test_admin_token")

# Extract recent logs
RECENT_LOGS=$(echo "$STATUS_RESPONSE" | jq -r '.recent_logs[0:5] | .[] | "\(.task_name): \(.status) - \(.message)"' 2>/dev/null || echo "Could not parse logs")

# Test cron runner
log_task "Testing cron runner..."
CRON_RESPONSE=$(curl -s -X POST "${API_BASE}/cron" \
    -H "Authorization: Bearer test_admin_token")

if echo "$CRON_RESPONSE" | grep -q '"success":true'; then
    log_info "✅ Cron runner executed successfully"
    RESULTS["cron_runner"]="SUCCESS"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    log_error "❌ Cron runner failed"
    RESULTS["cron_runner"]="FAILED"
fi

# Test health check
log_task "Running comprehensive health check..."
HEALTH_RESPONSE=$(curl -s -X GET "${API_BASE}/health" \
    -H "Authorization: Bearer test_admin_token")

if echo "$HEALTH_RESPONSE" | grep -q '"overall_status":"healthy"'; then
    log_info "✅ System health is good"
    RESULTS["health_check"]="SUCCESS"
else
    log_warn "⚠️ System health shows issues"
    RESULTS["health_check"]="WARNING"
fi

# Generate report
echo ""
log_info "📊 Task Execution Report"
echo "=================================="

for task in "${!RESULTS[@]}"; do
    status="${RESULTS[$task]}"
    case $status in
        "SUCCESS")
            echo -e "  ${GREEN}✅${NC} $task"
            ;;
        "FAILED")
            echo -e "  ${RED}❌${NC} $task"
            ;;
        "WARNING")
            echo -e "  ${YELLOW}⚠️${NC} $task"
            ;;
    esac
done

echo ""
log_info "📈 Summary Statistics"
echo "=================================="
echo "Total Tasks Tested: $((TOTAL_COUNT + 2))" # +2 for cron_runner and health_check
echo "Successful: $SUCCESS_COUNT"
echo "Failed: $((TOTAL_COUNT + 2 - SUCCESS_COUNT))"
echo "Success Rate: $(( SUCCESS_COUNT * 100 / (TOTAL_COUNT + 2) ))%"

echo ""
log_info "📋 Recent Activity"
echo "=================================="
echo "$RECENT_LOGS"

# Performance summary
echo ""
log_info "⚡ Performance Summary"
echo "=================================="

# Extract task durations from logs if available
TASK_PERFORMANCE=$(echo "$STATUS_RESPONSE" | jq -r '.recent_logs[0:5] | .[] | select(.duration_ms) | "\(.task_name): \(.duration_ms)ms"' 2>/dev/null || echo "Performance data not available")

if [ "$TASK_PERFORMANCE" != "Performance data not available" ]; then
    echo "$TASK_PERFORMANCE"
else
    echo "Task performance metrics not available in logs"
fi

# Final verdict
echo ""
if [ $SUCCESS_COUNT -eq $((TOTAL_COUNT + 2)) ]; then
    log_info "🎉 All tests passed! Automation system is fully functional."
    exit 0
elif [ $SUCCESS_COUNT -ge $((TOTAL_COUNT)) ]; then
    log_warn "⚠️ Most tests passed. System is mostly functional with minor issues."
    exit 0
else
    log_error "❌ Multiple tests failed. System requires attention."
    exit 1
fi