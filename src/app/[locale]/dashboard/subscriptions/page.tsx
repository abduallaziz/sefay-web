'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Subscription {
  id: string;
  plan: string;
  status: string;
  started_at: string;
  expires_at: string;
  price: number;
  billing_cycle: string;
  max_users: number;
  max_branches: number;
  cancelled_at?: string;
}

export default function SubscriptionsPage() {
  const t = useTranslations('subscriptions');
  const [current, setCurrent] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [curRes, histRes] = await Promise.all([
        fetch(`${API_URL}/subscriptions/current`, { headers }),
        fetch(`${API_URL}/subscriptions/history`, { headers }),
      ]);

      const curData = await curRes.json();
      const histData = await histRes.json();

      setCurrent(curData || null);
      setHistory(Array.isArray(histData) ? histData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric',
    });

  const statusColor = (s: string) => {
    if (s === 'active') return '#22c55e';
    if (s === 'cancelled') return '#ef4444';
    return '#f59e0b';
  };

  if (loading) return (
    <div style={{ padding: 32, color: 'var(--color-text)' }}>{t('loading')}</div>
  );

  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--color-text)' }}>
        {t('title')}
      </h1>

      {/* الاشتراك الحالي */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 32,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-muted)' }}>
          {t('current')}
        </h2>

        {current ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 4 }}>{t('plan')}</div>
              <div style={{ color: 'var(--color-text)', fontWeight: 600, fontSize: 18 }}>{current.plan}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 4 }}>{t('status')}</div>
              <div style={{ color: statusColor(current.status), fontWeight: 600 }}>{t(`status_${current.status}`)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 4 }}>{t('startedAt')}</div>
              <div style={{ color: 'var(--color-text)' }}>{formatDate(current.started_at)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 4 }}>{t('expiresAt')}</div>
              <div style={{ color: 'var(--color-text)' }}>{formatDate(current.expires_at)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 4 }}>{t('price')}</div>
              <div style={{ color: 'var(--color-text)' }}>{current.price} SAR / {t(`cycle_${current.billing_cycle}`)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 12, marginBottom: 4 }}>{t('limits')}</div>
              <div style={{ color: 'var(--color-text)' }}>
                {current.max_branches === 999 ? t('unlimited') : current.max_branches} {t('branches')} —{' '}
                {current.max_users === 999 ? t('unlimited') : current.max_users} {t('users')}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ color: 'var(--color-text-muted)' }}>{t('noActive')}</div>
        )}
      </div>

      {/* تاريخ الاشتراكات */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--color-text-muted)' }}>
        {t('history')}
      </h2>

      {history.length === 0 ? (
        <div style={{ color: 'var(--color-text-muted)' }}>{t('noHistory')}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.map((sub) => (
            <div key={sub.id} style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              padding: 16,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr 1fr',
              gap: 12,
            }}>
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{t('plan')}</div>
                <div style={{ color: 'var(--color-text)', fontWeight: 600 }}>{sub.plan}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{t('status')}</div>
                <div style={{ color: statusColor(sub.status) }}>{t(`status_${sub.status}`)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{t('startedAt')}</div>
                <div style={{ color: 'var(--color-text)', fontSize: 13 }}>{formatDate(sub.started_at)}</div>
              </div>
              <div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>{t('price')}</div>
                <div style={{ color: 'var(--color-text)', fontSize: 13 }}>{sub.price} SAR</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}