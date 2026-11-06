# Auditoria de migração (somente leitura) — GitHub privado + Supabase próprio + Cloudflare

Nenhum arquivo, banco, storage, configuração ou publicação foi alterado. Nenhum valor de .env ou segredo foi lido (apenas nomes de variáveis). Legenda: **[F]** fato confirmado nesta auditoria · **[I]** inferência a validar.

## 1. Runtime e adapter
- [F] TanStack Start 1.168.60, React Router 1.170.41, React 19, Vite 8.1.5, Nitro `3.0.260603-beta` (package.json).
- [F] `vite.config.ts` usa `defineConfig` de `@lovable.dev/vite-tanstack-config` 2.26.5 (devDependency), que embute tanstackStart, react, tailwind, tsconfig-paths e Nitro só no build com alvo **cloudflare** por padrão; entrada de servidor `src/server.ts`.
- [F] Não há `wrangler.toml/jsonc` no projeto.
- [I] Alvo correto: Cloudflare **Workers** (preset `cloudflare-module`), não Pages estático — o site tem SSR, server functions e rotas `sitemap.xml`/`robots.txt`.
- [I] Nitro é beta fixado; manter versões exatas para build reproduzível.

## 2. Scripts e comandos
- [F] `dev`, `build` (`vite build`), `build:dev`, `preview`, `lint` (eslint), `format` (prettier). Não existe script `test`.
- [F] Testes vitest: `src/lib/{catalogPreview,orders,pricing,productId,proof,sitemap}.test.ts` → `bunx vitest run`.
- [F] Lockfile `bun.lock` + `bunfig.toml`; `overrides.rolldown = 1.2.1`.
- Reprodutível: `bun install --frozen-lockfile && bunx vitest run && bun run build`.

## 3. Configuração e arquivos Lovable
Necessários: `package.json`, `bun.lock`, `bunfig.toml`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `components.json`, `drizzle.config.ts`, `drizzle/migrations/*` (25 entradas, incl. `meta/`), `src/**`, `public/**`.
A substituir/remover/revisar:
- `vite.config.ts` + `@lovable.dev/vite-tanstack-config` — [I] pode ser mantido (pacote público) ou trocado por config Vite explícita.
- `src/lib/lovable-error-reporting.ts` e import em `src/routes/__root.tsx` — telemetria da plataforma; remover ou trocar.
- `src/integrations/supabase/previewAuthStorage.ts` — adaptação ao iframe da prévia; [I] fora dela cai para localStorage.
- `src/integrations/supabase/cron-auth.ts` — usa `LOVABLE_CRON_SECRET(_PREVIOUS)`; [I] sem uso aparente em rotas.
- `supabase/config.toml` — `project_id` do Cloud atual; trocar pelo novo projeto.
- `src/lib/siteUrl.ts` — fallback `https://pixel-perfect-match-1058.lovable.app`; definir `SITE_URL`.
- `AGENTS.md`, `roadmap.md`, `.lovable/` — documentação interna, opcionais.
- `m.png` na raiz (100 KB) — [I] arquivo solto sem uso; confirmar.
- Criar: `wrangler.jsonc` (nome, `compatibility_date`, `nodejs_compat`, `main`/assets da saída Nitro).

## 4. Dependências de Lovable Cloud / preview / assets
- [F] Nenhuma referência a `/__l5e/assets-v1` nem arquivo `.asset.json` restante no código (corrigidos antes).
- [F] Clientes `client.ts`, `client.server.ts`, `auth-middleware.ts`, `auth-attacher.ts` são supabase-js padrão lendo env vars — portáveis.
- [F] Storage usado em `auth.tsx`, `proSignup.functions.ts`, `admin/produtos.tsx`, `admin/profissionais.tsx`.
- [F] (auditoria anterior) imagens de produto no banco usam URL absoluta do storage atual — precisam migrar + `UPDATE`.

## 5. Variáveis de ambiente (só nomes)
Navegador (build-time): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, opcional `VITE_SITE_URL`.
Servidor (Worker): `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (secreto; exclusão de contas e certificado no cadastro), `SITE_URL`, opcional `SUPABASE_PROJECT_ID`, `LOVABLE_CRON_SECRET(_PREVIOUS)` só se cron for mantido.

## 6. Assets binários (todos locais)
`public/favicon.png` (3 KB); `src/assets/`: `hero.jpg` 145 KB, `hero2.jpg` 69 KB, `hero1_mobile.jpg` 97 KB, `hero2_mobile.jpg` 55 KB, `kit.jpg` 259 KB, `p1–p4.jpg` ~40 KB cada, `rarity-logo.png` 202 KB, `sobre.jpg` 78 KB, `sobre.jpeg` 323 KB [I: duplicata, verificar qual é importado]; `m.png` 100 KB na raiz. Externos: imagens de produtos nos buckets `product-images` (público) e `pro-documents` (privado).

## 7. Riscos fora da Lovable
- SSR: catálogo depende de sessão/`ready`, página de produto entrega "Carregando…" e soft-404 (auditoria SEO) — [F] anterior, não bloqueia deploy.
- Runtime: Worker não é Node; [I] `postgres`/`drizzle` são só dev — garantir que não entrem no bundle.
- `sitemap.xml` lê `process.env` em runtime — exige secrets no Worker.
- Auth: atualizar Site URL e Redirect URLs no novo Supabase (recuperação de senha `/redefinir-senha`, confirmação de e-mail); configurar SMTP próprio; desativar HIBP se quiser manter senhas simples; senhas atuais [I] só migram via dump do schema `auth` com hash, senão os usuários redefinem.
- CSRF de server functions depende do Origin = domínio final.
- Storage: recriar buckets, limite 10 MB, allowlist PDF/JPG/PNG e políticas (migrations 0023 cobrem políticas).
- Funções `SECURITY DEFINER`, triggers em `auth.users` (`handle_new_user`) e grants precisam vir junto nas migrations.

## 8. Ações manuais do proprietário (credenciais)
1. Conectar GitHub (Project settings → Git) — cria repositório privado novo.
2. Criar conta/projeto Supabase; obter URL, chave publicável e service role.
3. Aplicar as migrations em ordem; exportar e importar dados (84 produtos, categorias, vitrines, descontos, pedidos, clientes) via dump.
4. Copiar arquivos dos dois buckets e atualizar `image_url`.
5. Configurar Auth (URLs, SMTP, provedores, templates).
6. Criar conta Cloudflare, Worker, secrets e build (`bun run build`) conectado ao GitHub.
7. Comprar/apontar domínio; definir `SITE_URL`; reenviar sitemap ao Search Console.
8. Homologar em URL temporária e virar DNS; rollback = manter o site atual no ar.

## Próximo passo sugerido
Ao aprovar, posso executar somente as etapas de código (wrangler, remoção da telemetria, configuração de build sem o wrapper) — nada no banco sem nova autorização.
