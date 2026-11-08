# Migração: Lovable Cloud → Supabase próprio + Cloudflare Workers

Estado: **dados migrados; falta configurar os painéis e publicar**. O site na Lovable continua no ar e intacto; nada nele foi alterado.

## Destinos

| Peça | Antes (Lovable) | Depois |
|---|---|---|
| Banco/Auth/Storage | Lovable Cloud `zxxbnzhapfvwcnxwioba` | Supabase `pqjqqokjnsrydfncpjwy` (org André_H, us-west-2) |
| Hospedagem (SSR) | Lovable | Cloudflare Worker `rarity-hair-care` |

## Feito

- [x] Schema: as 24 migrations de `drizzle/migrations/` aplicadas no Supabase novo. Conferido por hash
      contra a origem: colunas (203), funções (31), policies (58), triggers (16) e grants idênticos.
- [x] Buckets: `product-images` (público, 5 MB) e `pro-documents` (privado, 10 MB), iguais à origem.
- [x] Imagens: os 134 arquivos de `product-images` copiados (65.368.800 bytes, idêntico à origem).
- [x] Usuários: 3 contas de `auth.users`/`auth.identities` copiadas **com hash de senha** — o login
      continua com a mesma senha.
- [x] Código: `wrangler.jsonc` (nome, `nodejs_compat`, vars públicas do Supabase novo). O build
      (`npm run build`, Nitro preset `cloudflare-module`) gera `.output/` e
      `.wrangler/deploy/config.json`, e `npx wrangler deploy` na raiz publica. Testado localmente no
      `workerd` (páginas 200, 404 correto).
- [x] Dados das tabelas `public` importados do backup de 07/11 20:22 (`rarity-hair-care_261107.backup`):
      85 produtos, 16 categorias, 139 vínculos, vitrines, kits, promoções, cupons, descontos, auditoria.
      URLs das imagens reescritas para o storage novo; sequências ajustadas.
- [x] Diferença entre o backup e o banco atual sincronizada em 08/11 ~18:25 UTC (perfil e cargo da conta
      criada em 08/11, pedido 10 com item e histórico). Impressões digitais de produtos, categorias por
      produto, vitrines e kits conferidas: idênticas à origem.
- [ ] Configuração no painel do Supabase e do Cloudflare (abaixo).

## Por que o `.env` não mudou

O `.env` é gerenciado pela Lovable e ainda aponta para o Lovable Cloud; mudá-lo quebraria o editor da
Lovable durante a transição. No Cloudflare, as variáveis `VITE_*` são definidas como **variáveis de
build** e têm prioridade sobre o `.env` (verificado: o bundle sai sem nenhuma referência ao Lovable
Cloud). Depois da virada definitiva, o `.env` pode ser atualizado.

## Google (Analytics e Search Console)

Código pronto: o site só emite o GA4 e a verificação quando as variáveis abaixo existem no build.

1. **Google Analytics 4:** crie a propriedade em analytics.google.com e copie o ID `G-XXXXXXXXXX`.
   Build variable no Cloudflare: `VITE_GA_MEASUREMENT_ID` = esse ID.
2. **Search Console:** em search.google.com/search-console, adicione a propriedade (domínio final ou a URL
   `workers.dev`, enquanto testa). Escolha o método *Tag HTML* e copie só o valor do `content`.
   Build variable: `VITE_GOOGLE_SITE_VERIFICATION` = esse valor. Depois do deploy, clique em **Verificar**.
3. **Sitemap:** no Search Console, em Sitemaps, envie `sitemap.xml`. Só faça isso depois de definir
   `SITE_URL` com o domínio final; senão o sitemap lista o domínio antigo da Lovable.

## Passos no painel do Cloudflare (Workers & Pages → Create → Import a repository)

1. Repositório `andre-hsantos/rarity-hair-care`, branch de produção a definir (hoje `main`).
2. Build command: `npm run build` · Deploy command: `npx wrangler deploy`.
3. **Build variables** (Settings → Build → Variables):
   - `VITE_SUPABASE_URL` = `https://pqjqqokjnsrydfncpjwy.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_H5ORkXiEs5I4rbLqXdooXg_G-PTTP9v`
   - `VITE_SUPABASE_PROJECT_ID` = `pqjqqokjnsrydfncpjwy`
4. **Secret** do Worker (Settings → Variables and Secrets → tipo *Secret*):
   - `SUPABASE_SERVICE_ROLE_KEY` = chave *secret*/service_role do Supabase novo
     (Supabase → Project Settings → API Keys). Usada só no servidor: exclusão de contas e envio de
     certificado no cadastro profissional. **Nunca** colocar no repositório.
5. Depois de saber o domínio final, adicionar `SITE_URL` em `vars` no `wrangler.jsonc`
   (sitemap/robots). Sem ele o sitemap aponta para o domínio antigo da Lovable.

## Passos no painel do Supabase (Authentication)

1. URL Configuration → **Site URL** = domínio final (ou a URL `*.workers.dev` durante os testes).
2. **Redirect URLs**: `https://<dominio>/minha-conta` e `https://<dominio>/redefinir-senha`
   (usadas na confirmação de cadastro e na recuperação de senha). Para testes, adicionar também as
   da URL `workers.dev`.
3. **SMTP próprio** (Authentication → Emails → SMTP): o SMTP padrão do Supabase só envia poucos
   e-mails por hora — necessário para cadastro e recuperação de senha em produção.
4. Revisar os templates de e-mail (estão em inglês por padrão).

## Sincronização final (no dia da virada)

O site antigo continua recebendo cadastros e pedidos. Na virada: congelar o admin antigo, recopiar
`auth` + tabelas `public` (o processo apaga e recopia, então pode ser repetido) e então apontar o
domínio para o Worker. Rollback: o site da Lovable continua funcionando até ser despublicado.

## Limpeza depois da migração

- Feito: extensão `pg_net` removida; a Edge Function `migrate-storage` foi desativada (responde 410 e
  exige JWT) — pode ser apagada no painel do Supabase (Edge Functions).
- O bucket `database_export_07_11_26` da origem (backup feito na tentativa anterior) não é migrado.
