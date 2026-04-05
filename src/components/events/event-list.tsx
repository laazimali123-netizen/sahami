'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { CalendarDays, Plus, ChevronLeft, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EVENT_COLORS: Record<string, string> = {
  HOLIDAY: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  EXAM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  MEETING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ACTIVITY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  OTHER: 'bg-muted text-muted-foreground',
};

const EVENT_BORDER: Record<string, string> = {
  HOLIDAY: 'border-l-red-500',
  EXAM: 'border-l-amber-500',
  MEETING: 'border-l-blue-500',
  ACTIVITY: 'border-l-emerald-500',
  OTHER: 'border-l-gray-400',
};

export default function EventList() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '', type: 'OTHER' });
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());
  const [currentYear, setCurrentYear] = useState(now.getFullYear());

  useEffect(() => {
    loadEvents();
  }, [currentMonth, currentYear]);

  async function loadEvents() {
    try {
      const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const res = await fetch(`/api/events?month=${monthStr}`);
      const data = await res.json();
      setEvents(data.events || []);
      store.setEvents(data.events || []);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }

  const openCreate = () => {
    setEditEvent(null);
    setForm({ title: '', description: '', startDate: '', endDate: '', type: 'OTHER' });
    setDialogOpen(true);
  };

  const openEdit = (e: any) => {
    setEditEvent(e);
    setForm({ title: e.title, description: e.description || '', startDate: e.startDate, endDate: e.endDate || '', type: e.type });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.startDate) {
      toast.error('Title and start date are required');
      return;
    }
    setFormLoading(true);
    try {
      const url = editEvent ? '/api/events' : '/api/events';
      const method = editEvent ? 'PUT' : 'POST';
      const body = editEvent ? { id: editEvent.id, ...form } : form;
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'Failed'); return; }
      toast.success(editEvent ? 'Event updated' : 'Event created');
      setDialogOpen(false);
      loadEvents();
    } catch { toast.error('Network error'); } finally { setFormLoading(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
      toast.success('Event deleted');
      loadEvents();
    } catch { toast.error('Network error'); }
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  // Group events by date
  const eventsByDate: Record<string, any[]> = {};
  events.forEach(e => {
    const key = e.startDate;
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(e);
  });

  const sortedDates = Object.keys(eventsByDate).sort();

  if (loading) return <div className="space-y-4"><Skeleton className="h-10 w-full max-w-sm" /><Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="min-w-[180px] text-center">
            <h3 className="text-lg font-semibold">{MONTHS[currentMonth]} {currentYear}</h3>
            <p className="text-sm text-muted-foreground">{events.length} event(s)</p>
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editEvent ? 'Edit Event' : 'Create Event'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="School Holiday" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Event details..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOLIDAY">Holiday</SelectItem>
                    <SelectItem value="EXAM">Exam</SelectItem>
                    <SelectItem value="MEETING">Meeting</SelectItem>
                    <SelectItem value="ACTIVITY">Activity</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={formLoading}>
                {formLoading ? 'Saving...' : editEvent ? 'Update Event' : 'Create Event'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {sortedDates.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No events this month</p>
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {sortedDates.map(date => (
                <div key={date} className="p-4">
                  <p className="text-sm font-semibold text-muted-foreground mb-3">
                    {new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  <div className="space-y-2">
                    {eventsByDate[date].map((event: any) => (
                      <div key={event.id} className={`flex items-center gap-3 p-3 rounded-lg border border-l-4 ${EVENT_BORDER[event.type] || EVENT_BORDER.OTHER} bg-card`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{event.title}</p>
                          {event.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{event.description}</p>}
                          {event.endDate && event.endDate !== event.startDate && (
                            <p className="text-xs text-muted-foreground">to {new Date(event.endDate + 'T00:00:00').toLocaleDateString()}</p>
                          )}
                        </div>
                        <Badge className={EVENT_COLORS[event.type] || EVENT_COLORS.OTHER}>{event.type}</Badge>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => openEdit(event)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-red-500 hover:text-red-600" onClick={() => handleDelete(event.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
