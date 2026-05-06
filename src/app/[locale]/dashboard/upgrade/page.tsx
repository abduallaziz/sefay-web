'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  max_branches: number;
  max_users: number;
  features: string[];
}

interface CurrentPlan {
  plan: string;
  trial_ends_at: string;
  planDetails: Plan;
}

export default function UpgradePage() {
  const t = useTranslations('upgrade');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [plansRes, currentRes] = await Promise.all([
        fetch(`${API_URL}/business/plans`, { headers }),
        fetch(`${API_URL}/business/current-plan`, { headers }),
      ]);

      const plansData = await plansRes.json();
      const currentData = await currentRes.json();

      setPlans(Array.isArray(plansData) ? plansData : []);
      setCurrentPlan(currentData);
    } catch (error) {
      console.error('fetchData error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setUpgrading(planId);
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/business/upgrade`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ planId }),
    });

    if (res.ok) await fetchData();
    setUpgrading(null);
  };

  if (loading) return <div className="p-8 text-center">{t('loading')}</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
      <p className="text-gray-500 mb-8">
        {t('currentPlan')}:{' '}
        <span className="font-semibold text-blue-600">
          {currentPlan?.planDetails?.name}
        </span>
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`border rounded-xl p-6 flex flex-col gap-4 ${
                isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div>
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <p className="text-3xl font-bold mt-2">
                  {plan.price === 0 ? t('free') : `${plan.price} ${plan.currency}`}
                </p>
                {plan.price > 0 && (
                  <p className="text-sm text-gray-400">{t('month')}</p>
                )}
              </div>

              <ul className="text-sm text-gray-600 flex flex-col gap-1 flex-1">
                <li>
                  ✓{' '}
                  {plan.max_branches === 999
                    ? `${t('unlimited')} ${t('branches')}`
                    : `${plan.max_branches} ${t('branches')}`}
                </li>
                <li>
                  ✓{' '}
                  {plan.max_users === 999
                    ? `${t('unlimited')} ${t('users')}`
                    : `${plan.max_users} ${t('users')}`}
                </li>
                {plan.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && handleUpgrade(plan.id)}
                disabled={isCurrent || upgrading === plan.id}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  isCurrent
                    ? 'bg-blue-500 text-white cursor-default'
                    : 'bg-gray-900 text-white hover:bg-gray-700'
                }`}
              >
                {isCurrent
                  ? t('currentBadge')
                  : upgrading === plan.id
                  ? t('upgrading')
                  : t('selectPlan')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}