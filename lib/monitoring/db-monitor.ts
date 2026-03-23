import { adminSupabase } from '@/lib/supabase/admin';
import { triggerPagerDuty } from './pagerduty';

interface SlowQuery {
  query: string;
  calls: number;
  mean_exec_time_ms: number;
  max_exec_time_ms: number;
  total_exec_time_ms: number;
}

interface TableStats {
  table_name: string;
  row_estimate: number;
  dead_tuples: number;
  last_vacuum: string | null;
  last_analyze: string | null;
  table_size: string;
}

interface ConnectionStats {
  active: number;
  idle: number;
  idle_in_transaction: number;
  total: number;
  max_connections: number;
}

export async function checkSlowQueries(thresholdMs: number = 1000): Promise<SlowQuery[]> {
  try {
    const supabase = adminSupabase();
    const { data, error } = await supabase.rpc('get_slow_queries', { threshold_ms: thresholdMs });
    if (error) {
      console.error('[DB Monitor] Failed to check slow queries:', error.message);
      return [];
    }
    return (data as SlowQuery[]) || [];
  } catch {
    console.error('[DB Monitor] Slow query check failed');
    return [];
  }
}

export async function checkConnectionPool(): Promise<ConnectionStats | null> {
  try {
    const supabase = adminSupabase();
    const { data, error } = await supabase.rpc('get_connection_stats');
    if (error) {
      console.error('[DB Monitor] Failed to check connections:', error.message);
      return null;
    }
    return data as ConnectionStats;
  } catch {
    console.error('[DB Monitor] Connection check failed');
    return null;
  }
}

export async function getTableStats(): Promise<TableStats[]> {
  try {
    const supabase = adminSupabase();
    const { data, error } = await supabase.rpc('get_table_stats');
    if (error) {
      console.error('[DB Monitor] Failed to get table stats:', error.message);
      return [];
    }
    return (data as TableStats[]) || [];
  } catch {
    console.error('[DB Monitor] Table stats failed');
    return [];
  }
}

export async function runDatabaseHealthCheck(): Promise<{
  healthy: boolean;
  slowQueries: SlowQuery[];
  connections: ConnectionStats | null;
  tables: TableStats[];
  alerts: string[];
}> {
  const alerts: string[] = [];

  const [slowQueries, connections, tables] = await Promise.all([
    checkSlowQueries(),
    checkConnectionPool(),
    getTableStats(),
  ]);

  if (slowQueries.length > 0) {
    const msg = `${slowQueries.length} slow queries detected (>1s avg)`;
    alerts.push(msg);
    await triggerPagerDuty({
      severity: 'warning',
      summary: msg,
      component: 'database',
      details: { slowQueries: slowQueries.slice(0, 5) },
    });
  }

  if (connections && connections.max_connections > 0) {
    const utilization = (connections.total / connections.max_connections) * 100;
    if (utilization > 80) {
      const msg = `Database connection pool at ${utilization.toFixed(0)}% (${connections.total}/${connections.max_connections})`;
      alerts.push(msg);
      await triggerPagerDuty({
        severity: 'error',
        summary: msg,
        component: 'database',
        details: connections as unknown as Record<string, unknown>,
      });
    }
  }

  for (const table of tables) {
    if (table.dead_tuples > 10000) {
      alerts.push(`Table ${table.table_name} has ${table.dead_tuples} dead tuples — needs VACUUM`);
    }
  }

  return { healthy: alerts.length === 0, slowQueries, connections, tables, alerts };
}
