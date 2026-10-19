"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";

interface MateriaDetalle {
  id: string;
  nombre: string;
  docente: string;
  descripcion: string;
}

interface EntregaAlumno {
  id: number;
  alumno: string;
  fecha: string;
  tipo: "archivo" | "texto";
  contenido: string;
  peso?: string;
  nota: string;
  devolucion: string;
}

function ContenidoMateria() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || "1";

  const [usuario, setUsuario] = useState("");
  const [rol, setRol] = useState("");
  const [cargando, setCargando] = useState(true);

  // Referencias para inputs de archivo
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileMaterialRef = useRef<HTMLInputElement>(null);

  // ESTADOS DEL AULA (Avisos y Materiales)
  const [avisos, setAvisos] = useState([
    { id: 1, fecha: "18 Oct", texto: "Recuerden que la entrega del TP1 se extiende hasta el viernes por los cortes de luz." },
    { id: 2, fecha: "15 Oct", texto: "Ya está disponible la guía de la Unidad 2 en formato comprimido." }
  ]);
  const [nuevoAviso, setNuevoAviso] = useState("");

  const [materiales, setMateriales] = useState([
    { id: 1, titulo: "Guía Semana 1 - Repaso", tipo: "PDF", peso: "1.2 MB" },
    { id: 2, titulo: "Unidad 2 Completa", tipo: "ZIP", peso: "3.5 MB" }
  ]);
  const [nuevoMaterial, setNuevoMaterial] = useState<File | null>(null);

  // ESTADOS DE MENSAJERÍA (Foro de Dudas)
  const [mensajes, setMensajes] = useState([
    { id: 1, autor: "Juan Pérez", rol: "alumno", texto: "Profe, ¿el TP se puede hacer en el cuaderno y enviar foto?" },
    { id: 2, autor: "Prof. Gómez", rol: "docente", texto: "Sí Juan, pero por favor intenten comprimir la foto antes de subirla para ahorrar datos." }
  ]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  // ESTADOS DEL ALUMNO (Entrega de Tareas)
  const [archivo, setArchivo] = useState<File | null>(null);
  const [respuestaTexto, setRespuestaTexto] = useState("");
  const [opcionEntrega, setOpcionEntrega] = useState<"archivo" | "texto">("archivo");

  // ESTADOS DEL DOCENTE (Recepción de entregas)
  const [entregas, setEntregas] = useState<EntregaAlumno[]>([
    {
      id: 101,
      alumno: "Juan Pérez",
      fecha: "18 Oct 10:15",
      tipo: "archivo",
      contenido: "TP1_Matematica_Perez.pdf",
      peso: "1.4 MB",
      nota: "",
      devolucion: "",
    },
    {
      id: 102,
      alumno: "María Gómez",
      fecha: "18 Oct 11:30",
      tipo: "texto",
      contenido: "Respuesta al Ejercicio 1: X = 45. Ejercicio 2: La derivada da como resultado 2x + 3.",
      nota: "9/10",
      devolucion: "Excelente resolución paso a paso.",
    },
  ]);
  const [notasTemp, setNotasTemp] = useState<{ [key: number]: string }>({});
  const [devolucionesTemp, setDevolucionesTemp] = useState<{ [key: number]: string }>({});

  const materia: MateriaDetalle = {
    id: id,
    nombre: id === "1" ? "Matemática I" : id === "2" ? "Lengua y Literatura" : "Ciencias Naturales",
    docente: "Prof. Gómez",
    descripcion: "Contenidos fundamentales y guías semanales de contingencia.",
  };

  useEffect(() => {
    const userStored = sessionStorage.getItem("usuario");
    const roleStored = sessionStorage.getItem("rol");

    if (!userStored) {
      router.push("/");
    } else {
      setTimeout(() => {
        setUsuario(userStored);
        setRol(roleStored || "alumno");
        setCargando(false);
      }, 0);
    }
  }, [router]);

  // FUNCIONES DEL DOCENTE: Gestión de Avisos y Materiales
  const handleAgregarAviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoAviso.trim()) return;
    const fechaActual = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    setAvisos([{ id: Date.now(), fecha: fechaActual, texto: nuevoAviso }, ...avisos]);
    setNuevoAviso("");
  };

  const handleBorrarAviso = (idAviso: number) => {
    if (confirm("¿Estás seguro de borrar este aviso?")) {
      setAvisos(avisos.filter(a => a.id !== idAviso));
    }
  };

  const handleAgregarMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMaterial) return;
    const pesoMB = (nuevoMaterial.size / (1024 * 1024)).toFixed(1) + " MB";
    const extension = nuevoMaterial.name.split('.').pop()?.toUpperCase() || "FILE";
    setMateriales([{ id: Date.now(), titulo: nuevoMaterial.name, tipo: extension, peso: pesoMB }, ...materiales]);
    setNuevoMaterial(null);
    if (fileMaterialRef.current) fileMaterialRef.current.value = "";
  };

  const handleBorrarMaterial = (idMaterial: number) => {
    if (confirm("¿Estás seguro de borrar este material?")) {
      setMateriales(materiales.filter(m => m.id !== idMaterial));
    }
  };

  const handleGuardarCalificacion = (idEntrega: number) => {
    const nuevaNota = notasTemp[idEntrega];
    const nuevaDevolucion = devolucionesTemp[idEntrega];
    if (!nuevaNota) {
      alert("Por favor ingresa una nota.");
      return;
    }
    setEntregas((prev) =>
      prev.map((item) =>
        item.id === idEntrega ? { ...item, nota: nuevaNota, devolucion: nuevaDevolucion || "" } : item
      )
    );
    alert("¡Calificación y devolución guardadas correctamente!");
  };

  // FUNCIONES DE MENSAJERÍA
  const handleEnviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;
    setMensajes([...mensajes, { id: Date.now(), autor: usuario, rol: rol, texto: nuevoMensaje }]);
    setNuevoMensaje("");
  };

  // FUNCIONES DEL ALUMNO: Enviar Tarea
  const handleDesadjuntar = () => {
    setArchivo(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEnviarTarea = (e: React.FormEvent) => {
    e.preventDefault();
    if (opcionEntrega === "archivo") {
      if (archivo && archivo.size > 5242880) {
        alert("Error: El archivo supera los 5 MB. Por favor, comprímelo para ahorrar datos.");
        return;
      }
      if (!archivo) {
        alert("Debes adjuntar un archivo.");
        return;
      }
      alert("¡Archivo entregado correctamente en modo de bajo consumo!");
      handleDesadjuntar();
    } else {
      if (!respuestaTexto.trim()) {
        alert("Debes escribir una respuesta.");
        return;
      }
      alert("¡Respuesta de texto enviada correctamente!");
      setRespuestaTexto("");
    }
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
        
        {/* Encabezado y Acceso a Videollamada */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-800">{materia.nombre}</h1>
            <p className="text-sm text-gray-500 mt-1">Docente a cargo: {materia.docente}</p>
            <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-3 rounded border border-gray-200">
              {materia.descripcion}
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex flex-col items-center w-full md:w-64 shrink-0">
            <span className="flex items-center gap-2 text-blue-800 font-bold mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
              Clase en Vivo
            </span>
            <p className="text-xs text-blue-600 text-center mb-3">
              Recomendado: Ingresar con cámara apagada para ahorrar datos.
            </p>
            <button 
              onClick={() => router.push(`/dashboard/materia/${materia.id}/sala`)}
              className="w-full bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded hover:bg-blue-700 transition shadow-sm"
            >
              Unirse a la Sala
            </button>
          </div>
        </div>

        {/* Grid de Avisos y Materiales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Avisos del Docente</h2>
            {rol === "docente" && (
              <form onSubmit={handleAgregarAviso} className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={nuevoAviso}
                  onChange={(e) => setNuevoAviso(e.target.value)}
                  placeholder="Nuevo aviso rápido..." 
                  className="flex-1 text-sm border border-gray-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 font-medium">
                  Publicar
                </button>
              </form>
            )}
            <div className="space-y-3">
              {avisos.map((aviso) => (
                <div key={aviso.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-800 flex justify-between items-start gap-2">
                  <div>
                    <span className="font-bold text-yellow-800 block text-xs mb-1">{aviso.fecha}</span>
                    {aviso.texto}
                  </div>
                  {rol === "docente" && (
                    <button onClick={() => handleBorrarAviso(aviso.id)} className="text-red-500 hover:text-red-700 text-xs font-bold px-1">✕</button>
                  )}
                </div>
              ))}
              {avisos.length === 0 && <p className="text-xs text-gray-500">No hay avisos recientes.</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Material de Estudio</h2>
            {rol === "docente" && (
              <form onSubmit={handleAgregarMaterial} className="flex flex-col gap-2 mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
                <label className="text-xs font-medium text-gray-700">Subir nuevo material (PDF/ZIP)</label>
                <div className="flex items-center gap-2">
                  <input 
                    ref={fileMaterialRef}
                    type="file" 
                    onChange={(e) => setNuevoMaterial(e.target.files?.[0] || null)}
                    className="flex-1 text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full"
                  />
                  <button type="submit" className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded hover:bg-blue-700 font-medium">Subir</button>
                </div>
              </form>
            )}
            <div className="space-y-3">
              {materiales.map((archivo) => (
                <div key={archivo.id} className="p-3 border border-gray-200 rounded flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-sm">{archivo.titulo}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Formato: {archivo.tipo} • Peso: <span className="font-medium text-blue-600">{archivo.peso}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-xs bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 font-medium">Descargar</button>
                    {rol === "docente" && (
                      <button onClick={() => handleBorrarMaterial(archivo.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-2 border border-red-200 bg-red-50 hover:bg-red-100 rounded font-medium">Borrar</button>
                    )}
                  </div>
                </div>
              ))}
              {materiales.length === 0 && <p className="text-xs text-gray-500">No hay material cargado.</p>}
            </div>
          </div>
        </div>

        {/* VISTA DEL ALUMNO: Entregas */}
        {rol === "alumno" && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Entregar Trabajos</h2>
            <div className="flex border-b border-gray-200 mb-4">
              <button onClick={() => setOpcionEntrega("archivo")} className={`py-2 px-4 text-sm font-medium ${opcionEntrega === "archivo" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>Subir Archivo</button>
              <button onClick={() => setOpcionEntrega("texto")} className={`py-2 px-4 text-sm font-medium ${opcionEntrega === "texto" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"}`}>Texto Plano</button>
            </div>
            <form onSubmit={handleEnviarTarea} className="space-y-4">
              {opcionEntrega === "archivo" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona el archivo de tu trabajo (máx. 5 MB)</label>
                  <div className="flex items-center gap-4 mt-2">
                    <input ref={fileInputRef} type="file" onChange={(e) => setArchivo(e.target.files?.[0] || null)} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer flex-1" />
                    {archivo && <button type="button" onClick={handleDesadjuntar} className="text-sm text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded font-medium border border-red-200">Desadjuntar</button>}
                  </div>
                  {archivo && archivo.size > 5242880 && <p className="text-xs text-red-600 mt-2 font-medium">⚠️ El archivo supera los 5 MB permitidos.</p>}
                </div>
              )}
              {opcionEntrega === "texto" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Escribe tu respuesta</label>
                  <textarea value={respuestaTexto} onChange={(e) => setRespuestaTexto(e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 bg-gray-50 text-sm" placeholder="Escribe tu respuesta aquí..." />
                </div>
              )}
              <button type="submit" className="w-full bg-green-600 text-white font-medium py-2 px-4 rounded-md hover:bg-green-700">Enviar Tarea</button>
            </form>
          </div>
        )}

        {/* VISTA DEL DOCENTE: Calificaciones */}
        {rol === "docente" && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800">Trabajos Recibidos de Alumnos</h2>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded font-medium">{entregas.length} Entregas realizadas</span>
            </div>
            <div className="space-y-4">
              {entregas.map((item) => (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-800 text-sm">{item.alumno}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Enviado: {item.fecha}</p>
                    </div>
                    {item.nota ? (
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded">Nota: {item.nota}</span>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-800 font-bold px-2 py-1 rounded">Pendiente de corrección</span>
                    )}
                  </div>
                  <div className="p-3 bg-white border border-gray-200 rounded text-xs">
                    {item.tipo === "archivo" ? (
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">📄 Archivo: {item.contenido} ({item.peso})</span>
                        <button className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100">Descargar</button>
                      </div>
                    ) : (
                      <div>
                        <span className="font-semibold text-gray-500 block mb-1">📝 Respuesta en texto plano:</span>
                        <p className="text-gray-800 italic bg-gray-50 p-2 rounded border border-gray-100">{item.contenido}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex flex-col md:flex-row gap-3 items-end">
                    <div className="w-full md:w-32">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nota</label>
                      <input type="text" placeholder="Ej: 8/10" defaultValue={item.nota} onChange={(e) => setNotasTemp({ ...notasTemp, [item.id]: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 bg-white" />
                    </div>
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Devolución</label>
                      <input type="text" placeholder="Observación para el alumno..." defaultValue={item.devolucion} onChange={(e) => setDevolucionesTemp({ ...devolucionesTemp, [item.id]: e.target.value })} className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 bg-white" />
                    </div>
                    <button type="button" onClick={() => handleGuardarCalificacion(item.id)} className="w-full md:w-auto px-4 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 font-medium">Guardar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FORO DE DUDAS / MENSAJERÍA */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-lg font-bold text-gray-800">Foro de Consultas de la Materia</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">
              {mensajes.length} mensajes
            </span>
          </div>

          <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
            {mensajes.map((msg) => (
              <div key={msg.id} className={`p-3 rounded-lg text-sm ${msg.rol === "docente" ? "bg-blue-50 border border-blue-100 ml-4 md:ml-12" : "bg-gray-50 border border-gray-200 mr-4 md:mr-12"}`}>
                <span className={`font-bold block text-xs mb-1 ${msg.rol === "docente" ? "text-blue-800" : "text-gray-700"}`}>
                  {msg.autor} {msg.rol === "docente" && "⭐ (Docente)"}
                </span>
                <p className="text-gray-800">{msg.texto}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleEnviarMensaje} className="flex gap-2 pt-2 border-t border-gray-200">
            <input
              type="text"
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              placeholder="Escribe tu consulta o respuesta..."
              className="flex-1 text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            />
            <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700 font-medium transition">
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
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-100 text-gray-600 font-medium">Cargando aula virtual...</div>}>
      <ContenidoMateria />
    </Suspense>
  );
}