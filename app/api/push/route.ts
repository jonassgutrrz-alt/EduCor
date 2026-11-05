import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription, userId } = body;

    if (!subscription || !userId) {
      return NextResponse.json({ error: "Faltan datos requeridos." }, { status: 400 });
    }

    const { error } = await supabase.from("suscripciones_push").upsert(
      {
        usuario_id: userId,
        suscripcion: subscription,
      },
      { onConflict: "usuario_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error procesando suscripción." }, { status: 500 });
  }
}