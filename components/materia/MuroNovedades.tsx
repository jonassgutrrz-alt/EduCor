"use client";

import React, { useEffect, useState, useRef } from "react";
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

interface Props {
  materiaId: string;
  rol: string;
}

const generarRutaArchivo = (carpeta: string, nombreOriginal: string) => {
  return `${carpeta}/${Date.now()}_${nombreOriginal}`;
};

export default function MuroNovedades({ materiaId, rol }: Props) {
  const { showToast, showConfirm } = useToast();
  const fileMaterialRef = useRef<HTMLInputElement>(null);

  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [nuevoAviso, setNuevoAviso] = useState("");
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [nuevoMaterial, setNuevoMaterial] = useState<File | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarNovedades = async () => {
      const [resAvisos, resMateriales] = await Promise.all([
        supabase
          .from("avisos")
          .select("*")
          .eq("materia_id", materiaId)
          .order("fecha", { ascending: false }),
        supabase
          .from("materiales")
          .select("*")
          .eq("materia_id", materiaId)
          .order("id", { ascending: false }),
      ]);

      if (resAvisos.data) setAvisos(resAvisos.data);
      if (resMateriales.data) setMateriales(resMateriales.data);
      setCargando(false);
    };

    cargarNovedades();
  }, [materiaId]);

  const handleAgregarAviso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoAviso.trim()) return;

    const { data, error } = await supabase
      .from("avisos")
      .insert([{ materia_id: Number(materiaId), texto: nuevoAviso }])
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
        const { error } = await supabase.from("avisos").delete().eq("id", idAviso);
        if (!error) {
          setAvisos((prev) => prev.filter((a) => a.id !== idAviso));
          showToast("Aviso eliminado correctamente.", "info");
        }
      },
      "Eliminar Aviso"
    );
  };

  const handleAgregarMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMaterial) {
      showToast("Selecciona un archivo antes de subir.", "warning");
      return;
    }
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
          materia_id: Number(materiaId),
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
      showToast("Material subido con éxito.", "success");
    }
  };

  const handleBorrarMaterial = (idMaterial: number) => {
    showConfirm(
      "¿Eliminar este material de estudio?",
      async () => {
        const { error } = await supabase.from("materiales").delete().eq("id", idMaterial);
        if (!error) setMateriales((prev) => prev.filter((m) => m.id !== idMaterial));
      },
      "Eliminar Material"
    );
  };

  if (cargando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 animate-pulse">Cargando avisos...</div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 animate-pulse">Cargando materiales...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-2">
          Avisos del Docente
        </h2>
        {rol === "docente" && (
          <form onSubmit={handleAgregarAviso} className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              value={nuevoAviso}
              onChange={(e) => setNuevoAviso(e.target.value)}
              placeholder="Nuevo aviso rápido..."
              className="flex-1 min-h-[44px] text-xs sm:text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="min-h-[44px] bg-indigo-600 text-white text-xs sm:text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 font-semibold cursor-pointer">
              Publicar
            </button>
          </form>
        )}
        <div className="space-y-3">
          {avisos.map((a) => (
            <div key={a.id} className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 flex justify-between items-start">
              <p className="leading-relaxed">{a.texto}</p>
              {rol === "docente" && (
                <button onClick={() => handleBorrarAviso(a.id)} className="text-rose-500 hover:text-rose-700 font-bold text-xs ml-2 cursor-pointer p-1">
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
          <form onSubmit={handleAgregarMaterial} className="flex flex-col gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
            <input
              ref={fileMaterialRef}
              type="file"
              onChange={(e) => setNuevoMaterial(e.target.files?.[0] || null)}
              className="min-h-[44px] text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 font-medium"
            />
            <button type="submit" className="fill-current gap-1.5 relative flex min-h-[20px] bg-indigo-600 text-white text-xs px-3.5 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold self-end cursor-pointer">
              Subir <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-3 w-3"><path d="M256 109.3L256 320c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-210.7-41.4 41.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l96-96c12.5-12.5 32.8-12.5 45.3 0l96 96c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 109.3zM224 400c44.2 0 80-35.8 80-80l80 0c35.3 0 64 28.7 64 64l0 32c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64l0-32c0-35.3 28.7-64 64-64l80 0c0 44.2 35.8 80 80 80zm144 24a24 24 0 1 0 0-48 24 24 0 1 0 0 48z"/></svg>
            </button>
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
                <a href={m.url_archivo} target="_blank" rel="noopener noreferrer" className="min-h-[38px] text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 font-semibold flex items-center">
                  Descargar
                </a>
                {rol === "docente" && (
                  <button onClick={() => handleBorrarMaterial(m.id)} className="min-h-[38px] text-rose-500 text-xs px-2.5 border border-rose-200 dark:border-rose-900 rounded-lg hover:bg-rose-50 cursor-pointer">
                    Borrar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}