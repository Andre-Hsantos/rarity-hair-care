# Descontos por quantidade — auditoria e plano (nada foi alterado)

## 1. Estrutura existente

- **Preços**: `products.price` (normal) e `products.pro_price` (profissional, opcional). Desconto individual em `profiles.individual_discount_percent` (0–100), válido só se `account_type = 'profissional'` e `pro_status = 'aprovado'`.
- **Promoções**: `promotions` (percentual/valor fixo, período, status, público) + `promotion_products`. Calculadas apenas no banco por `_promo_price` / `_has_promo` (melhor promoção, empate pela mais antiga).
- **Cupons**: `coupons` (+ `coupon_products`, `coupon_categories`), validados em `_quote_cart`: status, período, limite de usos, público, pedido mínimo, restrição por produto/categoria. Regra atual: **cupom não incide em item em promoção**. Não existe hoje nenhuma opção no cupom sobre combinar com outros descontos.
- **Carrinho**: `cart_items` guarda só produto + quantidade. Preço calculado no banco por `_quote_cart` → `quote_cart` (exibição) e `create_order` (grava `order_items` com preço congelado).
- **Catálogo/produto**: `catalog_products()` devolve o preço final por visitante, sem considerar quantidade. Página `src/routes/produto.$id.tsx` usa `useCatalog` (`src/lib/catalog.ts`).
- **Carrinho na tela**: `src/routes/carrinho.tsx` + `src/lib/useQuote.ts`; checkout em `src/routes/_authenticated/checkout.tsx`; WhatsApp montado a partir do pedido gravado (`src/lib/orders.ts`).
- **Cálculo**: somente no banco. `src/lib/pricing.ts` é cópia de referência com testes (`pricing.test.ts`).
- **Desconto por quantidade**: não existe nenhuma tabela, coluna ou regra. Nada a duplicar.

## 2. Solução recomendada

Nova tabela de faixas por produto; o banco calcula o percentual da faixa dentro de `_quote_cart` (que já percorre cada linha com sua quantidade). `catalog_products()` não muda (preço de 1 unidade); a página do produto só lê as faixas para mostrar.

## 3. Alterações previstas

Banco (uma migração):
- Tabela `quantity_discounts`: `id uuid`, `product_id text → products.id`, `min_quantity int` (2–99), `percent numeric(5,2)` (>0 e ≤100), `status record_status` (padrão ativo), `created_at/updated_at`.
- Restrição única (`product_id`, `min_quantity`) para impedir faixas duplicadas; gatilho de validação recusando faixa maior com percentual menor ou igual a uma faixa menor (faixas conflitantes).
- Coluna nova `coupons.allow_with_quantity_discount boolean default false`.
- Função `_qty_pct(product_id, qty)`: maior percentual ativo com `min_quantity ≤ qty`.
- Atualizar `_quote_cart` (devolver também `quantity_percent` e `quantity_min` por item) e `admin_delete_product` (apagar faixas do produto).

Telas:
- Admin: nova seção “Descontos por quantidade” (ou aba dentro de Cupons e promoções) — escolher produto, listar/criar/editar/ativar/desativar/remover faixas.
- `produto.$id.tsx`: bloco “Leve mais, pague menos” com as faixas reais (ex.: “A partir de X un.: Y% off”); não aparece se não houver faixas.
- `carrinho.tsx` / checkout: mostrar faixa atingida, preço unitário aplicado e total da linha; o recálculo já acontece a cada mudança de quantidade.
- `pricing.ts` + testes atualizados para espelhar a regra.

## 4. Regras comerciais — ordem proposta

1. Tipo de cliente (comum ou profissional aprovado).
2. Base: comum → `price`; profissional aprovado → `pro_price` (ou `price`).
3. Percentual de pessoa/quantidade:
   - comum → percentual da faixa;
   - profissional → **maior** entre desconto individual e faixa (nunca somados).
4. Promoção (regra atual, sem mudança) sobre o resultado.
5. Cupom: não incide em item em promoção (mantido). Em item com desconto por quantidade, só incide se o cupom tiver `allow_with_quantity_discount = true`; demais restrições do cupom continuam.

Exemplos (valores ilustrativos, não serão cadastrados): produto R$100, pro R$80, faixas 5 un.=5% e 10 un.=10%.
- Comum, 4 un. → R$100 cada. 5 un. → R$95. 12 un. → R$90 (só 10%).
- Profissional com 8% individual, 6 un. → maior(8%, 5%) = 8% → R$73,60. 10 un. → 10% → R$72,00.
- Comum, 10 un., promoção 20% → R$90 × 0,8 = R$72; cupom não se aplica.
- Comum, 10 un., cupom 5% sem permissão → cupom ignorado nessa linha (aviso “Produto com desconto por quantidade: o cupom não se aplica”); com permissão → R$90 − 5%.

## 5. Segurança

- `quantity_discounts`: leitura para visitantes e logados só de faixas ativas de produtos ativos; inserir/editar/apagar apenas `has_role(auth.uid(),'admin')`. Grants: `anon`/`authenticated` SELECT; escrita via RLS de admin.
- Preço nunca vem do navegador: cálculo continua em `_quote_cart` / `create_order`; profissional pendente ou rejeitado nunca recebe preço pro.
- Alterações de faixa registradas em `audit_log`.

## 6. Testes

Unitários (`pricing.test.ts`) e verificação no banco/navegador:
- sem faixas; abaixo da 1ª faixa; exatamente no limite; entre faixas; faixa superior; dois produtos com regras independentes;
- comum vs. profissional aprovado; individual maior que faixa e vice-versa; profissional pendente;
- cupom permitido/não permitido; produto em promoção;
- mudar quantidade, remover item, recálculo;
- valores inválidos (0%, >100%, quantidade < 2, faixa duplicada/conflitante) recusados; não-admin tentando gravar recusado;
- pedido gravado e mensagem do WhatsApp com os mesmos valores do carrinho.

## 7. Pendências e riscos (preciso da sua decisão)

1. **Promoção + quantidade no mesmo produto**: proposto acumular (faixa e depois promoção). Alternativa: aplicar só o melhor dos dois. Qual prefere?
2. **Cupom**: a opção “permite combinar com desconto por quantidade” por cupom (padrão: não) atende?
3. Quantidade máxima por item hoje é 99 — faixas limitadas a esse valor.
4. Pedidos antigos não mudam (preço congelado).
5. Onde colocar no admin: aba nova no menu ou dentro de “Cupons e promoções”.

Aguardo autorização explícita para executar.
