"use server";

import { redirect } from "next/navigation";
import { postToBackend } from "@/lib/backend";
import { createSession, deleteSession, getSession } from "@/lib/session";
import {
  isBackendAuthResponse,
  toClientSession,
  type ClientSession,
} from "@/src/types/auth";

export type LoginState = {
  error?: string;
  email?: string;
  // Presente solo si el login fue exitoso. Lleva el access token al cliente
  // para guardarlo en memoria; el refresh token queda en la cookie httpOnly.
  session?: ClientSession;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa tu correo y contraseña.", email };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { error: "Ingresa un correo válido.", email };
  }

  let res: Response;
  try {
    res = await postToBackend("auth/login", { email, password });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return { error: "No se pudo iniciar sesión. Intenta más tarde.", email };
  }

  if (res.status === 401 || res.status === 403) {
    return { error: "Correo o contraseña incorrectos.", email };
  }

  const data: unknown = res.ok ? await res.json().catch(() => null) : null;
  if (!isBackendAuthResponse(data)) {
    console.error(`auth/login respondió ${res.status} con un cuerpo inesperado.`);
    return { error: "No se pudo iniciar sesión. Intenta más tarde.", email };
  }

  await createSession(data.refreshToken);
  return { session: toClientSession(data) };
}

export async function logout() {
  const refreshToken = await getSession();
  if (refreshToken) {
    // Revoca el refresh token en el backend. Si falla, igual se cierra la
    // sesión local: el token expira solo y el logout del backend es idempotente.
    await postToBackend("auth/logout", { refreshToken }).catch((error) => {
      console.error("Error al revocar la sesión:", error);
    });
  }
  await deleteSession();
  redirect("/login");
}
