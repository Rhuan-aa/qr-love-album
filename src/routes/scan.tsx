import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { extractCardId } from "../lib/cards";

export const Route = createFileRoute("/scan")({
  component: ScanPage,
});

function ScanPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 handwritten text-lg text-ink/70 hover:text-rose mb-6"
      >
        <ArrowLeft className="h-5 w-5" /> Voltar para o álbum
      </Link>

      <div className="text-center mb-6">
        <h1 className="font-display text-4xl text-rose">Aponte para o QR</h1>
        <p className="handwritten text-ink/70 mt-1">
          Permita o uso da câmera quando o navegador pedir
        </p>
      </div>

      <div className="relative rounded-2xl overflow-hidden border-4 border-paper-deep shadow-xl aspect-square bg-black">
        {scanning && (
          <Scanner
            onScan={(results) => {
              if (!results?.length) return;
              const value = results[0].rawValue;
              const id = extractCardId(value);
              if (!id) {
                setError("Esse QR não parece ser de uma carta 💔");
                return;
              }
              setScanning(false);
              navigate({ to: "/unlock/$id", params: { id } });
            }}
            onError={(err) => {
              console.error(err);
              setError("Não consegui acessar a câmera. Verifique as permissões.");
            }}
            constraints={{ facingMode: "environment" }}
            styles={{ container: { width: "100%", height: "100%" } }}
          />
        )}
        {/* Decorative corners */}
        <div className="pointer-events-none absolute inset-4 border-2 border-paper/70 rounded-xl" />
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-destructive/15 text-destructive">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p className="handwritten text-base">{error}</p>
        </div>
      )}

      <p className="text-center handwritten text-ink/60 mt-6">
        Cada carta só revela seu segredo uma vez ✨
      </p>
    </main>
  );
}
