"use client";

import type { CSSProperties } from "react";

type CoriandoliPiece = {
  id: number;
  left: string;
  delay: string;
  duration: string;
  drift: string;
  rotation: string;
  size: string;
  color: string;
};

const colors = ["#FACC15", "#2563EB", "#1E3A8A", "#22C55E", "#EF4444"];

function buildCoriandoliPieces(): CoriandoliPiece[] {
  return Array.from({ length: 90 }).map((_, index) => {
    const left = (index * 37) % 100;
    const delay = ((index * 17) % 80) / 100;
    const duration = 2.4 + ((index * 23) % 20) / 10;
    const drift = -120 + ((index * 53) % 240);
    const rotation = 180 + ((index * 71) % 720);
    const size = 7 + ((index * 11) % 8);

    return {
      id: index,
      left: `${left}%`,
      delay: `${delay}s`,
      duration: `${duration}s`,
      drift: `${drift}px`,
      rotation: `${rotation}deg`,
      size: `${size}px`,
      color: colors[index % colors.length],
    };
  });
}

const coriandoliPieces = buildCoriandoliPieces();

export function Coriandoli() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {coriandoliPieces.map((piece) => (
        <span
          key={piece.id}
          className="coriandoli-piece"
          style={
            {
              "--left": piece.left,
              "--delay": piece.delay,
              "--duration": piece.duration,
              "--drift": piece.drift,
              "--rotation": piece.rotation,
              "--size": piece.size,
              "--color": piece.color,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}