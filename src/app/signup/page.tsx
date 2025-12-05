"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, ArrowLeft, Mail, Lock, User, Sparkles, Zap, Crown, Users, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('trial');
  const [showPlanSelector, setShowPlanSelector] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const plans = [
    {
      id: 'trial',
      name: 'Free Trial',
      price: '₹0',
      duration: '15 days',
      features: ['All basic features', '15-day trial', 'No credit card required'],
      icon: Sparkles,
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '₹400',
      duration: '/month',
      features: ['All trial features', 'Priority support', 'Basic analytics'],
      icon: Users,
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹950',
      duration: '/month',
      features: ['Advanced features', 'AI-powered tools', 'Priority support'],
      icon: Zap,
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'ultra',
      name: 'Ultra',
      price: '₹7,833',
      duration: '/month',
      features: ['All features', 'Custom integrations', 'Dedicated support'],
      icon: Crown,
      color: 'from-amber-500 to-orange-600'
    }
  ];

  // Detect plan from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    if (plan && plans.find(p => p.id === plan)) {
      setSelectedPlan(plan);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Client-side validation
    if (!formData.name.trim() || formData.name.length < 2) {
      setError("Name must be at least 2 characters long");
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Get plan and payment token from URL if available
      const urlParams = new URLSearchParams(window.location.search);
      const plan = urlParams.get('plan');
      const paymentToken = urlParams.get('token');

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          plan: selectedPlan, // Pass selected plan
          paymentToken // Pass payment token if available
        }),
      });

      // Check if response is empty before parsing JSON
      const responseText = await response.text();
      if (!responseText) {
        throw new Error('Empty response from server');
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError, 'Response:', responseText);
        throw new Error('Invalid server response');
      }

      if (!response.ok) {
        let errorMessage = "Failed to create account";
        
        try {
          const errorData = JSON.parse(responseText);
          if (errorData.details && Array.isArray(errorData.details)) {
            // Show specific validation errors
            const validationErrors = errorData.details.map((err: any) => 
              `${err.field}: ${err.message}`
            ).join(', ');
            errorMessage = `Validation failed: ${validationErrors}`;
          } else {
            errorMessage = errorData.error || errorMessage;
          }
        } catch (parseError) {
          errorMessage = `Server error: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      setSuccess(true);
      
      // Redirect to dashboard after successful signup
      setTimeout(() => {
        router.push('/dashboard/client');
      }, 2000);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
        </div>
        
        <Card className="w-full max-w-md shadow-xl border-0 bg-white/10 backdrop-blur-xl relative z-10">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <CheckCircle className="h-16 w-16 text-green-400" />
              </motion.div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white">
                  {selectedPlan === 'trial' ? 'Trial Started Successfully!' : 'Account Created!'}
                </h2>
                <p className="text-purple-200 mt-2">
                  {selectedPlan === 'trial' 
                    ? 'Your 15-day free trial has been activated. Redirecting to dashboard...'
                    : 'Your account has been successfully created. Redirecting to dashboard...'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-10 left-10">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-6 h-6 text-purple-400 opacity-60" />
        </motion.div>
      </div>
      <div className="absolute top-32 right-16">
        <motion.div
          animate={{ y: [0, 15, 0], rotate: [0, -5, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <Zap className="w-5 h-5 text-blue-400 opacity-60" />
        </motion.div>
      </div>
      <div className="absolute bottom-20 right-32">
        <motion.div
          animate={{ y: [0, -25, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <Crown className="w-6 h-6 text-amber-400 opacity-60" />
        </motion.div>
      </div>

      {/* Back to Home Button - Bottom Left */}
      <Link href="/" className="absolute bottom-6 left-6 z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button 
            variant="outline" 
            className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </motion.div>
      </Link>

      <div className="w-full max-w-4xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding & Plan Selection */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center lg:text-left text-white"
          >
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.6, delay: 0.4, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-6 shadow-2xl"
              >
                <span className="text-2xl font-bold text-white">S</span>
              </motion.div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                Join Saanify Today
              </h1>
              
              <p className="text-xl text-purple-200 mb-6 leading-relaxed">
                Create your account and choose the perfect plan for your needs.
              </p>

              <div className="flex items-center gap-2 text-purple-200 mb-6">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-sm">Start with a 15-day free trial, no credit card required</span>
              </div>
            </div>

            {/* Plan Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-purple-400" />
                  Choose Your Plan
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPlanSelector(!showPlanSelector)}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {showPlanSelector ? 'Hide' : 'Change'} Plan
                </Button>
              </div>
              
              {showPlanSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  {plans.map((plan) => {
                    const Icon = plan.icon;
                    return (
                      <motion.div
                        key={plan.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSelectedPlan(plan.id);
                          setShowPlanSelector(false);
                          toast.success('✅ Plan Updated', {
                            description: `Selected ${plan.name} plan`,
                            duration: 2000,
                          });
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          selectedPlan === plan.id
                            ? 'bg-white/20 border-white/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white">{plan.name}</h4>
                              <p className="text-sm text-purple-200">{plan.features[0]}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-white">{plan.price}</div>
                            <div className="text-xs text-purple-200">{plan.duration}</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {!showPlanSelector && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  {(() => {
                    const currentPlan = plans.find(p => p.id === selectedPlan);
                    const Icon = currentPlan?.icon || Sparkles;
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 bg-gradient-to-r ${currentPlan?.color} rounded-xl flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-white">{currentPlan?.name}</h4>
                            <p className="text-sm text-purple-200">{currentPlan?.features[0]}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">{currentPlan?.price}</div>
                          <div className="text-xs text-purple-200">{currentPlan?.duration}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </motion.div>

            {/* Features List */}
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Secure authentication system" },
                { icon: Users, text: "Access to premium features" },
                { icon: Zap, text: "Instant account activation" }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-3 text-purple-200"
                >
                  <feature.icon className="w-5 h-5 text-purple-400" />
                  <span>{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Signup Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-0 shadow-2xl">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-bold text-white">
                  Create Account
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Join {plans.find(p => p.id === selectedPlan)?.name} plan today
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="bg-red-500/20 border-red-500/50">
                      <AlertDescription className="text-white">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white font-medium">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={isLoading}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-white font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        disabled={isLoading}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300 focus:border-purple-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white font-medium">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-purple-300" />
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        minLength={6}
                        disabled={isLoading}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder-purple-300 focus:border-purple-400"
                      />
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full py-3 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 transform hover:scale-105" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-purple-200">
                      Already have an account?{" "}
                      <Link href="/login" className="font-medium text-purple-300 hover:text-white transition-colors">
                        Sign in
                      </Link>
                    </p>
                  </div>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}