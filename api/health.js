import { applySecurityHeaders } from '../lib/security.js';

const START_TIME = Date.now();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function checkSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { status: 'unconfigured' };
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return {
      status: response.ok ? 'connected' : 'error',
      statusCode: response.status,
    };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

async function checkDiskSpace() {
  try {
    const df = process._getActiveRequests?.()?.length ?? 0;
    return { activeHandles: df };
  } catch {
    return { activeHandles: 'unknown' };
  }
}

export default async (req, res) => {
  applySecurityHeaders(res, { isApi: true, noindex: true });

  const uptime = Math.floor((Date.now() - START_TIME) / 1000);
  const memory = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  const [supabaseStatus, diskInfo] = await Promise.all([
    checkSupabase(),
    checkDiskSpace(),
  ]);

  const checks = {
    status: supabaseStatus.status === 'error' ? 'degraded' : 'healthy',
    version: '2.0.0',
    uptime: `${uptime}s`,
    uptimeHuman: uptime < 60 ? `${uptime}s` :
      uptime < 3600 ? `${Math.floor(uptime / 60)}m ${uptime % 60}s` :
      `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
    timestamp: new Date().toISOString(),
    timezone: 'America/Lima',
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memory.rss / 1024 / 1024) + 'MB',
      external: Math.round((memory.external || 0) / 1024 / 1024) + 'MB',
      heapUsedPercent: memory.heapTotal > 0
        ? Math.round((memory.heapUsed / memory.heapTotal) * 100) + '%'
        : 'N/A',
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000) + 'ms',
      system: Math.round(cpuUsage.system / 1000) + 'ms',
    },
    env: {
      supabase: supabaseStatus.status === 'connected' ? 'connected' :
                supabaseStatus.status === 'unconfigured' ? 'unconfigured' : 'error',
      supabaseDetail: supabaseStatus,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      region: process.env.VERCEL_REGION || 'local',
      environment: process.env.VERCEL_ENV || 'development',
    },
    checks: {
      ...diskInfo,
      memoryUsage: memory.heapUsed > memory.heapTotal * 0.9 ? 'critical' :
                   memory.heapUsed > memory.heapTotal * 0.7 ? 'warning' : 'normal',
    },
  };

  const statusCode = checks.status === 'healthy' ? 200 : 503;
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'application/json');
  res.status(statusCode).json(checks);
};
