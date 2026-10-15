import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/termos-de-uso")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Rarity Hair Care" },
      {
        name: "description",
        content: "Termos de Uso da Rarity Hair Care.",
      },
      {
        property: "og:title",
        content: "Termos de Uso — Rarity Hair Care",
      },
      {
        property: "og:description",
        content: "Termos de Uso da Rarity Hair Care.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Termos de Uso" crumb="Termos de Uso" />

      <article className="container-site mt-10 mb-16 max-w-3xl space-y-8 leading-relaxed text-foreground/85">
        <p className="text-sm text-muted-foreground">Última atualização: 15 de outubro de 2026</p>

        <p>
          Bem-vindo à Rarity Hair Care. Estes Termos de Uso estabelecem as condições gerais para utilização do nosso
          site. Ao utilizar suas funcionalidades, você declara estar ciente destas condições.
        </p>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Sobre a loja</h2>
          <p>A Rarity Hair Care é operada por:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>
              <strong>Razão social:</strong> RARITY HAIR CARE LTDA
            </li>
            <li>
              <strong>CNPJ:</strong> 20.616.640/0001-38
            </li>
            <li>
              <strong>Endereço:</strong> Rua São Paulo, 43, Loja 368, Jockey de Itaparica, Vila Velha, ES, CEP
              29103-875.
            </li>
            <li>
              <strong>E-mail:</strong>{" "}
              <a href="mailto:rarity@outlook.com.br" className="text-foreground underline underline-offset-4">
                rarity@outlook.com.br
              </a>
            </li>
            <li>
              <strong>WhatsApp:</strong>{" "}
              <a
                href="https://wa.me/5527997579959"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4"
              >
                (27) 99757-9959
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. Cadastro e conta</h2>
          <p>
            Para utilizar as funcionalidades que exigem cadastro, o usuário deve fornecer informações verdadeiras e
            manter seus dados atualizados.
          </p>
          <p>
            O usuário é responsável por proteger suas credenciais de acesso e comunicar à loja qualquer suspeita de
            utilização não autorizada de sua conta.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. Produtos e preços</h2>
          <p>
            O site apresenta produtos, preços e condições comerciais conforme as informações disponibilizadas pela loja.
          </p>
          <p>
            Os preços e benefícios podem variar conforme o produto, o perfil do cliente e as promoções vigentes. A
            disponibilidade dos produtos também pode variar.
          </p>
          <p>
            Caso sejam identificadas divergências nas informações apresentadas, a loja buscará esclarecê-las e
            corrigi-las, respeitando a legislação aplicável e os direitos do consumidor.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">4. Pedidos e atendimento</h2>
          <p>O site permite selecionar produtos e preparar pedidos para atendimento comercial.</p>
          <p>
            A conclusão da compra ocorre pelo WhatsApp, onde são confirmados os produtos, as quantidades, os preços e as
            condições de entrega ou retirada.
          </p>
          <p>
            O envio de um pedido pelo site não significa, por si só, confirmação de pagamento ou garantia de
            disponibilidade dos produtos.
          </p>
          <p>Após o encaminhamento do pedido, eventuais alterações deverão ser solicitadas diretamente à loja.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">5. Entrega e retirada</h2>
          <p>
            As condições de entrega, os respectivos valores e os prazos são combinados durante o atendimento comercial.
          </p>
          <p>A retirada na loja poderá ser realizada sem custo, conforme as condições informadas ao cliente.</p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">6. Cadastro profissional</h2>
          <p>
            O acesso a preços e condições comerciais profissionais depende da análise e aprovação do cadastro pela
            Rarity Hair Care.
          </p>
          <p>
            A loja poderá solicitar informações ou documentos necessários para verificar a atividade profissional. A
            aprovação não é automática e as condições comerciais específicas serão aplicadas conforme as regras
            vigentes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">7. Cupons, promoções e descontos</h2>
          <p>
            Cupons, promoções e descontos estão sujeitos às condições informadas pela loja, como validade, produtos
            participantes, público elegível e limites de utilização.
          </p>
          <p>
            Os benefícios não são necessariamente cumulativos. Eventuais restrições serão informadas conforme as regras
            de cada oferta, respeitando a legislação aplicável.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">8. Uso adequado do site</h2>
          <p>
            O usuário compromete-se a utilizar o site de maneira lícita e adequada, sem tentar acessar indevidamente
            informações de terceiros, realizar fraudes, comprometer a segurança ou prejudicar o funcionamento da
            plataforma.
          </p>
          <p>
            A loja poderá adotar medidas cabíveis diante de usos indevidos, respeitando a legislação e os direitos do
            usuário.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">9. Privacidade e dados pessoais</h2>
          <p>
            O tratamento de dados pessoais é explicado na{" "}
            <a href="/politica-de-privacidade" className="text-foreground underline underline-offset-4">
              Política de Privacidade
            </a>{" "}
            da Rarity Hair Care, disponível no site.
          </p>
          <p>
            As informações pessoais serão tratadas conforme as finalidades informadas naquela política e a legislação
            aplicável.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">10. Trocas, devoluções e direitos do consumidor</h2>
          <p>
            As solicitações de troca, devolução e demais questões relacionadas aos produtos serão tratadas conforme a
            legislação brasileira aplicável e a Política de Trocas e Devoluções da Rarity Hair Care, disponível no site.
          </p>
          <p>
            Estes Termos de Uso não excluem nem restringem os direitos garantidos ao consumidor pela legislação vigente.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">11. Alterações nos termos</h2>
          <p>
            Estes Termos de Uso poderão ser atualizados em razão de mudanças no site, nos serviços ou na legislação
            aplicável. A versão vigente estará disponível nesta página.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">12. Contato</h2>
          <p>Em caso de dúvidas sobre estes termos, entre em contato:</p>
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

        <footer className="border-t pt-5 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Rarity Hair Care | RARITY HAIR CARE LTDA</p>
          <p>CNPJ: 20.616.640/0001-38</p>
        </footer>
      </article>
    </>
  ),
});
