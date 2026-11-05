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
                  className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer whitespace-nowrap"
                >
                  Editar Corrección
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