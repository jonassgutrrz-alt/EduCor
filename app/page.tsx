"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Por favor completa todos los campos.");
      return;
    }

    setCargando(true);

    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("email", email)
        .eq("contrasena", password)
        .single();

      if (error || !data) {
        alert("Credenciales incorrectas. Verifica tu email y contraseña.");
        setCargando(false);
        return;
      }

      sessionStorage.setItem("usuario_id", data.id);
      sessionStorage.setItem("usuario", data.nombre_completo);
      sessionStorage.setItem("rol", data.rol);

      router.push("/dashboard");
    } catch {
      alert("Error de conexión. Intente nuevamente.");
      setCargando(false);
    }
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-center items-center px-4 py-8 sm:px-6 md:px-8 lg:px-12 bg-slate-50 overflow-x-hidden dark:bg-slate-950">
      {/* Background Ambient Glow (GPU-friendly, non-intrusive) */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-72 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Responsive Container: Fluid width across Mobile (320-767px), Tablet (768-1023px), and Desktop (1024px+) */}
      <main className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl transition-all duration-300">
        <div className="w-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 p-5 sm:p-8 md:p-10">
          
          {/* Header Section with Fluid Responsive Typography */}
          <header className="text-center mb-6 sm:mb-8">
            <div className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 mb-3 sm:mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6 sm:h-7 sm:w-7"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Edu<span className="text-indigo-600 dark:text-indigo-400">Cor</span>
            </h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
              Plataforma educativa interactiva optimizada para bajo consumo de datos
            </p>
          </header>

          {/* Login Form with 44px+ Touch-Friendly Targets */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            <div>
              <label 
                htmlFor="email-input" 
                className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Correo Electrónico
              </label>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu.nombre@educor.com"
                className="w-full min-h-[48px] px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-slate-900 bg-white dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>

            <div>
              <label 
                htmlFor="password-input" 
                className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-[48px] px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-slate-900 bg-white dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>

            {/* Submit Button with Active Scale & Mobile-Friendly Tap Height */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full min-h-[48px] px-4 py-3 text-sm sm:text-base font-bold text-white rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/25 hover:from-indigo-600 hover:to-indigo-800 hover:shadow-lg hover:shadow-indigo-500/35 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {cargando ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  <span>Conectando...</span>
                </>
              ) : (
                <span>Ingresar al Aula</span>
              )}
            </button>
          </form>

          {/* Footer Badge / Accessibility info */}
          <footer className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Conexión cifrada de alta eficiencia
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
