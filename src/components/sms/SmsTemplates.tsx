import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileText, Plus, Pencil, Trash2, Copy, Eye } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SmsTemplate {
  id: string;
  name: string;
  category: string;
  message: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
}

const defaultTemplates: SmsTemplate[] = [
  {
    id: '1',
    name: 'Bill Reminder',
    category: 'Billing',
    message: 'Dear {name}, your bill of ৳{amount} is due on {date}. Please pay to avoid service interruption. - {company}',
    variables: ['name', 'amount', 'date', 'company'],
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Payment Confirmation',
    category: 'Billing',
    message: 'Dear {name}, payment of ৳{amount} received successfully on {date}. Your new balance is ৳{balance}. Thank you! - {company}',
    variables: ['name', 'amount', 'date', 'balance', 'company'],
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '3',
    name: 'Expiry Warning',
    category: 'Service',
    message: 'Dear {name}, your internet connection expires on {date}. Please recharge to continue service. - {company}',
    variables: ['name', 'date', 'company'],
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '4',
    name: 'Service Activation',
    category: 'Service',
    message: 'Dear {name}, your internet service has been activated. Username: {username}, Plan: {plan}. Enjoy! - {company}',
    variables: ['name', 'username', 'plan', 'company'],
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '5',
    name: 'Service Suspended',
    category: 'Service',
    message: 'Dear {name}, your internet service has been suspended due to non-payment. Please contact us to restore. - {company}',
    variables: ['name', 'company'],
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '6',
    name: 'Welcome Message',
    category: 'General',
    message: 'Welcome to {company}, {name}! Your account has been created. Username: {username}. For support call {phone}.',
    variables: ['company', 'name', 'username', 'phone'],
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '7',
    name: 'Password Reset',
    category: 'Security',
    message: 'Dear {name}, your password has been reset. New password: {password}. Please change it after login. - {company}',
    variables: ['name', 'password', 'company'],
    isActive: false,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: '8',
    name: 'Monthly Invoice',
    category: 'Billing',
    message: 'Dear {name}, your invoice for {month} is ৳{amount}. Due date: {date}. Pay via bKash/Nagad to {pay_number}. - {company}',
    variables: ['name', 'month', 'amount', 'date', 'pay_number', 'company'],
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
];

const categoryColors: Record<string, string> = {
  Billing: 'bg-primary/10 text-primary border-primary/20',
  Service: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  General: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  Security: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function SmsTemplates() {
  const [templates, setTemplates] = useState<SmsTemplate[]>(defaultTemplates);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<SmsTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<SmsTemplate | null>(null);
  const [form, setForm] = useState({ name: '', category: 'Billing', message: '' });

  const extractVariables = (msg: string): string[] => {
    const matches = msg.match(/\{(\w+)\}/g);
    return matches ? matches.map(m => m.replace(/[{}]/g, '')) : [];
  };

  const handleSave = () => {
    if (!form.name || !form.message) {
      toast({ title: 'Error', description: 'Name and message are required.', variant: 'destructive' });
      return;
    }
    const variables = extractVariables(form.message);
    if (editingTemplate) {
      setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...form, variables } : t));
      toast({ title: 'Template Updated', description: `"${form.name}" has been updated.` });
    } else {
      const newTemplate: SmsTemplate = {
        id: Date.now().toString(),
        ...form,
        variables,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setTemplates(prev => [...prev, newTemplate]);
      toast({ title: 'Template Created', description: `"${form.name}" has been added.` });
    }
    setForm({ name: '', category: 'Billing', message: '' });
    setEditingTemplate(null);
    setDialogOpen(false);
  };

  const handleEdit = (template: SmsTemplate) => {
    setEditingTemplate(template);
    setForm({ name: template.name, category: template.category, message: template.message });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast({ title: 'Template Deleted', description: 'SMS template has been removed.' });
  };

  const handleToggle = (id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t));
  };

  const handleCopy = (message: string) => {
    navigator.clipboard.writeText(message);
    toast({ title: 'Copied', description: 'Template message copied to clipboard.' });
  };

  const handlePreview = (template: SmsTemplate) => {
    setPreviewTemplate(template);
    setPreviewOpen(true);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              SMS Templates
            </CardTitle>
            <CardDescription>Manage reusable SMS message templates with dynamic variables</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingTemplate(null); setForm({ name: '', category: 'Billing', message: '' }); }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create SMS Template'}</DialogTitle>
                <DialogDescription>
                  Use {'{variable}'} syntax for dynamic content. E.g. {'{name}'}, {'{amount}'}, {'{date}'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Template Name</Label>
                  <Input
                    placeholder="e.g. Bill Reminder"
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(val) => setForm(prev => ({ ...prev, category: val }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Billing">Billing</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Dear {name}, your bill of ৳{amount} is due on {date}..."
                    value={form.message}
                    onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">
                    Characters: {form.message.length} | Variables: {extractVariables(form.message).join(', ') || 'None'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>{editingTemplate ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Category</TableHead>
                <TableHead className="text-xs hidden md:table-cell">Message</TableHead>
                <TableHead className="text-xs">Variables</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id} className="hover:bg-muted/20">
                  <TableCell>
                    <p className="font-medium text-sm text-foreground">{template.name}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${categoryColors[template.category] || ''}`}>
                      {template.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-xs text-muted-foreground truncate max-w-[280px]">{template.message}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map(v => (
                        <Badge key={v} variant="outline" className="text-[10px] border-border px-1.5 py-0">
                          {'{' + v + '}'}
                        </Badge>
                      ))}
                      {template.variables.length > 3 && (
                        <Badge variant="outline" className="text-[10px] border-border px-1.5 py-0">
                          +{template.variables.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`text-xs cursor-pointer ${template.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground border-border'}`}
                      onClick={() => handleToggle(template.id)}
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(template)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(template.message)}>
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(template)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(template.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No templates found. Create your first SMS template.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>{previewTemplate?.name}</DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 border border-border p-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{previewTemplate.message}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Dynamic Variables:</p>
                <div className="flex flex-wrap gap-1.5">
                  {previewTemplate.variables.map(v => (
                    <Badge key={v} variant="outline" className="text-xs">
                      {'{' + v + '}'}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Category: {previewTemplate.category}</span>
                <span>Characters: {previewTemplate.message.length}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
