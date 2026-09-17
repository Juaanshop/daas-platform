import { NextRequest, NextResponse } from "next/server";
import { SettlementService } from "@/services/settlement";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const modeParam = searchParams.get("mode");

    const isAllTime = modeParam === "all" || dateParam === "all";
    const summary = await SettlementService.getDailySettlement({
      date: dateParam && dateParam !== "all" ? dateParam : undefined,
      isAllTime,
    });

    return NextResponse.json({ ok: true, settlement: summary });
  } catch (error: any) {
    console.error("Error al obtener liquidaciones diarias:", error);
    return NextResponse.json(
      { ok: false, error: "Error al calcular liquidación diaria", details: error.message },
      { status: 500 }
    );
  }
}
