import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      href="https://api.whatsapp.com/send?phone=5527997579959"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-2 ring-accent/60 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-4"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
