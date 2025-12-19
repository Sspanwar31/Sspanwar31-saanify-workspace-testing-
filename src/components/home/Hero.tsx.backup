'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, useSpring, useInView } from 'framer-motion'
import { Play, ArrowRight, TrendingUp, Users, Shield, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface CounterProps {
  value: number
  suffix?: string
  label: string
  delay: number
}

function Counter({ value, suffix = '', label, delay }: CounterProps) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => setIsVisible(true), delay)
      return () => clearTimeout(timer)
    }
  }, [isInView, delay])

  useEffect(() => {
    if (!isVisible) return

    let start = 0
    const end = value
    const duration = 2000
    const increment = end / (duration / 16)

    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [isVisible, value])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.6, delay: delay / 1000 }}
      className="text-center"
    >
      <div className="flex items-center justify-center gap-1 mb-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        <span className="text-2xl font-bold text-foreground">
          +{count}{suffix}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </motion.div>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
  shadowColor: string
  floatDuration: number
  floatDelay: number
  onClick?: () => void
  children?: React.ReactNode
}

function FeatureCard({ icon, title, description, gradient, shadowColor, floatDuration, floatDelay, onClick, children }: FeatureCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Motion values for 3D tilt effect
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)
  
  // Spring physics for smooth tilt
  const springConfig = { damping: 25, stiffness: 300 }
  const rotateXSpring = useSpring(rotateX, springConfig)
  const rotateYSpring = useSpring(rotateY, springConfig)

  // Transform values for 3D effect
  const transformX = useTransform(rotateXSpring, (value) => `${value}deg`)
  const transformY = useTransform(rotateYSpring, (value) => `${value}deg`)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return
    
    const rect = event.currentTarget.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const x = event.clientX - centerX
    const y = event.clientY - centerY
    
    const rotateXValue = (y / (rect.height / 2)) * -10
    const rotateYValue = (x / (rect.width / 2)) * 10
    
    rotateX.set(rotateXValue)
    rotateY.set(rotateYValue)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    setIsHovered(false)
  }

  return (
    <motion.div
      className="relative"
      animate={{ 
        y: [0, -10, 0],
      }}
      transition={{ 
        duration: floatDuration, 
        repeat: Infinity, 
        repeatType: "reverse", 
        ease: "easeInOut", 
        delay: floatDelay 
      }}
      whileHover={!isMobile ? {
        scale: 1.05,
        z: 50,
      } : {}}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: !isMobile ? `perspective(1000px) rotateX(${transformX}) rotateY(${transformY})` : 'none',
        transformStyle: 'preserve-3d',
      }}
    >
      <div className={`
        relative rounded-2xl p-6 bg-gradient-to-br ${gradient} 
        shadow-xl ${shadowColor} 
        transition-all duration-300 cursor-pointer
        ${isHovered ? 'shadow-2xl' : ''}
        backdrop-blur-sm border border-white/20
      `}>
        {/* Glow effect on hover */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-30"
            style={{
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 70%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 0.3 }}
          />
        )}
        
        <div className="relative z-10">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/20 backdrop-blur-sm mb-4">
            {icon}
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-white/90 text-sm leading-relaxed">{description}</p>
          
          {children && (
            <div className="mt-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function Hero() {
  const handleStartTrial = () => {
    toast.success("🎉 Trial Started!", {
      description: "Welcome to Saanify! Your 15-day free trial has begun.",
      duration: 5000,
    })
    // Redirect to signup page for trial users
    setTimeout(() => {
      window.location.href = '/signup'
    }, 1000)
  }

  const handleWatchDemo = () => {
    toast.info("🎥 Demo Video", {
      description: "Demo video will start playing in a new window.",
      duration: 3000,
    })
    // In a real app, this would open a modal or navigate to demo page
    setTimeout(() => {
      window.open('#demo', '_blank')
    }, 1000)
  }

  const handleFeatureClick = (featureName: string) => {
    toast.success(`✨ ${featureName}`, {
      description: "Learn more about this feature in our dashboard.",
      duration: 3000,
    })
    // Redirect to signup to explore features
    setTimeout(() => {
      window.location.href = '/signup'
    }, 1000)
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-sky-50/10 to-sky-100/10 dark:from-background dark:via-sky-950/50 dark:to-sky-900/50">
      {/* Blurred Light Orbs for Depth */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-sky-400 rounded-full blur-3xl opacity-20 dark:opacity-30" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-400 rounded-full blur-3xl opacity-20 dark:opacity-30" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-300 rounded-full blur-3xl opacity-15 dark:opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 dark:bg-primary/20"
            >
              ⚡ AI-Powered Society Management
            </motion.div>
            
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Effortless Society Management,
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
                Guaranteed Growth.
              </span>
            </h1>
            
            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed"
            >
              Experience complete transparency in deposits, member management, and financial operations. 
              All-in-one platform designed for modern societies.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={handleStartTrial}
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Start Your 15-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => window.location.href = '/login'}
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground font-semibold px-8 py-4 text-lg rounded-xl transition-all duration-300"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Sign In Now
                </Button>
              </motion.div>
            </motion.div>

            {/* Counters */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              <Counter value={12} suffix="+" label="Total Societies" delay={1000} />
              <Counter value={45.2} suffix="K" label="Happy Members" delay={1200} />
              <Counter value={1247} suffix="" label="Events Managed" delay={1400} />
              <Counter value={2.4} suffix="M" label="Revenue Processed" delay={1600} />
            </motion.div>
          </motion.div>

          {/* Right Side - 3D Floating Cards */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="grid grid-cols-1 gap-6">
              <FeatureCard
                icon={<Users className="h-6 w-6 text-white" />}
                title="Active Members"
                description="Connect with 45,000+ happy members across 12+ societies seamlessly."
                gradient="from-sky-400 to-blue-600"
                shadowColor="shadow-[0_8px_30px_rgba(14,165,233,0.3)]"
                floatDuration={5}
                floatDelay={0}
                onClick={() => handleFeatureClick("Active Members")}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="flex items-center justify-center text-white font-bold text-lg"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  +45.2K
                </motion.div>
              </FeatureCard>

              <FeatureCard
                icon={<Shield className="h-6 w-6 text-white" />}
                title="Secure & Protected"
                description="Bank-level security with encrypted transactions and data protection."
                gradient="from-emerald-400 to-green-600"
                shadowColor="shadow-[0_8px_30px_rgba(16,185,129,0.3)]"
                floatDuration={4.5}
                floatDelay={0.5}
                onClick={() => handleFeatureClick("Security")}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                  className="flex items-center justify-center text-white font-bold text-lg"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  256-bit SSL
                </motion.div>
              </FeatureCard>

              <FeatureCard
                icon={<Activity className="h-6 w-6 text-white" />}
                title="Transaction Flow"
                description="Process $2.4M+ revenue with real-time tracking and analytics."
                gradient="from-violet-400 to-indigo-600"
                shadowColor="shadow-[0_8px_30px_rgba(139,92,246,0.3)]"
                floatDuration={6}
                floatDelay={1}
                onClick={() => handleFeatureClick("Transactions")}
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.4 }}
                  className="flex items-center justify-center text-white font-bold text-lg"
                >
                  <Activity className="h-4 w-4 mr-1" />
                  $2.4M+
                </motion.div>
              </FeatureCard>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}