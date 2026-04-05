'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, Users, School, GraduationCap } from 'lucide-react';

export default function ClassList() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/classes');
        const data = await res.json();
        if (data.classes) store.setClasses(data.classes);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [store]);

  const filtered = store.classes.filter((c) =>
    search === '' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.gradeLevel.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search classes..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 shrink-0" onClick={() => store.navigate('class-form')}>
          <Plus className="h-4 w-4 mr-2" /> Add Class
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <School className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No classes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cls) => (
            <Card
              key={cls.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { store.setSelectedClassId(cls.id); store.navigate('class-detail', { id: cls.id }); }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5" />
                  </div>
                  <Badge variant="outline">{cls.gradeLevel}-{cls.section}</Badge>
                </div>
                <h3 className="font-semibold text-base mb-1">{cls.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">Grade {cls.gradeLevel} • Section {cls.section}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{cls._count?.enrollments || 0} students</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <School className="h-3.5 w-3.5" />
                    <span>{cls._count?.teachers || 0} teachers</span>
                  </div>
                </div>
                {cls.room && (
                  <p className="text-xs text-muted-foreground mt-2">Room: {cls.room} • Capacity: {cls.capacity}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-sm text-muted-foreground text-right">{filtered.length} class(es)</p>
    </div>
  );
}
