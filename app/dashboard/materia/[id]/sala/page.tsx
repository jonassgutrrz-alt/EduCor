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
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 px-4">
        <Image src="/EduCor.png" alt="EduCor Logo" width={64} height={64} priority className="h-16 w-16 object-contain animate-pulse mb-4" />
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-sm sm:text-base font-medium">Generando túnel seguro...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex flex-col bg-slate-50 dark:bg-slate-950">
      
      <header className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 shadow-sm z-10">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => router.push(`/dashboard/materia/${id}`)} 
            className="min-h-[44px] text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold transition-colors cursor-pointer"
          >
            ← Volver
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block mx-1"></div>
          <h1 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            Clase en Vivo: {materiaNombre}
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">{usuario}</span>
          <span className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{rol}</span>
        </div>
      </header>

      {salaBloqueada ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🔒
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Sala no iniciada</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              El docente aún no ha ingresado al aula. Por razones de seguridad, la sala virtual permanece cerrada hasta que el profesor inicie la clase.
            </p>
            <button
              onClick={() => router.push(`/dashboard/materia/${id}`)}
              className="w-full min-h-[44px] bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
            >
              Volver al Aula
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 w-full bg-slate-900 relative">
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
      )}
    </div>
  );
}

// 2. Exportamos el componente principal envuelto en Suspense
export default function SalaVirtual() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 px-4">
          <Image src="/EduCor.png" alt="EduCor Logo" width={56} height={56} priority className="h-14 w-14 object-contain animate-pulse mb-3" />
          <p className="text-sm font-medium">Preparando entorno virtual...</p>
        </div>
      }
    >
      <ContenidoSala />
    </Suspense>
  );
}