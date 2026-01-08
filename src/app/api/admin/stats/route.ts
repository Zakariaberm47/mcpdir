import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { servers, manualValidations } from "@/lib/db/schema";
import { sql, eq, count, avg } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  const devBypass = process.env.NODE_ENV === "development" && process.env.DEV_ADMIN_BYPASS === "true";

  if (!devBypass && !session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Server validation status counts
  const serverStats = await db
    .select({
      status: servers.validationStatus,
      count: count(),
    })
    .from(servers)
    .groupBy(servers.validationStatus);

  // Manual validation status counts
  const queueStats = await db
    .select({
      status: manualValidations.status,
      count: count(),
    })
    .from(manualValidations)
    .groupBy(manualValidations.status);

  // Average validation duration for successful validations
  const avgDuration = await db
    .select({
      avg: avg(servers.validationDurationMs),
    })
    .from(servers)
    .where(eq(servers.validationStatus, "validated"));

  // Count validated, failed, pending servers
  const statusMap: Record<string, number> = {};
  for (const row of serverStats) {
    statusMap[row.status ?? "null"] = Number(row.count);
  }

  const validated = statusMap["validated"] ?? 0;
  const failed = statusMap["failed"] ?? 0;
  const needsConfig = statusMap["needs_config"] ?? 0;
  const pending = statusMap["pending"] ?? 0;
  const total = validated + failed + needsConfig + pending;

  // Queue status map
  const queueMap: Record<string, number> = {};
  for (const row of queueStats) {
    queueMap[row.status ?? "null"] = Number(row.count);
  }

  // Error breakdown (top 10 error patterns)
  const errorBreakdown = await db
    .select({
      error: sql<string>`SUBSTRING(${servers.validationError}, 1, 100)`,
      count: count(),
    })
    .from(servers)
    .where(eq(servers.validationStatus, "failed"))
    .groupBy(sql`SUBSTRING(${servers.validationError}, 1, 100)`)
    .orderBy(sql`count(*) DESC`)
    .limit(10);

  // Recent activity (last 30 days)
  const recentActivity = await db
    .select({
      date: sql<string>`DATE(${servers.validatedAt})`,
      validated: sql<number>`COUNT(*) FILTER (WHERE ${servers.validationStatus} = 'validated')`,
      failed: sql<number>`COUNT(*) FILTER (WHERE ${servers.validationStatus} = 'failed')`,
    })
    .from(servers)
    .where(sql`${servers.validatedAt} > NOW() - INTERVAL '30 days'`)
    .groupBy(sql`DATE(${servers.validatedAt})`)
    .orderBy(sql`DATE(${servers.validatedAt})`);

  return NextResponse.json({
    servers: {
      total,
      validated,
      failed,
      needsConfig,
      pending,
      successRate: total > 0 ? Math.round((validated / (validated + failed)) * 100) : 0,
      avgDurationMs: avgDuration[0]?.avg ? Math.round(Number(avgDuration[0].avg)) : null,
    },
    queue: {
      pending: queueMap["pending"] ?? 0,
      validating: queueMap["validating"] ?? 0,
      completed: queueMap["completed"] ?? 0,
      failed: queueMap["failed"] ?? 0,
      cancelled: queueMap["cancelled"] ?? 0,
    },
    errorBreakdown: errorBreakdown.map((e) => ({
      error: e.error?.trim() || "Unknown error",
      count: Number(e.count),
    })),
    recentActivity: recentActivity.map((a) => ({
      date: a.date,
      validated: Number(a.validated),
      failed: Number(a.failed),
    })),
  });
}
