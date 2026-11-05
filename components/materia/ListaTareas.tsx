"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

interface Tarea {
  id: number;
  materia_id: number;
  titulo: string;
  descripcion: string;
  url_archivo: string | null;
  fecha: string;
}

interface EntregaAlumno {
  id: number;
  materia_id: number;
  tarea_id?: number;
  alumno_id: string;
  nota: string | null;
  devolucion: string | null;
}

interface ListaTareasProps {
  materiaId: string;
  rol: string;
  userId: string;
}

export default function ListaTareas({ materiaId, rol, userId }: ListaTareasProps) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [misEntregas, setMisEntregas] = useState<EntregaAlumno[]>([]);
  const { showToast } = useToast();

  // Estados Docente (Creación e Importación)
  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState("");
  const [nuevaTareaDesc, setNuevaTareaDesc] = useState("");
  const [archivoNuevaTarea, setArchivoNuevaTarea] = useState<File | null>(null);
  const fileTareaRef = useRef<HTMLInputElement>(null);

  // Estados Alumno (Entrega)
  const [tareaSeleccionada, setTareaSeleccionada] = useState<number | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [opcionEntrega, setOpcionEntrega] = useState<"archivo" | "texto">("archivo");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cargarTareasYEntregas = async () => {
      const { data: resTareas } = await supabase
        .from("tareas")
        .select("*")
        .eq("materia_id", materiaId)
        .order("fecha", { ascending: false });
      
      if (resTareas) setTareas(resTareas);

      if (rol === "alumno") {
        const { data: resEntregas } = await supabase
          .from("entregas")
          .select("id, materia_id, tarea_id, alumno_id, nota, devolucion")
          .eq("materia_id", materiaId)
          .eq("alumno_id", userId);
        
        if (resEntregas) setMisEntregas(resEntregas);
      }
    };
    cargarTareasYEntregas();
  }, [materiaId, rol, userId]);

  // Docente: Crear Tarea
  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTareaTitulo.trim() || !nuevaTareaDesc.trim()) {
      showToast("El título y las instrucciones son obligatorios.", "warning");
      return;
    }

    let urlArchivo = null;
    if (archivoNuevaTarea) {
      const fileName = `tareas/${Date.now()}_${archivoNuevaTarea.name}`;
      const { error: uploadError } = await supabase.storage.from("archivos-educor").upload(fileName, archivoNuevaTarea);
      if (uploadError) {
        showToast("Error al subir el archivo adjunto.", "error");
        return;
      }
      const { data: urlData } = supabase.storage.from("archivos-educor").getPublicUrl(fileName);
      urlArchivo = urlData.publicUrl;
    }

    const { data, error } = await supabase.from("tareas").insert([{
      materia_id: Number(materiaId),
      titulo: nuevaTareaTitulo,
      descripcion: nuevaTareaDesc,
      url_archivo: urlArchivo
    }]).select();

    if (!error && data) {
      setTareas([data[0], ...tareas]);
      setNuevaTareaTitulo("");
      setNuevaTareaDesc("");
      setArchivoNuevaTarea(null);
      if (fileTareaRef.current) fileTareaRef.current.value = "";
      showToast("Tarea enviada a los alumnos.", "success");
    } else {
      showToast("Error al crear la tarea.", "error");
    }
  };

  // Alumno: Entregar Tarea
  const handleEnviarTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tareaSeleccionada) return;

    let contenidoFinal = respuestaTexto;
    let pesoFinal = "0 KB";

    if (opcionEntrega === "archivo") {
      if (!archivo) {
        showToast("Por favor adjunta un archivo antes de enviar.", "warning");
        return;
      }
      if (archivo.size > 5242880) {
        showToast("El archivo supera el límite permitido de 5 MB.", "warning");
        return;
      }
      const fileName = `entregas/${Date.now()}_${archivo.name}`;
      const { error: uploadError } = await supabase.storage.from("archivos-educor").upload(fileName, archivo);

      if (uploadError) {
        showToast("Error al subir el trabajo. Intente nuevamente.", "error");
        return;
      }
      const { data: urlData } = supabase.storage.from("archivos-educor").getPublicUrl(fileName);
      contenidoFinal = urlData.publicUrl;
      pesoFinal = (archivo.size / (1024 * 1024)).toFixed(1) + " MB";
    } else {
      if (!respuestaTexto.trim()) {
        showToast("Por favor escribe una respuesta antes de enviar.", "warning");
        return;
      }
    }

    const { data, error } = await supabase.from("entregas").insert([{
      materia_id: Number(materiaId),
      tarea_id: tareaSeleccionada,
      alumno_id: userId,
      tipo: opcionEntrega,
      contenido: contenidoFinal,
      peso: pesoFinal,
    }]).select("id, materia_id, tarea_id, alumno_id, nota, devolucion");

    if (!error && data) {
      showToast("¡Tarea entregada con éxito!", "success");
      setMisEntregas([data[0], ...misEntregas]);
      setRespuestaTexto("");
      setArchivo(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTareaSeleccionada(null);
    } else {
      showToast("Error al registrar la entrega.", "error");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Trabajos Prácticos y Asignaciones
        </h2>
        {/* FASE 2: BOTÓN BANCO DE TAREAS */}
        {rol === "docente" && (
          <button 
            type="button"
            onClick={() => showToast("Funcionalidad del Banco de Tareas en desarrollo.", "info")} 
            className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
          >
            📂 Importar desde Banco
          </button>
        )}
      </div>

      {rol === "docente" && (
        <form onSubmit={handleCrearTarea} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 space-y-3">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Publicar Nueva Tarea</h3>
          <input type="text" placeholder="Título de la tarea" value={nuevaTareaTitulo} onChange={e => setNuevaTareaTitulo(e.target.value)} className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <textarea placeholder="Escribe las instrucciones aquí (requerido)" rows={3} value={nuevaTareaDesc} onChange={e => setNuevaTareaDesc(e.target.value)} className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input type="file" ref={fileTareaRef} onChange={e => setArchivoNuevaTarea(e.target.files?.[0] || null)} className="text-xs flex-1 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700" />
            <button type="submit" className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors w-full sm:w-auto cursor-pointer">
              Publicar Asignación
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {tareas.length === 0 ? (
          <p className="text-xs text-slate-500">No hay tareas asignadas en esta materia.</p>
        ) : (
          tareas.map(t => {
            const entregaRealizada = misEntregas.find(e => e.tarea_id === t.id);
            return (
              <div key={t.id} className="p-4 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.titulo}</h3>
                  {rol === "alumno" && (
                    entregaRealizada 
                      ? <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold uppercase tracking-wide">Entregada</span> 
                      : <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold uppercase tracking-wide">Pendiente</span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{t.descripcion}</p>
                {t.url_archivo && (
                  <a href={t.url_archivo} target="_blank" rel="noreferrer" className="inline-block text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors">
                    📎 Abrir archivo adjunto
                  </a>
                )}
                
                {rol === "alumno" && !entregaRealizada && tareaSeleccionada !== t.id && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                    <button onClick={() => setTareaSeleccionada(t.id)} className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer">
                      Realizar Entrega
                    </button>
                  </div>
                )}
                
                {tareaSeleccionada === t.id && (
                  <form onSubmit={handleEnviarTarea} className="mt-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 shadow-inner">
                    <div className="flex border-b border-slate-200 dark:border-slate-700 pb-2 gap-4">
                      <button type="button" onClick={() => setOpcionEntrega("archivo")} className={`text-xs font-bold pb-1 cursor-pointer ${opcionEntrega === "archivo" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500"}`}>
                        Subir Archivo
                      </button>
                      <button type="button" onClick={() => setOpcionEntrega("texto")} className={`text-xs font-bold pb-1 cursor-pointer ${opcionEntrega === "texto" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500"}`}>
                        Escribir Texto
                      </button>
                    </div>
                    
                    {opcionEntrega === "archivo" ? (
                      <div className="flex flex-col gap-2">
                        <input type="file" ref={fileInputRef} onChange={e => setArchivo(e.target.files?.[0] || null)} className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700" />
                        {archivo && <button type="button" onClick={() => { setArchivo(null); if(fileInputRef.current) fileInputRef.current.value = "";}} className="self-start text-xs text-rose-600 font-semibold cursor-pointer">Desadjuntar</button>}
                      </div>
                    ) : (
                      <textarea value={respuestaTexto} onChange={e => setRespuestaTexto(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Escribe tu respuesta aquí..." />
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer">
                        Enviar Trabajo
                      </button>
                      <button type="button" onClick={() => setTareaSeleccionada(null)} className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs px-4 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors cursor-pointer">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                {rol === "alumno" && entregaRealizada && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Calificación del Docente</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${entregaRealizada.nota ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {entregaRealizada.nota ? `Nota: ${entregaRealizada.nota}` : 'Pendiente'}
                      </span>
                    </div>
                    {entregaRealizada.devolucion ? (
                      <p className="text-xs text-slate-700 dark:text-slate-300 italic mt-1">&quot;{entregaRealizada.devolucion}&quot;</p>
                    ) : (
                      <p className="text-xs text-slate-400 italic mt-1">El docente aún no ha dejado comentarios.</p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}