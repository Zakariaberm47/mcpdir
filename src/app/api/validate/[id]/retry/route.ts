import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { manualValidations, validationAuditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const MAX_RETRIES = 3;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const session = await auth();
  const devBypass = process.env.NODE_ENV === "development" && process.env.DEV_ADMIN_BYPASS === "true";

  if (!devBypass && !session?.user?.isAdmin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = params;

  const submission = await db.query.manualValidations.findFirst({
    where: eq(manualValidations.id, id),
  });

  if (!submission) {
    return NextResponse.json({ error: "Validation not found" }, { status: 404 });
  }

  if (submission.status !== "failed") {
    return NextResponse.json(
      { error: "Can only retry failed validations" },
      { status: 400 }
    );
  }

  const currentRetryCount = submission.retryCount ?? 0;
  if (currentRetryCount >= MAX_RETRIES) {
    return NextResponse.json(
      { error: `Max retries (${MAX_RETRIES}) exceeded` },
      { status: 400 }
    );
  }

  const newRetryCount = currentRetryCount + 1;

  await db
    .update(manualValidations)
    .set({
      status: "pending",
      retryCount: newRetryCount,
      lastRetryAt: new Date(),
      validationError: null,
    })
    .where(eq(manualValidations.id, id));

  await db.insert(validationAuditLog).values({
    serverId: submission.serverId,
    userId: session?.user?.id ?? null,
    action: "retry",
    metadata: {
      validationId: id,
      retryCount: newRetryCount,
      previousStatus: submission.status,
    },
  });

  return NextResponse.json({
    id,
    status: "pending",
    retryCount: newRetryCount,
    message: `Validation queued for retry (attempt ${newRetryCount}/${MAX_RETRIES})`,
  });
}
