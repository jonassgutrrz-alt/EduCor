"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

interface Materia {
  id: number;
  nombre: string;
  docente: string;
  grado?: string | null;
  seccion?: string | null;
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
        const { data } = await supabase
          .from("inscripciones")
          .select(
            `
            materias (
              id, nombre, grado, seccion,
              usuarios ( nombre_completo )
            )
          `,
          )
          .eq("alumno_id", userId);

        if (data) {
          const materiasFormateadas = data.map((insc) => {
            const materiaData = insc.materias as unknown as {
              id: number;
              nombre: string;
              grado?: string | null;
              seccion?: string | null;
              usuarios: { nombre_completo: string } | null;
            };

            return {
              id: materiaData.id,
              nombre: materiaData.nombre,
              docente: materiaData.usuarios?.nombre_completo || "Sin asignar",
              grado: materiaData.grado || null,
              seccion: materiaData.seccion || null,
              tareasPendientes: 0,
            };
          });
          setMaterias(materiasFormateadas);
        }
      } else if (roleStored === "docente") {
        const { data } = await supabase
          .from("materias")
          .select("id, nombre, grado, seccion")
          .eq("docente_id", userId);

        if (data) {
          const materiasFormateadas = data.map((mat) => {
            const matData = mat as unknown as {
              id: number;
              nombre: string;
              grado?: string | null;
              seccion?: string | null;
            };
            return {
              id: matData.id,
              nombre: matData.nombre,
              docente: "Vos (Docente)",
              grado: matData.grado || null,
              seccion: matData.seccion || null,
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
      setMensajeAdmin(
        `✅ ¡Éxito! Procesados ${cantidadUsuarios} usuarios del archivo CSV.`,
      );
      if (fileCsvRef.current) fileCsvRef.current.value = "";
    };
    reader.readAsText(file);
  };

  if (cargando) {
    return (
      <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-slate-50 text-slate-600 px-4">
        <Image
          src="/EduCor.png"
          alt="EduCor Logo"
          width={64}
          height={64}
          priority
        />
        <div className="h-7 w-7 animate-spin rounded-full border-3 border-indigo-600 border-t-transparent mb-3" />
        <p className="text-sm sm:text-base font-medium text-slate-600">
          Cargando aula virtual en vivo...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh w-full bg-slate-50 py-4 px-3 sm:px-6 lg:px-8 overflow-x-hidden text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6">
        {/* RESPONSIVE HEADER with official EduCor.png Logo */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-all">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <Image
                src="/EduCor.png"
                alt="EduCor Logo"
                width={44}
                height={44}
                priority
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Edu
                  <span className="text-indigo-600 dark:text-indigo-400">
                    Cor
                  </span>
                </h1>
              </div>
            </div>

            {/* Quick-tap 44px logout button for mobile */}
            <button
              onClick={handleCerrarSesion}
              className="sm:hidden min-h-[44px] min-w-[44px] px-3 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer dark:bg-rose-950/40 dark:text-rose-400"
              aria-label="Cerrar sesión"
            >
                            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                className="w-5 h-5 shrink-0 fill-current"
                aria-hidden="true"
              >
                <path d="M224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160zM566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C426.1 156.8 405.8 156.8 393.3 169.3C380.8 181.8 380.8 202.1 393.3 214.6L466.7 288L256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L466.7 352L393.3 425.4C380.8 437.9 380.8 458.2 393.3 470.7C380.8 483.2 380.8 458.2 393.3 470.7C426.1 483.2 438.6 470.7 566.6 342.7z" />
              </svg>
            </button>
          </div>

          {/* User metadata & full desktop logout button */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                {usuario}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                {rol}
              </span>
              <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                {rol === "alumno"
                  ? materias[0]?.grado
                    ? `${materias[0].grado}° ${materias[0].seccion || ""}°`.trim()
                    : "Sin grado asignado"
                  : null}
              </span>
            </div>
            <button
              onClick={handleCerrarSesion}
              className="hidden sm:inline-flex min-h-[44px] items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:hover:bg-rose-950/70 rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 640 640"
                className="w-5 h-5 shrink-0 fill-current"
                aria-hidden="true"
              >
                <path d="M224 160C241.7 160 256 145.7 256 128C256 110.3 241.7 96 224 96L160 96C107 96 64 139 64 192L64 448C64 501 107 544 160 544L224 544C241.7 544 256 529.7 256 512C256 494.3 241.7 480 224 480L160 480C142.3 480 128 465.7 128 448L128 192C128 174.3 142.3 160 160 160L224 160zM566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L438.6 169.3C426.1 156.8 405.8 156.8 393.3 169.3C380.8 181.8 380.8 202.1 393.3 214.6L466.7 288L256 288C238.3 288 224 302.3 224 320C224 337.7 238.3 352 256 352L466.7 352L393.3 425.4C380.8 437.9 380.8 458.2 393.3 470.7C380.8 483.2 380.8 458.2 393.3 470.7C426.1 483.2 438.6 470.7 566.6 342.7z" />
              </svg>
            </button>
          </div>
        </header>

        {/* Dynamic Card Grids */}
        <main className="space-y-4 sm:space-y-6">
          <section className="bg-white dark:bg-slate-900 p-4 sm:p-6 md:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                {rol === "alumno"
                  ? "Mis Materias"
                  : rol === "docente"
                    ? "Aulas a Mi Cargo"
                    : "Panel de Gestión Institucional"}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {materias.length}{" "}
                {materias.length === 1 ? "materia activa" : "materias activas"}
              </span>
            </div>

            {/* FLUID CSS GRID */}
            {rol === "alumno" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-6">
                {materias.map((materia) => (
                  <div
                    key={materia.id}
                    className="group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 hover:bg-white dark:bg-slate-800/40 dark:hover:bg-slate-800 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {materia.nombre}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <svg
                          className="w-3.5 h-3.5 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Prof: {materia.docente}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-end">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/materia/${materia.id}`)
                        }
                        className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-600 dark:hover:text-white transition-all duration-150 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>Ingresar</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}

                {materias.length === 0 && (
                  <div className="col-span-full py-12 text-center">
                    <p className="text-sm text-slate-500">
                      No estás inscrito en ninguna materia por el momento.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Docente View */}
            {rol === "docente" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-6">
                {materias.map((materia) => (
                  <div
                    key={materia.id}
                    className="flex flex-col justify-between p-4 sm:p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 dark:border-emerald-950/60 dark:bg-emerald-950/20"
                  >
                    <div>
                      <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-300">
                        {materia.nombre}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Curso: {materia.grado ? `${materia.grado}° ${materia.seccion || ""}`.trim() : "Sin curso asignado"}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <span className="inline-flex items-center text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Aula Virtual Activa
                      </span>
                      <button
                        onClick={() =>
                          router.push(`/dashboard/materia/${materia.id}`)
                        }
                        className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Gestionar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Admin CSV View */}
            {rol === "admin" && (
              <div className="p-4 sm:p-6 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-900 rounded-2xl space-y-4">
                <div>
                  <h3 className="font-bold text-purple-950 dark:text-purple-200 text-base sm:text-lg">
                    Carga Masiva de Usuarios (CSV)
                  </h3>
                  <p className="text-xs sm:text-sm text-purple-800 dark:text-purple-300 mt-1">
                    Sube el padrón oficial de alumnos y docentes para
                    sincronizar el sistema.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 border border-purple-100 dark:border-purple-900/50 rounded-xl shadow-sm">
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileCsvRef}
                    onChange={handleCargarCSV}
                    className="min-h-[44px] text-xs sm:text-sm text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer flex-1"
                  />
                </div>

                {mensajeAdmin && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200 rounded-xl text-xs sm:text-sm font-medium">
                    {mensajeAdmin}
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}