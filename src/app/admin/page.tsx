"use client";

import { useState, useEffect } from "react";
import { LoginForm } from "@/components/login-form";
import { AttendanceForm } from "@/components/attendance-form";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const res = await fetch("/api/auth/check");
      setIsAuthenticated(res.ok);
    };
    checkAuth();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setIsAuthenticated(false);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Carregando...</div>
      </main>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          <header className="text-center mb-10">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
              Admin
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              Área restrita para registro de presenças
            </p>
          </header>
          <LoginForm onSuccess={handleLogin} />
        </div>
      </main>
    );
  }

  // Authenticated
  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Registro de Presença
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--electric)] underline"
          >
            Sair
          </button>
        </header>
        <AttendanceForm />
      </div>
    </main>
  );
}
