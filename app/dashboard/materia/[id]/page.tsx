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
}

interface EntregaAlumno {
  id: number;
  materia_id: number;
  alumno_id: string;
  usuarios?: { nombre_completo: string };
  fecha: string;
  tipo: "archivo" | "texto";
  contenido: string;
  peso?: string;
  nota: string;
  devolucion: string;
}

interface MensajeForo {
  id: number;
  autor_id: string; // <-- Aseguramos tener el ID del autor
  autor_nombre: string;
  rol: string;
  texto: string;
  fecha: string;
  editado?: boolean; // <-- Nueva propiedad de edición
}

function ContenidoMateria() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [usuario, setUsuario] = useState("");
  const [userId, setUserId] = useState(""); // <-- Nuevo estado para el ID del usuario actual
  const [rol, setRol] = useState("");
  const [materiaNombre, setMateriaNombre] = useState("Cargando...");
  const [materiaDocente, setMateriaDocente] = useState("");
  const [cargando, setCargando] = useState(true);
  const { showToast, showConfirm } = useToast();

  // Referencias para selector de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMaterialRef = useRef<HTMLInputElement>(null);

  // Estados de la materia
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [nuevoAviso, setNuevoAviso] = useState("");

  const [materiales, setMateriales] = useState<Material[]>([]);
  const [nuevoMaterial, setNuevoMaterial] = useState<File | null>(null);

  // Estados del Foro
  const [mensajes, setMensajes] = useState<MensajeForo[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null); // <-- ID del mensaje en edición
  const [textoEditado, setTextoEditado] = useState(""); // <-- Texto temporal editado

  // Estados del Alumno
  const [misEntregas, setMisEntregas] = useState<EntregaAlumno[]>([]); // <-- Nuevo estado
  const [archivo, setArchivo] = useState<File | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [opcionEntrega, setOpcionEntrega] = useState<"archivo" | "texto">(
    "archivo",
  );

  // Estados del Docente
  const [entregas, setEntregas] = useState<EntregaAlumno[]>([]);
  const [notasTemp, setNotasTemp] = useState<{ [key: number]: string }>({});
  const [devolucionesTemp, setDevolucionesTemp] = useState<{
    [key: number]: string;
  }>({});

  useEffect(() => {
    const cargarTodo = async () => {
      const userStored = sessionStorage.getItem("usuario");
      const roleStored = sessionStorage.getItem("rol");
      const userIdStored = sessionStorage.getItem("usuario_id"); // <-- Obtenemos el ID

      if (!userStored || !userIdStored) {
        router.push("/");
        return;
      }

      setUsuario(userStored);
      setRol(roleStored || "alumno");
      setUserId(userIdStored); // <-- Guardamos el ID en el estado

      // 1. Obtener detalles de la materia
      const { data: matData } = await supabase
        .from("materias")
        .select("nombre, usuarios(nombre_completo)")
        .eq("id", id)
        .single();

      if (matData) {
        setMateriaNombre(matData.nombre);
        const docName = (
          matData.usuarios as unknown as { nombre_completo: string }
        )?.nombre_completo;
        setMateriaDocente(docName || "Docente Asignado");
      }

      // 2. Cargar Avisos
      const { data: avisosData } = await supabase
        .from("avisos")
        .select("*")
        .eq("materia_id", id)
        .order("fecha", { ascending: false });
      if (avisosData) setAvisos(avisosData);

      // 3. Cargar Materiales
      const { data: materialesData } = await supabase
        .from("materiales")
        .select("*")
        .eq("materia_id", id)
        .order("id", { ascending: false });
      if (materialesData) setMateriales(materialesData);

      // 4. Cargar Mensajes del Foro
      const { data: mensajesData } = await supabase
        .from("mensajes_foro")
        .select("*")
        .eq("materia_id", id)
        .order("id", { ascending: true });
      if (mensajesData) setMensajes(mensajesData as MensajeForo[]);

      // 5. Cargar Entregas según el Rol
      if (roleStored === "docente") {
        const { data: entregasData } = await supabase
          .from("entregas")
          .select("*, usuarios(nombre_completo)")
          .eq("materia_id", id)
          .order("fecha", { ascending: false });
        if (entregasData) {
          setEntregas(entregasData as unknown as EntregaAlumno[]);
        }
      } else if (roleStored === "alumno") {
        const { data: misEntregasData } = await supabase
          .from("entregas")
          .select("*")
          .eq("materia_id", id)
          .eq("alumno_id", userIdStored)
          .order("fecha", { ascending: false });
        if (misEntregasData) {
          setMisEntregas(misEntregasData as EntregaAlumno[]);
        }
      }

      setCargando(false);
    };

    cargarTodo();
  }, [id, router]);

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
      setNuevoAviso("");
      showToast("Aviso publicado con éxito.", "success");
    } else {
      showToast("Error al publicar el aviso.", "error");
    }
  };

  const handleBorrarAviso = (idAviso: number) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar este aviso?",
      async () => {
        const { error } = await supabase
          .from("avisos")
          .delete()
          .eq("id", idAviso);
        if (!error) {
          setAvisos((prev) => prev.filter((a) => a.id !== idAviso));
          showToast("Aviso eliminado correctamente.", "info");
        } else {
          showToast("Error al eliminar el aviso.", "error");
        }
      },
      "Eliminar Aviso",
    );
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

    const { error: uploadError } = await supabase.storage
      .from("archivos-educor")
      .upload(filePath, nuevoMaterial);

    if (uploadError) {
      showToast(
        "Error subiendo el archivo. Asegúrate de haber creado el bucket 'archivos-educor' en Supabase.",
        "error",
      );
      return;
    }

    const { data: urlData } = supabase.storage
      .from("archivos-educor")
      .getPublicUrl(filePath);

    const pesoMB = (nuevoMaterial.size / (1024 * 1024)).toFixed(1) + " MB";

    const { data, error } = await supabase
      .from("materiales")
      .insert([
        {
          materia_id: Number(id),
          titulo: nuevoMaterial.name,
          tipo: fileExt?.toUpperCase() || "FILE",
          peso: pesoMB,
          url_archivo: urlData.publicUrl,
        },
      ])
      .select();

    if (!error && data) {
      setMateriales([data[0], ...materiales]);
      setNuevoMaterial(null);
      if (fileMaterialRef.current) fileMaterialRef.current.value = "";
      showToast("Material de estudio subido con éxito.", "success");
    }
  };

  const handleBorrarMaterial = (idMaterial: number) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar este material de estudio?",
      async () => {
        const { error } = await supabase
          .from("materiales")
          .delete()
          .eq("id", idMaterial);
        if (!error) {
          setMateriales((prev) => prev.filter((m) => m.id !== idMaterial));
          showToast("Material eliminado.", "info");
        } else {
          showToast("Error al eliminar el material.", "error");
        }
      },
      "Eliminar Material",
    );
  };

  // ENTREGAS (Alumno)
  const handleDesadjuntar = () => {
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEnviarTarea = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const { error: uploadError } = await supabase.storage
        .from("archivos-educor")
        .upload(fileName, archivo);

      if (uploadError) {
        showToast("Error al subir el trabajo. Intente nuevamente.", "error");
        return;
      }

      const { data: urlData } = supabase.storage
        .from("archivos-educor")
        .getPublicUrl(fileName);

      contenidoFinal = urlData.publicUrl;
      pesoFinal = (archivo.size / (1024 * 1024)).toFixed(1) + " MB";
    } else {
      if (!respuestaTexto.trim()) {
        showToast(
          "Por favor escribe una respuesta antes de enviar.",
          "warning",
        );
        return;
      }
    }

    const { error } = await supabase.from("entregas").insert([
      {
        materia_id: Number(id),
        alumno_id: userId,
        tipo: opcionEntrega,
        contenido: contenidoFinal,
        peso: pesoFinal,
      },
    ]);

    if (!error) {
      showToast("¡Tarea entregada con éxito!", "success");
      setRespuestaTexto("");
      handleDesadjuntar();
      const nuevaEntrega: EntregaAlumno = {
        id: Date.now(),
        materia_id: Number(id),
        alumno_id: userId,
        tipo: opcionEntrega,
        contenido: contenidoFinal,
        peso: pesoFinal,
        nota: "",
        devolucion: "",
        fecha: new Date().toISOString(),
      };
      setMisEntregas((prev) => [nuevaEntrega, ...prev]);
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
      showToast("¡Calificación guardada exitosamente!", "success");
    } else {
      showToast("Error al guardar la calificación.", "error");
    }
  };

  // FORO DE CONSULTAS
  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const { data, error } = await supabase
      .from("mensajes_foro")
      .insert([
        {
          materia_id: Number(id),
          autor_id: userId,
          autor_nombre: usuario,
          rol: rol,
          texto: nuevoMensaje,
        },
      ])
      .select();

    if (!error && data) {
      setMensajes([...mensajes, data[0] as MensajeForo]);
      setNuevoMensaje("");
      showToast("Consulta enviada al foro.", "success");
    } else {
      showToast("Error al enviar la consulta.", "error");
    }
  };

  // <-- NUEVA FUNCIÓN: Guardar Edición del Alumno
  const handleGuardarEdicion = async (idMensaje: number) => {
    if (!textoEditado.trim()) return;

    const { error } = await supabase
      .from("mensajes_foro")
      .update({ texto: textoEditado, editado: true })
      .eq("id", idMensaje);

    if (!error) {
      setMensajes(
        mensajes.map((m) =>
          m.id === idMensaje ? { ...m, texto: textoEditado, editado: true } : m,
        ),
      );
      setEditandoId(null);
      setTextoEditado("");
      showToast("Mensaje editado correctamente.", "success");
    } else {
      showToast("Error al editar el mensaje.", "error");
    }
  };

  const handleBorrarMensaje = (idMensaje: number) => {
    showConfirm(
      "¿Deseas eliminar este mensaje del foro?",
      async () => {
        const { error } = await supabase
          .from("mensajes_foro")
          .delete()
          .eq("id", idMensaje);
        if (!error) {
          setMensajes((prev) => prev.filter((m) => m.id !== idMensaje));
          showToast("Mensaje eliminado del foro.", "info");
        } else {
          showToast("Error al eliminar el mensaje.", "error");
        }
      },
      "Eliminar Mensaje",
    );
  };

  if (cargando) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 px-4">
        <Image
          src="/EduCor.png"
          alt="EduCor Logo"
          width={64}
          height={64}
          priority
          className="h-16 w-16 object-contain animate-pulse mb-4"
        />
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-sm sm:text-base font-medium">
          Cargando aula virtual...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 py-4 px-3 sm:px-6 lg:px-8 overflow-x-hidden text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* Top Header */}
      <header className="max-w-4xl mx-auto mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <button
            onClick={() => router.push("/dashboard")}
            className="min-h-[44px] text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors"
          >
            ←
          </button>
          <Image
            src="/EduCor.png"
            alt="EduCor Logo"
            width={38}
            height={38}
            priority
            className="h-9 w-9 object-contain transition-transform"
          />
          <h1
            onClick={() => router.push("/dashboard")}
            className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white"
          >
            Edu<span className="text-indigo-600 dark:text-indigo-400">Cor</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
            {usuario}
          </span>
          <span className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
            {rol}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Encabezado y Videollamada */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {materiaNombre}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Docente: {materiaDocente}
            </p>
          </div>

          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900 p-4 rounded-xl flex flex-col items-center w-full md:w-64 shrink-0">
            <span className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold mb-2 text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              Clase en Vivo
            </span>
            <button
              onClick={() => router.push(`/dashboard/materia/${id}/sala`)}
              className="w-full min-h-[44px] bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl hover:from-indigo-600 hover:to-indigo-800 transition-all shadow-md shadow-indigo-500/20 active:scale-95 cursor-pointer"
            >
              Unirse a la Sala
            </button>
          </div>
        </div>

        {/* Grid Avisos y Materiales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Avisos */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Avisos del Docente
            </h2>
            {rol === "docente" && (
              <form onSubmit={handleAgregarAviso} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={nuevoAviso}
                  onChange={(e) => setNuevoAviso(e.target.value)}
                  placeholder="Nuevo aviso rápido..."
                  className="flex-1 min-h-[44px] text-xs sm:text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="min-h-[44px] bg-indigo-600 text-white text-xs sm:text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 font-semibold cursor-pointer"
                >
                  Publicar
                </button>
              </form>
            )}
            <div className="space-y-3">
              {avisos.map((a) => (
                <div
                  key={a.id}
                  className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex justify-between items-start"
                >
                  <p className="leading-relaxed">{a.texto}</p>
                  {rol === "docente" && (
                    <button
                      onClick={() => handleBorrarAviso(a.id)}
                      className="text-rose-500 hover:text-rose-700 font-bold text-xs ml-2 cursor-pointer p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {avisos.length === 0 && (
                <p className="text-xs text-slate-500">
                  No hay avisos registrados.
                </p>
              )}
            </div>
          </div>

          {/* Materiales */}
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Material de Estudio
            </h2>
            {rol === "docente" && (
              <form
                onSubmit={handleAgregarMaterial}
                className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <input
                  ref={fileMaterialRef}
                  type="file"
                  onChange={(e) =>
                    setNuevoMaterial(e.target.files?.[0] || null)
                  }
                  className="min-h-[44px] text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 font-medium"
                />
                <button
                  type="submit"
                  className="min-h-[40px] bg-indigo-600 text-white text-xs px-3.5 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold self-end cursor-pointer"
                >
                  Subir Material
                </button>
              </form>
            )}
            <div className="space-y-3">
              {materiales.map((m) => (
                <div
                  key={m.id}
                  className="p-3 border border-slate-200/80 dark:border-slate-800 rounded-xl flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {m.titulo}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {m.tipo} - {m.peso}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={m.url_archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[38px] text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold flex items-center"
                    >
                      Descargar
                    </a>
                    {rol === "docente" && (
                      <button
                        onClick={() => handleBorrarMaterial(m.id)}
                        className="min-h-[38px] text-rose-500 text-xs px-2.5 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {materiales.length === 0 && (
                <p className="text-xs text-slate-500">
                  No hay materiales de estudio disponibles.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Vista Alumno: Entrega */}
        {rol === "alumno" && (
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
              Entregar Trabajo Práctico
            </h2>
            <div className="flex border-b border-slate-200 dark:border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => setOpcionEntrega("archivo")}
                className={`min-h-[44px] py-2 px-4 text-xs sm:text-sm font-semibold cursor-pointer ${opcionEntrega === "archivo" ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}
              >
                Opción 1: Subir Archivo
              </button>
              <button
                type="button"
                onClick={() => setOpcionEntrega("texto")}
                className={`min-h-[44px] py-2 px-4 text-xs sm:text-sm font-semibold cursor-pointer ${opcionEntrega === "texto" ? "border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}
              >
                Opción 2: Texto Plano
              </button>
            </div>
            <form onSubmit={handleEnviarTarea} className="space-y-4">
              {opcionEntrega === "archivo" && (
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                    className="min-h-[44px] text-xs sm:text-sm text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:bg-indigo-50 file:text-indigo-700"
                  />
                  {archivo && (
                    <button
                      type="button"
                      onClick={handleDesadjuntar}
                      className="min-h-[44px] text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                    >
                      Desadjuntar
                    </button>
                  )}
                </div>
              )}
              {opcionEntrega === "texto" && (
                <textarea
                  value={respuestaTexto}
                  onChange={(e) => setRespuestaTexto(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Escribe tu respuesta aquí..."
                />
              )}
              <button
                type="submit"
                className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-sm"
              >
                Enviar Tarea
              </button>
            </form>
            {/* Historial de Entregas y Feedback */}
            {misEntregas.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-4">
                  Mis Entregas y Calificaciones
                </h3>
                <div className="space-y-4">
                  {misEntregas.map((entrega) => (
                    <div 
                      key={entrega.id} 
                      className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/40"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Formato: {entrega.tipo}
                          </span>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${entrega.nota ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'}`}>
                          {entrega.nota ? `Nota: ${entrega.nota}` : 'Pendiente de revisión'}
                        </span>
                      </div>
                      
                      {/* Mostrar Feedback del Docente si existe */}
                      {entrega.devolucion ? (
                        <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 rounded-lg">
                          <p className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-wider">
                            Comentario:
                          </p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">
                            &quot;{entrega.devolucion}&quot;
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic mt-2">
                          El docente aún no ha dejado comentarios.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
        )}

        {/* Vista Docente: Corregir Entregas */}
        {rol === "docente" && (
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Trabajos Recibidos ({entregas.length})
            </h2>
            <div className="space-y-4">
              {entregas.map((e) => (
                <div
                  key={e.id}
                  className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-800/50 space-y-2"
                >
                  <div className="flex justify-between text-xs sm:text-sm font-bold">
                    <span>{e.usuarios?.nombre_completo || "Alumno"}</span>
                    <span className="text-xs text-indigo-700 dark:text-indigo-400">
                      {e.nota ? `Nota: ${e.nota}` : "Pendiente"}
                    </span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs">
                    {e.tipo === "archivo" ? (
                      <a
                        href={e.contenido}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline font-semibold"
                      >
                        Abrir Archivo Adjunto ({e.peso})
                      </a>
                    ) : (
                      <p className="italic text-slate-700 dark:text-slate-300 leading-relaxed">
                        {e.contenido}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center pt-2">
                    <input
                      type="text"
                      placeholder="Nota"
                      defaultValue={e.nota}
                      onChange={(ev) =>
                        setNotasTemp({ ...notasTemp, [e.id]: ev.target.value })
                      }
                      className="w-20 min-h-[40px] px-2.5 py-1 text-xs border rounded-lg bg-white dark:bg-slate-800"
                    />
                    <input
                      type="text"
                      placeholder="Devolución al alumno"
                      defaultValue={e.devolucion}
                      onChange={(ev) =>
                        setDevolucionesTemp({
                          ...devolucionesTemp,
                          [e.id]: ev.target.value,
                        })
                      }
                      className="flex-1 min-h-[40px] px-2.5 py-1 text-xs border rounded-lg bg-white dark:bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => handleGuardarCalificacion(e.id)}
                      className="min-h-[40px] px-3.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 cursor-pointer"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              ))}
              {entregas.length === 0 && (
                <p className="text-xs text-slate-500">
                  No se han recibido entregas aún.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Foro de Consultas - Modificado para Autonomía del Alumno */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            Foro de Consultas
          </h2>
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {mensajes.map((m) => {
              // Validamos la propiedad del mensaje y permisos
              const esAutor = userId === m.autor_id;
              const puedeBorrar = rol === "docente" || esAutor;

              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl text-xs sm:text-sm ${m.rol === "docente" ? "bg-indigo-50/70 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900" : "bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700"}`}
                >
                  <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    <span>
                      {m.autor_nombre} ({m.rol.toUpperCase()})
                      {m.editado && (
                        <span className="font-normal italic text-slate-500 ml-1">
                          (Editado)
                        </span>
                      )}
                    </span>
                    <div className="flex gap-3">
                      {esAutor && (
                        <button
                          onClick={() => {
                            setEditandoId(m.id);
                            setTextoEditado(m.texto);
                          }}
                          className="text-indigo-600 hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                      )}
                      {puedeBorrar && (
                        <button
                          onClick={() => handleBorrarMensaje(m.id)}
                          className="text-rose-500 hover:underline cursor-pointer"
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  </div>

                  {editandoId === m.id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={textoEditado}
                        onChange={(e) => setTextoEditado(e.target.value)}
                        className="flex-1 text-sm border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleGuardarEdicion(m.id)}
                        className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 cursor-pointer"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditandoId(null)}
                        className="bg-slate-400 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-500 cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">
                      {m.texto}
                    </p>
                  )}
                </div>
              );
            })}
            {mensajes.length === 0 && (
              <p className="text-xs text-slate-500">
                No hay consultas en el foro.
              </p>
            )}
          </div>
          <form onSubmit={handleEnviarMensaje} className="flex gap-2">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="flex-1 min-h-[44px] text-xs sm:text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="min-h-[44px] bg-indigo-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 cursor-pointer"
            >
              Enviar
            </button>
          </form>
        </div>
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
            src="/EduCor.png"
            alt="EduCor Logo"
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
