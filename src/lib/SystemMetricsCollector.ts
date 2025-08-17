import fs from 'fs/promises';
import os from 'os';

import 'server-only';

import { CpuLimit, SystemMetrics } from './models';

export default class SystemMetricsCollector {
  private static async readFirstExisting(...files: string[]) {
    for (const f of files) {
      try {
        return (await fs.readFile(f, 'utf8')).trim();
      } catch {}
    }
    return null;
  }

  private static async readCpuLimit(): Promise<CpuLimit> {
    const v2 = await this.readFirstExisting('/sys/fs/cgroup/cpu.max');
    if (v2) {
      const [qStr, pStr] = v2.split(/\s+/);
      return { quota: qStr === 'max' ? 'max' : Number(qStr), period: Number(pStr) };
    }
    const [qStr, pStr] = await Promise.all([
      this.readFirstExisting('/sys/fs/cgroup/cpu/cpu.cfs_quota_us'),
      this.readFirstExisting('/sys/fs/cgroup/cpu/cpu.cfs_period_us'),
    ]);
    if (qStr && pStr) {
      const q = Number(qStr),
        p = Number(pStr);
      return { quota: q < 0 ? 'max' : q, period: p };
    }
    return null;
  }

  private static async readMemLimitBytes(): Promise<number | null> {
    const v2 = await this.readFirstExisting('/sys/fs/cgroup/memory.max');
    if (v2) {
      if (v2 === 'max') {
        return null;
      }
      const val = Number(v2);
      if (!Number.isFinite(val)) {
        return null;
      }
      if (val <= 0 || val >= 1e15) {
        return null;
      }
      return val;
    }

    const v1 = await this.readFirstExisting('/sys/fs/cgroup/memory/memory.limit_in_bytes');
    if (v1) {
      const val = Number(v1);
      if (!Number.isFinite(val)) {
        return null;
      }
      if (val <= 0 || val >= 1e15) {
        return null;
      }
      return val;
    }

    return null;
  }

  private static async readMemCurrentBytes(): Promise<number | null> {
    const v2 = await this.readFirstExisting('/sys/fs/cgroup/memory.current');
    if (v2) {
      const val = Number(v2);
      return Number.isFinite(val) ? val : null;
    }

    const v1 = await this.readFirstExisting('/sys/fs/cgroup/memory/memory.usage_in_bytes');
    if (v1) {
      const val = Number(v1);
      return Number.isFinite(val) ? val : null;
    }

    return null;
  }

  private static coresFromCpuLimit(lim: CpuLimit, hostCores: number) {
    if (!lim || lim.quota === 'max' || !lim.period) {
      return hostCores;
    }
    return Math.max(0.1, lim.quota / lim.period);
  }

  private static sumTimes(t: os.CpuInfo['times']) {
    return t.user + t.nice + t.sys + t.irq + t.idle;
  }
  private static activeTimes(t: os.CpuInfo['times']) {
    return t.user + t.nice + t.sys + t.irq;
  }

  private static async sampleCpuPercent(sampleMs = 120) {
    const a = os.cpus().map((c) => c.times);
    await new Promise((r) => setTimeout(r, sampleMs));
    const b = os.cpus().map((c) => c.times);
    let active = 0,
      total = 0;
    for (let i = 0; i < a.length; i++) {
      total += this.sumTimes(b[i]) - this.sumTimes(a[i]);
      active += this.activeTimes(b[i]) - this.activeTimes(a[i]);
    }
    const pct = total === 0 ? 0 : (active / total) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }

  static async collect(): Promise<SystemMetrics> {
    try {
      const [cpuPct, cpuLimit, memLimit, memCurrent] = await Promise.all([
        this.sampleCpuPercent(120),
        this.readCpuLimit(),
        this.readMemLimitBytes(),
        this.readMemCurrentBytes(),
      ]);

      const hostCores = os.cpus().length;
      const effCores = this.coresFromCpuLimit(cpuLimit, hostCores);

      const [l1, l5, l15] = os.loadavg();
      const norm = (x: number) => Math.max(0, Math.round((x / effCores) * 100));
      const raw = (x: number) => Math.round(x * 100) / 100;

      const memTotal = memLimit ?? os.totalmem();
      const memUsed = memCurrent ?? memTotal - os.freemem();
      const memUsedPct = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0;

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        host: os.hostname(),
        platform: os.platform(),
        uptimeSec: Math.floor(os.uptime()),
        cpu: {
          percent: cpuPct,
          coresHost: hostCores,
          coresEffective: Math.round(effCores * 10) / 10,
          loadPct: { '1m': norm(l1), '5m': norm(l5), '15m': norm(l15) },
          rawLoad: { '1m': raw(l1), '5m': raw(l5), '15m': raw(l15) },
        },
        memory: {
          totalBytes: memTotal,
          usedBytes: memUsed,
          usedPct: memUsedPct,
          source: memLimit ? 'cgroup' : 'os',
        },
      };
    } catch (err: any) {
      return this.default({ reason: err?.message ?? 'metrics collection failed' });
    }
  }

  static default(overrides: Partial<SystemMetrics> = {}): SystemMetrics {
    const base: SystemMetrics = {
      status: 'degraded',
      reason: 'default',
      timestamp: new Date().toISOString(),
      host: typeof os.hostname === 'function' ? os.hostname() : 'local',
      platform: process.platform as NodeJS.Platform,
      uptimeSec: Math.floor(typeof os.uptime === 'function' ? os.uptime() : process.uptime()),
      cpu: {
        percent: 0,
        coresHost: os.cpus()?.length ?? 0,
        coresEffective: os.cpus()?.length ?? 0,
        loadPct: { '1m': 0, '5m': 0, '15m': 0 },
        rawLoad: { '1m': 0, '5m': 0, '15m': 0 },
      },
      memory: {
        totalBytes: 0,
        usedBytes: 0,
        usedPct: 0,
        source: 'degraded',
      },
    };
    return {
      ...base,
      ...overrides,
      cpu: { ...base.cpu, ...(overrides as any).cpu },
      memory: { ...base.memory, ...(overrides as any).memory },
    };
  }
}
