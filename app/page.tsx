"use client"; // Indica a Next.js que este componente usa interactividad en el navegador

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("alumno"); // Rol seleccionado por defecto
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario || !password) {
      alert("Por favor completa todos los campos.");
      return;
    }

    // Guardamos la sesión temporalmente en la memoria del navegador
    sessionStorage.setItem("usuario", usuario);
    sessionStorage.setItem("rol", rol);

    // Redirigimos al usuario al panel principal (Dashboard)
    router.push("/dashboard");
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-md border border-gray-200">
        
        {/* Encabezado sin imágenes pesadas para ahorrar datos */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-700">EduCor</h1>
          <p className="text-sm text-gray-500 mt-2">Plataforma educativa de bajo consumo</p>
        </div>

        {/* Formulario de ingreso */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Usuario / DNI</label>
            <input 
              type="text" 
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              placeholder="Ingresá tu usuario" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" 
              placeholder="••••••••" 
            />
          </div>

          {/* Selector de Rol */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Ingresar como:</label>
            <select 
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
            >
              <option value="alumno">Alumno</option>
              <option value="docente">Docente</option>
              <option value="admin">Administrador Escolar</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Ingresar al Aula
          </button>
        </form>

      </div>
    </div>
  );
}