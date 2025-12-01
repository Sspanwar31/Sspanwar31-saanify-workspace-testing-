import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SubscriptionStatus {
  plan: string
  status: string
  trialEndsAt?: string
  subscriptionEndsAt?: string
  daysRemaining?: number
}

export function useSubscriptionRedirect() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)

  useEffect(() => {
    let isMounted = true
    
    const checkSubscriptionAndRedirect = async () => {
      if (!isMounted) return
      
      try {
        // Get current path
        const currentPath = window.location.pathname
        
        // Skip redirect for public pages and auth pages
        const publicPaths = [
          '/',
          '/login',
          '/auth/signup',
          '/subscription/select-plan',
          '/subscription/payment-upload'
        ]
        
        if (publicPaths.some(path => currentPath.startsWith(path))) {
          if (isMounted) setIsLoading(false)
          return
        }

        // Check if user is authenticated
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]

        if (!token) {
          // Redirect to subscription selection if not authenticated
          if (!currentPath.startsWith('/login') && !currentPath.startsWith('/auth/')) {
            if (isMounted) router.push('/subscription/select-plan')
          }
          if (isMounted) setIsLoading(false)
          return
        }

        // Fetch subscription status
        const response = await fetch('/api/client/subscription', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (isMounted) setSubscriptionStatus(data)
          
          // Apply redirection logic
          if (isMounted) applyRedirectionLogic(data, currentPath, router)
        } else {
          // If failed to get subscription, redirect to subscription selection
          if (isMounted) router.push('/subscription/select-plan')
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        // On error, redirect to subscription selection
        if (isMounted) router.push('/subscription/select-plan')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    checkSubscriptionAndRedirect()
    
    return () => {
      isMounted = false
    }
  }, [])

  const applyRedirectionLogic = (
    subscription: SubscriptionStatus,
    currentPath: string,
    router: ReturnType<typeof useRouter>
  ) => {
    const { status, daysRemaining } = subscription

    // If user is on subscription-related pages, allow access
    if (currentPath.includes('/subscription') || currentPath.includes('/payment-upload')) {
      return
    }

    // If trial is active
    if (status === 'TRIAL' && daysRemaining && daysRemaining > 0) {
      // Allow access to dashboard
      if (currentPath === '/' || currentPath === '/subscription/select-plan') {
        router.push('/client/dashboard')
      }
      return
    }

    // If payment is pending
    if (status === 'PENDING_PAYMENT') {
      if (!currentPath.includes('/client/subscription')) {
        router.push('/client/subscription')
      }
      return
    }

    // If subscription is active
    if (status === 'ACTIVE') {
      // Allow access to dashboard
      if (currentPath === '/' || currentPath === '/subscription/select-plan') {
        router.push('/client/dashboard')
      }
      return
    }

    // If trial is expired or no valid subscription
    if (status === 'EXPIRED' || (status === 'TRIAL' && daysRemaining !== undefined && daysRemaining <= 0)) {
      router.push('/subscription/select-plan')
      return
    }
  }

  return {
    isLoading,
    subscriptionStatus,
    checkSubscriptionAndRedirect
  }
}

export function useRequireSubscription() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const checkSubscription = async () => {
      if (!isMounted) return
      
      try {
        // Check if user is authenticated
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]

        if (!token) {
          if (isMounted) router.push('/subscription/select-plan')
          return
        }

        // Fetch subscription status
        const response = await fetch('/api/client/subscription', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (isMounted) router.push('/subscription/select-plan')
          return
        }

        const data = await response.json()
        const { status, daysRemaining } = data

        // Check if user has valid subscription
        const hasValidSubscription = 
          status === 'ACTIVE' || 
          (status === 'TRIAL' && daysRemaining && daysRemaining > 0) ||
          status === 'PENDING_PAYMENT'

        if (hasValidSubscription) {
          if (isMounted) setIsAuthorized(true)
        } else {
          if (isMounted) router.push('/subscription/select-plan')
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        if (isMounted) router.push('/subscription/select-plan')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    checkSubscription()
    
    return () => {
      isMounted = false
    }
  }, [])

  return {
    isAuthorized,
    isLoading
  }
}