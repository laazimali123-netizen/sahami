'use client';

import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Building2, Loader2, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface SchoolOption {
  id: string;
  name: string;
}

export default function AdminSchoolCreate() {
  const navigate = useStore((s) => s.navigate);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', plan: 'BASIC',
    managerName: '', managerEmail: '', managerPassword: '',
  });
  const [schools, setSchools] = useState<SchoolOption[]>([]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Load existing schools for reference
  useEffect(() => {
    fetch('/api/schools').then(r => r.json()).then(d => setSchools(d.schools || [])).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.managerName || !form.managerEmail || !form.managerPassword) {
      toast.error('All required fields must be filled');
      return;
    }
    if (form.managerPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create school');
        return;
      }
      toast.success(`"${form.name}" created successfully!`);
      navigate('admin-schools');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('admin-schools')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Create New School</h2>
          <p className="text-muted-foreground">Set up a new school and assign a manager</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* School Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-5 w-5 text-emerald-600" />
              School Information
            </CardTitle>
            <CardDescription>Basic details for the new school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">School Name *</Label>
                <Input id="name" placeholder="Springfield Academy" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan">Subscription Plan *</Label>
                <Select value={form.plan} onValueChange={(v) => handleChange('plan', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASIC">BASIC — Free (100 students, 20 teachers)</SelectItem>
                    <SelectItem value="PRO">PRO — $29/mo (500 students, 50 teachers)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sEmail">School Email</Label>
                <Input id="sEmail" type="email" placeholder="info@school.edu" value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sPhone">School Phone</Label>
                <Input id="sPhone" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manager Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manager Account</CardTitle>
            <CardDescription>Create the primary owner/manager for this school</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mName">Manager Full Name *</Label>
              <Input id="mName" placeholder="John Smith" value={form.managerName} onChange={(e) => handleChange('managerName', e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mEmail">Manager Email *</Label>
                <Input id="mEmail" type="email" placeholder="admin@school.edu" value={form.managerEmail} onChange={(e) => handleChange('managerEmail', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mPass">Password *</Label>
                <Input id="mPass" type="password" placeholder="Min 6 characters" value={form.managerPassword} onChange={(e) => handleChange('managerPassword', e.target.value)} required minLength={6} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('admin-schools')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create School & Manager
          </Button>
        </div>
      </form>
    </div>
  );
}
