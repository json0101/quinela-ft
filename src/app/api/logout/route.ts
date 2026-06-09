import { NextResponse } from "next/server";
import config_local from "@/app/global-configuration/config-local";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(config_local.sessionCookieName);
  return response;
}
