import { Heart, Lock } from "lucide-react";
import type { Card } from "@/lib/cards";

type Props = {
  card?: Card;
  locked?: boolean;
  flipped?: boolean;
  revealing?: boolean;
  onClick?: () => void;
};

export function FlipCard({ card, locked, flipped, revealing, onClick }: Props) {
  const showBack = !locked && (flipped || revealing);

  return (
    <div
      className={`tcg-card ${showBack ? "tcg-card-flipped" : ""} ${revealing ? "tcg-reveal" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className="tcg-card-inner">
        {/* FRONT — blank white card */}
        <div className="tcg-card-face card-front-blank">
          {locked ? (
            <div className="locked-card absolute inset-0 flex flex-col items-center justify-center gap-3 text-paper">
              <Lock className="h-12 w-12 text-paper/90" strokeWidth={1.5} />
              <span className="handwritten text-xl text-paper/90">?</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 text-center">
              <Heart className="h-14 w-14 text-rose heart-pulse" fill="currentColor" />
              <span className="handwritten text-2xl text-ink/70">
                Para você
              </span>
            </div>
          )}
          <span className="tape tape-tl" />
          <span className="tape tape-tr" />
        </div>

        {/* BACK — full image */}
        {card && (
          <div className="tcg-card-face tcg-card-back bg-card">
            <div className="absolute inset-0">
              <img
                src={card.imageUrl}
                alt={card.title}
                className="h-full w-full object-cover"
              />
            </div>
            <span className="tape tape-tl" />
            <span className="tape tape-tr" />
          </div>
        )}
      </div>
    </div>
  );
}
