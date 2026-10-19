"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { JitsiMeeting } from "@jitsi/react-sdk";

// 1. Separamos toda la lógica en un componente interno
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
    } else {
      setTimeout(() => {
        setUsuario(userStored);
        setCargando(false);
      }, 0);
    }
  }, [router]);

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white font-medium">
        Conectando a la sala segura...
      </div>
    );
  }

  const roomName = `EduCorAulaContingenciaMateria${id.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900">
      {/* Barra superior de navegación */}
      <div className="bg-gray-800 p-4 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-white font-bold text-lg">Clase en Vivo - Materia {id}</h1>
          <p className="text-red-400 text-xs font-medium animate-pulse mt-1">
            ● Modo Ahorro de Datos Activado
          </p>
        </div>
        <button
          onClick={() => router.push(`/dashboard/materia/${id}`)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition border border-red-800"
        >
          Salir de la Clase
        </button>
      </div>

      {/* Contenedor del Iframe de Jitsi */}
      <div className="flex-1 w-full bg-black">
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
              "microphone", "camera", "chat", "raisehand", "participants", "tileview"
            ],
          }}
          userInfo={{
            displayName: usuario,
            email: `${usuario.replace(/\s+/g, '').toLowerCase()}@educor.local` 
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = "100%";
            iframeRef.style.width = "100%";
          }}
        />
      </div>
    </div>
  );
}

// 2. Exportamos el componente principal envuelto en Suspense
export default function SalaVirtual() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-gray-900 text-white font-medium">
          Cargando entorno virtual...
        </div>
      }
    >
      <ContenidoSala />
    </Suspense>
  );
}