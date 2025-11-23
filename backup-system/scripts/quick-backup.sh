#!/bin/bash

# Quick Backup Script for Saanify Workspace
# Usage: ./quick-backup.sh [options]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}🚀 Saanify Workspace - Quick Backup${NC}"
echo -e "${BLUE}======================================${NC}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "$PROJECT_ROOT/package.json" ]; then
    echo -e "${RED}Error: Not in a valid Node.js project directory${NC}"
    exit 1
fi

# Change to project root
cd "$PROJECT_ROOT"

# Parse arguments
QUICK=false
SILENT=false

for arg in "$@"; do
    case $arg in
        --quick)
            QUICK=true
            shift
            ;;
        --silent)
            SILENT=true
            shift
            ;;
        --help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --quick     Quick backup (minimal output)"
            echo "  --silent    Silent mode (no output)"
            echo "  --help      Show this help message"
            exit 0
            ;;
    esac
done

# Create backup
if [ "$SILENT" = false ]; then
    echo -e "${YELLOW}Creating backup...${NC}"
fi

if [ "$QUICK" = true ]; then
    node "$SCRIPT_DIR/backup.js" create --quick
else
    node "$SCRIPT_DIR/backup.js" create
fi

if [ "$SILENT" = false ]; then
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
fi