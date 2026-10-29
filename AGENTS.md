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
- Public catalog reads via RPC catalog_products() (security definer, masks prices for non-approved-pros) which returns the final per-visitor price; Home sections from home_section_products (manual curation). Why: show pro-only items as "Sob consulta" without exposing prices, and keep one price rule.
- Promotion pricing lives only in DB helpers _promo_price/_has_promo used by both catalog_products and _quote_cart (applicable price → pro individual discount → single best promotion, ties by earliest created); src/lib/pricing.ts is a test-pinned mirror, not used for display. Why: catalog, cart and orders always show the same price.
- Order pricing, coupon validation and order creation run only in DB RPCs (_quote_cart / quote_cart / create_order); admin order edits only via admin_update_order*, admin_add_order_item and admin_delete_order_item RPCs that write order_history. Why: the browser is never trusted with prices and every change is logged.
- Cart persists in cart_items for signed-in users (guest cart in localStorage, merged on sign-in); lines store only product id + qty. Why: prices always come from the live catalog.
- Permanent admin deletions go only through admin-checked RPCs (admin_delete_product/order/client_data) plus the deleteClient server function for storage and login removal. Why: atomic, no orphans, never trusts the browser.
- Favorites persist in favorites for signed-in users (guest favorites in localStorage, merged on sign-in). Why: same pattern as the cart; RLS keeps them per user.
- Admin→client notifications are created only via admin_send_notification RPC; clients may update only read_at. Why: one-way communication, no tampering.
- Self account deletion (delete_own_account_data + deleteOwnAccount server fn) anonymizes the profile and bans the login instead of deleting it. Why: orders reference the profile and must stay intact.
- Pro proof: CNPJ/MEI stored as pro_requests.proof_number (document_path = "<uid>/sem-arquivo" marker), Certificado as private file; CNPJ/MEI signups open the request in handle_new_user. Why: no upload needed for numbers and document_path stays NOT NULL.
- Category deletion only via admin_delete_category, blocked while products/coupons reference it. Why: no orphans, no silent product changes.
- Products can have many categories via product_categories; products.category_id stays as the principal (first) one. Why: additive change, existing reads keep working.
- Quantity discount tiers live in quantity_discounts and are applied only inside _quote_cart (max of tier vs pro individual %, then promotion; coupons skip such lines unless coupons.allow_with_quantity_discount). Why: one server-side price rule.
- Admin storefront previews use admin_catalog_preview with a database admin check and isolated catalog cache; never override auth tier or cart/checkout/order pricing. Why: preview prices safely without impersonation or changing commercial rules.

- Canonical site origin comes only from src/lib/siteUrl.ts (SITE_URL / VITE_SITE_URL env, Lovable URL fallback); sitemap.xml and robots.txt are server routes reading it, and every route declares staticData.sitemap. Why: a domain change is one config edit and new pages must decide indexability.
