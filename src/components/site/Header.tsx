import { useUnreadCount } from "@/lib/notifications";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Briefcase, Check, ChevronDown, Eye, Heart, LayoutDashboard, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import logo from "@/assets/rarity-logo.png.asset.json";
import { usePublicCategories } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import type { CatalogPreview } from "@/lib/catalogPreview";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const nav = [
  { to: "/", label: "Início" },
  { to: "/produtos", label: "Produtos" },
  { to: "/sobre", label: "Sobre nós" },
  { to: "/contato", label: "Contato" },
] as const;

function SearchBar({ className = "" }: { className?: string }) {
  const urlQ = useRouterState({
    select: (s) => (s.location.pathname === "/produtos" ? String((s.location.search as { q?: string }).q ?? "") : ""),
  });
  const [q, setQ] = useState(urlQ);
  useEffect(() => { setQ(urlQ); }, [urlQ]);
  const navigate = useNavigate();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const t = q.trim();
        navigate({ to: "/produtos", search: t ? { q: t } : {} });
      }}
      className={`relative ${className}`}
    >
      <button type="submit" aria-label="Pesquisar" className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:text-gold">
        <Search className="size-4" />
      </button>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search" enterKeyHint="search" placeholder="Buscar shampoo, máscara, kits..."
        aria-label="Buscar produtos"
        className="h-11 w-full rounded-full border border-input bg-surface pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold focus:bg-card focus:ring-2 focus:ring-gold/25"
      />
    </form>
  );
}

function IconLink({ to, label, children, badge, search }: { to: string; label: string; children: ReactNode; badge?: number; search?: Record<string, string> | undefined }) {
  return (
    <Link
      to={to}
      search={search as never}
      aria-label={label}
      className="group relative flex flex-col items-center gap-1 rounded-md px-2 py-1 text-ink-foreground/80 transition hover:text-gold"
    >
      <span className="relative">
        {children}
        {!!badge && (
          <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-gold px-1 text-[10px] font-semibold text-gold-foreground">
            {badge}
          </span>
        )}
      </span>
      <span className="hidden text-[11px] tracking-wide xl:block">{label}</span>
    </Link>
  );
}

export function Header() {
  const { count, favorites } = useStore();
  const categories = usePublicCategories().data ?? [];
  const { session, isAdmin, catalogPreview, setCatalogPreview } = useAuth();
  const navigate = useNavigate();
  const previewAs = (mode: CatalogPreview) => {
    setCatalogPreview(mode);
    void navigate({ to: "/" });
  };
  const unread = useUnreadCount();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-ink-soft text-ink-foreground/80">
        <p className="container-site py-2 text-center text-xs tracking-wide">
          Atendimento e compra pelo WhatsApp · Entrega ou retirada na loja
        </p>
      </div>

      <div className="bg-ink text-ink-foreground">
        <div className="container-site grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 py-3 lg:gap-8 lg:py-4">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger aria-label="Abrir menu" className="rounded-md p-2 text-ink-foreground lg:hidden">
                <Menu className="size-5" />
              </SheetTrigger>
              <SheetContent side="left" className="w-80 bg-background">
                <SheetTitle className="font-display text-2xl">Menu</SheetTitle>
                <nav className="mt-6 flex flex-col gap-1">
                  {nav.map((n) => (
                    <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="flex items-center justify-between rounded-md border-l-2 border-transparent px-3 py-3 text-sm font-medium uppercase tracking-[0.14em] hover:bg-accent" activeProps={{ className: "!border-gold text-gold-deep bg-gold/5" }} activeOptions={{ exact: true }}>
                      {n.label}
                    </Link>
                  ))}
                  <p className="eyebrow mt-6 px-3 text-muted-foreground">Categorias</p>
                  {categories.map((c) => (
                    <Link key={c.id} to="/produtos" search={{ categoria: c.id }} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                      {c.name}
                    </Link>
                  ))}
                  <div className="mt-6 border-t pt-4">
                    <Link to="/minha-conta" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-accent"><User className="size-4" /> Minha conta</Link>
                    <Link to="/favoritos" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-accent"><Heart className="size-4" /> Favoritos</Link>
                    {session && <Link to="/notificacoes" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-accent"><Bell className="size-4" /> Notificações{unread > 0 ? ` (${unread})` : ""}</Link>}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
            <Link to="/" aria-label="Rarity Hair Care — início" className="shrink-0">
              <img src={logo.url} alt="Rarity Hair Care" className="h-10 w-auto sm:h-12" />
            </Link>
          </div>

          <SearchBar className="hidden lg:block" />
          <div className="lg:hidden" />

          <div className="flex items-center gap-1 sm:gap-2">
            <span className="hidden lg:contents">
              <IconLink to="/favoritos" label="Favoritos" badge={favorites.length}><Heart className="size-5" /></IconLink>
              <IconLink to={session ? "/notificacoes" : "/login"} label="Notificações" badge={unread}><Bell className="size-5" /></IconLink>
            </span>
            {isAdmin && <IconLink to="/admin" label="Painel"><LayoutDashboard className="size-5" /></IconLink>}
            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Ver site como" title="Ver site como" className="text-ink-foreground hover:bg-ink-soft hover:text-gold">
                    <Eye className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuItem onSelect={() => previewAs("normal")}>
                    <User className="mr-2 size-4" /> Ver como cliente normal
                    {catalogPreview === "normal" && <Check className="ml-auto size-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => previewAs("profissional")}>
                    <Briefcase className="mr-2 size-4" /> Ver como profissional
                    {catalogPreview === "profissional" && <Check className="ml-auto size-4" />}
                  </DropdownMenuItem>
                  {catalogPreview && <DropdownMenuItem onSelect={() => setCatalogPreview(null)}><X className="mr-2 size-4" /> Encerrar visualização</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <IconLink to={session ? "/minha-conta" : "/login"} label={session ? "Minha conta" : "Entrar"}><User className="size-5" /></IconLink>
            <IconLink to="/carrinho" label="Carrinho" badge={count}><ShoppingBag className="size-5" /></IconLink>
          </div>
        </div>
        <div className="container-site pb-3 lg:hidden">
          <SearchBar />
        </div>
      </div>

      <nav aria-label="Principal" className="hidden border-b border-gold/15 bg-card lg:block">
        <div className="container-site flex items-center justify-center gap-10">
          {nav.slice(0, 2).map((n) => (
            <Link key={n.to} to={n.to} className="group relative px-1 py-4 text-[13px] font-medium uppercase tracking-[0.18em] text-foreground/70 transition-colors hover:text-foreground after:absolute after:inset-x-1 after:bottom-2.5 after:h-px after:origin-center after:scale-x-0 after:bg-gold-metal after:transition-transform after:duration-300 hover:after:scale-x-100" activeProps={{ className: "!text-foreground after:!scale-x-100" }} activeOptions={{ exact: true }}>
              {n.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="group relative px-1 py-4 text-[13px] font-medium uppercase tracking-[0.18em] text-foreground/70 transition-colors hover:text-foreground after:absolute after:inset-x-1 after:bottom-2.5 after:h-px after:origin-center after:scale-x-0 after:bg-gold-metal after:transition-transform after:duration-300 hover:after:scale-x-100 flex items-center gap-1.5 outline-none data-[state=open]:text-foreground data-[state=open]:after:scale-x-100">
              Categorias <ChevronDown className="size-3.5 text-gold-deep transition-transform group-data-[state=open]:rotate-180" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" sideOffset={0} className="w-60 rounded-none rounded-b-lg border-gold/20 p-2">
              {categories.map((c) => (
                <DropdownMenuItem key={c.id} asChild className="cursor-pointer rounded-md px-3 py-2.5 text-sm focus:bg-gold/10 focus:text-foreground">
                  <Link to="/produtos" search={{ categoria: c.id }}>{c.name}</Link>
                </DropdownMenuItem>
              ))}
              {!categories.length && <p className="px-3 py-2 text-sm text-muted-foreground">Nenhuma categoria.</p>}
            </DropdownMenuContent>
          </DropdownMenu>
          {nav.slice(2).map((n) => (
            <Link key={n.to} to={n.to} className="group relative px-1 py-4 text-[13px] font-medium uppercase tracking-[0.18em] text-foreground/70 transition-colors hover:text-foreground after:absolute after:inset-x-1 after:bottom-2.5 after:h-px after:origin-center after:scale-x-0 after:bg-gold-metal after:transition-transform after:duration-300 hover:after:scale-x-100" activeProps={{ className: "!text-foreground after:!scale-x-100" }}>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
      {isAdmin && catalogPreview && (
        <div className="border-b border-gold/30 bg-gold/10 text-foreground">
          <div className="container-site flex flex-wrap items-center justify-between gap-2 py-2">
            <p role="status" className="flex items-center gap-2 text-xs sm:text-sm"><Eye className="size-4 shrink-0" /> Visualização: {catalogPreview === "profissional" ? "profissional aprovado · sem desconto individual" : "cliente normal"}</p>
            <Button variant="ghost" size="sm" onClick={() => setCatalogPreview(null)}><X /> Encerrar</Button>
          </div>
        </div>
      )}
    </header>
  );
}
