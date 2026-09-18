import { NextResponse } from "next/server";
import { clearDeliverySession } from "@/lib/auth";

export async function POST() {
  await clearDeliverySession();
  return NextResponse.json({ success: true, message: "Sesión cerrada exitosamente" });
}
