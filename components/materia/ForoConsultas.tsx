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
                    <button onClick={() => { setEditandoId(m.id); setTextoEditado(m.texto); }} className="text-indigo-600 hover:underline cursor-pointer">
                      Editar
                    </button>
                  )}
                  {puedeBorrar && (
                    <button onClick={() => handleBorrarMensaje(m.id)} className="text-rose-500 hover:underline cursor-pointer">
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
        <button type="submit" className="min-h-[44px] bg-indigo-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 cursor-pointer">
          Enviar
        </button>
      </form>
    </div>
  );
}