import { useQuery } from '@tanstack/react-query';
import { getDb } from './index';

export type DbTable = { name: string };

/** Lists all user tables — proves the connection + schema work. */
export function useDbStatus() {
  return useQuery({
    queryKey: ['db', 'status'],
    queryFn: async () => {
      const db = await getDb();
      return db.getAllAsync<DbTable>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      );
    },
  });
}