import api from '@/lib/api';

export interface MonthlyGrowth {
  month: string;
  count: number;
}

export interface OverviewData {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  totalRevenue: number;
  monthlyGrowth: MonthlyGrowth[];
}

export async function fetchOverview(): Promise<OverviewData> {
  const { data } = await api.get<OverviewData>('/superadmin/overview');
  return data;
}