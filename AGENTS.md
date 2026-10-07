<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Cart/favorites live in an in-memory React context (src/lib/store.tsx) with mock catalog in src/lib/products.ts — prototype phase, no backend yet.
- Site chrome (Header/Footer) renders once in __root around <Outlet/> so every page shares navigation.

- Data model lives in Lovable Cloud (migration drizzle/migrations/0000_rarity_core_schema.sql); roles in user_roles + has_role(); passwords only in the auth system. Why: secure, relational base for real features.
- Order shipping NULL means "a combinar" (set by admin); no automatic freight. Why: MVP business rule.
- Pro documents go in private bucket pro-documents under <user_id>/ ; only admins can read. Why: sensitive documents.
- Public catalog reads via RPC catalog_products() (security definer, masks prices for non-approved-pros); Home sections from home_section_products (manual curation). Why: show pro-only items as "Sob consulta" without exposing prices.
