import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronDown, Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import logo from "@/assets/rarity-logo.png.asset.json";
import { categories } from "@/lib/products";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
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
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/produtos", search: { q } });
      }}
      className={`relative ${className}`}
    >
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar shampoo, máscara, kits..."
        aria-label="Buscar produtos"
        className="h-11 w-full rounded-full border border-input bg-surface pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-gold focus:bg-card focus:ring-2 focus:ring-gold/25"
      />
    </form>
  );
}

function IconLink({ to, label, children, badge }: { to: string; label: string; children: ReactNode; badge?: number }) {
  return (
    <Link
      to={to}
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
  const { session } = useAuth();
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
                    <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-base hover:bg-accent" activeProps={{ className: "text-gold-deep font-medium" }} activeOptions={{ exact: true }}>
                      {n.label}
                    </Link>
                  ))}
                  <p className="eyebrow mt-6 px-3 text-muted-foreground">Categorias</p>
                  {categories.map((c) => (
                    <Link key={c} to="/produtos" search={{ categoria: c }} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                      {c}
                    </Link>
                  ))}
                  <div className="mt-6 border-t pt-4">
                    <Link to="/minha-conta" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-accent"><User className="size-4" /> Minha conta</Link>
                    <Link to="/minha-conta" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md px-3 py-3 hover:bg-accent"><Heart className="size-4" /> Favoritos</Link>
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
              <IconLink to="/minha-conta" label="Favoritos" badge={favorites.length}><Heart className="size-5" /></IconLink>
              <IconLink to="/minha-conta" label="Notificações" badge={2}><Bell className="size-5" /></IconLink>
            </span>
            <IconLink to={session ? "/minha-conta" : "/login"} label={session ? "Minha conta" : "Entrar"}><User className="size-5" /></IconLink>
            <IconLink to="/carrinho" label="Carrinho" badge={count}><ShoppingBag className="size-5" /></IconLink>
          </div>
        </div>
        <div className="container-site pb-3 lg:hidden">
          <SearchBar />
        </div>
      </div>

      <nav aria-label="Principal" className="hidden border-b bg-card lg:block">
        <div className="container-site flex h-12 items-center gap-8 text-sm">
          {nav.slice(0, 2).map((n) => (
            <Link key={n.to} to={n.to} className="relative py-3 text-foreground/75 transition hover:text-foreground" activeProps={{ className: "!text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-gold" }} activeOptions={{ exact: true }}>
              {n.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 py-3 text-foreground/75 outline-none transition hover:text-foreground">
              Categorias <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {categories.map((c) => (
                <DropdownMenuItem key={c} asChild>
                  <Link to="/produtos" search={{ categoria: c }}>{c}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {nav.slice(2).map((n) => (
            <Link key={n.to} to={n.to} className="relative py-3 text-foreground/75 transition hover:text-foreground" activeProps={{ className: "!text-foreground after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-gold" }}>
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
