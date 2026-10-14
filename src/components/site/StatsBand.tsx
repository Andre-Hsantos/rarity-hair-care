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
        <div className="grid grid-cols-2 gap-x-2 gap-y-10 px-5 py-10 sm:grid-cols-2 sm:gap-x-6 sm:px-10 sm:py-14 lg:grid-cols-4">
          {stats.map(([Icon, value, label]) => (
            <div
              key={value}
              className="flex flex-col items-center text-center lg:border-l lg:border-ink-foreground/10 lg:first:border-l-0"
            >
              <Icon className="h-7 w-7 text-gold sm:h-9 sm:w-9" strokeWidth={1.5} />
              <h3 className="mt-4 text-[1.75rem] leading-none font-semibold text-gold-metal sm:mt-5 sm:text-4xl lg:text-5xl">
                {value}
              </h3>
              <p className="mt-2 max-w-[15ch] text-[0.62rem] font-medium uppercase tracking-[0.18em] text-ink-foreground/80 sm:mt-3 sm:max-w-[18ch] sm:text-[0.72rem] sm:tracking-[0.22em] sm:leading-relaxed">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
