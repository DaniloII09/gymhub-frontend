"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/src/stores/useAuthStore";
import { refreshSession } from "@/src/services/auth/refresh-session";

const PUBLIC_ROUTES = ["/login"];
// Abiertas a cualquier visitante: se intenta recuperar la sesión, pero sin redirigir.
const OPEN_ROUTES = ["/", "/home"];

// Rehidrata la sesión al cargar o recargar la página: el access token solo vive
// en memoria, así que se pide uno nuevo con el refresh token de la cookie
// httpOnly. En StrictMode el efecto corre dos veces, pero refreshSession()
// comparte la misma promesa y solo sale un POST.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isOpen = OPEN_ROUTES.includes(pathname);

  useEffect(() => {
    const { status, clearSession } = useAuthStore.getState();
    if (status !== "loading") return;
    if (isPublic) {
      clearSession();
      return;
    }
    refreshSession()
      .then((session) => {
        // Cookie ausente, expirada o revocada: ya no hay sesión que recuperar.
        if (session) return;
        if (isOpen) clearSession();
        else router.replace("/login");
      })
      .catch((error) => {
        console.error(error);
        clearSession();
      });
  }, [isPublic, isOpen, router]);

  return children;
}
