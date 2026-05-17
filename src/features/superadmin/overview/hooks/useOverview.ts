import { useQuery } from '@tanstack/react-query';
import { fetchOverview } from '../api/overview.api';
import { overviewKeys } from '../queryKeys';

export function useOverview() {
  return useQuery({
    queryKey: overviewKeys.all,
    queryFn: fetchOverview,
  });
}