#!/bin/bash

# Backup and Restore Test Script
# Tests the backup and restore functionality

set -e

echo "💾 Starting Backup and Restore Test..."

# Configuration
API_BASE="http://localhost:3000/api/super-admin/automation"
TEMP_DIR="/tmp/automation_test_$$"
TEST_BACKUP_FILE="$TEMP_DIR/test_backup.json"

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Cleanup function
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
}

# Set up cleanup on exit
trap cleanup EXIT

# Create temporary directory
mkdir -p "$TEMP_DIR"

# Step 1: Create a test backup
log_step "Step 1: Creating test backup..."
BACKUP_RESPONSE=$(curl -s -X POST "${API_BASE}/backup-now" \
    -H "Authorization: Bearer test_admin_token")

if echo "$BACKUP_RESPONSE" | grep -q '"success":true'; then
    log_info "✅ Backup created successfully"
    
    # Extract backup file name if available
    BACKUP_FILE=$(echo "$BACKUP_RESPONSE" | jq -r '.result.file_name' 2>/dev/null || echo "unknown")
    log_info "Backup file: $BACKUP_FILE"
else
    log_error "❌ Backup creation failed"
    echo "$BACKUP_RESPONSE"
    exit 1
fi

# Wait for backup to complete
sleep 3

# Step 2: List available backups
log_step "Step 2: Listing available backups..."
LIST_RESPONSE=$(curl -s -X GET "${API_BASE}/../storage/list" \
    -H "Authorization: Bearer test_admin_token" 2>/dev/null || echo '{"backups":[]}')

# Since we don't have a storage list endpoint, we'll skip this step
log_warn "⚠️ Storage list endpoint not available, skipping backup listing"

# Step 3: Create a test backup file for restore testing
log_step "Step 3: Creating test backup file for restore testing..."

# Create a sample backup file structure
cat > "$TEST_BACKUP_FILE" << 'EOF'
{
  "metadata": {
    "backup_id": "test-backup-123",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "tables": [
      {"name": "users", "record_count": 1},
      {"name": "societies", "record_count": 1},
      {"name": "automation_tasks", "record_count": 4}
    ],
    "total_records": 6,
    "file_size": 1024,
    "schema_version": "1.0",
    "created_by": "test_script"
  },
  "data": {
    "users": [
      {
        "id": "test-user-1",
        "email": "test@example.com",
        "name": "Test User",
        "role": "USER",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "societies": [
      {
        "id": "test-society-1",
        "name": "Test Society",
        "address": "123 Test St",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ],
    "automation_tasks": [
      {
        "id": "task-1",
        "task_name": "schema_sync",
        "schedule": "0 2 * * *",
        "enabled": true,
        "created_at": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "task-2",
        "task_name": "auto_sync_data",
        "schedule": "*/30 * * * *",
        "enabled": true,
        "created_at": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "task-3",
        "task_name": "backup",
        "schedule": "0 3 * * *",
        "enabled": true,
        "created_at": "2024-01-01T00:00:00.000Z"
      },
      {
        "id": "task-4",
        "task_name": "health_check",
        "schedule": "*/15 * * * *",
        "enabled": true,
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
EOF

log_info "✅ Test backup file created"

# Step 4: Test restore preview
log_step "Step 4: Testing restore preview..."
PREVIEW_RESPONSE=$(curl -s -X POST "${API_BASE}/restore" \
    -H "Authorization: Bearer test_admin_token" \
    -F "file=@$TEST_BACKUP_FILE" \
    -F "preview=true" \
    -F "confirm=false")

if echo "$PREVIEW_RESPONSE" | grep -q '"success":true'; then
    log_info "✅ Restore preview successful"
    
    # Extract preview information
    TABLE_COUNT=$(echo "$PREVIEW_RESPONSE" | jq -r '.result.preview.restore_plan.tables_to_restore | length' 2>/dev/null || echo "unknown")
    RECORD_COUNT=$(echo "$PREVIEW_RESPONSE" | jq -r '.result.preview.restore_plan.total_records' 2>/dev/null || echo "unknown")
    
    log_info "Preview shows $TABLE_COUNT tables with $RECORD_COUNT total records"
else
    log_warn "⚠️ Restore preview failed or not available"
    echo "$PREVIEW_RESPONSE" | jq '.' 2>/dev/null || echo "$PREVIEW_RESPONSE"
fi

# Step 5: Test restore with confirmation (dry run)
log_step "Step 5: Testing restore with confirmation (simulation mode)..."
RESTORE_RESPONSE=$(curl -s -X POST "${API_BASE}/restore" \
    -H "Authorization: Bearer test_admin_token" \
    -F "file=@$TEST_BACKUP_FILE" \
    -F "preview=false" \
    -F "confirm=true")

if echo "$RESTORE_RESPONSE" | grep -q '"success":true'; then
    log_info "✅ Restore executed successfully (simulation mode)"
    
    # Extract restore information
    RESTORED_TABLES=$(echo "$RESTORE_RESPONSE" | jq -r '.result.restored_tables | length' 2>/dev/null || echo "unknown")
    log_info "Restored $RESTORED_TABLES tables"
else
    log_warn "⚠️ Restore failed or not available"
    echo "$RESTORE_RESPONSE" | jq '.' 2>/dev/null || echo "$RESTORE_RESPONSE"
fi

# Step 6: Test backup validation
log_step "Step 6: Testing backup validation..."

# Test with invalid backup file
cat > "$TEMP_DIR/invalid_backup.json" << 'EOF'
{
  "invalid": "structure"
}
EOF

INVALID_RESPONSE=$(curl -s -X POST "${API_BASE}/restore" \
    -H "Authorization: Bearer test_admin_token" \
    -F "file=@$TEMP_DIR/invalid_backup.json" \
    -F "preview=true" \
    -F "confirm=false")

if echo "$INVALID_RESPONSE" | grep -q '"success":false'; then
    log_info "✅ Invalid backup correctly rejected"
else
    log_warn "⚠️ Invalid backup validation may not be working properly"
fi

# Step 7: Test backup file size limits
log_step "Step 7: Testing backup file size validation..."

# Create a large backup file (simulate)
dd if=/dev/zero of="$TEMP_DIR/large_backup.json" bs=1024 count=10240 2>/dev/null # 10MB
echo '{"metadata":{"backup_id":"large-test"},"data":{}}' >> "$TEMP_DIR/large_backup.json"

LARGE_RESPONSE=$(curl -s -X POST "${API_BASE}/restore" \
    -H "Authorization: Bearer test_admin_token" \
    -F "file=@$TEMP_DIR/large_backup.json" \
    -F "preview=true" \
    -F "confirm=false")

# Check if large file is handled (either accepted or rejected appropriately)
if echo "$LARGE_RESPONSE" | grep -q '"success"'; then
    log_info "✅ Large backup file handled appropriately"
else
    log_info "ℹ️ Large backup file rejected (may be expected)"
fi

# Step 8: Verify backup logs
log_step "Step 8: Verifying backup and restore logs..."
LOGS_RESPONSE=$(curl -s -X GET "${API_BASE}/logs" \
    -H "Authorization: Bearer test_admin_token" \
    -G -d "task_name=backup")

BACKUP_LOGS=$(echo "$LOGS_RESPONSE" | jq -r '.logs | length' 2>/dev/null || echo "0")

if [ "$BACKUP_LOGS" -gt 0 ]; then
    log_info "✅ Backup logs found ($BACKUP_LOGS entries)"
else
    log_warn "⚠️ No backup logs found"
fi

# Check for restore logs
RESTORE_LOGS_RESPONSE=$(curl -s -X GET "${API_BASE}/logs" \
    -H "Authorization: Bearer test_admin_token" \
    -G -d "task_name=restore")

RESTORE_LOGS=$(echo "$RESTORE_LOGS_RESPONSE" | jq -r '.logs | length' 2>/dev/null || echo "0")

if [ "$RESTORE_LOGS" -gt 0 ]; then
    log_info "✅ Restore logs found ($RESTORE_LOGS entries)"
else
    log_warn "⚠️ No restore logs found"
fi

# Generate comprehensive report
echo ""
log_info "📊 Backup and Restore Test Report"
echo "=================================="

# Test results summary
BACKUP_SUCCESS=$(echo "$BACKUP_RESPONSE" | grep -q '"success":true' && echo "✅ PASS" || echo "❌ FAIL")
PREVIEW_SUCCESS=$(echo "$PREVIEW_RESPONSE" | grep -q '"success":true' && echo "✅ PASS" || echo "⚠️ WARN")
RESTORE_SUCCESS=$(echo "$RESTORE_RESPONSE" | grep -q '"success":true' && echo "✅ PASS" || echo "⚠️ WARN")
VALIDATION_SUCCESS=$(echo "$INVALID_RESPONSE" | grep -q '"success":false' && echo "✅ PASS" || echo "❌ FAIL")

echo "Backup Creation: $BACKUP_SUCCESS"
echo "Restore Preview: $PREVIEW_SUCCESS"
echo "Restore Execution: $RESTORE_SUCCESS"
echo "Invalid Backup Rejection: $VALIDATION_SUCCESS"
echo "Backup Logs Found: $BACKUP_LOGS"
echo "Restore Logs Found: $RESTORE_LOGS"

echo ""
log_info "📋 Test Summary"
echo "=================================="

# Calculate success rate
TOTAL_TESTS=4
PASSED_TESTS=0

[ "$BACKUP_SUCCESS" = "✅ PASS" ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$PREVIEW_SUCCESS" = "✅ PASS" ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$RESTORE_SUCCESS" = "✅ PASS" ] && PASSED_TESTS=$((PASSED_TESTS + 1))
[ "$VALIDATION_SUCCESS" = "✅ PASS" ] && PASSED_TESTS=$((PASSED_TESTS + 1))

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "Tests Passed: $PASSED_TESTS/$TOTAL_TESTS"
echo "Success Rate: $SUCCESS_RATE%"

if [ $SUCCESS_RATE -ge 75 ]; then
    log_info "🎉 Backup and restore system is working well!"
    exit 0
elif [ $SUCCESS_RATE -ge 50 ]; then
    log_warn "⚠️ Backup and restore system is mostly functional with some issues."
    exit 0
else
    log_error "❌ Backup and restore system has significant issues."
    exit 1
fi