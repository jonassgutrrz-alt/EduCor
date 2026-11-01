"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!email || !password) {
    alert("Por favor completa todos los campos.");
    return;
  }

  setCargando(true);

  try {
    // 1. Iniciar sesión criptográficamente con Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password,
    });

    if (authError || !authData.user) {
      alert("Credenciales incorrectas. Verifica tu email y contraseña.");
      setCargando(false);
      return;
    }

    // 2. Con el token autenticado, RLS aprueba la lectura a la tabla usuarios
    const { data: userData, error: userError } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData) {
      alert("Error al cargar los datos del perfil.");
      setCargando(false);
      return;
    }

    // 3. Establecer las variables de sesión para el frontend
    sessionStorage.setItem("usuario_id", String(userData.id));
    sessionStorage.setItem("usuario", userData.nombre_completo);
    sessionStorage.setItem("rol", userData.rol);

    router.push("/dashboard");
  } catch {
    alert("Error de conexión. Intente nuevamente.");
    setCargando(false);
  }
};

  return (
    <div className="relative min-h-dvh w-full flex flex-col justify-center items-center px-4 py-8 sm:px-6 md:px-8 lg:px-12 bg-slate-50 overflow-x-hidden dark:bg-slate-950">
      {/* Ambient background glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-72 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" 
        aria-hidden="true" 
      />

      {/* Fluid Card Container */}
      <main className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl transition-all duration-300">
        <div className="w-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 p-5 sm:p-8 md:p-10">
          
          {/* Header Section: Replaced SVG with official EduCor.png Logo */}
          <header className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Image
                src="/EduCor.png"
                alt="Logo EduCor"
                width={80}
                height={80}
                priority
                // className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
              />
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Edu<span className="text-indigo-600 dark:text-indigo-400">Cor</span>
            </h1>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
              Plataforma educativa interactiva optimizada para bajo consumo de datos
            </p>
          </header>

          {/* Form */}
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
                className="w-full min-h-12 px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-slate-900 bg-white dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
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
                className="w-full min-h-12 px-3.5 sm:px-4 py-2.5 text-base sm:text-sm text-slate-900 bg-white dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>

            {/* Mobile Touch Button */}
            <button
              type="submit"
              disabled={cargando}
              className="w-full min-h-12 px-4 py-3 text-sm sm:text-base font-bold text-white rounded-full bg-linear-to-r from-indigo-500 via-indigo-600 to-indigo-700 shadow-md shadow-indigo-500/25 hover:from-indigo-600 hover:to-indigo-800 hover:shadow-lg hover:shadow-indigo-500/35 active:scale-95 disabled:opacity-50 disabled:pointer-events-none transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer mt-2"
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
            <div className="text-center pt-2">
              <Link
                href="/registro"
                className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                ¿No tenés una cuenta? <span className="underline decoration-indigo-300 underline-offset-4">Registrate ahora</span>
              </Link>
            </div>
          </form>

          <footer className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Aula Virtual EduCor - Todos los derechos reservados © 2026
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}