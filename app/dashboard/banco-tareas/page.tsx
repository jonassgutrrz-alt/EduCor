"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface TareaBanco {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  materias: {
    nombre: string;
    grado: string;
    seccion: string;
  };
}

export default function BancoTareasPage() {
  const router = useRouter();
  const [tareas, setTareas] = useState<TareaBanco[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarBanco = async () => {
      const userId = sessionStorage.getItem("usuario_id");
      const rol = sessionStorage.getItem("rol");

      if (!userId || rol !== "docente") {
        router.push("/dashboard");
        return;
      }

      const { data, error } = await supabase
        .from("tareas")
        .select(`
          id,
          titulo,
          descripcion,
          fecha,
          materias!inner(nombre, grado, seccion, docente_id)
        `)
        .eq("materias.docente_id", userId)
        .order("fecha", { ascending: false });

      if (data && !error) {
        setTareas(data as unknown as TareaBanco[]);
      }
      setCargando(false);
    };

    cargarBanco();
  }, [router]);

  if (cargando) {
    return <div className="p-6 text-sm text-slate-500 font-medium">Cargando banco de tareas...</div>;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <button 
            onClick={() => router.push("/dashboard")} 
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold text-sm cursor-pointer transition-colors"
          >
            ← Volver al Dashboard
          </button>
          <h1 className="text-xl sm:text-2xl font-bold">📂 Mi Banco de Tareas</h1>
        </header>

        <div className="space-y-4">
          {tareas.length === 0 ? (
            <p className="text-sm text-slate-500">No tenés tareas guardadas en tu historial.</p>
          ) : (
            tareas.map((t) => (
              <div key={t.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                    {t.titulo}
                  </h3>
                  <span className="shrink-0 text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 px-2 py-1 rounded font-bold uppercase tracking-wide">
                    {t.materias.nombre} ({t.materias.grado}° {t.materias.seccion})
                  </span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap line-clamp-3">
                  {t.descripcion}
                </p>
                <div className="text-[10px] text-slate-400 mt-2 font-medium">
                  Creada el {new Date(t.fecha).toLocaleDateString("es-AR")}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}