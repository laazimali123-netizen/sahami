'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useStore((s) => s.navigate);
  const setSession = useStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Login failed');
        return;
      }
      setSession(data.session);
      toast.success('Welcome back!');
    } catch {
      toast.error('Network error. Please try again.');
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
          <p className="text-muted-foreground">Sign in to your school dashboard</p>
        </div>

        <Card className="shadow-lg border-0 shadow-emerald-100/50">
          <form onSubmit={handleLogin}>
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Welcome Back</CardTitle>
              <CardDescription>Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@sahami.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-muted/60 p-3 text-sm">
                <p className="font-medium text-muted-foreground mb-1">Demo Credentials</p>
                <p className="text-foreground font-mono text-xs">Super Admin: admin@sahami.com / admin123</p>
                <p className="text-foreground font-mono text-xs mt-0.5">Owner: owner@alnoor.edu / owner123</p>
                <p className="text-foreground font-mono text-xs mt-0.5">Manager: manager@alnoor.edu / manager123</p>
                <p className="text-foreground font-mono text-xs mt-0.5">Teacher: teacher@alnoor.edu / teacher123</p>
                <p className="text-foreground font-mono text-xs mt-0.5">Finance: finance@alnoor.edu / finance123</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In
              </Button>
              <p className="text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <button type="button" className="text-emerald-600 hover:underline font-medium" onClick={() => navigate('register')}>
                  Register now
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
