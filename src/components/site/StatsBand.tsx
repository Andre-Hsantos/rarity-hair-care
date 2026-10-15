import { Award, Shield, Package, Users } from "lucide-react";

const stats = [
  [Award, "12+", "Anos de história"],
  [Users, "1.000+", "Clientes satisfeitos"],
  [Package, "70+", "Produtos selecionados"],
  [Shield, "100%", "Procedência garantida"],
] as const;

export function StatsBand() {
  return (
    <section className="container-site mt-20">
      <div className="grid grid-cols-2 gap-x-2 gap-y-10 py-4 sm:gap-x-6 sm:py-8 lg:grid-cols-4">
        {stats.map(([Icon, value, label]) => (
          <div
            key={value}
            className="flex flex-col items-center text-center lg:border-l lg:border-border lg:first:border-l-0"
          >
            <Icon className="h-7 w-7 text-gold sm:h-9 sm:w-9" strokeWidth={1.5} fill="none" />

            <h3 className="mt-4 text-[1.75rem] leading-none font-semibold text-gold-deep sm:mt-5 sm:text-4xl lg:text-5xl">
              {value}
            </h3>

            <p className="mt-2 max-w-[15ch] text-[0.62rem] font-medium uppercase tracking-[0.18em] text-muted-foreground sm:mt-3 sm:max-w-[18ch] sm:text-[0.72rem] sm:tracking-[0.22em] sm:leading-relaxed">
              {label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
