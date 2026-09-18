import { NextResponse } from "next/server";
import { getCurrentDeliveryUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentDeliveryUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  return NextResponse.json({ user });
}
