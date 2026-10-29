import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/politica-de-privacidade")({ staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Rarity Hair Care" },
      {
        name: "description",
        content: "Política de Privacidade da Rarity Hair Care.",
      },
      {
        property: "og:title",
        content: "Política de Privacidade — Rarity Hair Care",
      },
      {
        property: "og:description",
        content: "Política de Privacidade da Rarity Hair Care.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Política de Privacidade" crumb="Política de Privacidade" />

      <article className="container-site mt-10 mb-16 max-w-3xl space-y-8 leading-relaxed text-foreground/85">
        <p className="text-sm text-muted-foreground">Última atualização: 15 de outubro de 2026</p>

        <p>
          A Rarity Hair Care respeita sua privacidade e protege seus dados pessoais conforme a Lei Geral de Proteção de
          Dados (LGPD).
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Quais dados coletamos?</h2>
          <p>
            Podemos coletar nome, CPF, e-mail, telefone, endereço, data de nascimento e informações sobre seus pedidos.
            Para cadastros profissionais, também podemos solicitar CNPJ, informações de MEI ou documentos que comprovem
            a atividade profissional.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. Para que usamos seus dados?</h2>
          <p>
            Utilizamos seus dados para criar e administrar sua conta, atender solicitações, preparar pedidos, oferecer
            condições comerciais, verificar cadastros profissionais, enviar notificações e cumprir obrigações legais.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. Compartilhamento de dados</h2>
          <p>
            Seus dados poderão ser compartilhados com fornecedores de tecnologia necessários ao funcionamento do site e
            com serviços utilizados no atendimento, como o WhatsApp. Também poderão ser fornecidos às autoridades quando
            houver obrigação legal.
          </p>
          <p>Não vendemos seus dados pessoais.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">4. Segurança e armazenamento</h2>
          <p>
            Adotamos medidas de segurança para proteger suas informações contra acessos não autorizados. Documentos
            profissionais são armazenados em ambiente privado, com acesso restrito a administradores autorizados.
          </p>
          <p>
            Mantemos os dados apenas pelo tempo necessário às finalidades informadas ou ao cumprimento de obrigações
            legais.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">5. Cookies e tecnologias semelhantes</h2>
          <p>
            O site utiliza armazenamento local no navegador para funcionalidades como carrinho, favoritos e
            autenticação. O mapa exibido na página de contato pode utilizar tecnologias próprias do Google.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">6. Seus direitos</h2>
          <p>
            Você pode solicitar acesso, correção ou exclusão dos seus dados pessoais, além de exercer os demais direitos
            previstos na LGPD. A exclusão poderá ter limitações quando determinados registros precisarem ser mantidos
            por obrigação legal ou outra hipótese permitida pela legislação.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">7. Contato</h2>
          <p>Para dúvidas ou solicitações relacionadas à privacidade, entre em contato:</p>
          <p>
            <strong>E-mail:</strong>{" "}
            <a href="mailto:rarity@outlook.com.br" className="text-foreground underline underline-offset-4">
              rarity@outlook.com.br
            </a>
          </p>
          <p>
            <strong>WhatsApp:</strong>{" "}
            <a
              href="https://wa.me/5527997579959"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4"
            >
              (27) 99757-9959
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">8. Atualizações</h2>
          <p>
            Esta política poderá ser atualizada quando houver mudanças nas práticas de tratamento de dados ou nas
            funcionalidades do site. A versão vigente estará disponível nesta página.
          </p>
        </section>

        <footer className="border-t pt-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Rarity Hair Care | RARITY HAIR CARE LTDA</p>
          <p>CNPJ: 20.616.640/0001-38</p>
        </footer>
      </article>
    </>
  ),
});
