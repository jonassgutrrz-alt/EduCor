"use client";

import React from "react";

export default function MateriaGamificacion() {
  const logros = [
    { id: 1, titulo: "Primera Entrega", desc: "Completaste tu primer TP", icono: "🏆" },
    { id: 2, titulo: "Puntualidad", desc: "Entrega antes de la fecha límite", icono: "⚡" },
    { id: 3, titulo: "Asistencia Perfecta", desc: "Presente en todas las videollamadas", icono: "⭐" },
  ];

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-yellow-500/10 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 mb-6 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
          <span>🎮</span> Sistema de Emblemas y Logros
        </h3>
        <span className="text-[10px] font-extrabold bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-200 px-2.5 py-0.5 rounded-full">
          Gamificación Activa
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {logros.map((l) => (
          <div key={l.id} className="flex items-center gap-2.5 bg-white/80 dark:bg-slate-800/80 p-2.5 rounded-xl border border-amber-100 dark:border-amber-950/40">
            <span className="text-2xl">{l.icono}</span>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{l.titulo}</h4>
              <p className="text-[10px] text-slate-500">{l.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}