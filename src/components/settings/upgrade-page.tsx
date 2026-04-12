'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sparkles, Clock, CheckCircle2, Loader2, ArrowLeft,
  CreditCard, Smartphone, Building, Gift, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const PRO_PRICE = '1,500';

export default function UpgradePage() {
  const session = useStore((s) => s.session);
  const navigate = useStore((s) => s.navigate);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [schoolData, setSchoolData] = useState<any>(null);

  const [form, setForm] = useState({
    method: '',
    contactInfo: '',
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.school) setSchoolData(data.school);
      } catch { /* empty */ }
    }
    if (session?.schoolId) loadSettings();
  }, [session?.schoolId]);

  // Calculate trial status
  const trialStart = schoolData?.trialStart ? new Date(schoolData.trialStart) : null;
  const isTrialActive = trialStart
    ? (Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24) <= 30
    : false;
  const trialDaysLeft = trialStart
    ? Math.max(0, 30 - Math.floor((Date.now() - trialStart.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isPro = session?.schoolPlan === 'PRO';
  const needsUpgrade = !isPro && !isTrialActive;

  const paymentMethods = [
    { id: 'EBIRR', label: 'Telebirr (Ebirr)', icon: Smartphone, color: 'text-green-600' },
    { id: 'KAAFII', label: 'Kaafi', icon: CreditCard, color: 'text-amber-600' },
    { id: 'CBE', label: 'CBE (Commercial Bank of Ethiopia)', icon: Building, color: 'text-blue-600' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.method || !form.contactInfo.trim()) {
      toast.error('Please select a payment method and enter your contact info');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/payments/proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: 'PRO',
          amount: 1500,
          method: form.method,
          contactInfo: form.contactInfo.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit payment proof');
        return;
      }
      setSubmitted(true);
      toast.success('Payment proof submitted! We will review it shortly.');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const paymentAccounts: Record<string, { account: string; name: string }> = {
    EBIRR: { account: '0911223344', name: 'SAHAMI Admin' },
    KAAFII: { account: '0911223344', name: 'SAHAMI Admin' },
    CBE: { account: '1000123456789', name: 'SAHAMI Technology PLC' },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('settings')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Upgrade Plan</h2>
          <p className="text-sm text-muted-foreground">Manage your subscription</p>
        </div>
      </div>

      {/* Current Status Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isPro ? 'bg-amber-100' : isTrialActive ? 'bg-emerald-100' : 'bg-muted'}`}>
                {isPro ? (
                  <Sparkles className="h-6 w-6 text-amber-600" />
                ) : isTrialActive ? (
                  <Gift className="h-6 w-6 text-emerald-600" />
                ) : (
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-semibold text-lg">
                  {isPro ? 'PRO Plan' : isTrialActive ? 'PRO Trial' : 'BASIC Plan'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isPro
                    ? 'All features unlocked'
                    : isTrialActive
                      ? `Free trial - ${trialDaysLeft} days remaining`
                      : 'Limited features'}
                </p>
              </div>
            </div>
            <Badge className={isPro ? 'bg-amber-100 text-amber-700' : isTrialActive ? 'bg-emerald-100 text-emerald-700' : 'bg-muted text-muted-foreground'}>
              {isPro ? 'ACTIVE' : isTrialActive ? 'TRIAL' : 'BASIC'}
            </Badge>
          </div>

          {/* Trial countdown bar */}
          {isTrialActive && !isPro && (
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Trial period</span>
                <span className="text-emerald-600 font-medium">{trialDaysLeft} days left</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(trialDaysLeft / 30) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Trial expired warning */}
          {!isPro && !isTrialActive && trialStart && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mt-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-700">
                Your 30-day free trial has expired. Upgrade to PRO to keep using Finance, Messaging, and Advanced Reports.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PRO Features Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">PRO Plan Features</CardTitle>
          <CardDescription>Everything you need to run your school efficiently</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Finance & Fee Management',
              'Staff Messaging',
              'Advanced Reports & Analytics',
              'Up to 500 Students',
              'Up to 50 Teachers',
              'Priority Support',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-emerald-600">{PRO_PRICE} ETB</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Already PRO */}
      {isPro && (
        <Card>
          <CardContent className="p-6 text-center">
            <Sparkles className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="font-semibold text-lg">You are on the PRO plan!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enjoy all premium features. Thank you for choosing SAHAMI.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Trial Active - No need to upgrade yet */}
      {isTrialActive && !isPro && !submitted && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-emerald-600" />
              <p className="font-semibold">Your trial is active!</p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              You have <strong>{trialDaysLeft} days</strong> remaining in your free PRO trial.
              Upgrade now to avoid losing access to premium features.
            </p>
            <Button
              onClick={() => setSubmitted(true)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Upgrade Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Form - shown when upgrade is needed or user clicks upgrade */}
      {(needsUpgrade || (isTrialActive && submitted)) && !isPro && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upgrade to PRO</CardTitle>
            <CardDescription>
              {PRO_PRICE} ETB/month — Pay using one of the methods below
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="flex items-center gap-2">
                            <m.icon className={`h-4 w-4 ${m.color}`} />
                            {m.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {form.method && (
                  <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
                    <p className="text-sm font-medium">Send payment to:</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold">
                          {paymentAccounts[form.method]?.account}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {paymentAccounts[form.method]?.name}
                        </p>
                      </div>
                      <Badge variant="outline">{form.method}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Amount: <strong>{PRO_PRICE} ETB</strong> for PRO plan
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="contactInfo">Your Contact Info</Label>
                  <Input
                    id="contactInfo"
                    placeholder="Phone number or email used for payment"
                    value={form.contactInfo}
                    onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the phone number or email you used to send the payment
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 font-semibold"
                  disabled={loading || !form.method}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Submitting...' : 'I Have Sent the Payment'}
                </Button>
              </form>
            ) : (
              <div className="text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">Proof Submitted!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Thank you! Your payment proof has been submitted. Our team will review it within 24 hours.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border text-left space-y-2">
                  <p className="text-sm font-medium">What happens next:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>1. We verify your payment (usually within 24 hours)</li>
                    <li>2. Your account will be upgraded to PRO</li>
                    <li>3. You will get a notification once approved</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
