import { NextResponse } from "next/server";
import { getStats } from "@/lib/db/queries";

export const revalidate = 60; // Revalidate every 60 seconds

export async function GET() {
  const stats = await getStats();
  return NextResponse.json(stats);
}
