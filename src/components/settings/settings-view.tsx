'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, School, Loader2, Sparkles, Users, GraduationCap, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

function PasswordStrengthMeter({ password }: { password: string }) {
  const getStrength = (pw: string) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { score: 20, label: 'Weak', color: 'bg-red-500' };
    if (score <= 2) return { score: 40, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 3) return { score: 60, label: 'Good', color: 'bg-amber-500' };
    if (score <= 4) return { score: 80, label: 'Strong', color: 'bg-emerald-500' };
    return { score: 100, label: 'Very Strong', color: 'bg-emerald-600' };
  };

  const { score, label, color } = getStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Strength</span>
        <span className={label === 'Weak' ? 'text-red-500' : label === 'Fair' ? 'text-orange-500' : 'text-emerald-600'}>
          {label}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function SettingsView() {
  const store = useStore();
  const session = store.session;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', address: '', phone: '', email: '', academicYear: '',
  });
  const [stats, setStats] = useState<any>(null);

  // Password change state
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [sRes, dRes] = await Promise.all([
          fetch('/api/settings'),
          fetch('/api/dashboard'),
        ]);
        const sData = await sRes.json();
        const dData = await dRes.json();
        if (sData.school) {
          setForm({
            name: sData.school.name || '',
            address: sData.school.address || '',
            phone: sData.school.phone || '',
            email: sData.school.email || '',
            academicYear: sData.school.academicYear || '',
          });
        } else {
          setForm({ name: session?.schoolName || '', address: '', phone: '', email: session?.email || '', academicYear: '2024-2025' });
        }
        if (dData.totalStudents !== undefined) {
          setStats({
            totalStudents: dData.totalStudents || 0,
            totalTeachers: dData.totalTeachers || 0,
          } as any);
        }
        if (sData.usage) {
          setStats(prev => ({
            ...prev,
            totalStudents: sData.usage.students,
            totalTeachers: sData.usage.teachers,
          } as any));
        }
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save settings');
        return;
      }
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPw !== pwForm.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPw.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.newPw }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to change password');
        return;
      }
      toast.success('Password changed successfully');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch {
      toast.error('Network error');
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const isPro = session?.schoolPlan === 'PRO';
  const isOwner = session?.role === 'OWNER' || session?.role === 'MANAGER';
  const studentCount = stats?.totalStudents || 0;
  const teacherCount = stats?.totalTeachers || 0;
  const studentLimit = isPro ? 999 : 100;
  const teacherLimit = isPro ? 999 : 20;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your school information and account settings</p>
      </div>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Change Password</CardTitle>
          </div>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={pwForm.current}
                  onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={pwForm.newPw}
                  onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrengthMeter password={pwForm.newPw} />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={pwForm.confirm}
                  onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {pwForm.confirm && pwForm.newPw !== pwForm.confirm && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={pwLoading}>
              {pwLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Plan Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isPro ? 'bg-amber-100' : 'bg-muted'}`}>
                <Sparkles className={`h-5 w-5 ${isPro ? 'text-amber-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="font-semibold">Current Plan</p>
                <p className="text-sm text-muted-foreground">
                  {isPro ? 'PRO — 1,500 ETB/month' : 'BASIC — Free'}
                </p>
              </div>
            </div>
            <Badge className={isPro ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
              {session?.schoolPlan || 'BASIC'}
            </Badge>
          </div>
          {!isPro && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm font-medium text-amber-800 mb-1">Upgrade to PRO</p>
              <p className="text-xs text-amber-700 mb-3">Get access to Finance, Messaging, Advanced Reports, and unlimited students & teachers.</p>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={() => store.navigate('upgrade')}>Upgrade Now</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage</CardTitle>
          <CardDescription>Your current resource usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground" /> Students</span>
              <span className="font-medium">{studentCount} / {studentLimit === 999 ? '∞' : studentLimit}</span>
            </div>
            <Progress value={(studentCount / studentLimit) * 100} className="h-2" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Teachers</span>
              <span className="font-medium">{teacherCount} / {teacherLimit === 999 ? '∞' : teacherLimit}</span>
            </div>
            <Progress value={(teacherCount / teacherLimit) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* School Info Form (OWNER/MANAGER only) */}
      {isOwner && (
        <form onSubmit={handleSave}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">School Information</CardTitle>
              <CardDescription>Update your school&apos;s basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>School Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Springfield Academy" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@school.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 School Lane, City" />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2024-2025" />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end mt-6">
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Settings
            </Button>
          </div>
        </form>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Account Holder</span>
            <span className="font-medium">{session?.name}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{session?.email}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline">{session?.role}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
