# 🔒 Preventing "Maximum Update Depth Exceeded" Errors

This guide covers the most common patterns that cause infinite re-render loops in React and how to fix them.

## 🚨 Common Causes & Solutions

### 1. **Missing Dependency Array**
```tsx
// ❌ BAD - Runs on every render
useEffect(() => {
  setState(prev => prev + 1)
})

// ✅ GOOD - Runs only once
useEffect(() => {
  setState(prev => prev + 1)
}, []) // Empty dependency array
```

### 2. **Circular Dependencies**
```tsx
// ❌ BAD - state changes trigger effect again
useEffect(() => {
  setUser({ ...user, name: 'John' })
}, [user]) // user changes → effect runs → user changes

// ✅ GOOD - Use functional updates
useEffect(() => {
  setUser(prev => ({ ...prev, name: 'John' }))
}, []) // No user dependency needed
```

### 3. **Object/Array Recreation**
```tsx
// ❌ BAD - New object created on every render
const config = { theme: 'dark' }
useEffect(() => {
  applyTheme(config)
}, [config]) // config is always new

// ✅ GOOD - Use useMemo
const config = useMemo(() => ({ theme: 'dark' }), [])
useEffect(() => {
  applyTheme(config)
}, [config])
```

### 4. **Function Recreation**
```tsx
// ❌ BAD - New function on every render
const handleSubmit = () => {
  submit(data)
}
useEffect(() => {
  setupForm(handleSubmit)
}, [handleSubmit])

// ✅ GOOD - Use useCallback
const handleSubmit = useCallback(() => {
  submit(data)
}, [data])
useEffect(() => {
  setupForm(handleSubmit)
}, [handleSubmit])
```

## 🛠️ Utility Hooks (useEffectSafe.ts)

### Basic Safe Effect
```tsx
import { useEffectSafe } from '@/hooks/useEffectSafe'

useEffectSafe(() => {
  // Your effect logic
  console.log('Effect runs only when dependencies actually change')
}, [dependency1, dependency2])
```

### API Calls with Prevention
```tsx
import { useEffectApi } from '@/hooks/useEffectSafe'

useEffectApi(
  () => fetch('/api/data').then(res => res.json()),
  [userId], // Dependencies
  (data) => setData(data), // Success callback
  (error) => setError(error.message), // Error callback
  { enabled: !!userId, retryCount: 3 } // Options
)
```

### Debounced Effects
```tsx
import { useEffectDebounced } from '@/hooks/useEffectSafe'

useEffectDebounced(() => {
  searchAPI(query)
}, [query], 500) // 500ms delay
```

### Conditional Effects
```tsx
import { useEffectConditional } from '@/hooks/useEffectSafe'

useEffectConditional(
  () => user?.role === 'admin',
  () => loadAdminData(),
  [user]
)
```

## 🎯 Specific Patterns in Your Codebase

### Auth Provider Pattern
```tsx
// ✅ Fixed pattern - using functional state updates
setUser(prevUser => {
  const hasChanged = !prevUser || prevUser.id !== newUser.id
  return hasChanged ? newUser : prevUser
})
```

### Animation Pattern
```tsx
// ✅ Fixed pattern - prevent re-animations
const [hasAnimated, setHasAnimated] = useState(false)

useEffect(() => {
  if (hasAnimated || !isInView) return
  
  animate()
  setHasAnimated(true)
}, [value, isInView, hasAnimated])
```

### Subscription Redirect Pattern
```tsx
// ✅ Fixed pattern - prevent redirect loops
const isRedirectingRef = useRef(false)

useEffect(() => {
  if (isRedirectingRef.current) return
  
  if (needsRedirect) {
    isRedirectingRef.current = true
    router.push('/new-path')
    
    setTimeout(() => {
      isRedirectingRef.current = false
    }, 1000)
  }
}, [needsRedirect])
```

## 🔍 Debugging Checklist

When you encounter "Maximum update depth exceeded":

1. **Check dependency arrays**: Are you missing `[]` or including unstable references?
2. **Look for state updates**: Are you calling setState inside useEffect?
3. **Check object/array creation**: Are dependencies being recreated?
4. **Look for router redirects**: Can they cause component remounts?
5. **Check API calls**: Can they trigger state updates that re-run effects?

## 🚀 Quick Fix Template

```tsx
// Template for fixing infinite loops
useEffect(() => {
  // 1. Add guards
  if (isProcessingRef.current) return
  if (!dependency) return
  
  // 2. Set processing flag
  isProcessingRef.current = true
  
  // 3. Use functional updates
  setState(prev => {
    // 4. Check if update is needed
    if (prev === newValue) return prev
    return newValue
  })
  
  // 5. Cleanup
  return () => {
    isProcessingRef.current = false
  }
}, [dependency]) // Stable dependencies only
```

## 📞 Need Help?

If you're still experiencing issues, check:
1. React DevTools Profiler for component re-renders
2. Console logs for repeated effect executions
3. Network tab for repeated API calls
4. Component mounting/unmounting cycles