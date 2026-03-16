# Sobreviventes 3A

Sistema de controle de presença para encontros mensais do grupo Sobreviventes 3A. A aplicação agora roda sem Supabase: usa PostgreSQL direto e salva as fotos em disco, ideal para deploy completo no Railway.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)

## Funcionalidades

- Ranking de frequência
- Histórico de presenças por encontro
- Upload de fotos com conversão automática para WebP
- Painel admin protegido por senha
- Layout responsivo

## Stack

- Frontend: Next.js 16, React 19, TypeScript
- Backend: Route Handlers do Next.js
- Banco: PostgreSQL via `pg`
- Arquivos: volume local persistente
- Processamento de imagem: Sharp

## Variáveis de ambiente

Copie `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Preencha com:

```env
DATABASE_URL=postgresql://...
DATABASE_SSL=false
UPLOAD_DIR=.data/uploads
ADMIN_PASSWORD=sua-senha-admin
```

Notas:

- `DATABASE_SSL=false` funciona bem usando a connection string interna do Railway.
- Se você usar uma URL pública/externa que exija SSL, troque para `DATABASE_SSL=true`.
- Em produção no Railway, prefira um volume montado, por exemplo `UPLOAD_DIR=/data/uploads`.

## Banco de dados

O schema inicial está em `database/railway-init.sql`.

Para criar a estrutura:

```bash
psql "$DATABASE_URL" -f database/railway-init.sql
```

As tabelas continuam simples:

- `members`
- `meetings`
- `attendance`

Não existe mais dependência de RLS nem de recursos específicos do Supabase.

## Fotos

As novas fotos são gravadas no diretório definido em `UPLOAD_DIR` e servidas pela própria aplicação em URLs como `/uploads/meetings/...`.

Se já existirem URLs antigas do Supabase na coluna `meetings.photo_url`, elas continuam abrindo enquanto o arquivo remoto existir. Para remover a dependência antiga de vez, reenvie a foto do encontro ou migre esses arquivos para o volume novo.

## Deploy no Railway

1. Crie um serviço PostgreSQL no Railway.
2. Configure `DATABASE_URL`, `DATABASE_SSL` e `ADMIN_PASSWORD` no serviço da aplicação.
3. Adicione um volume persistente e monte no caminho usado por `UPLOAD_DIR`, por exemplo `/data/uploads`.
4. Rode o SQL de `database/railway-init.sql`.
5. Faça o deploy da aplicação.

## Setup local

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura

```text
src/
  app/
  components/
  lib/
database/
  railway-init.sql
```

## Segurança

- Autenticação admin por cookie HttpOnly
- Validação de UUID nas rotas de escrita
- Variáveis sensíveis fora do repositório
- Upload salvo apenas em pasta controlada pela aplicação
