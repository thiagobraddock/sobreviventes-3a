# Sobreviventes 3A ☕

Sistema de controle de presença para encontros mensais do grupo Sobreviventes 3A. Acompanhe quem participou de cada encontro e veja o ranking de frequência.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)

## ✨ Funcionalidades

- 📊 **Ranking de frequência** - Visualize quem mais participou dos encontros
- 📅 **Histórico de presenças** - Clique em uma data para ver quem estava presente
- 📸 **Fotos dos encontros** - Upload de fotos convertidas automaticamente para WebP
- 🔐 **Painel admin** - Área protegida para registrar presenças e enviar fotos
- 📱 **Responsivo** - Funciona bem em dispositivos móveis

## 🛠️ Tecnologias

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Estilização:** Tailwind CSS
- **Backend:** Next.js API Routes
- **Banco de dados:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage
- **Processamento de imagens:** Sharp

## 🚀 Setup Local

### Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/sobreviventes.git
cd sobreviventes
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

4. Preencha o `.env.local` com suas credenciais do Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
ADMIN_PASSWORD=sua-senha-admin
```

5. Configure o banco de dados no Supabase:

```sql
-- Tabela de membros
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de encontros
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_date DATE NOT NULL UNIQUE,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de presenças
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, meeting_id)
);

-- RLS Policies
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read members" ON members FOR SELECT USING (true);
CREATE POLICY "Public read meetings" ON meetings FOR SELECT USING (true);
CREATE POLICY "Public read attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Backend update meetings" ON meetings FOR UPDATE USING (true);
CREATE POLICY "Backend insert attendance" ON attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Backend delete attendance" ON attendance FOR DELETE USING (true);
```

6. Crie um bucket no Supabase Storage chamado `photos` com acesso público.

7. Execute o projeto:
```bash
npm run dev
```

8. Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── admin/          # Painel administrativo
│   ├── api/            # API Routes
│   │   ├── attendance/ # Gerenciar presenças
│   │   ├── auth/       # Autenticação
│   │   ├── meetings/   # Encontros e upload de fotos
│   │   └── members/    # Membros
│   ├── layout.tsx      # Layout principal
│   └── page.tsx        # Página inicial (ranking)
├── components/         # Componentes React
└── lib/               # Utilitários e queries
```

## 🔒 Segurança

- Autenticação via cookie HttpOnly com token SHA256 único
- Validação de sessão em todas as rotas protegidas
- Validação de UUID nos parâmetros
- RLS (Row Level Security) habilitado no Supabase
- Variáveis sensíveis em `.env.local` (não commitadas)

## 📝 Licença

MIT

---

Feito com 💜 por [Thiago Oliveira](https://github.com/thiagooliveira)
