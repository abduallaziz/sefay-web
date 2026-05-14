'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, MessageSquare } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL;

type Template = {
  id: string;
  name: string;
  type: 'whatsapp' | 'email' | 'sms';
  subject?: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
};

const typeLabel: Record<string, string> = {
  whatsapp: 'واتساب',
  email: 'إيميل',
  sms: 'SMS',
};

const typeColor: Record<string, string> = {
  whatsapp: 'bg-green-100 text-green-700',
  email: 'bg-blue-100 text-blue-700',
  sms: 'bg-orange-100 text-orange-700',
};

export default function CommunicationsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Template | null>(null);
  const [form, setForm] = useState({
    name: '', type: 'whatsapp', subject: '', body: '', variables: '',
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '20' });
      if (filterType) params.set('type', filterType);
      const res = await fetch(
        `${API}/superadmin/communications/templates?${params}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const json = await res.json();
      setTemplates(json.data || []);
      setTotal(json.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, [filterType]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ name: '', type: 'whatsapp', subject: '', body: '', variables: '' });
    setDialogOpen(true);
  };

  const openEdit = (t: Template) => {
    setEditItem(t);
    setForm({
      name: t.name, type: t.type,
      subject: t.subject || '', body: t.body,
      variables: t.variables.join(', '),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      type: form.type,
      subject: form.subject || undefined,
      body: form.body,
      variables: form.variables
        ? form.variables.split(',').map((v) => v.trim()).filter(Boolean)
        : [],
    };
    const url = editItem
      ? `${API}/superadmin/communications/templates/${editItem.id}`
      : `${API}/superadmin/communications/templates`;
    await fetch(url, {
      method: editItem ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    setDialogOpen(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف القالب؟')) return;
    await fetch(`${API}/superadmin/communications/templates/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchTemplates();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">قوالب الرسائل</h1>
          <p className="text-muted-foreground text-sm">{total} قالب</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 ml-2" />
          قالب جديد
        </Button>
      </div>

      <div className="flex gap-2">
        {['', 'whatsapp', 'email', 'sms'].map((t) => (
          <Button
            key={t}
            variant={filterType === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterType(t)}
          >
            {t === '' ? 'الكل' : typeLabel[t]}
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">جاري التحميل...</p>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>لا يوجد قوالب</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-right p-3">الاسم</th>
                <th className="text-right p-3">النوع</th>
                <th className="text-right p-3">المتغيرات</th>
                <th className="text-right p-3">الحالة</th>
                <th className="text-right p-3">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id} className="border-t hover:bg-muted/30">
                  <td className="p-3 font-medium">{t.name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor[t.type]}`}>
                      {typeLabel[t.type]}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {t.variables.length > 0 ? t.variables.join(', ') : '—'}
                  </td>
                  <td className="p-3">
                    <Badge variant={t.is_active ? 'default' : 'secondary'}>
                      {t.is_active ? 'مفعّل' : 'معطّل'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(t)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'تعديل القالب' : 'قالب جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>اسم القالب</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: ترحيب بـ tenant جديد"
              />
            </div>
            <div>
              <Label>النوع</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">واتساب</SelectItem>
                  <SelectItem value="email">إيميل</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.type === 'email' && (
              <div>
                <Label>الموضوع (Subject)</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="موضوع الإيميل"
                />
              </div>
            )}
            <div>
              <Label>نص الرسالة</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="مرحباً {{tenant_name}}، ..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground mt-1">
                استخدم {'{{variable_name}}'} للمتغيرات
              </p>
            </div>
            <div>
              <Label>المتغيرات</Label>
              <Input
                value={form.variables}
                onChange={(e) => setForm({ ...form, variables: e.target.value })}
                placeholder="tenant_name, plan_name, expiry_date"
              />
              <p className="text-xs text-muted-foreground mt-1">افصل بين المتغيرات بفاصلة</p>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleSave}>حفظ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}