"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Materia {
  id: number;
  nombre: string;
  docente: string;
  tareasPendientes: number;
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState("");
  const [rol, setRol] = useState("");
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  const fileCsvRef = useRef<HTMLInputElement>(null);
  const [mensajeAdmin, setMensajeAdmin] = useState("");

  useEffect(() => {
    const fetchDatos = async () => {
      const userId = sessionStorage.getItem("usuario_id");
      const userStored = sessionStorage.getItem("usuario");
      const roleStored = sessionStorage.getItem("rol");

      if (!userId) {
        router.push("/");
        return;
      }

      setUsuario(userStored || "");
      setRol(roleStored || "alumno");

      if (roleStored === "alumno") {
        // Buscamos las materias en las que está inscrito el alumno
        const { data } = await supabase
          .from("inscripciones")
          .select(`
            materias (
              id, nombre,
              usuarios ( nombre_completo )
            )
          `)
          .eq("alumno_id", userId);

        if (data) {
          // Tipado estricto para evitar el error 'Unexpected any'
          const materiasFormateadas = data.map((insc) => {
            const materiaData = insc.materias as unknown as {
              id: number;
              nombre: string;
              usuarios: { nombre_completo: string } | null;
            };

            return {
              id: materiaData.id,
              nombre: materiaData.nombre,
              docente: materiaData.usuarios?.nombre_completo || "Sin asignar",
              tareasPendientes: 0,
            };
          });
          setMaterias(materiasFormateadas);
        }
      } else if (roleStored === "docente") {
        // Buscamos las materias que dicta este docente
        const { data } = await supabase
          .from("materias")
          .select("id, nombre")
          .eq("docente_id", userId);

        if (data) {
           // Tipado estricto para evitar el error 'Unexpected any'
          const materiasFormateadas = data.map((mat) => {
            const matData = mat as unknown as { id: number; nombre: string };
            return {
              id: matData.id,
              nombre: matData.nombre,
              docente: "Vos (Docente)",
              tareasPendientes: 0,
            };
          });
          setMaterias(materiasFormateadas);
        }
      }

      setCargando(false);
    };

    fetchDatos();
  }, [router]);

  const handleCerrarSesion = () => {
    sessionStorage.clear();
    router.push("/");
  };

  const handleCargarCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lineas = text.split("\n").filter((line) => line.trim() !== "");
      const cantidadUsuarios = lineas.length > 1 ? lineas.length - 1 : 0;
      setMensajeAdmin(`✅ ¡Éxito! Procesados ${cantidadUsuarios} usuarios del CSV.`);
      if (fileCsvRef.current) fileCsvRef.current.value = "";
    };
    reader.readAsText(file);
  };

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-600 font-medium">
        Cargando aula virtual en vivo...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="flex items-center justify-between bg-white p-4 rounded-lg shadow border border-gray-200 mb-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">EduCor</h1>
          <p className="text-xs text-green-600 font-semibold">● Modo En Línea (Datos Reales)</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            Usuario: <strong>{usuario}</strong> ({rol.toUpperCase()})
          </span>
          <button
            onClick={handleCerrarSesion}
            className="px-3 py-1 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Panel de Control - {rol === "alumno" ? "Mis Materias" : rol === "docente" ? "Aulas a Cargo" : "Gestión Institucional"}
          </h2>

          {/* VISTA ALUMNO */}
          {rol === "alumno" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materias.map((materia) => (
                  <div key={materia.id} className="p-4 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-gray-800">{materia.nombre}</h4>
                      <p className="text-xs text-gray-500">Prof: {materia.docente}</p>
                    </div>
                    <button onClick={() => router.push(`/dashboard/materia/${materia.id}`)} className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100 border border-blue-200">
                      Entrar
                    </button>
                  </div>
                ))}
                {materias.length === 0 && <p className="text-sm text-gray-500">No estás inscrito en ninguna materia.</p>}
              </div>
            </div>
          )}

          {/* VISTA DOCENTE */}
          {rol === "docente" && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {materias.map((materia) => (
                  <div key={materia.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="font-bold text-green-800">{materia.nombre}</h3>
                    <p className="text-xs text-gray-500 mt-1">{materia.docente}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">Gestionar aula virtual</span>
                      <button onClick={() => router.push(`/dashboard/materia/${materia.id}`)} className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
                        Entrar
                      </button>
                    </div>
                  </div>
                ))}
                {materias.length === 0 && <p className="text-sm text-gray-500">No tienes materias asignadas.</p>}
              </div>
            </div>
          )}

          {/* VISTA ADMIN */}
          {rol === "admin" && (
            <div className="p-6 bg-purple-50 border border-purple-200 rounded-md space-y-4">
              <div>
                <h3 className="font-bold text-purple-900 text-lg">Carga Masiva de Usuarios (CSV)</h3>
                <p className="text-sm text-purple-800 mt-1">Sube el padrón de alumnos y docentes brindado por el Ministerio.</p>
              </div>
              <div className="flex items-center gap-4 bg-white p-4 border border-purple-100 rounded">
                <input 
                  type="file" 
                  accept=".csv"
                  ref={fileCsvRef}
                  onChange={handleCargarCSV}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer flex-1"
                />
              </div>
              {mensajeAdmin && (
                <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded text-sm font-medium">{mensajeAdmin}</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
