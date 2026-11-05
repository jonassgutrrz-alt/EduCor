"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/Toast";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SuscripcionPush() {
  const [suscripto, setSuscripto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Retraso de 0ms para desvincular el setState del ciclo de pintado síncrono del efecto
    const timeoutId = setTimeout(() => {
      if ("serviceWorker" in navigator && "Notification" in window) {
        if (Notification.permission === "granted") {
          setSuscripto(true);
        }
      }
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const suscribirUsuario = async () => {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) {
      showToast("Tu navegador no soporta notificaciones push.", "warning");
      return;
    }

    setCargando(true);
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        showToast("Permiso de notificaciones denegado.", "warning");
        setCargando(false);
        return;
      }

      const registro = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        showToast("Error de configuración VAPID pública.", "error");
        setCargando(false);
        return;
      }

      const suscripcion = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const userId = sessionStorage.getItem("usuario_id");

      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: suscripcion, userId }),
      });

      if (res.ok) {
        setSuscripto(true);
        showToast("¡Notificaciones activadas correctamente!", "success");
      } else {
        showToast("Error al registrar suscripción.", "error");
      }
    } catch {
      showToast("Error al activar notificaciones.", "error");
    } finally {
      setCargando(false);
    }
  };

  if (suscripto) return null;

  return (
    <button
      onClick={suscribirUsuario}
      disabled={cargando}
      className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
    >
      {cargando ? "Activando..." : "🔔 Activar Notificaciones Push"}
    </button>
  );
}