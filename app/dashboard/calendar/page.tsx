"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface EventoTarea {
  id: number;
  titulo: string;
  fecha_limite: string;
  materia_nombre: string;
}

// Extraemos la lógica impura (fechas) fuera del componente para evitar que
// Next.js detecte valores inestables durante el renderizado estático/SSR.
const obtenerDatosCalendario = () => {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = hoy.getMonth();
  
  return {
    anio,
    mes,
    diasEnMes: new Date(anio, mes + 1, 0).getDate(),
    primerDiaSemana: new Date(anio, mes, 1).getDay(),
    nombreMes: hoy.toLocaleString("es-AR", { month: "long", year: "numeric" }).toUpperCase()
  };
};

export default function CalendarioConsolidado() {
  const router = useRouter();
  const [eventos, setEventos] = useState<EventoTarea[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const cargarCalendario = async () => {
      const userId = sessionStorage.getItem("usuario_id");
      const rol = sessionStorage.getItem("rol");

      if (!userId) {
        router.push("/");
        return;
      }

      let materiasIds: number[] = [];

      if (rol === "alumno") {
        const { data: inscripciones } = await supabase
          .from("inscripciones")
          .select("materia_id")
          .eq("alumno_id", userId);
        materiasIds = (inscripciones || []).map((i) => i.materia_id);
      } else if (rol === "docente") {
        const { data: materias } = await supabase
          .from("materias")
          .select("id")
          .eq("docente_id", userId);
        materiasIds = (materias || []).map((m) => m.id);
      }

      if (materiasIds.length === 0) {
        setCargando(false);
        return;
      }

      const { data: tareasData } = await supabase
        .from("tareas")
        .select("id, titulo, fecha_limite, materias(nombre)")
        .in("materia_id", materiasIds)
        .not("fecha_limite", "is", null);

      if (tareasData) {
        const formateados: EventoTarea[] = (
          tareasData as unknown as Array<{
            id: number;
            titulo: string;
            fecha_limite: string;
            materias: { nombre: string } | null;
          }>
        ).map((t) => ({
          id: t.id,
          titulo: t.titulo,
          fecha_limite: t.fecha_limite,
          materia_nombre: t.materias?.nombre || "Materia",
        }));
        setEventos(formateados);
      }
      setCargando(false);
    };

    cargarCalendario();
  }, [router]);

  // Si está cargando, el componente se queda acá. Esto asegura que el servidor (SSR)
  // solo renderice este estado, evitando cualquier discrepancia con las fechas.
  if (cargando) {
    return <div className="p-8 text-center text-slate-500 text-sm">Cargando calendario de entregas...</div>;
  }

  // Se ejecuta solo en el cliente una vez que la carga finalizó
  const { anio, mes, diasEnMes, primerDiaSemana, nombreMes } = obtenerDatosCalendario();
  
  const diasArray = Array.from({ length: diasEnMes }, (_, i) => i + 1);
  const offsetArray = Array.from({ length: primerDiaSemana }, (_, i) => i);
  const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Calendario Consolidado de Entregas</h1>
          <p className="text-xs text-slate-500">
            {nombreMes}
          </p>
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer"
        >
          ← Volver al Panel
        </button>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-center font-bold text-xs text-slate-600 dark:text-slate-300 py-2">
          {diasSemana.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-200 dark:bg-slate-800">
          {offsetArray.map((i) => (
            <div key={`offset-${i}`} className="bg-slate-50/50 dark:bg-slate-900/50 min-h-22.5" />
          ))}

          {diasArray.map((dia) => {
            const fechaStr = `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
            const tareasDelDia = eventos.filter((e) => e.fecha_limite.startsWith(fechaStr));

            return (
              <div key={dia} className="bg-white dark:bg-slate-900 p-2 min-h-22.5 flex flex-col justify-start">
                <span className="text-xs font-bold text-slate-500 mb-1">{dia}</span>
                <div className="space-y-1 overflow-y-auto max-h-17.5">
                  {tareasDelDia.map((t) => (
                    <div
                      key={t.id}
                      className="text-[10px] p-1 rounded bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium truncate"
                      title={`${t.materia_nombre}: ${t.titulo}`}
                    >
                      <span className="font-bold">{t.materia_nombre}:</span> {t.titulo}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}