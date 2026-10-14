import type { SVGProps } from "react";
import { Award, Droplets, Shield, Users, type LucideIcon } from "lucide-react";

type IconProps = SVGProps<SVGSVGElement>;

// Desenhos preenchidos (silhuetas), no estilo da referência enviada.
const solid = (Icon: LucideIcon) => (props: IconProps) => <Icon {...props} fill="currentColor" />;

const AwardSolid = solid(Award);
const UsersSolid = solid(Users);
const DropletsSolid = solid(Droplets);
const ShieldSolid = solid(Shield);

// Valores demonstrativos — altere aqui os números, rótulos e ícones.
const stats = [
  [AwardSolid, "10 anos", "De história"],
  [UsersSolid, "+5.000", "Clientes satisfeitos"],
  [DropletsSolid, "+120", "Produtos selecionados"],
  [ShieldSolid, "100%", "Procedência garantida"],
] as const;

export function StatsBand() {
  return (
    <section className="container-site mt-20">
      <div className="overflow-hidden rounded-2xl bg-ink shadow-card">
        <div className="h-px w-full bg-gold-metal opacity-70" aria-hidden="true" />
        <div className="grid gap-y-12 px-6 py-12 sm:grid-cols-2 sm:px-10 sm:py-14 lg:grid-cols-4">
          {stats.map(([Icon, value, label]) => (
            <div
              key={value}
              className="flex flex-col items-center text-center lg:border-l lg:border-ink-foreground/10 lg:first:border-l-0"
            >
              <Icon className="h-9 w-9 text-gold" strokeWidth={1.5} />
              <h3 className="mt-5 text-4xl font-semibold text-gold-metal sm:text-5xl">{value}</h3>
              <p className="eyebrow mx-auto mt-3 max-w-[18ch] leading-relaxed text-ink-foreground/80">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
