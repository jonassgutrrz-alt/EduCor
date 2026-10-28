"use client";

import { useEffect, useState, Suspense, useMemo, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { supabase } from "@/lib/supabaseClient";

// 1. Componente interno que maneja la lógica de la sala
function ContenidoSala() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "1";

  const [usuario, setUsuario] = useState("Estudiante");
  const [rol, setRol] = useState("alumno");
  const [materiaNombre, setMateriaNombre] = useState("Cargando...");
  const [cargando, setCargando] = useState(true);
  const [roomHash, setRoomHash] = useState("");
  const [salaBloqueada, setSalaBloqueada] = useState(false);

  useEffect(() => {
    const inicializarSala = async () => {
      const userStored = sessionStorage.getItem("usuario");
      const roleStored = sessionStorage.getItem("rol");
      if (!userStored) {
        router.push("/");
        return;
      }
      setUsuario(userStored);
      setRol(roleStored || "alumno");

      const { data: matData, error } = await supabase
        .from("materias")
        .select("colegio_id, grado, seccion, nombre")
        .eq("id", id)
        .single();

      if (!error && matData) {
        setMateriaNombre(matData.nombre);
        const colId = matData.colegio_id || "Global";
        const grado = matData.grado || "General";
        const seccion = matData.seccion || "Unica";
        const nomLimpio = matData.nombre.replace(/[^a-zA-Z0-9]/g, "");

        setRoomHash(`EduCor_Col${colId}_Grado${grado}_Sec${seccion}_Mat${id}_${nomLimpio}`);
      } else {
        setMateriaNombre(`Materia ${id}`);
        setRoomHash(`EduCorAulaContingenciaMateria${id.replace(/[^a-zA-Z0-9]/g, "")}`);
      }

      setCargando(false);
    };

    inicializarSala();
  }, [id, router]);

  // Memorizamos las configuraciones para evitar el bucle infinito de renderizados en Jitsi
  const jitsiConfig = useMemo(() => ({
    startWithAudioMuted: rol === "alumno",
    startWithVideoMuted: true,
    startAudioOnly: true,
    prejoinPageEnabled: false,
    disableDeepLinking: true,
    resolution: 360,
  }), [rol]);

  const jitsiInterfaceConfig = useMemo(() => ({
    DISABLE_VIDEO_BACKGROUND: true,
    TOOLBAR_BUTTONS: [
      "microphone", "camera", "chat", "raisehand", "participants", "tileview", "desktop"
    ],
  }), []);

  const jitsiUser = useMemo(() => ({
    displayName: usuario,
    email: `${usuario.replace(/\s+/g, '').toLowerCase()}@educor.local`
  }), [usuario]);

  // Memorizamos las funciones callback pasadas a Jitsi
  const handleApiReady = useCallback((externalApi: unknown) => {
    const api = externalApi as {
      addEventListener: (event: string, callback: (e: { id: string; role: string }) => void) => void;
      executeCommand: (command: string) => void;
    };

    if (rol === "alumno") {
      api.addEventListener("participantRoleChanged", (event) => {
        if (event.id === "local" && event.role === "moderator") {
          api.executeCommand("hangup");
          setSalaBloqueada(true);
        }
      });
    }
  }, [rol]);

  const handleIFrameRef = useCallback((iframeRef: HTMLDivElement | null) => {
    if (iframeRef) {
      iframeRef.style.height = "100%";
      iframeRef.style.width = "100%";
      iframeRef.style.border = "none";
    }
  }, []);

  if (cargando || !roomHash) {
    return (
      <div className="relative min-h-dvh w-full flex flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col items-center">
          <Image src="/EduCor.png" alt="EduCor Logo" width={64} height={64} priority className="mb-4 h-16 w-16 animate-pulse object-contain" />
          <div className="mb-3 h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium sm:text-base">Generando túnel seguro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-full max-w-4xl -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl"
        aria-hidden="true"
      />

      <header className="relative z-10 w-full border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="flex w-full items-center gap-3 sm:w-auto">
          <button
            onClick={() => router.push(`/dashboard/materia/${id}`)}
            className="min-h-[44px] shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-indigo-300 dark:hover:bg-slate-700"
          >
            ← Volver
          </button>
          <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-700" />
          <Image
            src="/EduCor.png"
            alt="EduCor Logo"
            width={40}
            height={40}
            priority
            className="hidden h-10 w-10 shrink-0 object-contain sm:block"
          />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 sm:text-xs">
              Aula virtual
            </p>
            <h1 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white sm:text-lg">
              <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-rose-500" />
              <span className="truncate">Clase en Vivo: {materiaNombre}</span>
            </h1>
          </div>
          </div>

          <div className="flex items-center justify-between gap-3 pl-1 sm:justify-end sm:pl-0">
          <span className="truncate text-xs font-medium text-slate-600 dark:text-slate-300 sm:text-sm">{usuario}</span>
          <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 sm:text-xs">
            {rol}
          </span>
          </div>
        </div>
      </header>

      {salaBloqueada ? (
        <div className="relative flex flex-1 flex-col items-center justify-center p-5 text-center sm:p-8">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-900/5 backdrop-blur-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900/95">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-3xl text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
            🔒
          </div>
          <h2 className="mb-2 text-xl font-bold text-slate-900 dark:text-white">Sala no iniciada</h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            El docente aún no ha ingresado al aula. Por razones de seguridad, la sala virtual permanece cerrada hasta que el profesor inicie la clase.
          </p>
          <button
            onClick={() => router.push(`/dashboard/materia/${id}`)}
            className="min-h-12 w-full cursor-pointer rounded-full bg-linear-to-r from-indigo-500 via-indigo-600 to-indigo-700 px-4 py-3 text-sm font-bold text-white shadow-md shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-indigo-800 hover:shadow-lg hover:shadow-indigo-500/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Volver al Aula
          </button>
          </div>
        </div>
      ) : (
        <div className="relative mx-auto flex min-h-[420px] w-full max-w-7xl flex-1 p-2 sm:p-4">
          <div className="relative flex min-h-0 w-full flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-xl shadow-slate-900/10 dark:border-slate-800">
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={roomHash}
            configOverwrite={jitsiConfig}
            interfaceConfigOverwrite={jitsiInterfaceConfig}
            userInfo={jitsiUser}
            onApiReady={handleApiReady}
            getIFrameRef={handleIFrameRef}
          />
          </div>
        </div>
      )}
    </div>
  );
}

// 2. Exportamos el componente principal envuelto en Suspense
export default function SalaVirtual() {
  return (
    <Suspense
      fallback={
        <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 text-slate-600 dark:bg-slate-950 dark:text-slate-300">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center">
            <Image src="/EduCor.png" alt="EduCor Logo" width={56} height={56} priority className="mb-3 h-14 w-14 animate-pulse object-contain" />
            <p className="text-sm font-medium">Preparando entorno virtual...</p>
          </div>
        </div>
      }
    >
      <ContenidoSala />
    </Suspense>
  );
}