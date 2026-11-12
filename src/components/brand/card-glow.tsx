// Efeito de luz do login: um feixe desenhado com caracteres ASCII
// pequenos (densos e claros no centro, ralos e escuros nas bordas) que se
// abre e se espalha ao encostar no cartão, faíscas minúsculas, uma linha
// de luz fina na borda de cima do cartão e o brilho quente que entra
// nele. Tudo decorativo (aria-hidden, sem cliques) e determinístico: o
// mesmo desenho no servidor e no navegador.

const COLS = 84;
const ROWS = 26;
const CHAR_W = 5.5; // px por coluna
const LINE_H = 9; // px por linha

// Do mais apagado ao mais "cheio".
const RAMP = "`.':;~<(=sY5eG8&#Q@";

/** PRNG pequeno com semente fixa (mulberry32). */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildAscii(): string {
  const rand = rng(7);
  const lines: string[] = [];
  for (let r = 0; r < ROWS; r++) {
    // y = 0 no topo, 1 na borda do cartão.
    const y = r / (ROWS - 1);
    // Coluna estreita no alto que se abre de repente perto do cartão.
    const halfWidth = 0.14 + 0.18 * y + 0.62 * Math.pow(y, 4);
    let line = "";
    for (let c = 0; c < COLS; c++) {
      const dx = (c - (COLS - 1) / 2) / ((COLS - 1) / 2);
      const across = Math.exp(-Math.pow(dx / halfWidth, 2) * 1.8);
      const down = 0.18 + 0.82 * Math.pow(y, 1.3);
      const intensity = 0.95 * across * down + (rand() - 0.5) * 0.1;
      if (intensity < 0.05) {
        // Fora do feixe: só a malha de pontos bem fraca.
        line += rand() < 0.18 ? "`" : " ";
        continue;
      }
      const i = Math.min(RAMP.length - 1, Math.floor(intensity * RAMP.length));
      line += RAMP[i];
    }
    lines.push(line);
  }
  return lines.join("\n");
}

function buildSparks() {
  const rand = rng(21);
  return Array.from({ length: 36 }, () => {
    // Mais faíscas perto da borda do cartão, onde a luz se espalha.
    const y = 25 + Math.pow(rand(), 0.6) * 75;
    const spread = 14 + (y - 25) * 0.55;
    const x = 50 + (rand() + rand() - 1) * spread;
    return {
      left: `${x.toFixed(2)}%`,
      top: `${y.toFixed(2)}%`,
      size: rand() < 0.75 ? 1 : 1.6,
      opacity: (0.3 + rand() * 0.6).toFixed(2),
    };
  });
}

const ASCII = buildAscii();
const SPARKS = buildSparks();

const ASCII_WIDTH = COLS * CHAR_W;
const ASCII_HEIGHT = ROWS * LINE_H;

const GLYPH_MASK =
  "radial-gradient(ellipse 50% 100% at 50% 100%, black 40%, transparent 96%)";

/** Feixe acima do cartão. */
export function CardGlow() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 select-none"
      style={{ width: ASCII_WIDTH, height: ASCII_HEIGHT }}
    >
      {/* Leque largo e baixo: a luz se espalhando ao tocar o cartão. */}
      <div
        className="absolute inset-x-[-12%] bottom-0 h-1/2"
        style={{
          background:
            "radial-gradient(ellipse 50% 100% at 50% 100%, oklch(0.78 0.19 66 / 0.6) 0%, oklch(0.68 0.2 52 / 0.32) 40%, oklch(0.58 0.19 42 / 0.1) 70%, transparent 92%)",
          filter: "blur(16px)",
        }}
      />
      {/* Coluna: amarela no centro, laranja nas bordas, sumindo para cima. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 22% 100% at 50% 100%, oklch(0.9 0.19 94 / 0.95) 0%, oklch(0.82 0.19 76 / 0.75) 25%, oklch(0.7 0.2 56 / 0.38) 58%, transparent 92%)",
          filter: "blur(16px)",
        }}
      />
      {/* Faixa mais quente encostada na borda, larga como o leque. */}
      <div
        className="absolute inset-x-[4%] bottom-0 h-1/4"
        style={{
          background:
            "radial-gradient(ellipse 46% 100% at 50% 100%, oklch(0.95 0.15 98 / 0.85) 0%, oklch(0.88 0.19 88 / 0.55) 30%, oklch(0.75 0.19 66 / 0.2) 65%, transparent 90%)",
          filter: "blur(8px)",
        }}
      />
      {/* Caracteres: a cor vem de um degradê recortado no texto. */}
      <pre
        className="absolute bottom-0 left-1/2 m-0 w-max -translate-x-1/2 whitespace-pre font-mono"
        style={{
          fontSize: 7,
          lineHeight: `${LINE_H}px`,
          letterSpacing: `${CHAR_W - 4.2}px`,
          opacity: 0.7,
          filter: "blur(0.25px)",
          maskImage: GLYPH_MASK,
          WebkitMaskImage: GLYPH_MASK,
          backgroundImage:
            "radial-gradient(ellipse 50% 100% at 50% 100%, oklch(0.94 0.17 96) 0%, oklch(0.86 0.19 84) 20%, oklch(0.76 0.19 64) 40%, oklch(0.62 0.17 46 / 0.7) 60%, oklch(0.48 0.07 52 / 0.32) 80%, oklch(0.42 0.02 60 / 0.18) 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {ASCII}
      </pre>
      {/* Faíscas. */}
      {SPARKS.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            background: "oklch(0.93 0.17 92)",
            boxShadow: "0 0 3px 0.5px oklch(0.84 0.19 74 / 0.6)",
          }}
        />
      ))}
    </div>
  );
}

/** Linha de luz na borda de cima do cartão e o brilho que entra nele. */
export function CardGlowSpill() {
  const line =
    "linear-gradient(90deg, transparent 0%, oklch(0.55 0.15 45 / 0.4) 8%, oklch(0.74 0.19 60) 24%, oklch(0.9 0.19 92) 40%, oklch(0.97 0.12 100) 50%, oklch(0.9 0.19 92) 60%, oklch(0.74 0.19 60) 76%, oklch(0.55 0.15 45 / 0.4) 92%, transparent 100%)";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-60 overflow-hidden rounded-t-[12px]"
    >
      {/* Luz quente descendo pelo cartão, larga como o leque. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 62% 80% at 50% 0%, oklch(0.7 0.17 58 / 0.26) 0%, oklch(0.6 0.15 50 / 0.1) 45%, transparent 80%)",
        }}
      />
      {/* Bloom da linha. */}
      <div
        className="absolute top-0 left-1/2 h-2 w-[96%] -translate-x-1/2"
        style={{ background: line, filter: "blur(5px)", opacity: 0.6 }}
      />
      {/* Linha nítida de 1px. */}
      <div
        className="absolute top-0 left-1/2 h-px w-[96%] -translate-x-1/2"
        style={{ background: line }}
      />
    </div>
  );
}
