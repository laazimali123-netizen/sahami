'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

export default function TimetableView() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [slots, setSlots] = useState<any[]>([]);

  useEffect(() => {
    async function loadClasses() {
      try {
        const res = await fetch('/api/classes');
        const data = await res.json();
        if (data.classes) {
          store.setClasses(data.classes);
          if (data.classes.length > 0 && !selectedClass) {
            setSelectedClass(data.classes[0].id);
          }
        }
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    if (store.classes.length === 0) loadClasses();
    else {
      if (!selectedClass && store.classes.length > 0) setSelectedClass(store.classes[0].id);
      setLoading(false);
    }
  }, [store, selectedClass]);

  useEffect(() => {
    async function loadSlots() {
      if (!selectedClass) return;
      try {
        const res = await fetch(`/api/timetable?classId=${selectedClass}`);
        const data = await res.json();
        setSlots(data.slots || data.timetable || []);
      } catch { /* empty */ }
    }
    loadSlots();
  }, [selectedClass]);

  const getSlotForCell = (day: string, hour: string) => {
    return slots.find((s: any) => s.dayOfWeek === day && s.startTime === hour);
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Weekly Timetable</h2>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {store.classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {slots.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No timetable slots configured for this class</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border p-3 text-left text-sm font-medium text-muted-foreground w-20">Time</th>
                    {DAYS.map((day) => (
                      <th key={day} className="border p-3 text-center text-sm font-medium text-muted-foreground">
                        {day.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((hour, idx) => (
                    <tr key={hour}>
                      <td className="border p-3 text-sm font-medium text-muted-foreground align-top">
                        {hour}:00
                      </td>
                      {DAYS.map((day) => {
                        const slot = getSlotForCell(day, hour);
                        return (
                          <td key={`${day}-${hour}`} className="border p-1.5 align-top">
                            {slot ? (
                              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-center min-h-[60px] flex flex-col items-center justify-center">
                                <p className="text-xs font-semibold text-emerald-700">{slot.subject?.name || slot.subjectId}</p>
                                <p className="text-[10px] text-emerald-600 mt-0.5">{slot.teacher?.name || ''}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{slot.startTime}-{slot.endTime}</p>
                              </div>
                            ) : (
                              <div className="min-h-[60px]" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
