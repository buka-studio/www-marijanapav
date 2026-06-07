import 'server-only';

import { createDefaultSystemMetrics, SystemMetrics } from './models';

export default class SystemMetricsCollector {
  static async collect(): Promise<SystemMetrics> {
    return this.default();
  }

  static default(overrides: Partial<SystemMetrics> = {}): SystemMetrics {
    return createDefaultSystemMetrics(overrides);
  }
}
