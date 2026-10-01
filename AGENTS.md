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
