"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";

// Dynamic import with SSR disabled to ensure zero 'window is not defined' runtime crashes
const JitsiMeeting = dynamic(
  () => import("@jitsi/react-sdk").then((mod) => mod.JitsiMeeting),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 w-full flex flex-col items-center justify-center bg-slate-950 text-slate-300">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium">Iniciando videollamada de bajo consumo...</p>
      </div>
    ),
  }
);

function ContenidoSala() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "1";

  const [usuario, setUsuario] = useState("Estudiante");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const userStored = sessionStorage.getItem("usuario");
    if (!userStored) {
      router.push("/");
      return;
    }
    const timer = setTimeout(() => {
      setUsuario(userStored);
      setCargando(false);
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  if (cargando) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <Image
          src="/EduCor.png"
          alt="EduCor Logo"
          width={64}
          height={64}
          priority
          className="h-16 w-16 object-contain animate-pulse mb-4"
        />
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-500 border-t-transparent mb-3" />
        <p className="text-sm font-medium">Conectando a la sala segura...</p>
      </div>
    );
  }

  const roomName = `EduCorAulaContingenciaMateria${id.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-slate-950 overflow-x-hidden">
      {/* Top Navigation Bar with official EduCor.png Logo */}
      <header className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <Image
            src="/EduCor.png"
            alt="EduCor Logo"
            width={38}
            height={38}
            priority
            className="h-9 w-9 object-contain cursor-pointer transition-transform hover:scale-105"
            onClick={() => router.push(`/dashboard/materia/${id}`)}
          />
          <div>
            <h1 className="text-white font-bold text-sm sm:text-base">
              Clase en Vivo - Materia {id}
            </h1>
            <p className="text-rose-400 text-xs font-semibold flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              Modo Ahorro de Datos Activado
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push(`/dashboard/materia/${id}`)}
          className="min-h-[44px] bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 cursor-pointer"
        >
          Salir de la Clase
        </button>
      </header>

      {/* Jitsi Iframe Container */}
      <div className="flex-1 w-full bg-black relative min-h-[500px]">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: true,
            startAudioOnly: true,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            resolution: 360,
          }}
          interfaceConfigOverwrite={{
            DISABLE_VIDEO_BACKGROUND: true,
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "chat",
              "raisehand",
              "participants",
              "tileview",
            ],
          }}
          userInfo={{
            displayName: usuario,
            email: `${usuario.replace(/\s+/g, "").toLowerCase()}@educor.local`,
          }}
          getIFrameRef={(iframeRef) => {
            if (iframeRef) {
              iframeRef.style.height = "100%";
              iframeRef.style.width = "100%";
            }
          }}
        />
      </div>
    </div>
  );
}

export default function SalaVirtual() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-950 text-white font-medium">
          <Image
            src="/EduCor.png"
            alt="EduCor Logo"
            width={64}
            height={64}
            priority
            className="h-16 w-16 object-contain animate-pulse mb-3"
          />
          <p className="text-sm">Cargando entorno virtual...</p>
        </div>
      }
    >
      <ContenidoSala />
    </Suspense>
  );
}
