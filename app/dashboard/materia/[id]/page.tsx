"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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
  autor_nombre: string;
  rol: string;
  texto: string;
  fecha: string;
}

function ContenidoMateria() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "1";

  const [usuario, setUsuario] = useState("");
  const [rol, setRol] = useState("");
  const [materiaNombre, setMateriaNombre] = useState("Cargando...");
  const [materiaDocente, setMateriaDocente] = useState("");
  const [cargando, setCargando] = useState(true);

  // Referencias para selector de archivos
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMaterialRef = useRef<HTMLInputElement>(null);

  // Estados de la materia
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [nuevoAviso, setNuevoAviso] = useState("");

  const [materiales, setMateriales] = useState<Material[]>([]);
  const [nuevoMaterial, setNuevoMaterial] = useState<File | null>(null);

  const [mensajes, setMensajes] = useState<MensajeForo[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  // Estados del Alumno
  const [archivo, setArchivo] = useState<File | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [opcionEntrega, setOpcionEntrega] = useState<"archivo" | "texto">("archivo");

  // Estados del Docente
  const [entregas, setEntregas] = useState<EntregaAlumno[]>([]);
  const [notasTemp, setNotasTemp] = useState<{ [key: number]: string }>({});
  const [devolucionesTemp, setDevolucionesTemp] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const cargarTodo = async () => {
      const userStored = sessionStorage.getItem("usuario");
      const roleStored = sessionStorage.getItem("rol");

      if (!userStored) {
        router.push("/");
        return;
      }

      setUsuario(userStored);
      setRol(roleStored || "alumno");

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
      if (mensajesData) setMensajes(mensajesData);

      // 5. Cargar Entregas (si es docente)
      if (roleStored === "docente") {
        const { data: entregasData } = await supabase
          .from("entregas")
          .select("*, usuarios(nombre_completo)")
          .eq("materia_id", id)
          .order("fecha", { ascending: false });
        if (entregasData) {
          // Tipado estricto corregido sin usar 'any'
          setEntregas(entregasData as unknown as EntregaAlumno[]);
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
    }
  };

  const handleBorrarAviso = async (idAviso: number) => {
    if (!confirm("¿Borrar este aviso?")) return;
    const { error } = await supabase.from("avisos").delete().eq("id", idAviso);
    if (!error) setAvisos(avisos.filter((a) => a.id !== idAviso));
  };

  // MATERIALES
  const handleAgregarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMaterial) return;

    const fileExt = nuevoMaterial.name.split('.').pop();
    const filePath = `materiales/${Date.now()}_${nuevoMaterial.name}`;

    const { error: uploadError } = await supabase.storage
      .from('archivos-educor')
      .upload(filePath, nuevoMaterial);

    if (uploadError) {
      alert("Error subiendo el archivo. Asegúrate de haber creado el bucket 'archivos-educor' en Supabase.");
      return;
    }

    const { data: urlData } = supabase.storage
      .from('archivos-educor')
      .getPublicUrl(filePath);

    const pesoMB = (nuevoMaterial.size / (1024 * 1024)).toFixed(1) + " MB";

    const { data, error } = await supabase
      .from("materiales")
      .insert([{
        materia_id: Number(id),
        titulo: nuevoMaterial.name,
        tipo: fileExt?.toUpperCase() || 'FILE',
        peso: pesoMB,
        url_archivo: urlData.publicUrl
      }])
      .select();

    if (!error && data) {
      setMateriales([data[0], ...materiales]);
      setNuevoMaterial(null);
      if (fileMaterialRef.current) fileMaterialRef.current.value = "";
    }
  };

  const handleBorrarMaterial = async (idMaterial: number) => {
    if (!confirm("¿Borrar este material?")) return;
    const { error } = await supabase.from("materiales").delete().eq("id", idMaterial);
    if (!error) setMateriales(materiales.filter((m) => m.id !== idMaterial));
  };

  // ENTREGAS (Alumno)
  const handleDesadjuntar = () => {
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEnviarTarea = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = sessionStorage.getItem("usuario_id");

    let contenidoFinal = respuestaTexto;
    let pesoFinal = "0 KB";

    if (opcionEntrega === "archivo") {
      if (!archivo) {
        alert("Adjunta un archivo.");
        return;
      }
      if (archivo.size > 5242880) {
        alert("El archivo supera los 5 MB.");
        return;
      }

      const fileName = `entregas/${Date.now()}_${archivo.name}`;
      const { error: uploadError } = await supabase.storage
        .from('archivos-educor')
        .upload(fileName, archivo);

      if (uploadError) {
        alert("Error al subir el trabajo.");
        return;
      }

      const { data: urlData } = supabase.storage
        .from('archivos-educor')
        .getPublicUrl(fileName);

      contenidoFinal = urlData.publicUrl;
      pesoFinal = (archivo.size / (1024 * 1024)).toFixed(1) + " MB";
    } else {
      if (!respuestaTexto.trim()) {
        alert("Escribe una respuesta.");
        return;
      }
    }

    const { error } = await supabase.from("entregas").insert([{
      materia_id: Number(id),
      alumno_id: userId,
      tipo: opcionEntrega,
      contenido: contenidoFinal,
      peso: pesoFinal
    }]);

    if (!error) {
      alert("¡Tarea entregada con éxito!");
      setRespuestaTexto("");
      handleDesadjuntar();
    }
  };

  // CALIFICACIONES (Docente)
  const handleGuardarCalificacion = async (idEntrega: number) => {
    const nota = notasTemp[idEntrega];
    const devolucion = devolucionesTemp[idEntrega] || "";

    if (!nota) {
      alert("Ingresa una nota.");
      return;
    }

    const { error } = await supabase
      .from("entregas")
      .update({ nota, devolucion })
      .eq("id", idEntrega);

    if (!error) {
      setEntregas(entregas.map(e => e.id === idEntrega ? { ...e, nota, devolucion } : e));
      alert("¡Calificación guardada!");
    }
  };

  // FORO DE CONSULTAS
  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const userId = sessionStorage.getItem("usuario_id");

    const { data, error } = await supabase
      .from("mensajes_foro")
      .insert([{
        materia_id: Number(id),
        autor_id: userId,
        autor_nombre: usuario,
        rol: rol,
        texto: nuevoMensaje
      }])
      .select();

    if (!error && data) {
      setMensajes([...mensajes, data[0]]);
      setNuevoMensaje("");
    }
  };

  const handleBorrarMensaje = async (idMensaje: number) => {
    if (!confirm("¿Borrar este mensaje?")) return;
    const { error } = await supabase.from("mensajes_foro").delete().eq("id", idMensaje);
    if (!error) setMensajes(mensajes.filter((m) => m.id !== idMensaje));
  };

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-600 font-medium">
        Cargando aula virtual...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          ← Volver al Panel Principal
        </button>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
          {rol.toUpperCase()}: {usuario}
        </span>
      </div>

      <main className="max-w-4xl mx-auto space-y-6">
        {/* Encabezado y Videollamada */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{materiaNombre}</h1>
            <p className="text-sm text-gray-500 mt-1">Docente: {materiaDocente}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex flex-col items-center w-full md:w-64 shrink-0">
            <span className="flex items-center gap-2 text-blue-800 font-bold mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              Clase en Vivo
            </span>
            <button 
              onClick={() => router.push(`/dashboard/materia/${id}/sala`)}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-700 transition shadow-sm"
            >
              Unirse a la Sala
            </button>
          </div>
        </div>

        {/* Grid Avisos y Materiales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Avisos */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Avisos del Docente</h2>
            {rol === "docente" && (
              <form onSubmit={handleAgregarAviso} className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={nuevoAviso}
                  onChange={(e) => setNuevoAviso(e.target.value)}
                  placeholder="Nuevo aviso rápido..." 
                  className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none"
                />
                <button type="submit" className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 font-medium">Publicar</button>
              </form>
            )}
            <div className="space-y-3">
              {avisos.map((a) => (
                <div key={a.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-800 flex justify-between items-start">
                  <p>{a.texto}</p>
                  {rol === "docente" && (
                    <button onClick={() => handleBorrarAviso(a.id)} className="text-red-500 hover:text-red-700 font-bold text-xs ml-2">✕</button>
                  )}
                </div>
              ))}
              {avisos.length === 0 && <p className="text-xs text-gray-500">No hay avisos.</p>}
            </div>
          </div>

          {/* Materiales */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Material de Estudio</h2>
            {rol === "docente" && (
              <form onSubmit={handleAgregarMaterial} className="flex flex-col gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <input 
                  ref={fileMaterialRef}
                  type="file" 
                  onChange={(e) => setNuevoMaterial(e.target.files?.[0] || null)}
                  className="text-xs text-gray-500"
                />
                <button type="submit" className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 font-medium self-end">Subir</button>
              </form>
            )}
            <div className="space-y-3">
              {materiales.map((m) => (
                <div key={m.id} className="p-3 border border-gray-200 rounded flex justify-between items-center bg-gray-50">
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm">{m.titulo}</h3>
                    <p className="text-xs text-gray-500">{m.tipo} • {m.peso}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={m.url_archivo} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 font-medium">Descargar</a>
                    {rol === "docente" && (
                      <button onClick={() => handleBorrarMaterial(m.id)} className="text-red-500 text-xs px-2 border border-red-200 rounded">Borrar</button>
                    )}
                  </div>
                </div>
              ))}
              {materiales.length === 0 && <p className="text-xs text-gray-500">No hay materiales.</p>}
            </div>
          </div>
        </div>

        {/* Vista Alumno: Entrega */}
        {rol === "alumno" && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Entregar Trabajo Práctico</h2>
            <div className="flex border-b border-gray-200 mb-4">
              <button type="button" onClick={() => setOpcionEntrega("archivo")} className={`py-2 px-4 text-sm font-medium ${opcionEntrega === "archivo" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}>Opción 1: Subir Archivo</button>
              <button type="button" onClick={() => setOpcionEntrega("texto")} className={`py-2 px-4 text-sm font-medium ${opcionEntrega === "texto" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"}`}>Opción 2: Texto Plano</button>
            </div>
            <form onSubmit={handleEnviarTarea} className="space-y-4">
              {opcionEntrega === "archivo" && (
                <div>
                  <input ref={fileInputRef} type="file" onChange={(e) => setArchivo(e.target.files?.[0] || null)} className="text-sm text-gray-500" />
                  {archivo && <button type="button" onClick={handleDesadjuntar} className="text-xs text-red-600 ml-2">Desadjuntar</button>}
                </div>
              )}
              {opcionEntrega === "texto" && (
                <textarea value={respuestaTexto} onChange={(e) => setRespuestaTexto(e.target.value)} rows={4} className="w-full p-2 border border-gray-300 rounded text-sm" placeholder="Escribe tu respuesta aquí..." />
              )}
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 font-medium">Enviar Tarea</button>
            </form>
          </div>
        )}

        {/* Vista Docente: Corregir Entregas */}
        {rol === "docente" && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Trabajos Recibidos ({entregas.length})</h2>
            <div className="space-y-4">
              {entregas.map((e) => (
                <div key={e.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{e.usuarios?.nombre_completo || "Alumno"}</span>
                    <span className="text-xs text-blue-700">{e.nota ? `Nota: ${e.nota}` : "Pendiente"}</span>
                  </div>
                  <div className="p-2 bg-white rounded border text-xs">
                    {e.tipo === "archivo" ? (
                      <a href={e.contenido} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-medium">Abrir Archivo Adjunto ({e.peso})</a>
                    ) : (
                      <p className="italic text-gray-700">{e.contenido}</p>
                    )}
                  </div>
                  <div className="flex gap-2 items-center pt-2">
                    <input type="text" placeholder="Nota" defaultValue={e.nota} onChange={(ev) => setNotasTemp({ ...notasTemp, [e.id]: ev.target.value })} className="w-20 px-2 py-1 text-xs border rounded bg-white" />
                    <input type="text" placeholder="Devolución" defaultValue={e.devolucion} onChange={(ev) => setDevolucionesTemp({ ...devolucionesTemp, [e.id]: ev.target.value })} className="flex-1 px-2 py-1 text-xs border rounded bg-white" />
                    <button type="button" onClick={() => handleGuardarCalificacion(e.id)} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">Guardar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Foro de Consultas */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Foro de Consultas</h2>
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {mensajes.map((m) => (
              <div key={m.id} className={`p-3 rounded text-sm ${m.rol === "docente" ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border"}`}>
                <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                  <span>{m.autor_nombre} ({m.rol.toUpperCase()})</span>
                  {rol === "docente" && (
                    <button onClick={() => handleBorrarMensaje(m.id)} className="text-red-500 text-xs">Borrar</button>
                  )}
                </div>
                <p className="text-gray-800">{m.texto}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleEnviarMensaje} className="flex gap-2">
            <input type="text" value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} placeholder="Escribe tu consulta..." className="flex-1 text-sm border rounded px-3 py-2" />
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">Enviar</button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function MateriaPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-100 text-gray-600 font-medium">Cargando aula...</div>}>
      <ContenidoMateria />
    </Suspense>
  );
}