import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("[health] Health check OK");
  return NextResponse.json({ status: "ok" });
}
