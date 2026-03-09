#!/bin/bash
# Quick TypeScript Error Checker
# Run this script to find all TypeScript errors at once

echo "Checking TypeScript errors..."
npx tsc --noEmit --pretty false 2>&1 | grep "error TS" || echo "No TypeScript errors found!"

echo ""
echo "Checking Next.js build..."
npm run build 2>&1 | grep -E "Type error|Failed to compile" || echo "Build successful!"

echo ""
echo "Done! Check output above for errors."
