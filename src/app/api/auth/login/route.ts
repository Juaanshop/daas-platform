import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword, setDeliverySession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Correo electrónico y contraseña requeridos" },
        { status: 400 }
      );
    }

    const user = await prisma.deliveryUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Credenciales inválidas" },
        { status: 401 }
      );
    }

    await setDeliverySession({ id: user.id, email: user.email });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al procesar el inicio de sesión" },
      { status: 500 }
    );
  }
}
