'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import '@/styles/upgrade.css';

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

  if (loading) return <div className="upgrade-page">{t('loading')}</div>;

  return (
    <div className="upgrade-page">
      <h1 className="upgrade-title">{t('title')}</h1>
      <p className="upgrade-subtitle">
        {t('currentPlan')}: <span>{currentPlan?.planDetails?.name}</span>
      </p>

      <div className="upgrade-grid">
        {plans.map((plan) => {
          const isCurrent = currentPlan?.plan === plan.id;
          return (
            <div key={plan.id} className={`upgrade-card ${isCurrent ? 'current' : ''}`}>
              <div>
                <div className="upgrade-card-name">{plan.name}</div>
                <div className="upgrade-card-price">
                  {plan.price === 0 ? t('free') : `${plan.price} ${plan.currency}`}
                </div>
                {plan.price > 0 && (
                  <div className="upgrade-card-period">{t('month')}</div>
                )}
              </div>

              <ul className="upgrade-card-features">
                <li>
                  {plan.max_branches === 999
                    ? `${t('unlimited')} ${t('branches')}`
                    : `${plan.max_branches} ${t('branches')}`}
                </li>
                <li>
                  {plan.max_users === 999
                    ? `${t('unlimited')} ${t('users')}`
                    : `${plan.max_users} ${t('users')}`}
                </li>
                {plan.features.map((f, i) => (
                  <li key={i}>{t(`feature_${f}`)}</li>
                ))}
              </ul>

              {isCurrent ? (
                <button disabled className="upgrade-btn current">
                  {t('currentBadge')}
                </button>
              ) : (
                <a
                  href={`https://wa.me/966530575553?text=${encodeURIComponent(`مرحباً، أريد الاشتراك في خطة ${plan.name} بسعر ${plan.price} ${plan.currency}/شهر`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="upgrade-btn select"
                  style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}
                >
                  {t('selectPlan')}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}