import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { ArrowLeft, Copy, Download, LogOut, Trash2 } from "lucide-react";
import { adminAuth, cardsStore, type Card } from "@/lib/cards";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setAuthed(adminAuth.isAuthed());
  }, []);

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (adminAuth.login(pw)) {
              setAuthed(true);
              setErr("");
            } else {
              setErr("Senha incorreta");
            }
          }}
          className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-xl space-y-4"
        >
          <h1 className="font-display text-3xl text-rose text-center">Área Secreta</h1>
          <p className="handwritten text-center text-ink/70">
            Apenas o autor das cartas pode entrar.
          </p>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Senha"
            autoFocus
          />
          {err && <p className="text-destructive text-sm">{err}</p>}
          <Button type="submit" className="w-full bg-rose hover:bg-rose/90">
            Entrar
          </Button>
          <Link
            to="/"
            className="block text-center handwritten text-sm text-ink/60 hover:text-rose"
          >
            ← voltar
          </Link>
        </form>
      </main>
    );
  }

  return <AdminDashboard onLogout={() => setAuthed(false)} />;
}

function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [cards, setCards] = useState<Card[]>([]);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [letter, setLetter] = useState("");
  const [created, setCreated] = useState<Card | null>(null);

  useEffect(() => {
    setCards(cardsStore.list());
    const sync = () => setCards(cardsStore.list());
    window.addEventListener("love-album:update", sync);
    return () => window.removeEventListener("love-album:update", sync);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !imageUrl || !letter) return;
    const c = cardsStore.create({ title, imageUrl, letter });
    setCreated(c);
    setTitle("");
    setImageUrl("");
    setLetter("");
  };

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 handwritten text-lg text-ink/70 hover:text-rose"
        >
          <ArrowLeft className="h-5 w-5" /> Álbum
        </Link>
        <button
          onClick={() => {
            adminAuth.logout();
            onLogout();
          }}
          className="inline-flex items-center gap-2 handwritten text-ink/70 hover:text-rose"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>

      <h1 className="font-display text-4xl text-rose mb-6">Painel do Criador</h1>

      <form
        onSubmit={submit}
        className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-md"
      >
        <h2 className="font-display text-2xl">Nova carta</h2>
        <div className="space-y-2">
          <label className="handwritten text-ink/80">Título</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <label className="handwritten text-ink/80">URL da imagem</label>
          <Input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
            required
          />
        </div>
        <div className="space-y-2">
          <label className="handwritten text-ink/80">Cartinha</label>
          <Textarea
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            rows={6}
            required
          />
        </div>
        <Button type="submit" className="w-full bg-rose hover:bg-rose/90">
          Criar carta + gerar QR
        </Button>
      </form>

      {created && <CreatedCardPreview card={created} onClose={() => setCreated(null)} />}

      <section className="mt-10">
        <h2 className="font-display text-2xl mb-4">Cartas cadastradas ({cards.length})</h2>
        <div className="space-y-3">
          {cards.map((c) => (
            <CardRow key={c.id} card={c} />
          ))}
          {cards.length === 0 && (
            <p className="handwritten text-ink/60 text-center py-8">
              Nenhuma carta ainda.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function CreatedCardPreview({ card, onClose }: { card: Card; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const u = `${window.location.origin}/unlock/${card.id}`;
    setUrl(u);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, u, { width: 280, margin: 2 });
    }
  }, [card.id]);

  const downloadQR = () => {
    const link = document.createElement("a");
    link.download = `carta-${card.title.replace(/\s+/g, "-")}.png`;
    link.href = canvasRef.current!.toDataURL();
    link.click();
  };

  return (
    <div className="mt-6 bg-accent/30 border-2 border-dashed border-accent rounded-2xl p-6 space-y-4 text-center">
      <h3 className="font-display text-2xl text-rose">Carta criada! 💌</h3>
      <canvas ref={canvasRef} className="mx-auto rounded-lg bg-white p-2" />
      <p className="font-body text-xs text-ink/70 break-all px-4">{url}</p>
      <div className="flex gap-2 justify-center flex-wrap">
        <Button onClick={downloadQR} variant="outline">
          <Download className="h-4 w-4 mr-2" /> Baixar QR
        </Button>
        <Button
          onClick={() => navigator.clipboard.writeText(url)}
          variant="outline"
        >
          <Copy className="h-4 w-4 mr-2" /> Copiar link
        </Button>
        <Button onClick={onClose} variant="ghost">Fechar</Button>
      </div>
    </div>
  );
}

function CardRow({ card }: { card: Card }) {
  const [showQR, setShowQR] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const url = typeof window !== "undefined" ? `${window.location.origin}/unlock/${card.id}` : "";

  useEffect(() => {
    if (showQR && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 240, margin: 2 });
    }
  }, [showQR, url]);

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex gap-4 items-start">
      <img
        src={card.imageUrl}
        alt=""
        className="w-16 h-16 rounded-md object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="handwritten text-xl text-ink truncate">{card.title}</p>
        <p className="text-xs text-ink/60 font-body">
          {card.unlockedAt ? "✓ desbloqueada" : "🔒 aguardando"} · id {card.id.slice(0, 8)}
        </p>
        {showQR && (
          <div className="mt-3 space-y-2">
            <canvas ref={canvasRef} className="rounded bg-white p-1" />
            <p className="text-xs break-all text-ink/70">{url}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Button size="sm" variant="outline" onClick={() => setShowQR((v) => !v)}>
          QR
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (confirm("Apagar essa carta?")) cardsStore.remove(card.id);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
