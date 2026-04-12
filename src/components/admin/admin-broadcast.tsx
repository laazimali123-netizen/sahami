'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Megaphone, Send, Loader2, Clock, Mail, MessageSquare,
  AlertCircle, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Broadcast {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  sender: { name: string; email: string };
}

export default function AdminBroadcast() {
  const navigate = useStore((s) => s.navigate);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [remaining, setRemaining] = useState(3);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'EMAIL',
  });

  const loadBroadcasts = async () => {
    try {
      const res = await fetch('/api/admin/broadcast');
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data.broadcasts || []);
        setRemaining(data.remainingThisWeek ?? 3);
      }
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    if (remaining <= 0) {
      toast.error('Weekly broadcast limit reached');
      return;
    }
    setSending(true);
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          type: form.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to send broadcast');
        return;
      }
      toast.success('Broadcast sent successfully!');
      setForm({ title: '', content: '', type: 'EMAIL' });
      setRemaining(data.remainingThisWeek ?? remaining - 1);
      loadBroadcasts();
    } catch {
      toast.error('Network error');
    } finally {
      setSending(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Broadcast Messages</h2>
        <p className="text-muted-foreground">Send announcements to all schools</p>
      </div>

      {/* Weekly Limit */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Weekly Sends</p>
                <p className="text-sm text-muted-foreground">
                  {remaining > 0
                    ? `${remaining} remaining this week`
                    : 'Weekly limit reached'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-3 w-3 rounded-full transition-colors ${
                    i <= 3 - remaining ? 'bg-emerald-500' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compose Form */}
      {remaining > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" />
              Compose Broadcast
            </CardTitle>
            <CardDescription>
              This message will be sent to all registered schools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label>Message Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">
                      <span className="flex items-center gap-2">
                        <Mail className="h-4 w-4" /> Email
                      </span>
                    </SelectItem>
                    <SelectItem value="SMS">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> SMS
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="broadcastTitle">Subject</Label>
                <Input
                  id="broadcastTitle"
                  placeholder="Important update from SAHAMI..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="broadcastContent">Message</Label>
                <Textarea
                  id="broadcastContent"
                  placeholder="Write your broadcast message here..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={5}
                />
              </div>

              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={sending}
              >
                {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {sending ? 'Sending...' : `Send Broadcast (${remaining} left)`}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {remaining <= 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-3" />
            <p className="font-semibold">Weekly Limit Reached</p>
            <p className="text-sm text-muted-foreground mt-1">
              You have used all 3 broadcasts for this week. New sends reset every Monday.
            </p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Broadcast History</CardTitle>
        </CardHeader>
        <CardContent>
          {broadcasts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No broadcasts sent yet
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {broadcasts.map((b) => (
                <div key={b.id} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {b.type === 'EMAIL' ? (
                          <><Mail className="h-3 w-3 mr-1" /> Email</>
                        ) : (
                          <><MessageSquare className="h-3 w-3 mr-1" /> SMS</>
                        )}
                      </Badge>
                      <span className="font-medium text-sm">{b.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeAgo(b.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{b.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
