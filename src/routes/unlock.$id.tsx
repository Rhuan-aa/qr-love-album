import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cardsStore, type Card } from "@/lib/cards";
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
    const result = cardsStore.unlock(id);
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
    return () => clearTimeout(t);
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
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
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

      <div className="w-72 max-w-[80vw]">
        {card && <FlipCard card={card} revealing={revealing} flipped={done} />}
      </div>

      {done && (
        <button
          onClick={() => navigate({ to: "/" })}
          className="mt-10 px-8 py-4 rounded-full bg-rose text-primary-foreground handwritten text-xl shadow-lg hover:scale-105 transition-transform"
        >
          Guardar no álbum ✨
        </button>
      )}
    </main>
  );
}
