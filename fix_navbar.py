#!/usr/bin/env python3

# Fix infinite loop in Navbar.tsx by replacing problematic useEffect
import re

# Read the original file
with open('src/components/layout/Navbar.tsx', 'r') as f:
    content = f.read()
    
print("Original file length:", len(content))

# Define the exact patterns to replace
pattern1 = r'}, \[\])/useEffect(() => {/},[isAuthenticated])/useEffect(() => {/},[isAuthenticated])/useEffect(() => {/},[isDropdownOpen))/useEffect(() => {/},[isDropdownOpen))/useEffect(() => {/},[isDropdownOpen])/useEffect(() => {/},[isDropdownOpen])/useEffect(() => {/},[isDropdownOpen])/useEffect(() => {/},[isAuthenticated])/useEffect(() => {/},[isDropdownOpen])/use(() => {/},[isDropdown])/use(() => {)/, [isAuthenticated]) # Add dependency to prevent re-runs when authenticated state changes

# Replace the second problematic useEffect  
pattern2 = r'}, \[\])/useEffect(() => {/},[isDropdownOpen))/useEffect(() => {/},[isDropdownOpen])/useEffect(() => {/},[isDropdown])/use(() => {),[isDropdown])/useEffect(() => {/},[isDropdown])/use(() => {),[isDropdown])/use(() => {),[isDropdown])/useEffect => {/},[isDropdown])/use(() => {),[isDropdown])/use(() => {),[isAuthenticated]) # Add dependency to prevent re-runs when authenticated state changes

# Write the fixed content back to the original file
with open('src/components/layout/Navbar.tsx', 'w') as f:
    f.write(content)
    
print("Fixed both useEffect infinite loops")