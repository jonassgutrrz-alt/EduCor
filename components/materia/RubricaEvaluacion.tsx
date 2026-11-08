"use client";

import React, { useState } from "react";

interface Criterio {
  id: string;
  nombre: string;
  puntaje: number;
}

interface RubricaEvaluacionProps {
  onGenerarEvaluacion: (nota: string, devolucion: string) => void;
}

export default function RubricaEvaluacion({ onGenerarEvaluacion }: RubricaEvaluacionProps) {
  const [criterios, setCriterios] = useState<Criterio[]>([
    { id: "1", nombre: "Precisión", puntaje: 0 },
    { id: "2", nombre: "Claridad", puntaje: 0 },
    { id: "3", nombre: "Desarrollo", puntaje: 0 },
    { id: "4", nombre: "Originalidad", puntaje: 0 },
    { id: "5", nombre: "Presentación", puntaje: 0 },
  ]);
  const [nuevoCriterio, setNuevoCriterio] = useState("");

  const notificarCambio = (listaActualizada: Criterio[]) => {
    const evaluados = listaActualizada.filter((c) => c.puntaje > 0);
    if (evaluados.length === 0) {
      onGenerarEvaluacion("", "");
      return;
    }

    const suma = evaluados.reduce((acc, c) => acc + c.puntaje, 0);
    const promedio = (suma / evaluados.length).toFixed(2).replace(".00", "");

    let textoDevolucion = "Evaluación por Rúbrica:\n";
    evaluados.forEach((c) => {
      textoDevolucion += `- ${c.nombre}: ${c.puntaje}/10\n`;
    });

    onGenerarEvaluacion(promedio, textoDevolucion);
  };

  const actualizarPuntaje = (id: string, puntaje: number) => {
    const nuevaLista = criterios.map((c) => (c.id === id ? { ...c, puntaje } : c));
    setCriterios(nuevaLista);
    notificarCambio(nuevaLista);
  };

  const actualizarNombre = (id: string, nuevoNombre: string) => {
    const nuevaLista = criterios.map((c) => (c.id === id ? { ...c, nombre: nuevoNombre } : c));
    setCriterios(nuevaLista);
    notificarCambio(nuevaLista);
  };

  const eliminarCriterio = (id: string) => {
    const nuevaLista = criterios.filter((c) => c.id !== id);
    setCriterios(nuevaLista);
    notificarCambio(nuevaLista);
  };

  const agregarCriterio = () => {
    if (!nuevoCriterio.trim()) return;
    const nuevaLista = [
      ...criterios,
      { id: Date.now().toString(), nombre: nuevoCriterio, puntaje: 0 },
    ];
    setCriterios(nuevaLista);
    setNuevoCriterio("");
    notificarCambio(nuevaLista);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mt-3 space-y-4">
      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
        Rúbrica Interactiva
      </h4>
      
      <div className="space-y-3">
        {criterios.map((c) => (
          <div key={c.id} className="flex flex-col gap-2">
            <div className="flex justify-between items-center gap-2">
              <input
                type="text"
                value={c.nombre}
                onChange={(e) => actualizarNombre(c.id, e.target.value)}
                className="text-xs font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200 w-full"
              />
              <button
                type="button"
                onClick={() => eliminarCriterio(c.id)}
                className="text-[10px] text-rose-500 hover:text-rose-700 font-bold px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => actualizarPuntaje(c.id, num)}
                  className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold transition-colors cursor-pointer ${
                    c.puntaje === num
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-indigo-400"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
        <input
          type="text"
          value={nuevoCriterio}
          onChange={(e) => setNuevoCriterio(e.target.value)}
          placeholder="Nuevo criterio..."
          className="flex-1 text-xs p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={agregarCriterio}
          className="bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200 text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-slate-300 cursor-pointer"
        >
          Agregar
        </button>
      </div>
    </div>
  );
}