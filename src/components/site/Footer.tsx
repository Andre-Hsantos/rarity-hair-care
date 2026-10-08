import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, MessageCircle, Youtube } from "lucide-react";
import logo from "@/assets/rarity-logo.png.asset.json";

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-ink-foreground/75">
      <div className="h-px bg-gold-metal opacity-60" />
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={logo.url} alt="Rarity Hair Care" className="h-12 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Cuidados capilares com sofisticação e qualidade. Texto demonstrativo.
          </p>
          <div className="mt-5 flex gap-3">
            {[Instagram, Facebook, Youtube].map((I, i) => (
              <a key={i} href="#" aria-label="Rede social (placeholder)" className="grid size-9 place-items-center rounded-full border border-ink-foreground/20 transition hover:border-gold hover:text-gold">
                <I className="size-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="eyebrow text-gold">Navegação</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link to="/" className="hover:text-ink-foreground">Início</Link></li>
            <li><Link to="/produtos" className="hover:text-ink-foreground">Produtos</Link></li>
            <li><Link to="/sobre" className="hover:text-ink-foreground">Sobre nós</Link></li>
            <li><Link to="/contato" className="hover:text-ink-foreground">Contato</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-gold">Informações</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-ink-foreground">Política de Privacidade</a></li>
            <li><a href="#" className="hover:text-ink-foreground">Termos de Uso</a></li>
            <li><a href="#" className="hover:text-ink-foreground">Trocas e devoluções</a></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-gold">Atendimento</p>
          <a href="https://wa.me/5527997579959" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-md border border-gold/40 px-4 py-2.5 text-sm text-ink-foreground transition hover:bg-gold/10">
            <MessageCircle className="size-4 text-gold" /> Fale pelo WhatsApp
          </a>
          <p className="mt-4 text-xs">Segunda a Sexta 08:00 às 17:00.</p>
        </div>
      </div>
      <div className="border-t border-ink-foreground/10">
        <p className="container-site py-5 text-xs">© {new Date().getFullYear()} Rarity Hair Care · Protótipo visual</p>
      </div>
    </footer>
  );
}
