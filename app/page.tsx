"use client";

import { useState } from "react";
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

    // Consulta directa a Supabase
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

    // Guardamos la sesión (ahora con el ID real de Supabase)
    sessionStorage.setItem("usuario_id", data.id);
    sessionStorage.setItem("usuario", data.nombre_completo);
    sessionStorage.setItem("rol", data.rol);

    router.push("/dashboard");
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md border border-gray-200">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-700">EduCor</h1>
          <p className="text-sm text-gray-500 mt-2">Plataforma educativa de bajo consumo</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email del Usuario</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              placeholder="juan@educor.com" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              placeholder="1234" 
            />
          </div>

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400"
          >
            {cargando ? "Conectando..." : "Ingresar al Aula"}
          </button>
        </form>
      </div>
    </div>
  );
}
