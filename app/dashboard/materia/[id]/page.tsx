"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";
import {
  useEditor,
  useEditorState,
  EditorContent,
  Editor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

const MateriaGamificacion = dynamic(
  () => import("@/components/MateriaGamificacion"),
  { ssr: false },
);

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
  url_archivo_2?: string | null;
  enlaces?: string[];
  fecha: string;
  editado_en?: string | null;
}

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

const formatearFechaHora = (fechaStr?: string | null) => {
  if (!fechaStr) return "";
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return fechaStr;
  return `${d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })} a las ${d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })} hs`;
};

const generarRutaArchivo = (carpeta: string, nombreOriginal: string) => {
  return `${carpeta}/${Date.now()}_${nombreOriginal}`;
};

const obtenerFechaActualISO = () => {
  return new Date().toISOString();
};

const getClavesNotificaciones = (idUsuario: string, materiaId: string) => {
  const alcance = `${idUsuario}:${materiaId}`;
  return {
    leidas: `AulaLink:notificaciones:leidas:${alcance}`,
    eliminadas: `AulaLink:notificaciones:eliminadas:${alcance}`,
  };
};

const EditorMenuBar = ({ editor }: { editor: Editor | null }) => {
  const active = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      underline: editor?.isActive("underline") ?? false,
      h1: editor?.isActive("heading", { level: 1 }) ?? false,
      h2: editor?.isActive("heading", { level: 2 }) ?? false,
      paragraph: editor?.isActive("paragraph") ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
    }),
  }) ?? {
    bold: false,
    italic: false,
    underline: false,
    h1: false,
    h2: false,
    paragraph: false,
    bulletList: false,
    orderedList: false,
  };

  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-t-lg border-b border-slate-300 dark:border-slate-600">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 text-xs rounded font-bold transition-colors ${active.bold ? "bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
      >
        B
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 text-xs rounded italic transition-colors ${active.italic ? "bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
      >
        I
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`px-2 py-1 text-xs rounded underline transition-colors ${active.underline ? "bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
      >
        U
      </button>
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`px-2 py-1 text-xs rounded font-bold transition-colors ${active.h1 ? "bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`px-2 py-1 text-xs rounded font-bold transition-colors ${active.h2 ? "bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`px-2 py-1 text-xs rounded transition-colors ${active.paragraph ? "bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
      >
        Texto normal
      </button>
      <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`px-2 py-1 text-xs rounded transition-colors ${active.bulletList ? "bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
      >
        • Lista
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`px-2 py-1 text-xs rounded transition-colors ${active.orderedList ? "bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-100" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"}`}
      >
        1. Lista
      </button>
    </div>
  );
};

const RichTextEditor = ({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) => {
  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "assignment-rich-text focus:outline-none min-h-[120px] p-3 text-slate-800 dark:text-slate-200",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(content, { emitUpdate: false });
      editor.commands.setTextSelection({ from, to });
    }
  }, [content, editor]);

  return (
    <div className="border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-700 shadow-inner">
      <EditorMenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

function ContenidoMateria() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [usuario, setUsuario] = useState("");
  const [userId, setUserId] = useState("");
  const [rol, setRol] = useState("");
  const [materiaNombre, setMateriaNombre] = useState("Cargando...");
  const [materiaDocente, setMateriaDocente] = useState("");
  const [gamificationActive, setGamificationActive] = useState<boolean>(false);
  const [cargando, setCargando] = useState(true);
  const { showToast, showConfirm } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMaterialRef = useRef<HTMLInputElement>(null);
  const fileTareaRef = useRef<HTMLInputElement>(null);

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [nuevoAviso, setNuevoAviso] = useState("");

  const [materiales, setMateriales] = useState<Material[]>([]);
  const [nuevoMaterial, setNuevoMaterial] = useState<File | null>(null);

  const [mensajes, setMensajes] = useState<MensajeForo[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [textoEditado, setTextoEditado] = useState("");

  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState<
    Set<string>
  >(new Set());
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);

  // Tareas (Docente)
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState("");
  const [nuevaTareaDesc, setNuevaTareaDesc] = useState("");
  const [archivosNuevaTarea, setArchivosNuevaTarea] = useState<File[]>([]);
  const [enlacesNuevaTarea, setEnlacesNuevaTarea] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");

  const [mostrarBanco, setMostrarBanco] = useState(false);
  const [tareasBanco, setTareasBanco] = useState<TareaBanco[]>([]);
  const [cargandoBanco, setCargandoBanco] = useState(false);

  const [editandoTareaId, setEditandoTareaId] = useState<number | null>(null);
  const [editTareaTitulo, setEditTareaTitulo] = useState("");
  const [editTareaDesc, setEditTareaDesc] = useState("");
  const [editTareaArchivosNuevos, setEditTareaArchivosNuevos] = useState<
    File[]
  >([]);
  const [editTareaUrlsExistentes, setEditTareaUrlsExistentes] = useState<
    string[]
  >([]);
  const [editTareaEnlaces, setEditTareaEnlaces] = useState<string[]>([]);
  const [editLinkInput, setEditLinkInput] = useState("");

  const [misEntregas, setMisEntregas] = useState<EntregaAlumno[]>([]);
  const [tareaSeleccionada, setTareaSeleccionada] = useState<number | null>(
    null,
  );
  const [archivo, setArchivo] = useState<File | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [opcionEntrega, setOpcionEntrega] = useState<"archivo" | "texto">(
    "archivo",
  );

  const [entregas, setEntregas] = useState<EntregaAlumno[]>([]);
  const [notasTemp, setNotasTemp] = useState<{ [key: number]: string }>({});
  const [devolucionesTemp, setDevolucionesTemp] = useState<{
    [key: number]: string;
  }>({});
  const [calificacionEditable, setCalificacionEditable] = useState<
    number | null
  >(null);

  const obtenerIdsGuardados = (clave: string): string[] => {
    try {
      const ids: unknown = JSON.parse(localStorage.getItem(clave) || "[]");
      return Array.isArray(ids)
        ? ids.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  };

  const guardarIds = (clave: string, ids: string[]) => {
    try {
      localStorage.setItem(clave, JSON.stringify(ids));
    } catch {}
  };

  const marcarNotificacionesLeidas = () => {
    const idsLeidos = obtenerIdsGuardados(
      getClavesNotificaciones(userId, id).leidas,
    );
    guardarIds(getClavesNotificaciones(userId, id).leidas, [
      ...new Set([...idsLeidos, ...notificaciones.map((n) => n.id)]),
    ]);
    setNotificacionesNoLeidas(new Set());
  };

  const eliminarNotificacion = (idNotificacion: string) => {
    const claves = getClavesNotificaciones(userId, id);
    const idsEliminados = obtenerIdsGuardados(claves.eliminadas);
    guardarIds(claves.eliminadas, [
      ...new Set([...idsEliminados, idNotificacion]),
    ]);
    setNotificaciones((actuales) =>
      actuales.filter((notificacion) => notificacion.id !== idNotificacion),
    );
    setNotificacionesNoLeidas((actuales) => {
      const restantes = new Set(actuales);
      restantes.delete(idNotificacion);
      return restantes;
    });
  };

  const agregarNotificacion = (notificacion: Notificacion) => {
    if (
      obtenerIdsGuardados(
        getClavesNotificaciones(userId, id).eliminadas,
      ).includes(notificacion.id)
    )
      return;
    setNotificaciones((actuales) =>
      [
        notificacion,
        ...actuales.filter((actual) => actual.id !== notificacion.id),
      ].slice(0, 10),
    );
    setNotificacionesNoLeidas((actuales) =>
      new Set(actuales).add(notificacion.id),
    );
  };

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

      const { data: matData } = await supabase
        .from("materias")
        .select("nombre, gamification_active, usuarios(nombre_completo)")
        .eq("id", id)
        .single();
      if (matData) {
        setMateriaNombre(matData.nombre);
        setGamificationActive(!!matData.gamification_active);
        const docName = (
          matData.usuarios as unknown as { nombre_completo: string }
        )?.nombre_completo;
        setMateriaDocente(docName || "Docente Asignado");
      }

      const [resAvisos, resMateriales, resMensajes, resTareas] =
        await Promise.all([
          supabase
            .from("avisos")
            .select("*")
            .eq("materia_id", id)
            .order("fecha", { ascending: false }),
          supabase
            .from("materiales")
            .select("*")
            .eq("materia_id", id)
            .order("id", { ascending: false }),
          supabase
            .from("mensajes_foro")
            .select("*")
            .eq("materia_id", id)
            .order("id", { ascending: true }),
          supabase
            .from("tareas")
            .select("*")
            .eq("materia_id", id)
            .order("fecha", { ascending: false }),
        ]);

      if (resAvisos.data) setAvisos(resAvisos.data);
      if (resMateriales.data) setMateriales(resMateriales.data);
      if (resMensajes.data) setMensajes(resMensajes.data as MensajeForo[]);
      if (resTareas.data) {
        // Asegurar que enlaces sea siempre array
        setTareas(
          resTareas.data.map((t) => ({ ...t, enlaces: t.enlaces || [] })),
        );
      }

      const claves = getClavesNotificaciones(userIdStored, id);
      const idsLeidos = obtenerIdsGuardados(claves.leidas);
      const idsEliminados = new Set(obtenerIdsGuardados(claves.eliminadas));

      const notifs: Notificacion[] = [];
      resTareas.data?.forEach((t) =>
        notifs.push({
          id: `t-${t.id}`,
          tipo: "Nueva Tarea",
          texto: t.titulo,
          fecha: t.fecha,
        }),
      );
      resMateriales.data?.forEach((m) =>
        notifs.push({
          id: `m-${m.id}`,
          tipo: "Material de Estudio",
          texto: m.titulo,
          fecha: m.fecha || obtenerFechaActualISO(),
        }),
      );
      resAvisos.data?.forEach((a) =>
        notifs.push({
          id: `a-${a.id}`,
          tipo: "Aviso del Docente",
          texto: a.texto,
          fecha: a.fecha,
        }),
      );

      notifs.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
      );
      const notificacionesVisibles = notifs
        .filter((notificacion) => !idsEliminados.has(notificacion.id))
        .slice(0, 10);
      setNotificaciones(notificacionesVisibles);
      setNotificacionesNoLeidas(
        new Set(
          notificacionesVisibles
            .filter((notificacion) => !idsLeidos.includes(notificacion.id))
            .map((notificacion) => notificacion.id),
        ),
      );

      if (roleStored === "docente") {
        const { data: entregasData } = await supabase
          .from("entregas")
          .select("*, usuarios(nombre_completo), tareas(titulo)")
          .eq("materia_id", id)
          .order("fecha", { ascending: false });
        if (entregasData)
          setEntregas(entregasData as unknown as EntregaAlumno[]);
      } else if (roleStored === "alumno") {
        const { data: misEntregasData } = await supabase
          .from("entregas")
          .select("*, tareas(titulo)")
          .eq("materia_id", id)
          .eq("alumno_id", userIdStored)
          .order("fecha", { ascending: false });
        if (misEntregasData)
          setMisEntregas(misEntregasData as unknown as EntregaAlumno[]);
      }

      setCargando(false);
    };

    cargarTodo();
    const canalRealtime = supabase
      .channel(`materia_realtime_${id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tareas",
          filter: `materia_id=eq.${id}`,
        },
        () => cargarTodo(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "entregas",
          filter: `materia_id=eq.${id}`,
        },
        () => cargarTodo(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "avisos",
          filter: `materia_id=eq.${id}`,
        },
        () => cargarTodo(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "materiales",
          filter: `materia_id=eq.${id}`,
        },
        () => cargarTodo(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mensajes_foro",
          filter: `materia_id=eq.${id}`,
        },
        () => cargarTodo(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalRealtime);
    };
  }, [id, router]);

  const cargarBancoTareas = async () => {
    setCargandoBanco(true);
    setMostrarBanco(true);
    setTareasBanco([]);
    const { data, error } = await supabase
      .from("tareas")
      .select(
        `id, titulo, descripcion, fecha, materias!inner(nombre, grado, seccion, docente_id)`,
      )
      .eq("materias.docente_id", userId)
      .order("fecha", { ascending: false });
    if (error) {
      showToast("No se pudieron cargar las tareas anteriores.", "error");
    } else if (data) {
      setTareasBanco(data as unknown as TareaBanco[]);
    }
    setCargandoBanco(false);
  };

  const importarTarea = (tarea: TareaBanco) => {
    setNuevaTareaTitulo(tarea.titulo);
    setNuevaTareaDesc(tarea.descripcion);
    setMostrarBanco(false);
    showToast("Tarea importada. Podés editarla antes de publicar.", "info");
  };

  // TAREAS: Lógica Compartida
  const subirArchivos = async (archivos: File[]) => {
    const urls: string[] = [];
    for (const f of archivos) {
      const fileName = generarRutaArchivo("tareas", f.name);
      const { error } = await supabase.storage
        .from("archivos-AulaLink")
        .upload(fileName, f);
      if (error) return null;
      const { data } = supabase.storage
        .from("archivos-AulaLink")
        .getPublicUrl(fileName);
      urls.push(data.publicUrl);
    }
    return urls;
  };

  const manejarSeleccionArchivos = (
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: "nuevo" | "edicion",
  ) => {
    const seleccionados = Array.from(e.target.files || []);
    if (tipo === "nuevo") {
      if (archivosNuevaTarea.length + seleccionados.length > 2) {
        showToast("Límite máximo de 2 archivos.", "warning");
        return;
      }
      setArchivosNuevaTarea([...archivosNuevaTarea, ...seleccionados]);
    } else {
      if (
        editTareaUrlsExistentes.length +
          editTareaArchivosNuevos.length +
          seleccionados.length >
        2
      ) {
        showToast("Límite máximo de 2 archivos.", "warning");
        return;
      }
      setEditTareaArchivosNuevos([
        ...editTareaArchivosNuevos,
        ...seleccionados,
      ]);
    }
    e.target.value = "";
  };

  const handleCrearTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    const descLimpia = nuevaTareaDesc.replace(/<[^>]*>?/gm, "").trim();
    if (!nuevaTareaTitulo.trim() || !descLimpia) {
      showToast("El título y las instrucciones son obligatorios.", "warning");
      return;
    }

    const urlsSubidas = await subirArchivos(archivosNuevaTarea);
    if (urlsSubidas === null) {
      showToast("Error al subir los archivos.", "error");
      return;
    }

    const { data, error } = await supabase
      .from("tareas")
      .insert([
        {
          materia_id: Number(id),
          titulo: nuevaTareaTitulo,
          descripcion: nuevaTareaDesc,
          url_archivo: urlsSubidas[0] || null,
          url_archivo_2: urlsSubidas[1] || null,
          enlaces: enlacesNuevaTarea,
        },
      ])
      .select();

    if (!error && data) {
      setTareas([{ ...data[0], enlaces: data[0].enlaces || [] }, ...tareas]);
      agregarNotificacion({
        id: `t-${data[0].id}`,
        tipo: "Nueva Tarea",
        texto: data[0].titulo,
        fecha: data[0].fecha,
      });
      setNuevaTareaTitulo("");
      setNuevaTareaDesc("");
      setArchivosNuevaTarea([]);
      setEnlacesNuevaTarea([]);
      showToast("Tarea enviada a los alumnos.", "success");
    } else {
      showToast("Error al crear la tarea.", "error");
    }
  };

  const handleIniciarEdicionTarea = (t: Tarea) => {
    setEditandoTareaId(t.id);
    setEditTareaTitulo(t.titulo);
    setEditTareaDesc(t.descripcion);
    setEditTareaEnlaces(t.enlaces || []);
    const existentes: string[] = [];
    if (t.url_archivo) existentes.push(t.url_archivo);
    if (t.url_archivo_2) existentes.push(t.url_archivo_2);
    setEditTareaUrlsExistentes(existentes);
    setEditTareaArchivosNuevos([]);
  };

  const handleGuardarEdicionTarea = async (idTarea: number) => {
    const descLimpia = editTareaDesc.replace(/<[^>]*>?/gm, "").trim();
    if (!editTareaTitulo.trim() || !descLimpia) {
      showToast("El título y las instrucciones son obligatorios.", "warning");
      return;
    }
    if (editTareaUrlsExistentes.length + editTareaArchivosNuevos.length > 2) {
      showToast("No podés adjuntar más de 2 archivos.", "warning");
      return;
    }

    const urlsSubidas = await subirArchivos(editTareaArchivosNuevos);
    if (urlsSubidas === null) {
      showToast("Error al subir los nuevos archivos.", "error");
      return;
    }

    const urlsFinales = [...editTareaUrlsExistentes, ...urlsSubidas];
    const fechaEdicion = obtenerFechaActualISO();

    const result = await supabase
      .from("tareas")
      .update({
        titulo: editTareaTitulo,
        descripcion: editTareaDesc,
        url_archivo: urlsFinales[0] || null,
        url_archivo_2: urlsFinales[1] || null,
        enlaces: editTareaEnlaces,
        editado_en: fechaEdicion,
      })
      .eq("id", idTarea)
      .eq("materia_id", Number(id))
      .select("id")
      .maybeSingle();

    if (!result.error && result.data) {
      setTareas((prev) =>
        prev.map((t) =>
          t.id === idTarea
            ? {
                ...t,
                titulo: editTareaTitulo,
                descripcion: editTareaDesc,
                url_archivo: urlsFinales[0] || null,
                url_archivo_2: urlsFinales[1] || null,
                enlaces: editTareaEnlaces,
                editado_en: fechaEdicion,
              }
            : t,
        ),
      );
      setEditandoTareaId(null);
      showToast("Tarea actualizada correctamente.", "success");
    } else {
      showToast("Error al actualizar la tarea.", "error");
    }
  };

  const handleBorrarTarea = (idTarea: number) => {
    showConfirm(
      "¿Estás seguro de que deseas eliminar esta tarea?",
      async () => {
        const { data, error } = await supabase
          .from("tareas")
          .delete()
          .eq("id", idTarea)
          .eq("materia_id", Number(id))
          .select("id")
          .maybeSingle();
        if (!error && data) {
          setTareas((prev) => prev.filter((t) => t.id !== idTarea));
          showToast("Tarea eliminada correctamente.", "info");
        } else {
          showToast("Error al eliminar la tarea.", "error");
        }
      },
      "Eliminar Tarea",
    );
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
      if (!archivo)
        return showToast(
          "Por favor adjunta un archivo antes de enviar.",
          "warning",
        );
      if (archivo.size > 5242880)
        return showToast(
          "El archivo supera el límite permitido de 5 MB.",
          "warning",
        );

      const fileName = generarRutaArchivo("entregas", archivo.name);
      const { error: uploadError } = await supabase.storage
        .from("archivos-AulaLink")
        .upload(fileName, archivo);
      if (uploadError)
        return showToast(
          "Error al subir el trabajo. Intente nuevamente.",
          "error",
        );

      const { data: urlData } = supabase.storage
        .from("archivos-AulaLink")
        .getPublicUrl(fileName);
      contenidoFinal = urlData.publicUrl;
      pesoFinal = (archivo.size / (1024 * 1024)).toFixed(1) + " MB";
    } else {
      const respLimpia = respuestaTexto.replace(/<[^>]*>?/gm, "").trim();
      if (!respLimpia)
        return showToast(
          "Por favor escribe una respuesta antes de enviar.",
          "warning",
        );
    }

    const { data, error } = await supabase
      .from("entregas")
      .insert([
        {
          materia_id: Number(id),
          tarea_id: tareaSeleccionada,
          alumno_id: userId,
          tipo: opcionEntrega,
          contenido: contenidoFinal,
          peso: pesoFinal,
        },
      ])
      .select("*, tareas(titulo)");

    if (!error && data) {
      showToast("¡Tarea entregada con éxito!", "success");
      setMisEntregas([data[0] as unknown as EntregaAlumno, ...misEntregas]);
      setRespuestaTexto("");
      handleDesadjuntar();
      setTareaSeleccionada(null);
    } else {
      showToast("Error al registrar la entrega.", "error");
    }
  };

  // CALIFICACIONES (Docente)
  const handleGuardarCalificacion = async (idEntrega: number) => {
    const nota = notasTemp[idEntrega];
    const devolucion = devolucionesTemp[idEntrega] || "";
    if (!nota)
      return showToast(
        "Por favor ingresa una nota antes de guardar.",
        "warning",
      );

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
      setCalificacionEditable(null);
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
      agregarNotificacion({
        id: `a-${data[0].id}`,
        tipo: "Aviso del Docente",
        texto: data[0].texto,
        fecha: data[0].fecha,
      });
      setNuevoAviso("");
      showToast("Aviso publicado con éxito.", "success");
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
        }
      },
      "Eliminar Aviso",
    );
  };

  // MATERIALES
  const handleAgregarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMaterial)
      return showToast("Selecciona un archivo antes de subir.", "warning");
    const fileExt = nuevoMaterial.name.split(".").pop();
    const filePath = generarRutaArchivo("materiales", nuevoMaterial.name);
    const { error: uploadError } = await supabase.storage
      .from("archivos-AulaLink")
      .upload(filePath, nuevoMaterial);
    if (uploadError) return showToast("Error subiendo el archivo.", "error");

    const { data: urlData } = supabase.storage
      .from("archivos-AulaLink")
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
      agregarNotificacion({
        id: `m-${data[0].id}`,
        tipo: "Material de Estudio",
        texto: data[0].titulo,
        fecha: data[0].fecha || obtenerFechaActualISO(),
      });
      setNuevoMaterial(null);
      if (fileMaterialRef.current) fileMaterialRef.current.value = "";
      showToast("Material subido con éxito.", "success");
    }
  };

  const handleBorrarMaterial = (idMaterial: number) => {
    showConfirm(
      "¿Eliminar este material de estudio?",
      async () => {
        const { error } = await supabase
          .from("materiales")
          .delete()
          .eq("id", idMaterial);
        if (!error)
          setMateriales((prev) => prev.filter((m) => m.id !== idMaterial));
      },
      "Eliminar Material",
    );
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
    }
  };

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
    }
  };

  const handleBorrarMensaje = (idMensaje: number) => {
    showConfirm(
      "¿Eliminar este mensaje del foro?",
      async () => {
        const { error } = await supabase
          .from("mensajes_foro")
          .delete()
          .eq("id", idMensaje);
        if (!error)
          setMensajes((prev) => prev.filter((m) => m.id !== idMensaje));
      },
      "Eliminar Mensaje",
    );
  };

  if (cargando) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 px-4">
        <Image
          src="/AulaLink.png"
          alt="AulaLink Logo"
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
    <div className="min-h-dvh w-full bg-slate-50 py-4 px-3 sm:px-6 lg:px-8 overflow-x-hidden text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      {/* MODAL BANCO DE TAREAS */}
      {mostrarBanco && (
        <div className="inset-0 z-50 flex justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity fixed">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  Importar del Banco de Tareas
                </h3>
                <p className="text-xs text-slate-500">
                  Seleccioná una tarea de otra materia para reutilizarla.
                </p>
              </div>
              <button
                onClick={() => setMostrarBanco(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-2"
              >
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-slate-50 dark:bg-slate-950/50">
              {cargandoBanco ? (
                <div className="text-center py-8">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent mb-2" />
                  <p className="text-xs text-slate-500">
                    Cargando banco de tareas...
                  </p>
                </div>
              ) : tareasBanco.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No tenés tareas guardadas en el banco aún.
                </p>
              ) : (
                tareasBanco.map((tb) => (
                  <div
                    key={tb.id}
                    className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center gap-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {tb.titulo}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Materia: {tb.materias.nombre} ({tb.materias.grado}°{" "}
                        {tb.materias.seccion})
                      </p>
                    </div>
                    <button
                      onClick={() => importarTarea(tb)}
                      className="shrink-0 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                    >
                      Importar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Header con Sistema de Notificaciones */}
      <header className="max-w-4xl mx-auto mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-3 cursor-pointer text-left"
        >
          <span className="min-h-11 text-xs sm:text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold flex items-center gap-1.5 transition-colors">
            ←
          </span>
          <Image
            src="/AulaLink.png"
            alt="AulaLink Logo"
            width={38}
            height={38}
            priority
            className="h-9 w-9 object-contain transition-transform"
          />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Aula
            <span className="text-indigo-600 dark:text-indigo-400">Link</span>
          </h1>
        </button>

        <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="max-w-[55vw] truncate text-xs sm:max-w-none sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              {usuario}
            </span>
            <span className="text-[10px] sm:text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
              {rol}
            </span>
          </div>
          <div className="relative">
            {rol === "alumno" && (
              <button
                onClick={() => {
                  const abriendo = !mostrarNotificaciones;
                  setMostrarNotificaciones(abriendo);
                  if (abriendo) marcarNotificacionesLeidas();
                }}
                className="relative flex h-11 w-11 items-center justify-center rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                  className="w-5 h-5 fill-current"
                >
                  <path d="M320 64C302.3 64 288 78.3 288 96L288 99.2C215 114 160 178.6 160 256L160 277.7C160 325.8 143.6 372.5 113.6 410.1L103.8 422.3C98.7 428.6 96 436.4 96 444.5C96 464.1 111.9 480 131.5 480L508.4 480C528 480 543.9 464.1 543.9 444.5C543.9 436.4 541.2 428.6 536.1 422.3L526.3 410.1C496.4 372.5 480 325.8 480 277.7L480 256C480 178.6 425 114 352 99.2L352 96C352 78.3 337.7 64 320 64zM258 528C265.1 555.6 290.2 576 320 576C349.8 576 374.9 555.6 382 528L258 528z" />
                </svg>
                {notificacionesNoLeidas.size > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                    {notificacionesNoLeidas.size}
                  </span>
                )}
              </button>
            )}
            {mostrarNotificaciones && (
              <div className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl z-50 overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Novedades del Aula
                  </h3>
                  <button
                    onClick={() => setMostrarNotificaciones(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notificaciones.length === 0 ? (
                    <p className="p-4 text-xs text-slate-500 text-center">
                      No hay notificaciones recientes.
                    </p>
                  ) : (
                    notificaciones.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-3 border-b border-slate-100 p-3 text-xs transition-colors hover:bg-slate-50 dark:border-slate-800/50 dark:hover:bg-slate-800/50"
                      >
                        <div className="min-w-0 flex-1 wrap-break-word">
                          <span className="mb-1 block font-bold text-indigo-600 dark:text-indigo-400">
                            {n.tipo}
                          </span>
                          <span className="text-slate-600 dark:text-slate-300">
                            {n.texto}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => eliminarNotificacion(n.id)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {materiaNombre}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Docente: {materiaDocente}
            </p>
          </div>
          {/* <div className="flex gap-2 w-full md:w-auto flex-wrap justify-start md:justify-end">
            <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900 p-4 rounded-xl flex flex-col items-center w-full md:w-64 shrink-0">
              <span className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold mb-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>{" "}
                Clase en Vivo
              </span>
              <button
                onClick={() => router.push(`/dashboard/materia/${id}/sala`)}
                className="w-full min-h-11 bg-linear-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-xl hover:from-indigo-600 hover:to-indigo-800 transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Unirse a la Sala
              </button>
            </div>
          </div> */}
        </div>
        {(rol === "docente" || rol === "admin") && (
          <button
            onClick={() =>
              router.push(`/dashboard/materia/${id}/calificaciones`)
            }
            className="fill-current gap-1 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              className="h-4 w-4 inline-block"
            >
              <path d="M384 32c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64l-320 0-6.5-.3C25.2 476.4 0 449.1 0 416L0 96C0 60.7 28.7 32 64 32l320 0zM64 320l0 96 128 0 0-96-128 0zm192 0l0 96 128 0 0-96-128 0zM64 256l128 0 0-96-128 0 0 96zm192 0l128 0 0-96-128 0 0 96z" />
            </svg>{" "}
            Planilla General
          </button>
        )}

        {/* Grid Avisos y Materiales Antiguos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
              Avisos del Docente
            </h2>
            {rol === "docente" && (
              <form
                onSubmit={handleAgregarAviso}
                className="flex flex-col sm:flex-row gap-2 mb-4"
              >
                <input
                  type="text"
                  value={nuevoAviso}
                  onChange={(e) => setNuevoAviso(e.target.value)}
                  placeholder="Nuevo aviso rápido..."
                  className="flex-1 min-h-11 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="min-h-11 bg-indigo-600 text-white text-xs sm:text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 font-semibold cursor-pointer"
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
            </div>
          </div>

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
                  className="min-h-11 text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 font-medium"
                />

                {/* Desadjuntar en Material de Estudio */}
                {nuevoMaterial && (
                  <div className="flex items-center justify-between bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600 mt-2 text-xs">
                    <span className="truncate">{nuevoMaterial.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNuevoMaterial(null);
                        if (fileMaterialRef.current)
                          fileMaterialRef.current.value = "";
                      }}
                      className="text-rose-500 font-bold px-2 cursor-pointer"
                    >
                      Desadjuntar
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="min-h-10 mt-2 bg-indigo-600 text-white text-xs px-3.5 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold self-end cursor-pointer"
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
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={m.url_archivo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-9.5 text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold flex items-center"
                    >
                      Descargar
                    </a>
                    {rol === "docente" && (
                      <button
                        onClick={() => handleBorrarMaterial(m.id)}
                        className="min-h-9.5 text-rose-500 text-xs px-2.5 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-50 cursor-pointer"
                      >
                        Borrar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Foro de Consultas */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            Foro de Consultas
          </h2>
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {mensajes.map((m) => {
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
                    <div className="flex flex-col sm:flex-row gap-2 mt-2">
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
          </div>
          <form
            onSubmit={handleEnviarMensaje}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe tu consulta..."
              className="flex-1 min-h-11 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="min-h-11 bg-indigo-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 cursor-pointer"
            >
              Enviar
            </button>
          </form>
        </div>

        {gamificationActive && <MateriaGamificacion />}

        {/* MÓDULO DE ASIGNACIONES (TAREAS) */}
        <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Trabajos Prácticos y Asignaciones
            </h2>
            {rol === "docente" && (
              <button
                type="button"
                onClick={cargarBancoTareas}
                className="fill-current px-3 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 576 512"
                  className="w-4 h-4 inline-block"
                >
                  <path d="M288 64c106 0 192 86 192 192S394 448 288 448c-65.2 0-122.9-32.5-157.6-82.3-10.1-14.5-30.1-18-44.6-7.9s-18 30.1-7.9 44.6C124.1 468.6 201 512 288 512 429.4 512 544 397.4 544 256S429.4 0 288 0C202.3 0 126.5 42.1 80 106.7L80 80c0-17.7-14.3-32-32-32S16 62.3 16 80l0 112c0 17.7 14.3 32 32 32l24.6 0c.5 0 1 0 1.5 0l86 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-38.3 0C154.9 102.6 217 64 288 64zm24 88c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65 0-94.1z" />
                </svg>{" "}
                Importar del Banco
              </button>
            )}
          </div>

          {/* Docente: Crear Tarea */}
          {rol === "docente" && (
            <form
              onSubmit={handleCrearTarea}
              className="border-b border-slate-500 dark:border-slate-900 pb-5 mb-6 space-y-3"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                Publicar nueva tarea
              </h3>
              <input
                type="text"
                placeholder="Título de la tarea"
                value={nuevaTareaTitulo}
                onChange={(e) => setNuevaTareaTitulo(e.target.value)}
                className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="w-full">
                <RichTextEditor
                  content={nuevaTareaDesc}
                  onChange={setNuevaTareaDesc}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-start pt-2">
                <div className="flex-1 w-full space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                    Adjuntar Archivos (Máx 2)
                  </label>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => manejarSeleccionArchivos(e, "nuevo")}
                    className="text-xs w-full file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 font-medium"
                  />
                  <div className="flex flex-col gap-1 mt-1">
                    {archivosNuevaTarea.map((f, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600"
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setArchivosNuevaTarea((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="text-rose-500 font-bold px-2 cursor-pointer shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                    Añadir Enlaces Web
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      className="flex-1 text-xs p-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (linkInput.trim()) {
                          setEnlacesNuevaTarea([
                            ...enlacesNuevaTarea,
                            linkInput.trim(),
                          ]);
                          setLinkInput("");
                        }
                      }}
                      className="bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 text-xs px-3 rounded font-bold cursor-pointer"
                    >
                      Añadir
                    </button>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    {enlacesNuevaTarea.map((enl, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-xs bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600"
                      >
                        <span className="truncate">{enl}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setEnlacesNuevaTarea((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="text-rose-500 font-bold px-2 cursor-pointer shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white text-xs px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Publicar Asignación
                </button>
              </div>
            </form>
          )}

          {/* Listado de Tareas */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200">
              Tareas publicadas
            </h2>
            {tareas.length === 0 ? (
              <p className="text-xs text-slate-500">
                No hay tareas asignadas en esta materia.
              </p>
            ) : (
              tareas.map((t) => {
                const entregaRealizada = misEntregas.find(
                  (e) => e.tarea_id === t.id,
                );
                const estaEditando = editandoTareaId === t.id;

                return (
                  <div
                    key={t.id}
                    className="p-4 border border-slate-200/80 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                  >
                    {estaEditando ? (
                      /* Formulario de Edición de Tarea */
                      <div className="space-y-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                          Editar Tarea
                        </h4>
                        <input
                          type="text"
                          value={editTareaTitulo}
                          onChange={(e) => setEditTareaTitulo(e.target.value)}
                          placeholder="Título de la tarea"
                          className="w-full text-sm p-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="w-full">
                          <RichTextEditor
                            content={editTareaDesc}
                            onChange={setEditTareaDesc}
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-start pt-2 border-t border-slate-200 dark:border-slate-700">
                          <div className="flex-1 w-full space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                              Archivos Adjuntos (Máx 2)
                            </label>
                            <input
                              type="file"
                              multiple
                              onChange={(e) =>
                                manejarSeleccionArchivos(e, "edicion")
                              }
                              className="text-xs w-full file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 font-medium"
                            />
                            <div className="flex flex-col gap-1 mt-1">
                              {editTareaUrlsExistentes.map((url, i) => (
                                <div
                                  key={`exist-${i}`}
                                  className="flex justify-between items-center text-xs bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600"
                                >
                                  <span className="truncate">
                                    Archivo adjunto {i + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditTareaUrlsExistentes((prev) =>
                                        prev.filter((_, idx) => idx !== i),
                                      )
                                    }
                                    className="text-rose-500 font-bold px-2 cursor-pointer shrink-0"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              {editTareaArchivosNuevos.map((f, i) => (
                                <div
                                  key={`nuevo-${i}`}
                                  className="flex justify-between items-center text-xs bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600"
                                >
                                  <span className="truncate">{f.name}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditTareaArchivosNuevos((prev) =>
                                        prev.filter((_, idx) => idx !== i),
                                      )
                                    }
                                    className="text-rose-500 font-bold px-2 cursor-pointer shrink-0"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex-1 w-full space-y-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                              Enlaces Web
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                placeholder="https://..."
                                value={editLinkInput}
                                onChange={(e) =>
                                  setEditLinkInput(e.target.value)
                                }
                                className="flex-1 text-xs p-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (editLinkInput.trim()) {
                                    setEditTareaEnlaces([
                                      ...editTareaEnlaces,
                                      editLinkInput.trim(),
                                    ]);
                                    setEditLinkInput("");
                                  }
                                }}
                                className="bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 text-xs px-3 rounded font-bold cursor-pointer"
                              >
                                Añadir
                              </button>
                            </div>
                            <div className="flex flex-col gap-1 mt-1">
                              {editTareaEnlaces.map((enl, i) => (
                                <div
                                  key={i}
                                  className="flex justify-between items-center text-xs bg-white dark:bg-slate-700 p-2 rounded border border-slate-200 dark:border-slate-600"
                                >
                                  <span className="truncate">{enl}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditTareaEnlaces((prev) =>
                                        prev.filter((_, idx) => idx !== i),
                                      )
                                    }
                                    className="text-rose-500 font-bold px-2 cursor-pointer shrink-0"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleGuardarEdicionTarea(t.id)}
                            className="bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditandoTareaId(null)}
                            className="bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs px-4 py-2 rounded-lg font-bold hover:bg-slate-400 transition-colors cursor-pointer"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Vista Normal de la Tarea */
                      <>
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <h3 className="min-w-0 wrap-break-word font-bold text-slate-800 dark:text-slate-100 text-sm">
                              {t.titulo}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>
                                Publicado: {formatearFechaHora(t.fecha)}
                              </span>
                              {t.editado_en && (
                                <span className="italic text-indigo-600 dark:text-indigo-400 font-medium">
                                  • Editado: {formatearFechaHora(t.editado_en)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {rol === "alumno" &&
                              (entregaRealizada ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                                  Entregada
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold uppercase tracking-wide">
                                  Pendiente
                                </span>
                              ))}
                            {rol === "docente" && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleIniciarEdicionTarea(t)}
                                  className="text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBorrarTarea(t.id)}
                                  className="text-xs bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 hover:bg-rose-100 px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors"
                                >
                                  Borrar
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div
                          className="assignment-rich-text text-slate-700 dark:text-slate-300"
                          dangerouslySetInnerHTML={{ __html: t.descripcion }}
                        />

                        <div className="flex flex-wrap gap-2 pt-2">
                          {t.url_archivo && (
                            <a
                              href={t.url_archivo}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
                            >
                              📎 Archivo 1
                            </a>
                          )}
                          {t.url_archivo_2 && (
                            <a
                              href={t.url_archivo_2}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 px-3 py-1.5 rounded-lg font-semibold hover:bg-indigo-100 transition-colors"
                            >
                              📎 Archivo 2
                            </a>
                          )}
                          {t.enlaces &&
                            t.enlaces.map((enl, idx) => (
                              <a
                                key={idx}
                                href={enl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300 px-3 py-1.5 rounded-lg font-semibold hover:bg-sky-100 transition-colors"
                              >
                                🔗 Enlace {idx + 1}
                              </a>
                            ))}
                        </div>

                        {rol === "alumno" &&
                          !entregaRealizada &&
                          tareaSeleccionada !== t.id && (
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 mt-2">
                              <button
                                onClick={() => setTareaSeleccionada(t.id)}
                                className="text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                              >
                                Realizar Entrega
                              </button>
                            </div>
                          )}

                        {tareaSeleccionada === t.id && (
                          <form
                            onSubmit={handleEnviarTarea}
                            className="mt-4 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 shadow-inner"
                          >
                            <div className="flex border-b border-slate-200 dark:border-slate-700 pb-2 gap-4">
                              <button
                                type="button"
                                onClick={() => setOpcionEntrega("archivo")}
                                className={`text-xs font-bold pb-1 cursor-pointer ${opcionEntrega === "archivo" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500"}`}
                              >
                                Subir Archivo
                              </button>
                              <button
                                type="button"
                                onClick={() => setOpcionEntrega("texto")}
                                className={`text-xs font-bold pb-1 cursor-pointer ${opcionEntrega === "texto" ? "text-indigo-600 border-b-2 border-indigo-600" : "text-slate-500"}`}
                              >
                                Escribir Texto
                              </button>
                            </div>

                            {opcionEntrega === "archivo" ? (
                              <div className="flex flex-col gap-2">
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={(e) =>
                                    setArchivo(e.target.files?.[0] || null)
                                  }
                                  className="text-xs file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 font-medium"
                                />
                                {archivo && (
                                  <button
                                    type="button"
                                    onClick={handleDesadjuntar}
                                    className="self-start text-xs text-rose-600 font-semibold cursor-pointer"
                                  >
                                    Desadjuntar
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="w-full">
                                <RichTextEditor
                                  content={respuestaTexto}
                                  onChange={setRespuestaTexto}
                                />
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                              <button
                                type="submit"
                                className="w-full sm:w-auto bg-emerald-600 text-white text-xs px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                              >
                                Enviar Trabajo
                              </button>
                              <button
                                type="button"
                                onClick={() => setTareaSeleccionada(null)}
                                className="w-full sm:w-auto bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs px-4 py-2 rounded-lg font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          </form>
                        )}

                        {rol === "alumno" && entregaRealizada && (
                          <div className="mt-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Calificación del Docente
                              </span>
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded ${entregaRealizada.nota ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                              >
                                {entregaRealizada.nota
                                  ? `Nota: ${entregaRealizada.nota}`
                                  : "Pendiente"}
                              </span>
                            </div>
                            {entregaRealizada.devolucion ? (
                              <p className="text-xs text-slate-700 dark:text-slate-300 italic mt-1">
                                &quot;{entregaRealizada.devolucion}&quot;
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 italic mt-1">
                                El docente aún no ha dejado comentarios.
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
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
                <div
                  key={e.id}
                  className="p-4 border border-slate-200/80 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-800/50 space-y-2"
                >
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
                      <a
                        href={e.contenido}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline font-semibold flex items-center gap-1"
                      >
                        <svg
                          className="w-4 h-4 fill-current"
                          viewBox="0 0 512 512"
                        >
                          <path d="M288 109.3V352c0 17.7-14.3 32-32 32s-32-14.3-32-32V109.3l-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L288 109.3zM64 352H192c0 35.3 28.7 64 64 64s64-28.7 64-64H448c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V416c0-35.3 28.7-64 64-64zM432 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48z" />
                        </svg>
                        Abrir Archivo Adjunto ({e.peso})
                      </a>
                    ) : (
                      <div
                        className="assignment-rich-text text-slate-700 dark:text-slate-300"
                        dangerouslySetInnerHTML={{ __html: e.contenido }}
                      />
                    )}
                  </div>

                  {e.nota && calificacionEditable !== e.id ? (
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-xs gap-2">
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 mr-2 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
                          Nota: {e.nota}
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 italic">
                          &quot;{e.devolucion}&quot;
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setNotasTemp({ ...notasTemp, [e.id]: e.nota });
                          setDevolucionesTemp({
                            ...devolucionesTemp,
                            [e.id]: e.devolucion,
                          });
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
                        onChange={(ev) =>
                          setNotasTemp({
                            ...notasTemp,
                            [e.id]: ev.target.value,
                          })
                        }
                        className="w-20 min-h-10 px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Devolución al alumno"
                        defaultValue={devolucionesTemp[e.id] || ""}
                        onChange={(ev) =>
                          setDevolucionesTemp({
                            ...devolucionesTemp,
                            [e.id]: ev.target.value,
                          })
                        }
                        className="min-w-0 w-full sm:flex-1 min-h-10 px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleGuardarCalificacion(e.id)}
                        className="min-h-10 px-4 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 cursor-pointer shadow-sm"
                      >
                        Guardar
                      </button>
                      {e.nota && (
                        <button
                          type="button"
                          onClick={() => setCalificacionEditable(null)}
                          className="min-h-10 px-3 py-1 bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-300 cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  )}
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
      </main>
    </div>
  );
}

export default function MateriaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 font-medium">
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
