'use client';

import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak — add uppercase, numbers, or symbols', color: 'bg-red-500', textColor: 'text-red-500' };
  if (score === 2) return { score: 2, label: 'Fair — consider making it longer', color: 'bg-amber-500', textColor: 'text-amber-500' };
  if (score === 3) return { score: 3, label: 'Good — almost there!', color: 'bg-emerald-400', textColor: 'text-emerald-500' };
  return { score: 4, label: 'Strong — excellent password!', color: 'bg-emerald-500', textColor: 'text-emerald-600' };
}

export default function RegisterPage() {
  const navigate = useStore((s) => s.navigate);
  const viewParams = useStore((s) => s.viewParams);
  const setSession = useStore((s) => s.setSession);

  const [form, setForm] = useState({
    schoolName: '',
    managerName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'email') {
      setEmailStatus('idle');
    }
  };

  // Real-time email duplicate check
  const checkEmailAvailability = useCallback(async (email: string) => {
    if (!email || !email.includes('@') || email.length < 5) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    try {
      const res = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setEmailStatus(data.available ? 'available' : 'taken');
      } else {
        setEmailStatus('idle');
      }
    } catch {
      setEmailStatus('idle');
    }
  }, []);

  const handleEmailBlur = () => {
    if (form.email) {
      checkEmailAvailability(form.email);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!form.schoolName.trim()) {
      toast.error('School name is required');
      return;
    }
    if (!form.managerName.trim()) {
      toast.error('Your full name is required');
      return;
    }
    if (!form.email.trim() || !form.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (emailStatus === 'taken') {
      toast.error('This email is already registered. Please use a different email or sign in.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: form.schoolName.trim(),
          managerName: form.managerName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          plan: 'BASIC',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Handle duplicate email from server
        if (res.status === 409) {
          setEmailStatus('taken');
          toast.error(data.error || 'This email is already taken. Please use a different email address to register.');
        } else {
          toast.error(data.error || 'Registration failed. Please try again.');
        }
        return;
      }

      setSession(data.session);
      toast.success('School created successfully! Welcome to SAHAMI!');
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-background to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/sahami-logo.png" alt="SAHAMI" className="h-12 w-12 rounded-xl shadow-md" />
            <span className="text-3xl font-bold tracking-tight">SAHAMI</span>
          </div>
          <p className="text-muted-foreground">Create your school account</p>
        </div>

        <Card className="shadow-lg border-0 shadow-emerald-100/50">
          <form onSubmit={handleRegister}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Get Started</CardTitle>
              <CardDescription>Set up your school in just a few steps. You will be the school owner.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* School Name */}
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  placeholder="Springfield Academy"
                  value={form.schoolName}
                  onChange={(e) => handleChange('schoolName', e.target.value)}
                  required
                />
              </div>

              {/* Manager Name */}
              <div className="space-y-2">
                <Label htmlFor="managerName">Your Full Name (School Owner)</Label>
                <Input
                  id="managerName"
                  placeholder="John Smith"
                  value={form.managerName}
                  onChange={(e) => handleChange('managerName', e.target.value)}
                  required
                />
              </div>

              {/* Email with live validation */}
              <div className="space-y-2">
                <Label htmlFor="regEmail">Email Address</Label>
                <div className="relative">
                  <Input
                    id="regEmail"
                    type="email"
                    placeholder="admin@school.com"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={handleEmailBlur}
                    required
                    className={emailStatus === 'taken' ? 'border-red-500 focus-visible:ring-red-500' : emailStatus === 'available' ? 'border-emerald-500 focus-visible:ring-emerald-500' : ''}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {emailStatus === 'checking' && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
                    {emailStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {emailStatus === 'taken' && <XCircle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
                {emailStatus === 'taken' && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>This email is already registered. Please <button type="button" className="underline font-medium hover:text-red-700" onClick={() => navigate('login')}>sign in</button> or use a different email.</span>
                  </div>
                )}
                {emailStatus === 'available' && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>This email is available!</span>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="regPassword">Password</Label>
                <div className="relative">
                  <Input
                    id="regPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Password Strength Meter */}
                {form.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className={cn(
                          'h-1.5 flex-1 rounded-full transition-colors',
                          i <= getPasswordStrength(form.password).score
                            ? getPasswordStrength(form.password).color
                            : 'bg-muted'
                        )} />
                      ))}
                    </div>
                    <p className={cn('text-xs', getPasswordStrength(form.password).textColor)}>
                      {getPasswordStrength(form.password).label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="regConfirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="regConfirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    required
                    minLength={6}
                    className={cn(form.confirmPassword && form.confirmPassword !== form.password ? 'border-red-500' : '', form.confirmPassword && form.confirmPassword === form.password && form.confirmPassword.length > 0 ? 'border-emerald-500' : '')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.password && (
                  <p className="text-sm text-red-600">Passwords do not match</p>
                )}
                {form.confirmPassword && form.confirmPassword === form.password && form.confirmPassword.length > 0 && (
                  <p className="text-sm text-emerald-600">Passwords match</p>
                )}
              </div>

              {/* Free Trial Info */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">Start with a free 30-day PRO trial</p>
                  <p className="text-xs text-emerald-700 mt-0.5">No credit card required. Get full access to all PRO features for 30 days.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" disabled={loading || emailStatus === 'taken'}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Creating Your School...' : 'Create School Account'}
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button type="button" className="text-emerald-600 hover:underline font-medium" onClick={() => navigate('login')}>
                  Sign in
                </button>
              </p>
            </CardFooter>
          </form>
        </Card>

        <button
          type="button"
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => navigate('landing')}
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
}
