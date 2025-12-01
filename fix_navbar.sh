#!/bin/bash

# Fix infinite loop in Navbar.tsx by replacing problematic useEffect
echo "Fixing Navbar infinite loop issues..."

# Use ed for exact text replacement
ed -i '22,55s/}, \[\])/useEffect(() => {/},[isAuthenticated])/useEffect(() => {/},[isAuthenticated])' src/components/layout/Navbar.tsx

echo "Fixed first useEffect infinite loop"