import { NextRequest, NextResponse } from "next/server";
import config_local from "@/app/global-configuration/config-local";
import { unwrapToken } from "@/app/global-configuration/backend";

// Recibe {username, password}, autentica contra el backend y guarda el JWT
// en una cookie httpOnly. El navegador nunca ve el token directamente.
export async function POST(req: NextRequest) {
  
  try {
    const body = await req.json();

    console.log(`${config_local.backendBaseUrl}`);
    
    const res = await fetch(`${config_local.backendBaseUrl}/Authentication`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: body.username, password: body.password }),
    });

    
    if (!res.ok) {
      let message = "Usuario o contraseña incorrectos.";
      try {
        
        const payload = await res.json();
        
        if (payload?.message) message = payload.message;
      } catch {
        /* sin cuerpo JSON */
      }

      console.log(message);
      
      return NextResponse.json({ message }, { status: res.status });
    }

    const token = unwrapToken(await res.text());

    const response = NextResponse.json({ ok: true });
    response.cookies.set(config_local.sessionCookieName, token, {
      httpOnly: true,
      sameSite: "lax",
      // secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas (igual que la expiración del JWT)
    });
    return response;
  } catch (error) {
    console.log("Payload", error);
    return NextResponse.json({ message: "No se pudo iniciar sesión." }, { status: 500 });
  }
}
