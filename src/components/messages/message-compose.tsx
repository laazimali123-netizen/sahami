'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function MessageCompose() {
  const store = useStore();
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [form, setForm] = useState({ receiverId: '', subject: '', content: '' });

  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await fetch('/api/teachers');
        const data = await res.json();
        setStaff(data.teachers || []);
      } catch { /* empty */ }
    }
    loadStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.receiverId || !form.subject || !form.content) {
      toast.error('All fields are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to send');
        return;
      }
      toast.success('Message sent');
      store.navigate('messages');
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => store.navigate('messages')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Compose Message</h2>
          <p className="text-sm text-muted-foreground">Send a message to staff members</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">New Message</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>To *</Label>
              <Select value={form.receiverId} onValueChange={(v) => setForm({ ...form, receiverId: v })}>
                <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.email})</SelectItem>
                  ))}
                  {staff.length === 0 && <SelectItem value="_none" disabled>No staff found</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required placeholder="Message subject" />
            </div>
            <div className="space-y-2">
              <Label>Message *</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required rows={8} placeholder="Write your message..." />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={() => store.navigate('messages')}>Discard</Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Message
          </Button>
        </div>
      </form>
    </div>
  );
}
