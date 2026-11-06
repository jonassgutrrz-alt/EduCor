"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

interface EntregaAlumno {
  id: number;
  materia_id: number;
  tarea_id?: number;
  alumno_id: string;
  usuarios?: { nombre_completo: string };
  tareas?: { titulo: string };
  fecha: string;
  tipo: "archivo" | "texto";
  contenido: string;
  peso?: string;
  nota: string;
  devolucion: string;
}

interface Props {
  materiaId: string;
}

export default function PanelEntregas({ materiaId }: Props) {
  const { showToast } = useToast();
  const [entregas, setEntregas] = useState<EntregaAlumno[]>([]);
  const [notasTemp, setNotasTemp] = useState<{ [key: number]: string }>({});
  const [devolucionesTemp, setDevolucionesTemp] = useState<{ [key: number]: string }>({});
  const [calificacionEditable, setCalificacionEditable] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEntregas = async () => {
      const { data } = await supabase
        .from("entregas")
        .select("*, usuarios(nombre_completo), tareas(titulo)")
        .eq("materia_id", materiaId)
        .order("fecha", { ascending: false });

      if (data) setEntregas(data as unknown as EntregaAlumno[]);
      setCargando(false);
    };

    cargarEntregas();
  }, [materiaId]);

  const handleGuardarCalificacion = async (idEntrega: number) => {
    const nota = notasTemp[idEntrega];
    const devolucion = devolucionesTemp[idEntrega] || "";

    if (!nota) {
      showToast("Por favor ingresa una nota antes de guardar.", "warning");
      return;
    }

    const { error } = await supabase
      .from("entregas")
      .update({ nota, devolucion })
      .eq("id", idEntrega);

    if (!error) {
      setEntregas(
        entregas.map((e) => (e.id === idEntrega ? { ...e, nota, devolucion } : e))
      );
      setCalificacionEditable(null);
      showToast("¡Calificación guardada y asegurada!", "success");
    } else {
      showToast("Error al guardar la calificación.", "error");
    }
  };

  if (cargando) {
    return (
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 animate-pulse">
        Cargando entregas...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
        Trabajos Recibidos ({entregas.length})
      </h2>
      <div className="space-y-4">
        {entregas.map((e) => (
          <div key={e.id} className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-800/50 space-y-2">
            <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              <span>
                {e.usuarios?.nombre_completo || "Alumno"} -{" "}
                <span className="text-indigo-600 dark:text-indigo-400">
                  {e.tareas?.titulo || "Tarea General"}
                </span>
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs">
              {e.tipo === "archivo" ? (
                <a href={e.contenido} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold">
                  Abrir Archivo Adjunto ({e.peso})
                </a>
              ) : (
                <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed">{e.contenido}</p>
              )}
            </div>

            {e.nota && calificacionEditable !== e.id ? (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs gap-2">
                <div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 mr-2 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                    Nota: {e.nota}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 italic">&quot;{e.devolucion}&quot;</span>
                </div>
                <button
                  onClick={() => {
                    setNotasTemp({ ...notasTemp, [e.id]: e.nota });
                    setDevolucionesTemp({ ...devolucionesTemp, [e.id]: e.devolucion });
                    setCalificacionEditable(e.id);
                  }}
                  className="relative flex gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-bold fill-current cursor-pointer whitespace-nowrap"
                >
                  Editar <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 512 512"><path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z"/></svg>
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 items-center pt-2">
                <input
                  type="text"
                  placeholder="Nota"
                  defaultValue={notasTemp[e.id] || ""}
                  onChange={(ev) => setNotasTemp({ ...notasTemp, [e.id]: ev.target.value })}
                  className="w-20 min-h-[40px] px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Devolución al alumno"
                  defaultValue={devolucionesTemp[e.id] || ""}
                  onChange={(ev) => setDevolucionesTemp({ ...devolucionesTemp, [e.id]: ev.target.value })}
                  className="min-w-0 w-full sm:flex-1 min-h-[40px] px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleGuardarCalificacion(e.id)}
                  className="min-h-[40px] px-4 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 cursor-pointer shadow-sm"
                >
                  Guardar
                </button>
                {e.nota && (
                  <button type="button" onClick={() => setCalificacionEditable(null)} className="min-h-[40px] px-3 py-1 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300 cursor-pointer">
                    Cancelar
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {entregas.length === 0 && <p className="text-xs text-slate-500">No se han recibido entregas aún.</p>}
      </div>
    </div>
  );
}