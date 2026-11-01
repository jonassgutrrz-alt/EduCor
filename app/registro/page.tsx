"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/Toast";

interface DatosPadron {
  dni: string;
  nombre_completo: string;
  rol: string;
  grado?: string;
  seccion?: string;
  colegio_id?: string;
  curso_division?: string;
  registrado: boolean;
}

export default function Registro() {
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [datosPadron, setDatosPadron] = useState<DatosPadron | null>(null);
  const router = useRouter();
  const { showToast } = useToast();

  const handleVerificarDNI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim()) {
      showToast("Por favor, ingresa tu número de DNI.", "warning");
      return;
    }
    setCargando(true);

    const { data, error } = await supabase
      .from("padron_autorizado")
      .select("*")
      .eq("dni", dni.trim())
      .single();

    if (error || !data) {
      showToast("El DNI ingresado no se encuentra en el padrón de la institución.", "error");
      setCargando(false);
      return;
    }

    if (data.registrado) {
      showToast("Este DNI ya tiene una cuenta registrada. Por favor, inicia sesión.", "warning");
      setCargando(false);
      return;
    }

    setDatosPadron(data as DatosPadron);
    showToast(`¡Identidad verificada! Hola, ${data.nombre_completo}`, "success");
    setPaso(2);
    setCargando(false);
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !datosPadron) {
      showToast("Por favor completa todos los campos requeridos.", "warning");
      return;
    }

    if (password.length < 6) {
      showToast("La contraseña debe tener al menos 6 caracteres.", "warning");
      return;
    }

    setCargando(true);
    const emailLimpio = email.trim().toLowerCase();

    let grado: string | null = null;
    let seccion: string | null = null;

    if (datosPadron.curso_division) {
      const match = datosPadron.curso_division.match(/^(\d+)?([A-Za-z]+)?$/);
      if (match) {
        grado = match[1] || datosPadron.curso_division;
        seccion = match[2] || null;
      } else {
        grado = datosPadron.curso_division;
      }
    } else {
      grado = datosPadron.grado || null;
      seccion = datosPadron.seccion || null;
    }

    const { error: authError } = await supabase.auth.signUp({
      email: emailLimpio,
      password,
      options: {
        data: {
          nombre_completo: datosPadron.nombre_completo,
          rol: datosPadron.rol,
          grado: grado,
          seccion: seccion,
          colegio_id: datosPadron.colegio_id || null,
          dni: dni.trim()
        }
      }
    });

    if (authError) {
      showToast(`Error al crear la cuenta: ${authError.message}`, "error");
      setCargando(false);
      return;
    }

    showToast("¡Cuenta creada exitosamente! Revisa tu correo de confirmación.", "success");
    setPaso(3);
    setCargando(false);
  };

  return (
    <div className="relative min-h-dvh w-full flex flex-col justify-center items-center px-4 py-8 bg-slate-50 overflow-x-hidden dark:bg-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-72 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
      <main className="relative w-full max-w-md sm:max-w-lg lg:max-w-xl transition-all duration-300">
        <div className="w-full bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/5 p-5 sm:p-8 md:p-10">
          <header className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Image src="/EduCor.png" alt="Logo EduCor" width={80} height={80} priority className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-md transition-transform duration-300 hover:scale-105" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
              Registro <span className="text-indigo-600 dark:text-indigo-400">EduCor</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
              {paso === 1 && "Paso 1 de 3: Verificá tu identidad con tu DNI"}
              {paso === 2 && "Paso 2 de 3: Creá tus credenciales de acceso"}
              {paso === 3 && "Paso 3 de 3: Confirmación requerida"}
            </p>
          </header>

          {paso === 1 && (
            <form onSubmit={handleVerificarDNI} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Número de DNI (sin puntos)</label>
                <input type="text" required value={dni} onChange={(e) => setDni(e.target.value)} placeholder="Ej. 12345678" className="w-full min-h-12 px-4 py-2.5 text-slate-900 bg-white dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <button type="submit" disabled={cargando} className="w-full min-h-12 px-4 py-3 text-white font-bold rounded-full bg-linear-to-r from-indigo-500 via-indigo-600 to-indigo-700 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 transition-all cursor-pointer">
                {cargando ? "Verificando..." : "Validar Identidad"}
              </button>
              <div className="text-center pt-2">
                <Link href="/" className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                  ¿Ya tenés una cuenta? <span className="underline decoration-indigo-300 underline-offset-4">Iniciá sesión</span>
                </Link>
              </div>
            </form>
          )}

          {paso === 2 && datosPadron && (
            <form onSubmit={handleRegistro} className="space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl mb-4">
                <p className="text-sm text-indigo-900 dark:text-indigo-200">
                  <strong>Hola, {datosPadron.nombre_completo}</strong> <br />
                  Sos {datosPadron.rol}
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Correo Electrónico</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu.nombre@educor.com" className="w-full min-h-12 px-4 py-2.5 text-slate-900 bg-white dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Contraseña (mínimo 6 caracteres)</label>
                <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full min-h-12 px-4 py-2.5 text-slate-900 bg-white dark:bg-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              </div>
              <button type="submit" disabled={cargando} className="w-full min-h-12 px-4 py-3 text-white font-bold rounded-full bg-linear-to-r from-indigo-500 via-indigo-600 to-indigo-700 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 transition-all mt-2 cursor-pointer">
                {cargando ? "Procesando..." : "Crear Cuenta"}
              </button>
            </form>
          )}

          {paso === 3 && (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full text-emerald-600 mb-2">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">¡Revisa tu bandeja de entrada!</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Te hemos enviado un enlace de confirmación a <strong>{email}</strong>. Tenés que verificar tu correo antes de poder ingresar al aula.
              </p>
              <button onClick={() => router.push("/")} className="mt-6 w-full min-h-12 px-4 py-3 text-indigo-700 font-bold bg-indigo-50 rounded-full hover:bg-indigo-100 transition-all cursor-pointer">
                Volver al Inicio de Sesión
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}