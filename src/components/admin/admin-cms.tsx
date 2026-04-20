'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface ConfigField {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'textarea';
  placeholder: string;
}

const configFields: ConfigField[] = [
  { key: 'heroTitle', label: 'Hero Title (HTML)', description: 'Main headline on the landing page. Supports basic HTML.', type: 'textarea', placeholder: 'The Smartest Way to<br />Manage Your School' },
  { key: 'heroSubtitle', label: 'Hero Subtitle', description: 'Subtitle under the main headline.', type: 'textarea', placeholder: 'Streamline every aspect of school administration...' },
  { key: 'heroBadge', label: 'Hero Badge Text', description: 'The small badge above the hero title.', type: 'text', placeholder: 'Trusted by 500+ schools worldwide' },
  { key: 'proPrice', label: 'PRO Price (ETB)', description: 'Monthly PRO plan price displayed on the pricing section.', type: 'text', placeholder: '1,500' },
  { key: 'trialDays', label: 'Free Trial Days', description: 'Number of days for the free PRO trial.', type: 'text', placeholder: '30' },
  { key: 'paymentTelebirr', label: 'Telebirr Account', description: 'Telebirr (Ebirr) account number for payments.', type: 'text', placeholder: '0911223344' },
  { key: 'paymentTelebirrName', label: 'Telebirr Account Name', description: 'Name on the Telebirr account.', type: 'text', placeholder: 'SAHAMI Admin' },
  { key: 'paymentKaafi', label: 'Kaafi Account', description: 'Kaafi account number for payments.', type: 'text', placeholder: '0911223344' },
  { key: 'paymentKaafiName', label: 'Kaafi Account Name', description: 'Name on the Kaafi account.', type: 'text', placeholder: 'SAHAMI Admin' },
  { key: 'paymentCBE', label: 'CBE Account Number', description: 'CBE (Commercial Bank of Ethiopia) account number.', type: 'text', placeholder: '1000123456789' },
  { key: 'paymentCBEName', label: 'CBE Account Name', description: 'Name on the CBE account.', type: 'text', placeholder: 'SAHAMI Technology PLC' },
  { key: 'contactEmail', label: 'Contact Email', description: 'Public contact email displayed on the website.', type: 'text', placeholder: 'support@sahami.app' },
  { key: 'contactPhone', label: 'Contact Phone', description: 'Public contact phone number.', type: 'text', placeholder: '+251911223344' },
];

export default function AdminCMS() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/site-config');
      const data = await res.json();
      if (data.config) setConfigs(data.config);
    } catch {
      toast.error('Failed to load site configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/site-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configs }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to save');
        return;
      }
      toast.success('Site configuration saved!');
    } catch {
      toast.error('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setConfigs((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Site Content Management</h2>
          <p className="text-muted-foreground">Edit website text, pricing, and payment information</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadConfig} disabled={saving}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Landing Page — Hero Section</CardTitle>
          <CardDescription>Headline and subtitle shown at the top of the homepage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configFields.filter(f => f.key.startsWith('hero')).map((field) => (
            <div key={field.key} className="space-y-2">
              <div>
                <Label>{field.label}</Label>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
              {field.type === 'textarea' ? (
                <Textarea
                  value={configs[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  value={configs[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pricing</CardTitle>
          <CardDescription>PRO plan pricing and trial period configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configFields.filter(f => f.key === 'proPrice' || f.key === 'trialDays').map((field) => (
            <div key={field.key} className="space-y-2">
              <div>
                <Label>{field.label}</Label>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
              <Input
                value={configs[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Accounts</CardTitle>
          <CardDescription>Payment method details shown to schools during upgrade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configFields.filter(f => f.key.startsWith('payment')).map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Input
                value={configs[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
          <CardDescription>Public contact details displayed on the website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configFields.filter(f => f.key.startsWith('contact')).map((field) => (
            <div key={field.key} className="space-y-2">
              <Label>{field.label}</Label>
              <Input
                value={configs[field.key] || ''}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Live Preview</CardTitle>
          <CardDescription>Preview of how the hero section will look on the landing page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 p-8 text-white">
            {configs.heroBadge && (
              <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-white/15 text-white/90 text-sm font-medium">
                {configs.heroBadge}
              </div>
            )}
            <h2 className="text-2xl font-bold mb-2">
              {configs.heroTitle ? (
                <span dangerouslySetInnerHTML={{ __html: configs.heroTitle }} />
              ) : (
                'The Smartest Way to Manage Your School'
              )}
            </h2>
            <p className="text-white/80 text-sm">
              {configs.heroSubtitle || 'Streamline every aspect of school administration...'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
