import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, QrCode, Sparkles, Lock } from "lucide-react";
import { cardsStore, type Card } from "@/lib/cards";
import { FlipCard } from "@/components/FlipCard";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [cards, setCards] = useState<Card[]>([]);
  const [openCard, setOpenCard] = useState<Card | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => setCards(cardsStore.list());
    sync();
    window.addEventListener("love-album:update", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("love-album:update", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const unlocked = cards.filter((c) => c.unlockedAt !== null);
  const hasAny = unlocked.length > 0;

  return (
    <main className="min-h-screen px-4 py-8 pb-32 max-w-3xl mx-auto">
      <header className="flex flex-col items-center text-center gap-2 mb-8">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-rose" fill="currentColor" />
          <span className="handwritten text-sm tracking-widest uppercase text-ink/60">
            Nosso álbum
          </span>
          <Heart className="h-6 w-6 text-rose" fill="currentColor" />
        </div>
        <h1 className="font-display text-5xl md:text-6xl shimmer-gold">
          Cartas de Amor
        </h1>
        <p className="handwritten text-lg text-ink/70 max-w-md">
          {hasAny
            ? `Você já desbloqueou ${unlocked.length} carta${unlocked.length > 1 ? "s" : ""} ✨`
            : "Cada QR code é uma surpresa esperando por você"}
        </p>
      </header>

      {!hasAny ? (
        <EmptyState onScan={() => navigate({ to: "/scan" })} />
      ) : (
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-5">
          {cards.map((card) => {
            const locked = card.unlockedAt === null;
            return (
              <button
                key={card.id}
                type="button"
                disabled={locked}
                onClick={() => !locked && setOpenCard(card)}
                className="polaroid disabled:cursor-not-allowed text-left"
                style={{
                  transform: `rotate(${(parseInt(card.id.slice(0, 2), 16) % 7) - 3}deg)`,
                }}
              >
                <FlipCard card={card} locked={locked} flipped={false} />
                <p className="handwritten text-center mt-2 text-ink/80 truncate">
                  {locked ? "??? " : card.title}
                </p>
              </button>
            );
          })}
        </section>
      )}

      {/* Floating scan button */}
      <Link
        to="/scan"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-7 py-4 rounded-full bg-rose text-primary-foreground shadow-[0_10px_30px_-8px_oklch(0.5_0.2_20/0.6)] hover:scale-105 transition-transform"
      >
        <QrCode className="h-5 w-5" />
        <span className="handwritten text-xl">Escanear carta</span>
        <Sparkles className="h-4 w-4" />
      </Link>

      <Dialog open={!!openCard} onOpenChange={(o) => !o && setOpenCard(null)}>
        <DialogContent className="max-w-md p-6 bg-card border-border">
          {openCard && (
            <div className="space-y-4">
              <img
                src={openCard.imageUrl}
                alt={openCard.title}
                className="w-full aspect-[4/3] object-cover rounded-lg"
              />
              <h2 className="handwritten text-3xl text-rose">{openCard.title}</h2>
              <p className="handwritten text-lg text-ink/85 whitespace-pre-wrap leading-relaxed">
                {openCard.letter}
              </p>
              <p className="text-xs text-ink/50 font-body">
                Desbloqueada em{" "}
                {new Date(openCard.unlockedAt!).toLocaleDateString("pt-BR")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 mt-12 px-4">
      <div className="relative">
        <div className="polaroid w-56 aspect-[5/7] flex items-center justify-center">
          <div className="locked-card absolute inset-3 rounded-md flex items-center justify-center">
            <Lock className="h-14 w-14 text-paper" strokeWidth={1.5} />
          </div>
          <span className="tape tape-tl" />
          <span className="tape tape-tr" />
        </div>
      </div>
      <div className="space-y-2 max-w-sm">
        <h2 className="font-display text-3xl text-rose">Seu álbum está esperando</h2>
        <p className="handwritten text-lg text-ink/75">
          Pegue a primeira cartinha física, aponte a câmera para o QR code e
          deixe a magia acontecer 💌
        </p>
      </div>
      <p className="handwritten text-ink/55 text-sm">
        Use o botão abaixo para abrir o scanner ↓
      </p>
    </div>
  );
}
