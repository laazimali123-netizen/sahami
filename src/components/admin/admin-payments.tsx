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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DollarSign, Check, X, Clock, Eye, CreditCard, Smartphone,
  Building, Search, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentProofItem {
  id: string;
  schoolId: string;
  schoolName: string;
  requesterId: string;
  requesterName: string;
  plan: string;
  amount: number;
  method: string;
  contactInfo: string;
  screenshotUrl: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export default function AdminPayments() {
  const [proofs, setProofs] = useState<PaymentProofItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [reviewLoading, setReviewLoading] = useState<string | null>(null);
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; proof: PaymentProofItem | null; action: 'APPROVED' | 'REJECTED' | null }>({
    open: false, proof: null, action: null,
  });
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadProofs();
  }, []);

  const loadProofs = async () => {
    try {
      const res = await fetch('/api/payments/proof');
      if (res.ok) {
        const data = await res.json();
        setProofs(data.proofs || []);
      }
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!reviewDialog.proof || !reviewDialog.action) return;
    setReviewLoading(reviewDialog.proof.id);
    try {
      const res = await fetch(`/api/payments/proof/${reviewDialog.proof.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: reviewDialog.action,
          adminNotes: adminNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to review payment proof');
        return;
      }
      toast.success(`Payment proof ${reviewDialog.action === 'APPROVED' ? 'approved' : 'rejected'}!`);
      setReviewDialog({ open: false, proof: null, action: null });
      setAdminNotes('');
      loadProofs();
    } catch {
      toast.error('Network error');
    } finally {
      setReviewLoading(null);
    }
  };

  const methodIcon = (method: string) => {
    switch (method) {
      case 'EBIRR': return <Smartphone className="h-4 w-4 text-green-600" />;
      case 'KAAFII': return <CreditCard className="h-4 w-4 text-amber-600" />;
      case 'CBE': return <Building className="h-4 w-4 text-blue-600" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge className="bg-amber-100 text-amber-700 border-0"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-700 border-0"><Check className="h-3 w-3 mr-1" /> Approved</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-700 border-0"><X className="h-3 w-3 mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filtered = proofs.filter((p) => {
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    const matchSearch = search === '' ||
      p.schoolName.toLowerCase().includes(search.toLowerCase()) ||
      p.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      p.contactInfo.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const pendingCount = proofs.filter(p => p.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Proofs</h2>
          <p className="text-muted-foreground">Review and manage upgrade payment proofs</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-0 px-3 py-1 text-sm">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by school, name, or contact..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No payment proofs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((proof) => (
                    <TableRow key={proof.id}>
                      <TableCell className="font-medium">{proof.schoolName}</TableCell>
                      <TableCell>{proof.requesterName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {methodIcon(proof.method)}
                          <span className="text-sm">{proof.method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{proof.amount.toLocaleString()} ETB</TableCell>
                      <TableCell className="text-sm">{proof.contactInfo}</TableCell>
                      <TableCell>{statusBadge(proof.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(proof.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {proof.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setReviewDialog({ open: true, proof, action: 'APPROVED' })}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => setReviewDialog({ open: true, proof, action: 'REJECTED' })}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                        {proof.status !== 'PENDING' && proof.adminNotes && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            title={proof.adminNotes}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground text-right">{filtered.length} payment proof(s) shown</p>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => setReviewDialog({ open, proof: null, action: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewDialog.action === 'APPROVED' ? 'Approve' : 'Reject'} Payment Proof
            </DialogTitle>
          </DialogHeader>
          {reviewDialog.proof && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/50 border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">School</span>
                  <span className="font-medium">{reviewDialog.proof.schoolName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Requested By</span>
                  <span>{reviewDialog.proof.requesterName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span className="flex items-center gap-1">{methodIcon(reviewDialog.proof.method)} {reviewDialog.proof.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold">{reviewDialog.proof.amount.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact</span>
                  <span>{reviewDialog.proof.contactInfo}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder={reviewDialog.action === 'APPROVED' ? 'Any notes for the school...' : 'Reason for rejection...'}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setReviewDialog({ open: false, proof: null, action: null })}>
                  Cancel
                </Button>
                <Button
                  className={reviewDialog.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                  onClick={handleReview}
                  disabled={!!reviewLoading}
                >
                  {reviewLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {reviewDialog.action === 'APPROVED' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
