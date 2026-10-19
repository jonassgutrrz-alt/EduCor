"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Definimos un tipo de datos básico para las materias
interface Materia {
  id: number;
  nombre: string;
  docente: string;
  tareasPendientes: number;
}

export default function Dashboard() {
  const [usuario, setUsuario] = useState("");
  const [rol, setRol] = useState("");
  const [cargando, setCargando] = useState(true);
  const router = useRouter();

  // Datos simulados (mock data) de materias adaptados a bajo consumo
  const materiasAlumno: Materia[] = [
    {
      id: 1,
      nombre: "Matemática I",
      docente: "Prof. Gómez",
      tareasPendientes: 1,
    },
    {
      id: 2,
      nombre: "Lengua y Literatura",
      docente: "Prof. Pérez",
      tareasPendientes: 0,
    },
    {
      id: 3,
      nombre: "Ciencias Naturales",
      docente: "Prof. Ruiz",
      tareasPendientes: 2,
    },
  ];

  const materiasDocente: Materia[] = [
    {
      id: 1,
      nombre: "Matemática I - 3° Año",
      docente: "Vos (Docente)",
      tareasPendientes: 5,
    },
    {
      id: 2,
      nombre: "Física - 4° Año",
      docente: "Vos (Docente)",
      tareasPendientes: 2,
    },
  ];

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

  if (cargando) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-600 font-medium">
        Cargando aula virtual...
      </div>
    );
  }

  const handleCerrarSesion = () => {
    sessionStorage.clear();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Barra Superior */}
      <header className="flex items-center justify-between bg-white p-4 rounded-lg shadow border border-gray-200 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-700">EduCor</h1>
          <p className="text-xs text-green-600 font-semibold">
            ● Modo En Línea (Bajo Consumo)
          </p>
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

      {/* Contenido Principal */}
      <main className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Panel de Control -{" "}
            {rol === "alumno"
              ? "Mis Materias"
              : rol === "docente"
                ? "Aulas a Cargo"
                : "Gestión Institucional"}
          </h2>

          {/* VISTA ALUMNO */}
          {rol === "alumno" && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-semibold text-blue-900">Vista de Alumno</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Aquí podrás visualizar tus materias, descargar guías semanales
                  comprimidas en PDF y enviar tus trabajos resueltos.
                </p>
              </div>

              {/* Módulo de Aulas / Materias dinámicas */}
              <h3 className="text-lg font-bold text-gray-800 mt-6 border-b pb-2">
                Mis Materias
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materiasAlumno.map((materia) => (
                  <div
                    key={materia.id}
                    className="p-4 bg-white border border-gray-200 rounded-md shadow-sm flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-gray-800">
                        {materia.nombre}
                      </h4>
                      <p className="text-xs text-gray-500">{materia.docente}</p>
                      <span
                        className={`text-xs font-medium ${
                          materia.tareasPendientes > 0
                            ? "text-orange-600"
                            : "text-green-600"
                        }`}
                      >
                        ●{" "}
                        {materia.tareasPendientes > 0
                          ? `${materia.tareasPendientes} tarea pendiente`
                          : "Al día"}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        router.push(`/dashboard/materia/${materia.id}`)
                      }
                      className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100 border border-blue-200 transition"
                    >
                      Entrar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISTA DOCENTE */}
          {rol === "docente" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Administra tus cursos, publica avisos y sube material de
                contingencia.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {materiasDocente.map((materia) => (
                  <div
                    key={materia.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-green-500 transition-colors bg-gray-50"
                  >
                    <h3 className="font-bold text-green-800">
                      {materia.nombre}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {materia.docente}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
                        {materia.tareasPendientes} entregas por corregir
                      </span>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/materia/${materia.id}`)
                        }
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                      >
                        Gestionar aula
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISTA ADMIN */}
          {rol === "admin" && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-md space-y-3">
              <h3 className="font-semibold text-purple-900">
                Panel de Administración Escolar
              </h3>
              <p className="text-sm text-purple-800">
                Herramientas institucionales habilitadas para la carga masiva de
                usuarios y control de accesos durante la contingencia climática.
              </p>
              <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 font-medium">
                Cargar Planilla CSV de Alumnos/Docentes
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}