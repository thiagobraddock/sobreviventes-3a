"use client";

import { useState } from "react";

type Props = {
  onSuccess: () => void;
};

export function LoginForm({ onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        setError("Senha incorreta");
      }
    } catch {
      setError("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
        >
          Senha
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-[var(--ash)] bg-[var(--slate)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--electric)] focus:border-transparent transition-all"
          placeholder="Digite a senha"
          required
        />
      </div>

      {error && (
        <p className="text-[var(--error)] text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 bg-[var(--electric)] text-white font-medium rounded-lg hover:bg-[var(--electric-bright)] focus:outline-none focus:ring-2 focus:ring-[var(--electric)] focus:ring-offset-2 focus:ring-offset-[var(--void)] disabled:opacity-50 transition-all"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
