"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // Detect plan from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan');
    if (plan) {
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
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
          plan, // Pass plan if available (trial, basic, etc.)
          paymentToken // Pass payment token if available
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Card className="w-full max-w-md shadow-xl border-0">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <CheckCircle className="h-16 w-16 text-green-500" />
              </motion.div>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedPlan === 'trial' ? 'Trial Started Successfully!' : 'Account Created!'}
                </h2>
                <p className="text-gray-600 mt-2">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Plan indicator */}
        {selectedPlan === 'trial' && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-3 rounded-xl text-center font-semibold shadow-lg">
              🚀 Starting 15-Day Free Trial - No Credit Card Required
            </div>
          </motion.div>
        )}
        
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-2 pb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-2xl">🏢</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {selectedPlan === 'trial' ? 'Start Your Free Trial' : 'Create your account'}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {selectedPlan === 'trial' 
                  ? 'Sign up to experience all premium features free for 15 days'
                  : 'Enter your information to get started'
                }
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full py-3 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {selectedPlan === 'trial' ? 'Starting Trial...' : 'Creating Account...'}
                  </>
                ) : (
                  selectedPlan === 'trial' ? 'Start Free Trial' : 'Create Account'
                )}
              </Button>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                    Sign in
                  </Link>
                </p>
              </div>
              
              <div className="text-center">
                <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}