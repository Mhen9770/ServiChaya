# Quick Error Checking Guide

## Best Practice: Check All Errors at Once

Instead of fixing errors one by one during build, use these methods to find ALL errors at once:

### Method 1: TypeScript Compiler (Fastest)
```bash
npx tsc --noEmit
```
This will show ALL TypeScript errors without building the entire app.

### Method 2: Use the Scripts
```bash
# Windows PowerShell
.\check-errors.ps1

# Linux/Mac
./check-errors.sh
```

### Method 3: Next.js Build with Error Filtering
```bash
npm run build 2>&1 | Select-String -Pattern "Type error|Failed to compile"
```

## Common Error Patterns to Fix

1. **Missing Properties**: Use type assertions `(obj as any).property` or optional chaining `obj?.property`
2. **Import Errors**: Check if component is default or named export
3. **Type Mismatches**: Use type guards or conditional checks
4. **Undefined Values**: Add null checks or default values

## Best Practices

1. ✅ Always run `npx tsc --noEmit` before committing
2. ✅ Fix all errors in one batch, not one by one
3. ✅ Use TypeScript strict mode for better type safety
4. ✅ Add proper type definitions instead of using `any` when possible
5. ✅ Use optional chaining (`?.`) for potentially undefined values
