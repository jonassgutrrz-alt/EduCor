"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

interface Aviso {
  id: number;
  texto: string;
  fecha: string;
}

interface Material {
  id: number;
  titulo: string;
  tipo: string;
  peso: string;
  url_archivo: string;
  fecha?: string;
}

interface Tarea {
  id: number;
  materia_id: number;
  titulo: string;
  descripcion: string;
  url_archivo: string | null;
  fecha: string;
}

interface Notificacion {
  id: string;
  tipo: string;
  texto: string;
  fecha: string;
}

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

interface MensajeForo {
  id: number;
  autor_id: string;
  autor_nombre: string;
  rol: string;
  texto: string;
  fecha: string;
  editado?: boolean;
}

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
  const { showToast, showConfirm } = useToast();

  // Referencias para selector de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMaterialRef = useRef<HTMLInputElement>(null);
  const fileTareaRef = useRef<HTMLInputElement>(null);

  // Estados Base
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [nuevoAviso, setNuevoAviso] = useState("");

  const [materiales, setMateriales] = useState<Material[]>([]);
  const [nuevoMaterial, setNuevoMaterial] = useState<File | null>(null);

  const [mensajes, setMensajes] = useState<MensajeForo[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [textoEditado, setTextoEditado] = useState("");

  // Notificaciones
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState<Set<string>>(new Set());
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);

  const obtenerIdsGuardados = (clave: string): string[] => {
    try {
      const ids: unknown = JSON.parse(localStorage.getItem(clave) || "[]");
      return Array.isArray(ids) ? ids.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  };

  const guardarIds = (clave: string, ids: string[]) => {
    try {
      localStorage.setItem(clave, JSON.stringify(ids));
    } catch {
      // Las notificaciones siguen funcionando durante esta sesión aunque el almacenamiento esté bloqueado.
    }
  };

  const clavesNotificaciones = (idUsuario: string) => {
    const alcance = `${idUsuario}:${id}`;
    return {
      leidas: `educor:notificaciones:leidas:${alcance}`,
      eliminadas: `educor:notificaciones:eliminadas:${alcance}`,
    };
  };

  const marcarNotificacionesLeidas = () => {
    const idsLeidos = obtenerIdsGuardados(clavesNotificaciones(userId).leidas);
    guardarIds(clavesNotificaciones(userId).leidas, [...new Set([...idsLeidos, ...notificaciones.map((n) => n.id)])]);
    setNotificacionesNoLeidas(new Set());
  };

  const eliminarNotificacion = (idNotificacion: string) => {
    const claves = clavesNotificaciones(userId);
    const idsEliminados = obtenerIdsGuardados(claves.eliminadas);
    guardarIds(claves.eliminadas, [...new Set([...idsEliminados, idNotificacion])]);
    setNotificaciones((actuales) => actuales.filter((notificacion) => notificacion.id !== idNotificacion));
    setNotificacionesNoLeidas((actuales) => {
      const restantes = new Set(actuales);
      restantes.delete(idNotificacion);
      return restantes;
    });
  };

  const agregarNotificacion = (notificacion: Notificacion) => {
    if (obtenerIdsGuardados(clavesNotificaciones(userId).eliminadas).includes(notificacion.id)) return;
    setNotificaciones((actuales) => [notificacion, ...actuales.filter((actual) => actual.id !== notificacion.id)].slice(0, 10));
    setNotificacionesNoLeidas((actuales) => new Set(actuales).add(notificacion.id));
  };

  // Tareas (Docente)
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState("");
  const [nuevaTareaDesc, setNuevaTareaDesc] = useState("");
  const [archivoNuevaTarea, setArchivoNuevaTarea] = useState<File | null>(null);

  // Entregas (Alumno)
  const [misEntregas, setMisEntregas] = useState<EntregaAlumno[]>([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<number | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [opcionEntrega, setOpcionEntrega] = useState<"archivo" | "texto">("archivo");

  // Calificaciones (Docente)
  const [entregas, setEntregas] = useState<EntregaAlumno[]>([]);
  const [notasTemp, setNotasTemp] = useState<{ [key: number]: string }>({});
  const [devolucionesTemp, setDevolucionesTemp] = useState<{ [key: number]: string }>({});
  const [calificacionEditable, setCalificacionEditable] = useState<number | null>(null);

  useEffect(() => {
    const cargarTodo = async () => {
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

      // 1. Obtener detalles de la materia
      const { data: matData } = await supabase
        .from("materias")
        .select("nombre, usuarios(nombre_completo)")
        .eq("id", id)
        .single();

      if (matData) {
        setMateriaNombre(matData.nombre);
        const docName = (matData.usuarios as unknown as { nombre_completo: string })?.nombre_completo;
        setMateriaDocente(docName || "Docente Asignado");
      }

      // 2. Cargar todo el contenido de la materia
      const [resAvisos, resMateriales, resMensajes, resTareas] = await Promise.all([
        supabase.from("avisos").select("*").eq("materia_id", id).order("fecha", { ascending: false }),
        supabase.from("materiales").select("*").eq("materia_id", id).order("id", { ascending: false }),
        supabase.from("mensajes_foro").select("*").eq("materia_id", id).order("id", { ascending: true }),
        supabase.from("tareas").select("*").eq("materia_id", id).order("fecha", { ascending: false })
      ]);

      if (resAvisos.data) setAvisos(resAvisos.data);
      if (resMateriales.data) setMateriales(resMateriales.data);
      if (resMensajes.data) setMensajes(resMensajes.data as MensajeForo[]);
      if (resTareas.data) setTareas(resTareas.data);

      const claves = clavesNotificaciones(userIdStored);
      const idsLeidos = obtenerIdsGuardados(claves.leidas);
      const idsEliminados = new Set(obtenerIdsGuardados(claves.eliminadas));

      // Consolidar Notificaciones dinámicamente
      const notifs: Notificacion[] = [];
      resTareas.data?.forEach(t => notifs.push({ id: `t-${t.id}`, tipo: 'Nueva Tarea', texto: t.titulo, fecha: t.fecha }));
      resMateriales.data?.forEach(m => notifs.push({ id: `m-${m.id}`, tipo: 'Material de Estudio', texto: m.titulo, fecha: m.fecha || new Date().toISOString() }));
      resAvisos.data?.forEach(a => notifs.push({ id: `a-${a.id}`, tipo: 'Aviso del Docente', texto: a.texto, fecha: a.fecha }));
      
      // Ordenar notificaciones de más reciente a más antigua
      notifs.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
      const notificacionesVisibles = notifs.filter((notificacion) => !idsEliminados.has(notificacion.id)).slice(0, 10);
      setNotificaciones(notificacionesVisibles);
      setNotificacionesNoLeidas(new Set(notificacionesVisibles.filter((notificacion) => !idsLeidos.includes(notificacion.id)).map((notificacion) => notificacion.id)));

      // 3. Cargar Entregas según el Rol
      if (roleStored === "docente") {
        const { data: entregasData } = await supabase
          .from("entregas")
          .select("*, usuarios(nombre_completo), tareas(titulo)")
          .eq("materia_id", id)
          .order("fecha", { ascending: false });
        if (entregasData) {
          setEntregas(entregasData as unknown as EntregaAlumno[]);
        }
      } else if (roleStored === "alumno") {
        const { data: misEntregasData } = await supabase
          .from("entregas")
          .select("*, tareas(titulo)")
          .eq("materia_id", id)
          .eq("alumno_id", userIdStored)
          .order("fecha", { ascending: false });
        if (misEntregasData) {
          setMisEntregas(misEntregasData as unknown as EntregaAlumno[]);
        }
      }

      setCargando(false);
    };

    cargarTodo();
  }, [id, router]);

  // CREAR TAREAS (Docente)
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
      materia_id: Number(id),
      titulo: nuevaTareaTitulo,
      descripcion: nuevaTareaDesc,
      url_archivo: urlArchivo
    }]).select();

    if (!error && data) {
      setTareas([data[0], ...tareas]);
      agregarNotificacion({ id: `t-${data[0].id}`, tipo: "Nueva Tarea", texto: data[0].titulo, fecha: data[0].fecha });
      setNuevaTareaTitulo("");
      setNuevaTareaDesc("");
      setArchivoNuevaTarea(null);
      if (fileTareaRef.current) fileTareaRef.current.value = "";
      showToast("Tarea enviada a los alumnos.", "success");
    } else {
      showToast("Error al crear la tarea.", "error");
    }
  };

  // ENTREGAR TAREA (Alumno)
  const handleDesadjuntar = () => {
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
      materia_id: Number(id),
      tarea_id: tareaSeleccionada,
      alumno_id: userId,
      tipo: opcionEntrega,
      contenido: contenidoFinal,
      peso: pesoFinal,
    }]).select("*, tareas(titulo)");

    if (!error && data) {
      showToast("¡Tarea entregada con éxito!", "success");
      setMisEntregas([data[0] as unknown as EntregaAlumno, ...misEntregas]);
      setRespuestaTexto("");
      handleDesadjuntar();
      setTareaSeleccionada(null); // Cierra el formulario de la tarea específica
    } else {
      showToast("Error al registrar la entrega.", "error");
    }
  };

  // CALIFICACIONES (Docente)
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
        entregas.map((e) =>
          e.id === idEntrega ? { ...e, nota, devolucion } : e,
        ),
      );
      setCalificacionEditable(null); // Bloquea la edición nuevamente
      showToast("¡Calificación guardada y asegurada!", "success");
    } else {
      showToast("Error al guardar la calificación.", "error");
    }
  };

  // AVISOS
  const handleAgregarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoAviso.trim()) return;

    const { data, error } = await supabase
      .from("avisos")
      .insert([{ materia_id: Number(id), texto: nuevoAviso }])
      .select();

    if (!error && data) {
      setAvisos([data[0], ...avisos]);
      agregarNotificacion({ id: `a-${data[0].id}`, tipo: "Aviso del Docente", texto: data[0].texto, fecha: data[0].fecha });
      setNuevoAviso("");
      showToast("Aviso publicado con éxito.", "success");
    } else {
      showToast("Error al publicar el aviso.", "error");
    }
  };

  const handleBorrarAviso = (idAviso: number) => {
    showConfirm("¿Estás seguro de que deseas eliminar este aviso?", async () => {
      const { error } = await supabase.from("avisos").delete().eq("id", idAviso);
      if (!error) {
        setAvisos((prev) => prev.filter((a) => a.id !== idAviso));
        showToast("Aviso eliminado correctamente.", "info");
      }
    }, "Eliminar Aviso");
  };

  // MATERIALES
  const handleAgregarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMaterial) {
      showToast("Selecciona un archivo antes de subir.", "warning");
      return;
    }
    const fileExt = nuevoMaterial.name.split(".").pop();
    const filePath = `materiales/${Date.now()}_${nuevoMaterial.name}`;
    const { error: uploadError } = await supabase.storage.from("archivos-educor").upload(filePath, nuevoMaterial);

    if (uploadError) return showToast("Error subiendo el archivo.", "error");
    
    const { data: urlData } = supabase.storage.from("archivos-educor").getPublicUrl(filePath);
    const pesoMB = (nuevoMaterial.size / (1024 * 1024)).toFixed(1) + " MB";

    const { data, error } = await supabase.from("materiales").insert([{
      materia_id: Number(id),
      titulo: nuevoMaterial.name,
      tipo: fileExt?.toUpperCase() || "FILE",
      peso: pesoMB,
      url_archivo: urlData.publicUrl,
    }]).select();

    if (!error && data) {
      setMateriales([data[0], ...materiales]);
      agregarNotificacion({ id: `m-${data[0].id}`, tipo: "Material de Estudio", texto: data[0].titulo, fecha: data[0].fecha || new Date().toISOString() });
      setNuevoMaterial(null);
      if (fileMaterialRef.current) fileMaterialRef.current.value = "";
      showToast("Material subido con éxito.", "success");
    }
  };

  const handleBorrarMaterial = (idMaterial: number) => {
    showConfirm("¿Eliminar este material de estudio?", async () => {
      const { error } = await supabase.from("materiales").delete().eq("id", idMaterial);
      if (!error) setMateriales((prev) => prev.filter((m) => m.id !== idMaterial));
    }, "Eliminar Material");
  };

  // FORO DE CONSULTAS
  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const { data, error } = await supabase.from("mensajes_foro").insert([{
      materia_id: Number(id),
      autor_id: userId,
      autor_nombre: usuario,
      rol: rol,
      texto: nuevoMensaje,
    }]).select();

    if (!error && data) {
      setMensajes([...mensajes, data[0] as MensajeForo]);
      setNuevoMensaje("");
    }
  };

  const handleGuardarEdicion = async (idMensaje: number) => {
    if (!textoEditado.trim()) return;
    const { error } = await supabase.from("mensajes_foro").update({ texto: textoEditado, editado: true }).eq("id", idMensaje);
    if (!error) {
      setMensajes(mensajes.map((m) => m.id === idMensaje ? { ...m, texto: textoEditado, editado: true } : m));
      setEditandoId(null);
      setTextoEditado("");
    }
  };

  const handleBorrarMensaje = (idMensaje: number) => {
    showConfirm("¿Eliminar este mensaje del foro?", async () => {
      const { error } = await supabase.from("mensajes_foro").delete().eq("id", idMensaje);
      if (!error) setMensajes((prev) => prev.filter((m) => m.id !== idMensaje));
    }, "Eliminar Mensaje");
  };

  if (cargando) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 px-4">
        <Image src="/EduCor.png" alt="EduCor Logo" width={64} height={64} priority className="h-16 w-16 object-contain animate-pulse mb-4" />
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-sm sm:text-base font-medium">Cargando aula virtual...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 py-4 px-3 sm:px-6 lg:px-8 overflow-x-hidden text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      
      {/* Top Header con Sistema de Notificaciones */}
      <header className="max-w-4xl mx-auto mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <button type="button" onClick={() => router.push("/dashboard")} aria-label="Volver al dashboard" className="flex items-center gap-3 cursor-pointer text-left">
          <span className="min-h-[44px] text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors">←</span>
          <Image src="/EduCor.png" alt="EduCor Logo" width={38} height={38} priority className="h-9 w-9 object-contain transition-transform" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Edu<span className="text-indigo-600 dark:text-indigo-400">Cor</span></h1>
        </button>
        
        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
          {/* Notificaciones del aula */}
          <div className="relative">
            <button 
              onClick={() => {
                const abriendo = !mostrarNotificaciones;
                setMostrarNotificaciones(abriendo);
                if (abriendo) marcarNotificacionesLeidas();
              }}
              type="button"
              aria-label="Abrir notificaciones"
              aria-expanded={mostrarNotificaciones}
              className="relative flex h-11 w-11 items-center justify-center rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M320 64C302.3 64 288 78.3 288 96L288 99.2C215 114 160 178.6 160 256L160 277.7C160 325.8 143.6 372.5 113.6 410.1L103.8 422.3C98.7 428.6 96 436.4 96 444.5C96 464.1 111.9 480 131.5 480L508.4 480C528 480 543.9 464.1 543.9 444.5C543.9 436.4 541.2 428.6 536.1 422.3L526.3 410.1C496.4 372.5 480 325.8 480 277.7L480 256C480 178.6 425 114 352 99.2L352 96C352 78.3 337.7 64 320 64zM258 528C265.1 555.6 290.2 576 320 576C349.8 576 374.9 555.6 382 528L258 528z"/></svg>
            </button>

            {/* Dropdown de Notificaciones */}
            {mostrarNotificaciones && (
              <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Novedades del Aula</h3>
                  <button onClick={() => setMostrarNotificaciones(false)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificaciones.length === 0 ? (
                    <p className="p-4 text-xs text-slate-500 text-center">No hay notificaciones recientes.</p>
                  ) : (
                    notificaciones.map((n) => (
                      <div key={n.id} className="flex items-start gap-3 border-b border-slate-100 p-3 text-xs transition-colors hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/50">
                        <div className="min-w-0 flex-1 break-words">
                          <span className="mb-1 block font-bold text-indigo-600 dark:text-indigo-400">{n.tipo}</span>
                          <span className="text-slate-600 dark:text-slate-300">{n.texto}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarNotificacion(n.id)}
                          aria-label={`Eliminar notificación: ${n.tipo}`}
                          title="Eliminar notificación"
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                        >
                          <span aria-hidden="true">×</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="max-w-[55vw] truncate text-xs sm:max-w-none sm:text-sm text-slate-600 dark:text-slate-300 font-medium">{usuario}</span>
            <span className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{rol}</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        
        {/* Encabezado de la Materia */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{materiaNombre}</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Docente: {materiaDocente}</p>
          </div>
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900 p-4 rounded-xl flex flex-col items-center w-full md:w-64 shrink-0">
            <span className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold mb-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span> Clase en Vivo
            </span>
            <button onClick={() => router.push(`/dashboard/materia/${id}/sala`)} className="w-full min-h-[44px] bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl hover:from-indigo-600 hover:to-indigo-800 transition-all shadow-md active:scale-95 cursor-pointer">
              Unirse a la Sala
            </button>
          </div>
        </div>

        {/* MÓDULO DE ASIGNACIONES (TAREAS) */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            Trabajos Prácticos y Asignaciones
          </h2>
          
          {/* Docente: Crear Tarea */}
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

          {/* Listado de Tareas */}
          <div className="space-y-4">
            {tareas.length === 0 ? (
              <p className="text-xs text-slate-500">No hay tareas asignadas en esta materia.</p>
            ) : (
              tareas.map(t => {
                const entregaRealizada = misEntregas.find(e => e.tarea_id === t.id);
                return (
                  <div key={t.id} className="p-4 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <h3 className="min-w-0 break-words font-bold text-slate-800 dark:text-slate-100 text-sm">{t.titulo}</h3>
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
                    
                    {/* Botón del Alumno para desplegar formulario */}
                    {rol === "alumno" && !entregaRealizada && tareaSeleccionada !== t.id && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                        <button onClick={() => setTareaSeleccionada(t.id)} className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer">
                          Realizar Entrega
                        </button>
                      </div>
                    )}
                    
                    {/* Formulario de Entrega (Se abre bajo la tarea seleccionada) */}
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
                            {archivo && <button type="button" onClick={handleDesadjuntar} className="self-start text-xs text-rose-600 font-semibold cursor-pointer">Desadjuntar</button>}
                          </div>
                        ) : (
                          <textarea value={respuestaTexto} onChange={e => setRespuestaTexto(e.target.value)} rows={3} className="w-full text-xs p-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Escribe tu respuesta aquí..." />
                        )}
                        
                        <div className="flex flex-col sm:flex-row gap-2 pt-2">
                          <button type="submit" className="w-full sm:w-auto bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer">
                            Enviar Trabajo
                          </button>
                          <button type="button" onClick={() => setTareaSeleccionada(null)} className="w-full sm:w-auto bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs px-4 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors cursor-pointer">
                            Cancelar
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Feedback del Docente visible para el alumno */}
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

        {/* VISTA DOCENTE: Corregir Entregas Bloqueadas */}
        {rol === "docente" && (
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Trabajos Recibidos ({entregas.length})
            </h2>
            <div className="space-y-4">
              {entregas.map((e) => (
                <div key={e.id} className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-800/50 space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                    <span>{e.usuarios?.nombre_completo || "Alumno"} - <span className="text-indigo-600 dark:text-indigo-400">{e.tareas?.titulo || "Tarea General"}</span></span>
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

                  {/* Lógica de Bloqueo de Corrección */}
                  {e.nota && calificacionEditable !== e.id ? (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs gap-2">
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 mr-2 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">Nota: {e.nota}</span>
                        <span className="text-slate-600 dark:text-slate-400 italic">&quot;{e.devolucion}&quot;</span>
                      </div>
                      <button 
                        onClick={() => {
                          setNotasTemp({...notasTemp, [e.id]: e.nota});
                          setDevolucionesTemp({...devolucionesTemp, [e.id]: e.devolucion});
                          setCalificacionEditable(e.id);
                        }} 
                        className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer whitespace-nowrap"
                      >
                        Editar Corrección
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 items-center pt-2">
                      <input type="text" placeholder="Nota" defaultValue={notasTemp[e.id] || ""} onChange={(ev) => setNotasTemp({ ...notasTemp, [e.id]: ev.target.value })} className="w-20 min-h-[40px] px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      <input type="text" placeholder="Devolución al alumno" defaultValue={devolucionesTemp[e.id] || ""} onChange={(ev) => setDevolucionesTemp({ ...devolucionesTemp, [e.id]: ev.target.value })} className="min-w-0 w-full sm:flex-1 min-h-[40px] px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      <button type="button" onClick={() => handleGuardarCalificacion(e.id)} className="min-h-[40px] px-4 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 cursor-pointer shadow-sm">
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
        )}

        {/* Grid Avisos y Materiales Antiguos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Avisos del Docente</h2>
            {rol === "docente" && (
              <form onSubmit={handleAgregarAviso} className="flex flex-col sm:flex-row gap-2 mb-4">
                <input type="text" value={nuevoAviso} onChange={(e) => setNuevoAviso(e.target.value)} placeholder="Nuevo aviso rápido..." className="flex-1 min-h-[44px] text-xs sm:text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" className="min-h-[44px] bg-indigo-600 text-white text-xs sm:text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 font-semibold cursor-pointer">Publicar</button>
              </form>
            )}
            <div className="space-y-3">
              {avisos.map((a) => (
                <div key={a.id} className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex justify-between items-start">
                  <p className="leading-relaxed">{a.texto}</p>
                  {rol === "docente" && <button onClick={() => handleBorrarAviso(a.id)} className="text-rose-500 hover:text-rose-700 font-bold text-xs ml-2 cursor-pointer p-1">✕</button>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">Material de Estudio</h2>
            {rol === "docente" && (
              <form onSubmit={handleAgregarMaterial} className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                <input ref={fileMaterialRef} type="file" onChange={(e) => setNuevoMaterial(e.target.files?.[0] || null)} className="min-h-[44px] text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 font-medium" />
                <button type="submit" className="min-h-[40px] bg-indigo-600 text-white text-xs px-3.5 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold self-end cursor-pointer">Subir Material</button>
              </form>
            )}
            <div className="space-y-3">
              {materiales.map((m) => (
                <div key={m.id} className="p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">{m.titulo}</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{m.tipo} - {m.peso}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a href={m.url_archivo} target="_blank" rel="noopener noreferrer" className="min-h-[38px] text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold flex items-center">Descargar</a>
                    {rol === "docente" && <button onClick={() => handleBorrarMaterial(m.id)} className="min-h-[38px] text-rose-500 text-xs px-2.5 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-50 cursor-pointer">Borrar</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Foro de Consultas */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Foro de Consultas</h2>
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {mensajes.map((m) => {
              const esAutor = userId === m.autor_id;
              const puedeBorrar = rol === "docente" || esAutor;

              return (
                <div key={m.id} className={`p-3 rounded-xl text-xs sm:text-sm ${m.rol === "docente" ? "bg-indigo-50/70 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900" : "bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700"}`}>
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>{m.autor_nombre} ({m.rol.toUpperCase()}){m.editado && <span className="font-normal italic text-slate-500 ml-1">(Editado)</span>}</span>
                    <div className="flex gap-3">
                      {esAutor && <button onClick={() => { setEditandoId(m.id); setTextoEditado(m.texto); }} className="text-indigo-600 hover:underline cursor-pointer">Editar</button>}
                      {puedeBorrar && <button onClick={() => handleBorrarMensaje(m.id)} className="text-rose-500 hover:underline cursor-pointer">Borrar</button>}
                    </div>
                  </div>
                  
                  {editandoId === m.id ? (
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
                      <input type="text" value={textoEditado} onChange={(e) => setTextoEditado(e.target.value)} className="flex-1 text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                      <button onClick={() => handleGuardarEdicion(m.id)} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 cursor-pointer">Guardar</button>
                      <button onClick={() => setEditandoId(null)} className="bg-slate-400 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-500 cursor-pointer">Cancelar</button>
                    </div>
                  ) : (
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{m.texto}</p>
                  )}
                </div>
              );
            })}
          </div>
          <form onSubmit={handleEnviarMensaje} className="flex flex-col sm:flex-row gap-2">
            <input type="text" value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} placeholder="Escribe tu consulta..." className="flex-1 min-h-[44px] text-xs sm:text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" className="min-h-[44px] bg-indigo-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 cursor-pointer">Enviar</button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function MateriaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 font-medium">
        <Image src="/EduCor.png" alt="EduCor Logo" width={56} height={56} priority className="h-14 w-14 object-contain animate-pulse mb-3" />
        <p className="text-sm">Cargando aula...</p>
      </div>
    }>
      <ContenidoMateria />
    </Suspense>
  );
}
