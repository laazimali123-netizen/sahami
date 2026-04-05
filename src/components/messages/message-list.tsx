'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Plus, Inbox, Send, Mail, MailOpen } from 'lucide-react';

export default function MessageList() {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState<'inbox' | 'sent'>('inbox');
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/messages?folder=${folder}`);
        const data = await res.json();
        setMessages(data.messages || []);
        store.setMessages(data.messages || []);
      } catch { /* empty */ } finally {
        setLoading(false);
      }
    }
    load();
  }, [folder, store]);

  if (loading) return <Skeleton className="h-64 w-full" />;

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={folder} onValueChange={(v) => setFolder(v as 'inbox' | 'sent')}>
          <TabsList>
            <TabsTrigger value="inbox" className="gap-2">
              <Inbox className="h-4 w-4" /> Inbox
              {unreadCount > 0 && (
                <Badge className="bg-emerald-500 text-white border-0 ml-1">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" /> Sent
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => store.navigate('message-compose')}>
          <Plus className="h-4 w-4 mr-2" /> Compose
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {messages.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              {folder === 'inbox' ? <MailOpen className="h-12 w-12 mx-auto mb-3 opacity-30" /> : <Send className="h-12 w-12 mx-auto mb-3 opacity-30" />}
              <p className="text-sm">{folder === 'inbox' ? 'Your inbox is empty' : 'No sent messages'}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>{folder === 'inbox' ? 'From' : 'To'}</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m) => (
                  <TableRow key={m.id} className={m.isRead ? '' : 'bg-emerald-50/50'}>
                    <TableCell>
                      {!m.isRead && <div className="h-2 w-2 rounded-full bg-emerald-500" />}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {folder === 'inbox' ? m.sender?.name : m.receiver?.name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className={`text-sm ${m.isRead ? 'text-muted-foreground' : 'font-medium'}`}>{m.subject}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.content}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground text-right">{messages.length} message(s)</p>
    </div>
  );
}
