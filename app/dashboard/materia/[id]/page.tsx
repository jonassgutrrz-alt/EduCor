"use client";

import React, { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

import ListaTareas from "@/components/materia/ListaTareas";
import MuroNovedades from "@/components/materia/MuroNovedades";
import ForoConsultas from "@/components/materia/ForoConsultas";
import PanelEntregas from "@/components/materia/PanelEntregas";

function ContenidoMateria() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [usuario, setUsuario] = useState("");
  const [userId, setUserId] = useState("");
  const [rol, setRol] = useState("");
  const [materiaNombre, setMateriaNombre] = useState("Cargando...");
  const [materiaDocente, setMateriaDocente] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDetalleMateria = async () => {
      const userStored = sessionStorage.getItem("usuario");
      const roleStored = sessionStorage.getItem("rol");
      const userIdStored = sessionStorage.getItem("usuario_id");

      if (!userStored || !userIdStored) {
        router.push("/");
        return;
      }

      setUsuario(userStored);
      setRol(roleStored || "alumno");
      setUserId(userIdStored);

      const { data: matData } = await supabase
        .from("materias")
        .select("nombre, usuarios(nombre_completo)")
        .eq("id", id)
        .single();

      if (matData) {
        setMateriaNombre(matData.nombre);
        const docName = (matData.usuarios as unknown as { nombre_completo: string })?.nombre_completo;
        setMateriaDocente(docName || "Sin Asignar");
      }

      setCargando(false);
    };

    cargarDetalleMateria();
  }, [id, router]);

  if (cargando) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 px-4">
        <Image
          src="/AulaLink.png"
          alt="AulaLink Logo"
          width={64}
          height={64}
          priority
          className="h-16 w-16 object-contain animate-pulse mb-4"
        />
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-sm sm:text-base font-medium">Cargando aula virtual...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 py-4 px-3 sm:px-6 lg:px-8 overflow-x-hidden text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <header className="max-w-4xl mx-auto mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          aria-label="Volver al dashboard"
          className="flex items-center gap-2 cursor-pointer text-left"
        >
          <span className="relative flex text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold items-center gap-2 transition-colors h-6 w-6 fill-current">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
              <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 288 544 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-434.7 0 73.4-73.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-128 128z" />
            </svg>
          </span>
          <Image
            src="/AulaLink.png"
            alt="AulaLink Logo"
            width={50}
            height={50}
            priority
            className="h-12 w-12 object-contain transition-transform"
          />
        </button>

        <div className="flex items-center gap-2">
          <span className="max-w-[55vw] truncate text-xs sm:max-w-none sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            {usuario}
          </span>
          <span className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            {rol}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {materiaNombre}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Prof: {materiaDocente}
            </p>
          </div>
        </div>

        <ListaTareas materiaId={id} rol={rol} userId={userId} />

        {rol === "docente" && <PanelEntregas materiaId={id} />}

        <MuroNovedades materiaId={id} rol={rol} />

        <ForoConsultas materiaId={id} rol={rol} userId={userId} usuarioNombre={usuario} />
      </main>
    </div>
  );
}

export default function MateriaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 font-medium">
          <Image
            src="/AulaLink.png"
            alt="AulaLink Logo"
            width={56}
            height={56}
            priority
            className="h-14 w-14 object-contain animate-pulse mb-3"
          />
          <p className="text-sm">Cargando aula...</p>
        </div>
      }
    >
      <ContenidoMateria />
    </Suspense>
  );
}