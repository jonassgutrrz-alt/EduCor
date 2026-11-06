"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

interface MensajeForo {
  id: number;
  autor_id: string;
  autor_nombre: string;
  rol: string;
  texto: string;
  fecha: string;
  editado?: boolean;
}

interface Props {
  materiaId: string;
  rol: string;
  userId: string;
  usuarioNombre: string;
}

export default function ForoConsultas({ materiaId, rol, userId, usuarioNombre }: Props) {
  const { showConfirm } = useToast();
  const [mensajes, setMensajes] = useState<MensajeForo[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarMensajes = async () => {
      const { data } = await supabase
        .from("mensajes_foro")
        .select("*")
        .eq("materia_id", materiaId)
        .order("id", { ascending: true });

      if (data) setMensajes(data as MensajeForo[]);
      setCargando(false);
    };

    cargarMensajes();
  }, [materiaId]);

  const handleEnviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const { data, error } = await supabase
      .from("mensajes_foro")
      .insert([
        {
          materia_id: Number(materiaId),
          autor_id: userId,
          autor_nombre: usuarioNombre,
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
          m.id === idMensaje ? { ...m, texto: textoEditado, editado: true } : m
        )
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
        if (!error) setMensajes((prev) => prev.filter((m) => m.id !== idMensaje));
      },
      "Eliminar Mensaje"
    );
  };

  if (cargando) {
    return (
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 animate-pulse">
        Cargando foro...
      </div>
    );
  }

  return (
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
              className={`p-3 rounded-xl text-xs sm:text-sm ${
                m.rol === "docente"
                  ? "bg-indigo-50/70 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900"
                  : "bg-slate-50 border border-slate-200 dark:bg-slate-800/50 dark:border-slate-700"
              }`}
            >
              <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span>
                  {m.autor_nombre} ({m.rol.toUpperCase()})
                  {m.editado && <span className="font-normal italic text-slate-500 ml-1">(Editado)</span>}
                </span>
                <div className="flex gap-3">
                  {esAutor && (
                    <button onClick={() => { setEditandoId(m.id); setTextoEditado(m.texto); }} className="fill-current text-indigo-600 hover:underline cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-4 w-4"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L368 46.1 465.9 144 490.3 119.6c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L432 177.9 334.1 80 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z"/></svg>
                    </button>
                  )}
                  {puedeBorrar && (
                    <button onClick={() => handleBorrarMensaje(m.id)} className="fill-current text-rose-500 hover:underline cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-4 w-4"><path d="M136.7 5.9C141.1-7.2 153.3-16 167.1-16l113.9 0c13.8 0 26 8.8 30.4 21.9L320 32 416 32c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 96C14.3 96 0 81.7 0 64S14.3 32 32 32l96 0 8.7-26.1zM32 144l384 0 0 304c0 35.3-28.7 64-64 64L96 512c-35.3 0-64-28.7-64-64l0-304zm88 64c-13.3 0-24 10.7-24 24l0 192c0 13.3 10.7 24 24 24s24-10.7 24-24l0-192c0-13.3-10.7-24-24-24zm104 0c-13.3 0-24 10.7-24 24l0 192c0 13.3 10.7 24 24 24s24-10.7 24-24l0-192c0-13.3-10.7-24-24-24zm104 0c-13.3 0-24 10.7-24 24l0 192c0 13.3 10.7 24 24 24s24-10.7 24-24l0-192c0-13.3-10.7-24-24-24z"/></svg>
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
                  <button onClick={() => handleGuardarEdicion(m.id)} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700 cursor-pointer">
                    Guardar
                  </button>
                  <button onClick={() => setEditandoId(null)} className="bg-slate-400 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-slate-500 cursor-pointer">
                    Cancelar
                  </button>
                </div>
              ) : (
                <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{m.texto}</p>
              )}
            </div>
          );
        })}
      </div>
      <form onSubmit={handleEnviarMensaje} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={nuevoMensaje}
          onChange={(e) => setNuevoMensaje(e.target.value)}
          placeholder="Escribe tu consulta..."
          className="flex-1 min-h-[44px] text-xs sm:text-sm border border-slate-300 dark:border-slate-700 dark:bg-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button type="submit" className="justify-center items-center relative flex fill-current min-h-[44px] bg-indigo-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" className="h-5 w-5"><path d="M536.4-26.3c9.8-3.5 20.6-1 28 6.3s9.8 18.2 6.3 28l-178 496.9c-5 13.9-18.1 23.1-32.8 23.1-14.2 0-27-8.6-32.3-21.7l-64.2-158c-4.5-11-2.5-23.6 5.2-32.6l94.5-112.4c5.1-6.1 4.7-15-.9-20.6s-14.6-6-20.6-.9L229.2 276.1c-9.1 7.6-21.6 9.6-32.6 5.2L38.1 216.8c-13.1-5.3-21.7-18.1-21.7-32.3 0-14.7 9.2-27.8 23.1-32.8l496.9-178z"/></svg>
        </button>
      </form>
    </div>
  );
}