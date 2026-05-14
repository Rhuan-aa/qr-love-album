import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { unlockCard, type Card } from "../lib/cards";
import { FlipCard } from "@/components/FlipCard";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/unlock/$id")({
  component: UnlockPage,
});

function UnlockPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState<Card | null>(null);
  const [revealing, setRevealing] = useState(true);
  const [done, setDone] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const unlock = async () => {
      const result = await unlockCard(id);
      if (!result) {
        setNotFound(true);
        return;
      }
      setCard(result.card);
      // Animation duration = 2.8s; show "done" state after
      const t = setTimeout(() => {
        setRevealing(false);
        setDone(true);
      }, 2900);
    };
    unlock();
  }, [id]);

  if (notFound) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-4xl text-rose">Carta não encontrada</h1>
        <p className="handwritten text-lg text-ink/70 max-w-sm">
          Esse QR não corresponde a nenhuma carta cadastrada.
        </p>
        <Link
          to="/"
          className="mt-4 px-6 py-3 rounded-full bg-rose text-primary-foreground handwritten text-xl"
        >
          Voltar ao álbum
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10 max-w-5xl mx-auto w-full">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="h-5 w-5 text-rose heart-pulse" fill="currentColor" />
          <span className="handwritten text-sm tracking-widest uppercase text-ink/60">
            Nova carta
          </span>
          <Heart className="h-5 w-5 text-rose heart-pulse" fill="currentColor" />
        </div>
        <h1 className="font-display text-5xl shimmer-gold">
          {done ? "Para você ♡" : "Revelando..."}
        </h1>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 w-full">
        <div className="w-72 max-w-[80vw] shrink-0">
          {card && <FlipCard card={card} revealing={revealing} flipped={done} />}
        </div>

        {done && card && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-left-4 duration-1000">
            <h2 className="handwritten text-4xl md:text-5xl text-rose border-b border-rose/20 pb-2">
              {card.title}
            </h2>
            <p className="handwritten text-xl md:text-2xl text-ink/85 leading-relaxed whitespace-pre-wrap">
              {card.letter}
            </p>
            
            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-6 self-start px-8 py-4 rounded-full bg-rose text-primary-foreground handwritten text-xl shadow-lg hover:scale-105 transition-transform"
            >
              Guardar no álbum ✨
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
