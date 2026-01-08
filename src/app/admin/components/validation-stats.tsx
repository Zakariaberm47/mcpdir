"use client";

import { useEffect, useState } from "react";
import {
  GlassCard,
  GlassCardContent,
  GlassCardHeader,
  GlassCardTitle,
} from "@/components/ui/glass-card";
import {
  ShieldCheck,
  XCircle,
  Settings,
  Clock,
  TrendingUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface Stats {
  servers: {
    total: number;
    validated: number;
    failed: number;
    needsConfig: number;
    pending: number;
    successRate: number;
    avgDurationMs: number | null;
  };
  queue: {
    pending: number;
    validating: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
  errorBreakdown: { error: string; count: number }[];
  recentActivity: { date: string; validated: number; failed: number }[];
}

export function ValidationStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load stats
      </div>
    );
  }

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard glow="cyan" hover={false}>
          <GlassCardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.servers.validated}</p>
                <p className="text-xs text-muted-foreground">Validated</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard hover={false}>
          <GlassCardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/20">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.servers.failed}</p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard hover={false}>
          <GlassCardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Settings className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.servers.needsConfig}</p>
                <p className="text-xs text-muted-foreground">Needs Config</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard hover={false}>
          <GlassCardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan/20">
                <TrendingUp className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.servers.successRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Queue Status */}
        <GlassCard hover={false}>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Queue Status
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{stats.queue.pending}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Validating</span>
                <span className="font-medium text-blue-400">
                  {stats.queue.validating}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium text-green-400">
                  {stats.queue.completed}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Failed</span>
                <span className="font-medium text-red-400">
                  {stats.queue.failed}
                </span>
              </div>
              <div className="border-t border-[var(--glass-border)] pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Avg Duration</span>
                  <span className="font-medium">
                    {formatDuration(stats.servers.avgDurationMs)}
                  </span>
                </div>
              </div>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Error Breakdown */}
        <GlassCard hover={false}>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Top Errors
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {stats.errorBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No errors recorded
              </p>
            ) : (
              <div className="space-y-2">
                {stats.errorBreakdown.slice(0, 5).map((err, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-start gap-2 text-sm"
                  >
                    <span className="text-muted-foreground truncate flex-1">
                      {err.error}
                    </span>
                    <span className="font-medium text-red-400 shrink-0">
                      {err.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Recent Activity */}
      {stats.recentActivity.length > 0 && (
        <GlassCard hover={false}>
          <GlassCardHeader>
            <GlassCardTitle>Recent Activity (30 days)</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {(() => {
              const days = stats.recentActivity.slice(-30);
              const maxTotal = Math.max(...days.map(d => d.validated + d.failed), 1);
              const maxHeight = 80;

              return (
                <div className="flex items-end gap-1 h-24">
                  {days.map((day, i) => {
                    const total = day.validated + day.failed;
                    const barHeight = total > 0 ? Math.max(4, (total / maxTotal) * maxHeight) : 4;
                    const validatedHeight = total > 0 ? (day.validated / total) * barHeight : barHeight;
                    const failedHeight = barHeight - validatedHeight;

                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col justify-end"
                        title={`${day.date}: ${day.validated} validated, ${day.failed} failed`}
                      >
                        {failedHeight > 0 && (
                          <div
                            className="w-full bg-red-500/70"
                            style={{ height: `${failedHeight}px` }}
                          />
                        )}
                        <div
                          className="w-full rounded-b bg-gradient-to-t from-green-500/50 to-green-400/50"
                          style={{ height: `${validatedHeight}px` }}
                        />
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
