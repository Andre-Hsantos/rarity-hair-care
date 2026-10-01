import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";

export type Product = {
  id: string;
  name: string;
  short: string;
  description: string;
  category: Category;
  price: number;
  oldPrice?: number;
  image: string;
  inStock: boolean;
  size: string;
  rating: number;
};

export const categories = [
  "Shampoos",
  "Condicionadores",
  "Máscaras",
  "Finalizadores",
  "Tratamentos",
  "Kits",
] as const;
export type Category = (typeof categories)[number];

export const products: Product[] = [
  { id: "1", name: "Shampoo Reconstrutor", short: "Limpeza suave com reposição de massa", description: "Fórmula demonstrativa para limpeza delicada dos fios, auxiliando na reconstrução e no brilho natural. Texto ilustrativo para o protótipo.", category: "Shampoos", price: 89.9, oldPrice: 109.9, image: p1, inStock: true, size: "300 ml", rating: 4.8 },
  { id: "2", name: "Máscara Nutrição Intensa", short: "Nutrição profunda para fios ressecados", description: "Máscara de tratamento com textura cremosa. Descrição fictícia para fins de demonstração.", category: "Máscaras", price: 119.9, image: p2, inStock: true, size: "250 g", rating: 4.9 },
  { id: "3", name: "Condicionador Hidratante", short: "Desembaraço e maciez imediata", description: "Condicionador com toque leve, pensado para uso diário. Conteúdo demonstrativo.", category: "Condicionadores", price: 79.9, image: p3, inStock: true, size: "200 ml", rating: 4.7 },
  { id: "4", name: "Sérum Brilho Absoluto", short: "Finalizador leve com efeito luminoso", description: "Sérum finalizador para pontas e comprimento. Informações ilustrativas.", category: "Finalizadores", price: 99.9, oldPrice: 124.9, image: p4, inStock: true, size: "30 ml", rating: 4.6 },
  { id: "5", name: "Shampoo Equilíbrio", short: "Para couro cabeludo oleoso", description: "Shampoo de limpeza equilibrada. Texto demonstrativo.", category: "Shampoos", price: 74.9, image: p1, inStock: false, size: "300 ml", rating: 4.5 },
  { id: "6", name: "Máscara Reparação", short: "Tratamento para fios danificados", description: "Máscara reparadora de uso semanal. Conteúdo fictício.", category: "Tratamentos", price: 134.9, image: p2, inStock: true, size: "500 g", rating: 4.8 },
  { id: "7", name: "Leave-in Proteção", short: "Proteção térmica e controle do frizz", description: "Leave-in demonstrativo para proteção diária.", category: "Finalizadores", price: 69.9, oldPrice: 84.9, image: p3, inStock: true, size: "150 ml", rating: 4.4 },
  { id: "8", name: "Óleo Capilar Nutritivo", short: "Nutrição e brilho para as pontas", description: "Óleo leve de rápida absorção. Texto ilustrativo.", category: "Tratamentos", price: 89.9, image: p4, inStock: true, size: "60 ml", rating: 4.7 },
];

export const getProduct = (id: string) => products.find((p) => p.id === id);

export const brl = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
