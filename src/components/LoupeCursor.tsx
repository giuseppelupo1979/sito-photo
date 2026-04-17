import React, { useEffect, useState } from 'react';

export const LoupeCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -999, y: -999, visible: false });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY, visible: true });
    };
    const leave = () => setPos((p) => ({ ...p, visible: false }));

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);

    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, []);

  if (!pos.visible) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: pos.x - 38,
          top: pos.y - 38,
          width: 76,
          height: 76,
          borderRadius: "50%",
          border: "1px solid rgba(232,226,212,0.85)",
          boxShadow: "inset 0 0 0 6px rgba(0,0,0,0.35), 0 0 40px rgba(217,58,43,0.12)",
          pointerEvents: "none",
          zIndex: 9999,
          mixBlendMode: "difference",
        }}
      />
      <div
        style={{
          position: "fixed",
          left: pos.x + 44,
          top: pos.y - 8,
          fontSize: 9,
          letterSpacing: 2,
          color: "#e8e2d4",
          pointerEvents: "none",
          zIndex: 10000,
          fontFamily: 'var(--font-mono)',
        }}
      >
        LOUPE 8×
      </div>
    </>
  );
};
