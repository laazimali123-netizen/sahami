'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus, Users, Search, Mail, Phone, Shield,
  CheckCircle2, XCircle, GraduationCap, ClipboardCheck,
  BarChart3, UserCog,
} from 'lucide-react';
import { toast } from 'sonner';

interface StaffMember {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    classAssignments: number;
    grades: number;
    attendanceMarks: number;
  };
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  OWNER: { label: 'Owner', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Shield },
  MANAGER: { label: 'Manager', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: UserCog },
  TEACHER: { label: 'Teacher', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: GraduationCap },
  FINANCE: { label: 'Finance', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: ClipboardCheck },
};

export default function StaffList() {
  const session = useStore((s) => s.session);
  const navigate = useStore((s) => s.navigate);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'TEACHER' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    loadStaff();
  }, [session?.schoolId]);

  async function loadStaff() {
    if (!session?.schoolId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/schools/${session.schoolId}/staff`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff);
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateStaff() {
    setCreateError('');
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      setCreateError('All fields are required.');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch(`/api/schools/${session!.schoolId}/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setShowCreateDialog(false);
        setCreateForm({ name: '', email: '', password: '', role: 'TEACHER' });
        loadStaff();
      } else {
        setCreateError(data.error || 'Failed to create staff account.');
      }
    } catch {
      setCreateError('Network error. Please try again.');
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(user: StaffMember) {
    if (user.role === 'OWNER' && user.id === session?.userId) {
      toast.error('You cannot deactivate your own account.');
      return;
    }

    try {
      const res = await fetch(`/api/schools/${session!.schoolId}/staff`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, isActive: !user.isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        loadStaff();
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Failed to update status.');
    }
  }

  const filtered = staff.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || s.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleCounts = {
    OWNER: staff.filter((s) => s.role === 'OWNER').length,
    MANAGER: staff.filter((s) => s.role === 'MANAGER').length,
    TEACHER: staff.filter((s) => s.role === 'TEACHER').length,
    FINANCE: staff.filter((s) => s.role === 'FINANCE').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage teachers, managers, and finance staff for your school
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Role Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(roleCounts).map(([role, count]) => {
          const cfg = roleConfig[role];
          const Icon = cfg.icon;
          return (
            <Card
              key={role}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setFilterRole(filterRole === role ? 'ALL' : role)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground">{cfg.label}s</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="OWNER">Owners</SelectItem>
                <SelectItem value="MANAGER">Managers</SelectItem>
                <SelectItem value="TEACHER">Teachers</SelectItem>
                <SelectItem value="FINANCE">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No staff members found</p>
            </div>
          ) : (
            <div className="divide-y max-h-[600px] overflow-y-auto sahami-scroll">
              {filtered.map((member) => {
                const cfg = roleConfig[member.role] || roleConfig.TEACHER;
                return (
                  <div
                    key={member.id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                      {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        {!member.isActive && (
                          <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                            Inactive
                          </Badge>
                        )}
                        {member.id === session?.userId && (
                          <Badge variant="secondary" className="text-[10px] bg-muted">
                            You
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                        {member.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex">
                            <Phone className="h-3 w-3" />
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={`text-[11px] border ${cfg.color}`}>
                        {cfg.label}
                      </Badge>
                      {member.role !== 'OWNER' && member.id !== session?.userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(member)}
                          className="h-8 w-8 p-0"
                          title={member.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {member.isActive ? (
                            <XCircle className="h-4 w-4 text-red-400" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Staff Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Staff Member</DialogTitle>
            <DialogDescription>
              Create a login account for a new teacher, manager, or finance staff member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {createError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {createError}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input
                placeholder="e.g., Mr. John Smith"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="e.g., john.smith@alnoor.edu"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Password</label>
              <Input
                type="password"
                placeholder="Minimum 6 characters"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Staff can change their password after first login.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={createForm.role}
                onValueChange={(v) => setCreateForm({ ...createForm, role: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Teacher — Teaches classes, marks attendance & grades
                    </span>
                  </SelectItem>
                  <SelectItem value="MANAGER">
                    <span className="flex items-center gap-2">
                      <UserCog className="h-4 w-4" />
                      Manager — Full management access (except settings)
                    </span>
                  </SelectItem>
                  <SelectItem value="FINANCE">
                    <span className="flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4" />
                      Finance — Fee management and reports only
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateStaff}
              disabled={creating}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {creating ? 'Creating...' : 'Create Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
