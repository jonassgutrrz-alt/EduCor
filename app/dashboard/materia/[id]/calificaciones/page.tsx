"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";
import Papa from "papaparse";

interface AlumnoFila {
  inscripcion_id: number;
  alumno_id: string;
  nombre_completo: string;
  notasTareas: { [tareaId: number]: string };
  calificacionesManuales: { [columnaNombre: string]: string };
}

interface TareaColumna {
  id: number;
  titulo: string;
}

function ContenidoCalificaciones() {
  const params = useParams<{ id: string }>();
  const materiaId = params.id;
  const router = useRouter();
  const { showToast } = useToast();

  const [cargando, setCargando] = useState<boolean>(true);
  const [tareas, setTareas] = useState<TareaColumna[]>([]);
  const [columnasExtra, setColumnasExtra] = useState<string[]>([]);
  const [alumnos, setAlumnos] = useState<AlumnoFila[]>([]);
  const [nuevaColumnaNombre, setNuevaColumnaNombre] = useState<string>("");

  useEffect(() => {
    const cargarDatos = async () => {
      const roleStored = sessionStorage.getItem("rol");
      if (roleStored !== "docente" && roleStored !== "admin") {
        showToast("Acceso restringido a docentes y administradores.", "error");
        router.push(`/dashboard/materia/${materiaId}`);
        return;
      }

      const { data: resTareas } = await supabase
        .from("tareas")
        .select("id, titulo")
        .eq("materia_id", materiaId)
        .order("id", { ascending: true });

      const tareasLista = resTareas || [];
      setTareas(tareasLista);

      const { data: resInscripciones } = await supabase
        .from("inscripciones")
        .select("id, alumno_id, calificaciones_manuales, usuarios(nombre_completo)")
        .eq("materia_id", materiaId);

      const { data: resEntregas } = await supabase
        .from("entregas")
        .select("tarea_id, alumno_id, nota")
        .eq("materia_id", materiaId);

      const entregasMap: { [key: string]: string } = {};
      resEntregas?.forEach((e) => {
        if (e.tarea_id && e.alumno_id && e.nota) {
          entregasMap[`${e.alumno_id}_${e.tarea_id}`] = e.nota;
        }
      });

      const extraColsSet = new Set<string>();

      const filas: AlumnoFila[] = (resInscripciones || []).map((item) => {
        const insc = item as unknown as {
          id: number;
          alumno_id: string;
          calificaciones_manuales: Record<string, string> | null;
          usuarios: { nombre_completo: string } | null;
        };
        const manuales = insc.calificaciones_manuales || {};
        Object.keys(manuales).forEach((col) => extraColsSet.add(col));

        const notasTareas: { [tareaId: number]: string } = {};
        tareasLista.forEach((t) => {
          notasTareas[t.id] = entregasMap[`${insc.alumno_id}_${t.id}`] || "-";
        });

        return {
          inscripcion_id: insc.id,
          alumno_id: insc.alumno_id,
          nombre_completo: insc.usuarios?.nombre_completo || "Sin Nombre",
          notasTareas,
          calificacionesManuales: manuales,
        };
      });

      filas.sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));

      setColumnasExtra(Array.from(extraColsSet));
      setAlumnos(filas);
      setCargando(false);
    };

    cargarDatos();
  }, [materiaId, router, showToast]);

  const handleAgregarColumna = () => {
    const colLimpia = nuevaColumnaNombre.trim();
    if (!colLimpia) return;
    if (columnasExtra.includes(colLimpia) || tareas.some((t) => t.titulo === colLimpia)) {
      showToast("Ya existe una columna con ese nombre.", "warning");
      return;
    }
    setColumnasExtra([...columnasExtra, colLimpia]);
    setNuevaColumnaNombre("");

    setAlumnos((prev) =>
      prev.map((a) => {
        const nuevasManuales = { ...a.calificacionesManuales, [colLimpia]: "" };
        
        supabase
          .from("inscripciones")
          .update({ calificaciones_manuales: nuevasManuales })
          .eq("id", a.inscripcion_id)
          .then();

        return { ...a, calificacionesManuales: nuevasManuales };
      })
    );
  };

  const handleEliminarColumna = (colNombre: string) => {
    setColumnasExtra(columnasExtra.filter((c) => c !== colNombre));
    setAlumnos((prev) =>
      prev.map((a) => {
        const copiaManuales = { ...a.calificacionesManuales };
        delete copiaManuales[colNombre];

        supabase
          .from("inscripciones")
          .update({ calificaciones_manuales: copiaManuales })
          .eq("id", a.inscripcion_id)
          .then();

        return { ...a, calificacionesManuales: copiaManuales };
      })
    );
  };

  const handleCambioNotaManual = async (inscripcionId: number, colNombre: string, valor: string) => {
    setAlumnos((prev) =>
      prev.map((a) => {
        if (a.inscripcion_id !== inscripcionId) return a;
        const nuevasManuales = { ...a.calificacionesManuales, [colNombre]: valor };

        supabase
          .from("inscripciones")
          .update({ calificaciones_manuales: nuevasManuales })
          .eq("id", inscripcionId)
          .then();

        return { ...a, calificacionesManuales: nuevasManuales };
      })
    );
  };

  const calcularNotaFinal = (alumno: AlumnoFila): string => {
    let suma = 0;
    let cantidad = 0;

    Object.values(alumno.notasTareas).forEach((nota) => {
      const num = parseFloat(nota);
      if (!isNaN(num)) {
        suma += num;
        cantidad++;
      }
    });

    Object.values(alumno.calificacionesManuales).forEach((nota) => {
      const num = parseFloat(nota);
      if (!isNaN(num)) {
        suma += num;
        cantidad++;
      }
    });

    if (cantidad === 0) return "-";
    
    return Math.round(suma / cantidad).toString();
  };

  const handleExportarCSV = () => {
    const datosExportacion = alumnos.map((a) => {
      const fila: Record<string, string> = { "Nombre Completo": a.nombre_completo };
      tareas.forEach((t) => {
        fila[t.titulo] = a.notasTareas[t.id] || "-";
      });
      columnasExtra.forEach((col) => {
        fila[col] = a.calificacionesManuales[col] || "-";
      });
      
      fila["Nota Final"] = calcularNotaFinal(a);
      
      return fila;
    });

    const csv = Papa.unparse(datosExportacion);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Calificaciones_Materia_${materiaId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Planilla CSV generada correctamente.", "success");
  };

  if (cargando) {
    return <div className="p-8 text-center text-slate-500 text-sm">Cargando planilla de calificaciones...</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 w-full min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Planilla General de Calificaciones</h1>
          <p className="text-xs text-slate-500">Gestión de notas automáticas de tareas y evaluaciones manuales.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/dashboard/materia/${materiaId}`)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-200 cursor-pointer"
          >
            ← Volver a la Materia
          </button>
          <button
            onClick={handleExportarCSV}
            className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder="Nombre de columna extra (Ej: Examen Parcial)"
          value={nuevaColumnaNombre}
          onChange={(e) => setNuevaColumnaNombre(e.target.value)}
          className="text-xs p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none flex-1 min-w-0"
        />
        <button
          onClick={handleAgregarColumna}
          className="px-3 py-2 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
        >
          + Agregar Columna
        </button>
      </div>

      {/* Contenedor responsivo con scroll horizontal limitado a la tabla */}
      <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm scroll-smooth">
        <table className="w-full min-w-max text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <th className="p-3 font-bold bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-w-45">
                Alumno
              </th>
              {tareas.map((t) => (
                <th key={t.id} className="p-3 font-semibold border-r border-slate-200 dark:border-slate-700 min-w-32.5 bg-indigo-50/50 dark:bg-indigo-950/30">
                  <span className="block truncate">{t.titulo}</span>
                  <span className="text-[9px] text-indigo-500 font-normal">(Tarea)</span>
                </th>
              ))}
              {columnasExtra.map((col) => (
                <th key={col} className="p-3 font-semibold border-r border-slate-200 dark:border-slate-700 min-w-35 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{col}</span>
                    <button
                      onClick={() => handleEliminarColumna(col)}
                      className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer shrink-0"
                      title="Eliminar columna"
                    >
                      ✕
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-3 font-bold bg-slate-200 dark:bg-slate-700 border-l border-slate-300 dark:border-slate-600 min-w-25 text-center">
                Nota Final
              </th>
            </tr>
          </thead>
          <tbody>
            {alumnos.length === 0 ? (
              <tr>
                <td colSpan={2 + tareas.length + columnasExtra.length} className="p-4 text-center text-slate-400">
                  No hay alumnos inscriptos en esta materia.
                </td>
              </tr>
            ) : (
              alumnos.map((a) => (
                <tr key={a.inscripcion_id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                    {a.nombre_completo}
                  </td>
                  {tareas.map((t) => (
                    <td key={t.id} className="p-3 border-r border-slate-100 dark:border-slate-800 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {a.notasTareas[t.id]}
                    </td>
                  ))}
                  {columnasExtra.map((col) => (
                    <td key={col} className="p-2 border-r border-slate-100 dark:border-slate-800">
                      <input
                        type="text"
                        value={a.calificacionesManuales[col] || ""}
                        onChange={(e) => handleCambioNotaManual(a.inscripcion_id, col, e.target.value)}
                        placeholder="-"
                        className="w-full text-center text-xs p-1 border border-slate-200 dark:border-slate-700 rounded dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                  ))}
                  <td className="p-3 font-bold text-center bg-slate-50 dark:bg-slate-800/90 border-l border-slate-200 dark:border-slate-700 text-indigo-700 dark:text-indigo-400">
                    {calcularNotaFinal(a)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PaginaCalificaciones() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 text-sm">Cargando...</div>}>
      <ContenidoCalificaciones />
    </Suspense>
  );
}