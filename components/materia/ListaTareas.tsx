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
  url_archivo_2: string | null;
  enlaces: string[];
  fecha: string;
  editado_en: string | null;
}

interface EntregaAlumno {
  id: number;
  materia_id: number;
  tarea_id?: number;
  alumno_id: string;
  nota: string | null;
  devolucion: string | null;
}

interface TareaBanco {
  id: number;
  titulo: string;
  descripcion: string;
  materias: {
    docente_id: string;
    nombre: string;
  };
}

interface ListaTareasProps {
  materiaId: string;
  rol: string;
  userId: string;
}

// Estilos dinámicos para forzar visibilidad sin usar @tailwindcss/typography
const tailwindProseAlternativo = `
  [&_h1]:text-2xl [&_h1]:font-extrabold [&_h1]:mb-4 [&_h1]:mt-2
  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-2
  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
  [&_li]:mb-1
  [&_p]:mb-3
  [&_b]:font-bold [&_strong]:font-bold
  [&_i]:italic [&_em]:italic
  [&_u]:underline
`;

// Subcomponente Editor Enriquecido Nativo
function EditorEnriquecido({ valor, onChange }: { valor: string; onChange: (v: string) => void }) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && valor !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = valor;
    }
  }, [valor]);

  const ejecutarComando = (comando: string, cmdValor?: string) => {
    document.execCommand(comando, false, cmdValor);
    if (editorRef.current) onChange(editorRef.current.innerHTML);
    editorRef.current?.focus();
  };

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-700">
      <div className="bg-slate-100 dark:bg-slate-800 p-2 flex flex-wrap gap-1 border-b border-slate-300 dark:border-slate-600 text-xs">
        <button type="button" onClick={() => ejecutarComando('bold')} className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold cursor-pointer">B</button>
        <button type="button" onClick={() => ejecutarComando('italic')} className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded italic cursor-pointer">I</button>
        <button type="button" onClick={() => ejecutarComando('underline')} className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded underline cursor-pointer">U</button>
        <span className="w-px bg-slate-300 dark:bg-slate-600 mx-1"></span>
        <button type="button" onClick={() => ejecutarComando('formatBlock', 'H1')} className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold cursor-pointer">H1</button>
        <button type="button" onClick={() => ejecutarComando('formatBlock', 'H2')} className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded font-bold cursor-pointer">H2</button>
        <span className="w-px bg-slate-300 dark:bg-slate-600 mx-1"></span>
        <button type="button" onClick={() => ejecutarComando('insertUnorderedList')} className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer">• Lista</button>
        <button type="button" onClick={() => ejecutarComando('insertOrderedList')} className="px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer">1. Lista</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        className={`p-3 min-h-[120px] text-sm focus:outline-none text-slate-800 dark:text-slate-100 max-w-none ${tailwindProseAlternativo}`}
      />
    </div>
  );
}

export default function ListaTareas({ materiaId, rol, userId }: ListaTareasProps) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [misEntregas, setMisEntregas] = useState<EntregaAlumno[]>([]);
  const { showToast, showConfirm } = useToast();

  // Estados Docente (Creación/Edición)
  const [editandoTareaId, setEditandoTareaId] = useState<number | null>(null);
  const [tareaTitulo, setTareaTitulo] = useState("");
  const [tareaDesc, setTareaDesc] = useState("");
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [urlsExistentes, setUrlsExistentes] = useState<string[]>([]);
  
  const [enlaces, setEnlaces] = useState<string[]>([]);
  const [inputEnlace, setInputEnlace] = useState("");
  
  const fileTareaRef = useRef<HTMLInputElement>(null);

  // Módulo Banco de Tareas
  const [mostrarBanco, setMostrarBanco] = useState(false);
  const [tareasBanco, setTareasBanco] = useState<TareaBanco[]>([]);
  const [cargandoBanco, setCargandoBanco] = useState(false);

  // Estados Alumno (Entrega)
  const [tareaSeleccionada, setTareaSeleccionada] = useState<number | null>(null);
  const [archivoAlumno, setArchivoAlumno] = useState<File | null>(null);
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

      if (resTareas) setTareas(resTareas.map(t => ({...t, enlaces: t.enlaces || []})));

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

  // Gestión de enlaces en formulario
  const agregarEnlace = () => {
    if (inputEnlace.trim() && (inputEnlace.startsWith('http://') || inputEnlace.startsWith('https://'))) {
      setEnlaces([...enlaces, inputEnlace.trim()]);
      setInputEnlace("");
    } else {
      showToast("Ingresá una URL válida que empiece con http o https.", "warning");
    }
  };

  const removerEnlace = (index: number) => {
    setEnlaces(enlaces.filter((_, i) => i !== index));
  };

  // Gestión de archivos en formulario
  const manejarSeleccionArchivos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const seleccionados = Array.from(e.target.files);
      if (urlsExistentes.length + archivosNuevos.length + seleccionados.length > 2) {
        showToast("Límite máximo de 2 archivos adjuntos alcanzado.", "warning");
        return;
      }
      setArchivosNuevos([...archivosNuevos, ...seleccionados]);
    }
  };

  const removerArchivoNuevo = (index: number) => {
    setArchivosNuevos(archivosNuevos.filter((_, i) => i !== index));
  };

  const removerArchivoExistente = (url: string) => {
    setUrlsExistentes(urlsExistentes.filter(u => u !== url));
  };

  // Resetear Formulario
  const resetFormulario = () => {
    setEditandoTareaId(null);
    setTareaTitulo("");
    setTareaDesc("");
    setArchivosNuevos([]);
    setUrlsExistentes([]);
    setEnlaces([]);
    setInputEnlace("");
    if (fileTareaRef.current) fileTareaRef.current.value = "";
  };

  // Cargar para Edición
  const cargarEdicion = (t: Tarea) => {
    setEditandoTareaId(t.id);
    setTareaTitulo(t.titulo);
    setTareaDesc(t.descripcion);
    setEnlaces(t.enlaces || []);
    
    const existentes = [];
    if (t.url_archivo) existentes.push(t.url_archivo);
    if (t.url_archivo_2) existentes.push(t.url_archivo_2);
    setUrlsExistentes(existentes);
    setArchivosNuevos([]);
  };

  // Guardar Tarea (Crear o Editar)
  const handleGuardarTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tareaTitulo.trim() || !tareaDesc.trim()) {
      showToast("El título y las instrucciones son obligatorios.", "warning");
      return;
    }

    if (urlsExistentes.length + archivosNuevos.length > 2) {
      showToast("No podés adjuntar más de 2 archivos.", "warning");
      return;
    }

    // Subir nuevos archivos
    const urlsNuevas: string[] = [];
    for (const file of archivosNuevos) {
      const fileName = `tareas/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("archivos-educor").upload(fileName, file);
      if (uploadError) {
        showToast(`Error al subir ${file.name}.`, "error");
        return;
      }
      const { data: urlData } = supabase.storage.from("archivos-educor").getPublicUrl(fileName);
      urlsNuevas.push(urlData.publicUrl);
    }

    const urlsFinales = [...urlsExistentes, ...urlsNuevas];
    const url_1 = urlsFinales[0] || null;
    const url_2 = urlsFinales[1] || null;

    if (editandoTareaId) {
      const { data, error } = await supabase
        .from("tareas")
        .update({
          titulo: tareaTitulo,
          descripcion: tareaDesc,
          url_archivo: url_1,
          url_archivo_2: url_2,
          enlaces: enlaces,
          editado_en: new Date().toISOString()
        })
        .eq("id", editandoTareaId)
        .select();

      if (!error && data) {
        setTareas(tareas.map(t => t.id === editandoTareaId ? { ...t, ...data[0] } : t));
        showToast("Asignación actualizada.", "success");
        resetFormulario();
      } else {
        showToast("Error al actualizar la tarea.", "error");
      }
    } else {
      const { data, error } = await supabase.from("tareas").insert([{
        materia_id: Number(materiaId),
        titulo: tareaTitulo,
        descripcion: tareaDesc,
        url_archivo: url_1,
        url_archivo_2: url_2,
        enlaces: enlaces
      }]).select();

      if (!error && data) {
        setTareas([data[0], ...tareas]);
        showToast("Asignación enviada a los alumnos.", "success");
        resetFormulario();
      } else {
        showToast("Error al crear la tarea.", "error");
      }
    }
  };

  const handleBorrarTarea = (idTarea: number) => {
    showConfirm("¿Estás seguro de eliminar esta asignación de forma permanente?", async () => {
      const { error } = await supabase.from("tareas").delete().eq("id", idTarea);
      if (!error) {
        setTareas(tareas.filter((t) => t.id !== idTarea));
        showToast("Tarea eliminada correctamente.", "info");
      } else {
        showToast("Error al eliminar la tarea.", "error");
      }
    }, "Eliminar Asignación");
  };

  // Importar de Banco
  const abrirBancoTareas = async () => {
    setMostrarBanco(true);
    setCargandoBanco(true);
    const { data } = await supabase
      .from("tareas")
      .select(`id, titulo, descripcion, materias!inner(docente_id, nombre)`)
      .eq("materias.docente_id", userId)
      .order("fecha", { ascending: false });

    if (data) setTareasBanco(data as unknown as TareaBanco[]);
    setCargandoBanco(false);
  };

  const importarTarea = (tarea: TareaBanco) => {
    setTareaTitulo(tarea.titulo);
    setTareaDesc(tarea.descripcion);
    setMostrarBanco(false);
    showToast("Tarea importada. Podés editarla antes de publicar.", "success");
  };

  // Alumno: Entregar Tarea
  const handleEnviarTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tareaSeleccionada) return;

    let contenidoFinal = respuestaTexto;
    let pesoFinal = "0 KB";

    if (opcionEntrega === "archivo") {
      if (!archivoAlumno) return showToast("Adjunta un archivo antes de enviar.", "warning");
      if (archivoAlumno.size > 5242880) return showToast("El archivo supera el límite de 5 MB.", "warning");

      const fileName = `entregas/${Date.now()}_${archivoAlumno.name}`;
      const { error: uploadError } = await supabase.storage.from("archivos-educor").upload(fileName, archivoAlumno);
      if (uploadError) return showToast("Error al subir el trabajo.", "error");

      const { data: urlData } = supabase.storage.from("archivos-educor").getPublicUrl(fileName);
      contenidoFinal = urlData.publicUrl;
      pesoFinal = (archivoAlumno.size / (1024 * 1024)).toFixed(1) + " MB";
    } else {
      if (!respuestaTexto.trim()) return showToast("Escribe una respuesta antes de enviar.", "warning");
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
      setArchivoAlumno(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTareaSeleccionada(null);
    } else {
      showToast("Error al registrar la entrega.", "error");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mb-6 relative">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Trabajos Prácticos y Asignaciones
        </h2>
        {rol === "docente" && (
          <button
            type="button"
            onClick={abrirBancoTareas}
            className="text-xs relative flex gap-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors cursor-pointer fill-current"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="h-4 w-4">
              <path d="M288 64c106 0 192 86 192 192S394 448 288 448c-65.2 0-122.9-32.5-157.6-82.3-10.1-14.5-30.1-18-44.6-7.9s-18 30.1-7.9 44.6C124.1 468.6 201 512 288 512 429.4 512 544 397.4 544 256S429.4 0 288 0C202.3 0 126.5 42.1 80 106.7L80 80c0-17.7-14.3-32-32-32S16 62.3 16 80l0 112c0 17.7 14.3 32 32 32l24.6 0c.5 0 1 0 1.5 0l86 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-38.3 0C154.9 102.6 217 64 288 64zm24 88c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1z" />
            </svg>
            Importar
          </button>
        )}
      </div>

      {mostrarBanco && (
        <div className="absolute top-0 left-0 w-full h-full bg-white/95 dark:bg-slate-900/95 z-10 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">Seleccionar Tarea Previa</h3>
            <button onClick={() => setMostrarBanco(false)} className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer fill-current">
              ✕ Cerrar
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {cargandoBanco ? (
              <p className="text-xs text-slate-500">Cargando consignas...</p>
            ) : tareasBanco.length === 0 ? (
              <p className="text-xs text-slate-500">No hay tareas en tu banco.</p>
            ) : (
              tareasBanco.map((tb) => (
                <div key={tb.id} onClick={() => importarTarea(tb)} className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors group">
                  <div className="flex justify-between">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">{tb.titulo}</h4>
                    <span className="text-[9px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded">{tb.materias?.nombre}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {rol === "docente" && (
        <form onSubmit={handleGuardarTarea} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {editandoTareaId ? "Editando Tarea Publicada" : "Publicar Nueva Tarea"}
            </h3>
            {editandoTareaId && (
              <button type="button" onClick={resetFormulario} className="text-xs text-slate-500 hover:text-slate-700 font-bold cursor-pointer">Cancelar Edición</button>
            )}
          </div>
          
          <input type="text" placeholder="Título de la tarea" value={tareaTitulo} onChange={(e) => setTareaTitulo(e.target.value)} className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          
          <EditorEnriquecido valor={tareaDesc} onChange={setTareaDesc} />

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Adjuntar Archivos (Máx 2)</label>
              <input type="file" multiple ref={fileTareaRef} onChange={manejarSeleccionArchivos} className="w-full text-xs file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700" />
              <div className="flex flex-col gap-1">
                {urlsExistentes.map((url, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] bg-white dark:bg-slate-700 p-1.5 rounded border border-slate-200 dark:border-slate-600">
                    <span className="truncate">Archivo previo {i + 1}</span>
                    <button type="button" onClick={() => removerArchivoExistente(url)} className="text-rose-500 font-bold px-2 cursor-pointer">X</button>
                  </div>
                ))}
                {archivosNuevos.map((f, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] bg-white dark:bg-slate-700 p-1.5 rounded border border-slate-200 dark:border-slate-600">
                    <span className="truncate">{f.name}</span>
                    <button type="button" onClick={() => removerArchivoNuevo(i)} className="text-rose-500 font-bold px-2 cursor-pointer">X</button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Añadir Enlaces Web</label>
              <div className="flex gap-2">
                <input type="text" placeholder="https://ejemplo.com" value={inputEnlace} onChange={e => setInputEnlace(e.target.value)} className="flex-1 text-xs p-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                <button type="button" onClick={agregarEnlace} className="bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 text-xs px-2 rounded font-bold cursor-pointer">Add</button>
              </div>
              <div className="flex flex-col gap-1">
                {enlaces.map((enl, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px] bg-white dark:bg-slate-700 p-1.5 rounded border border-slate-200 dark:border-slate-600">
                    <span className="truncate">{enl}</span>
                    <button type="button" onClick={() => removerEnlace(i)} className="text-rose-500 font-bold px-2 cursor-pointer">X</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="bg-indigo-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors w-full cursor-pointer">
            {editandoTareaId ? "Guardar Cambios" : "Publicar Asignación"}
          </button>
        </form>
      )}

      <div className="space-y-4">
        {tareas.length === 0 ? (
          <p className="text-xs text-slate-500">No hay tareas asignadas en esta materia.</p>
        ) : (
          tareas.map((t) => {
            const entregaRealizada = misEntregas.find((e) => e.tarea_id === t.id);
            return (
              <div key={t.id} className="p-4 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">{t.titulo}</h3>
                    <div className="text-[10px] text-slate-500 mt-1 flex gap-2">
                      <span>Publicado: {new Date(t.fecha).toLocaleString("es-AR")}</span>
                      {t.editado_en && <span className="italic text-slate-400">| Editado: {new Date(t.editado_en).toLocaleString("es-AR")}</span>}
                    </div>
                  </div>
                  
                  {rol === "alumno" && (
                    entregaRealizada ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold uppercase tracking-wide">Entregada</span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold uppercase tracking-wide">Pendiente</span>
                    )
                  )}

                  {rol === "docente" && (
                    <div className="flex gap-2">
                      <button onClick={() => cargarEdicion(t)} className="text-[10px] bg-slate-200 text-slate-700 px-2 py-1 rounded font-bold hover:bg-slate-300 cursor-pointer">Editar</button>
                      <button onClick={() => handleBorrarTarea(t.id)} className="text-[10px] bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold hover:bg-rose-200 cursor-pointer">Borrar</button>
                    </div>
                  )}
                </div>

                <div 
                  className={`text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-w-none ${tailwindProseAlternativo}`}
                  dangerouslySetInnerHTML={{ __html: t.descripcion }}
                />

                <div className="flex flex-wrap gap-2 pt-2">
                  {t.url_archivo && (
                    <a href={t.url_archivo} target="_blank" rel="noreferrer" className="inline-block text-[11px] bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors">
                      📎 Archivo Adjunto 1
                    </a>
                  )}
                  {t.url_archivo_2 && (
                    <a href={t.url_archivo_2} target="_blank" rel="noreferrer" className="inline-block text-[11px] bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors">
                      📎 Archivo Adjunto 2
                    </a>
                  )}
                  {t.enlaces && t.enlaces.map((enl, idx) => (
                    <a key={idx} href={enl} target="_blank" rel="noreferrer" className="inline-block text-[11px] bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 px-3 py-1.5 rounded-lg font-semibold hover:bg-sky-100 transition-colors">
                      🔗 Enlace {idx + 1}
                    </a>
                  ))}
                </div>

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
                      <button type="button" onClick={() => setOpcionEntrega("archivo")} className={`text-xs font-bold pb-1 cursor-pointer ${opcionEntrega === "archivo" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500"}`}>Subir Archivo</button>
                      <button type="button" onClick={() => setOpcionEntrega("texto")} className={`text-xs font-bold pb-1 cursor-pointer ${opcionEntrega === "texto" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500"}`}>Escribir Texto</button>
                    </div>

                    {opcionEntrega === "archivo" ? (
                      <div className="flex flex-col gap-2">
                        <input type="file" ref={fileInputRef} onChange={(e) => setArchivoAlumno(e.target.files?.[0] || null)} className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700" />
                        {archivoAlumno && (
                          <button type="button" onClick={() => { setArchivoAlumno(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="self-start text-xs text-rose-600 font-semibold cursor-pointer">
                            Desadjuntar
                          </button>
                        )}
                      </div>
                    ) : (
                      <textarea value={respuestaTexto} onChange={(e) => setRespuestaTexto(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Escribe tu respuesta aquí..." />
                    )}

                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer">Enviar Trabajo</button>
                      <button type="button" onClick={() => setTareaSeleccionada(null)} className="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs px-4 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors cursor-pointer">Cancelar</button>
                    </div>
                  </form>
                )}

                {rol === "alumno" && entregaRealizada && (
                  <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Calificación del Docente</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${entregaRealizada.nota ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {entregaRealizada.nota ? `Nota: ${entregaRealizada.nota}` : "Pendiente"}
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
            );
          })
        )}
      </div>
    </div>
  );
}