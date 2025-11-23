#!/bin/bash

# Quick Restore Script for Saanify Workspace - FIXED VERSION
# Usage: ./quick-restore.sh [backup-id]

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

echo -e "${BLUE}🔄 Saanify Workspace - Quick Restore (Fixed)${NC}"
echo -e "${BLUE}========================================${NC}"

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
BACKUP_ID=""
SILENT=false

for arg in "$@"; do
    case $arg in
        --silent)
            SILENT=true
            shift
            ;;
        --help)
            echo "Usage: $0 [backup-id] [options]"
            echo "Arguments:"
            echo "  backup-id    Specific backup ID to restore (optional)"
            echo "Options:"
            echo "  --silent     Silent mode (no output)"
            echo "  --help       Show this help message"
            exit 0
            ;;
        *)
            BACKUP_ID="$arg"
            shift
            ;;
    esac
done

# Check if simple-restore.js exists
if [ ! -f "$SCRIPT_DIR/simple-restore.js" ]; then
    echo -e "${RED}Error: simple-restore.js not found${NC}"
    echo -e "${BLUE}Please ensure the backup system is properly installed${NC}"
    exit 1
fi

# Warning message
if [ "$SILENT" = false ]; then
    echo -e "${YELLOW}⚠️  This will restore your project from a backup.${NC}"
    echo -e "${YELLOW}⚚�️  Current project files will be overwritten!${NC}"
    echo
    
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Restore cancelled.${NC}"
        exit 0
    fi
fi

# Restore backup
if [ "$SILENT" = false ]; then
    echo -e "${YELLOW}Restoring backup...${NC}"
fi

if [ -n "$BACKUP_ID" ]; then
    echo "node \"$SCRIPT_DIR/simple-restore.js\" restore \"$BACKUP_ID\"" | bash
else
    echo "node \"$SCRIPT_DIR/simple-restore.js\" restore" | bash
fi

if [ "$SILENT" = false ]; then
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
    echo -e "${BLUE}🚀 Project is ready to use!${NC}"
    echo -e "${BLUE}📝 Run \"npm run dev\" to start the development server${NC}"
fi