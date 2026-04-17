import React, { useState, useEffect } from 'react';
import { LoupeCursor } from './LoupeCursor';

interface Props {
  initialStories: any[];
  initialSheet: any[];
  email: string;
  igHandle: string;
}

interface LightboxFrame { frame: any; story: any; }

export const HomeSheet: React.FC<Props> = ({ initialStories, initialSheet, email, igHandle }) => {
  const [hover, setHover] = useState<number | null>(null);
  const [lightbox, setLightbox] = useState<LightboxFrame | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function openLightbox(e: React.MouseEvent, i: number) {
    e.preventDefault();
    const frame = initialSheet[i];
    const story = initialStories.find(s => s.id === frame.story_id) ?? null;
    setLightbox({ frame, story });
  }

  const hoveredFrame = hover !== null ? initialSheet[hover] : null;
  const hoveredStory = hoveredFrame ? initialStories.find(s => s.id === hoveredFrame.story_id) : null;

  return (
    <div className="home-sheet-container" style={{
      position: "relative",
      width: "100%",
      height: "100vh",
      background: "var(--bg-home)",
      color: "var(--text-primary)",
      overflow: "hidden",
    }}>
      <LoupeCursor />

      {/* Header */}
      <header className="dotted-border-b" style={{
        padding: "28px 44px 20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, opacity: 0.5, textTransform: 'uppercase' }}>
            ROLL N° 141 / TRI-X 400 / 20°C
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 32,
            letterSpacing: -0.4,
            marginTop: 6,
            marginBottom: 0,
          }}>
            Giuseppe Lupo <span style={{ opacity: 0.45, fontSize: 15, fontStyle: "italic" }}>— fotografo</span>
          </h1>
        </div>
        <div style={{ textAlign: "right", fontSize: 10, letterSpacing: 2, opacity: 0.75 }}>
          <div style={{ fontWeight: 500 }}>REPORTAGE ∙ VIAGGIO ∙ RITRATTI</div>
          <div style={{ marginTop: 6, opacity: 0.55 }}>INDEX ∙ STORIE ∙ STAMPE ∙ <a href={`https://instagram.com/${igHandle.replace('@','')}`} target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>{igHandle.toUpperCase()}</a> ∙ <a href={`mailto:${email}`} style={{ color: 'inherit', textDecoration: 'none' }}>EMAIL</a></div>
        </div>
      </header>

      {/* Grid */}
      <main className="home-grid" style={{
        position: "absolute",
        top: "var(--header-h)",
        left: 44,
        right: 44,
        bottom: "var(--footer-h)",
        gap: 14,
        paddingTop: 20,
        paddingBottom: 20,
      }}>
        {initialSheet.map((f, i) => {
          const isHovered = hover === i;
          return (
            <a
              key={i}
              href={`/storie/${f.storySlug}`}
              onClick={(e) => openLightbox(e, i)}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: 'block',
                position: "relative",
                background: "var(--bg-frame)",
                border: isHovered ? "1px solid rgba(232,226,212,0.4)" : "1px solid var(--border-subtle)",
                transition: "border-color 0.15s, transform 0.25s",
                transform: isHovered ? "scale(1.02)" : "scale(1)",
                zIndex: isHovered ? 10 : 1,
                cursor: "none",
                overflow: "hidden",
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              {f.src ? (
                <img 
                  src={f.src} 
                  alt={f.lbl}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: 0.8,
                  }} 
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: 'var(--border-subtle)' }} />
              )}
              
              <div style={{
                position: "absolute", left: 6, bottom: 4, fontSize: 9,
                letterSpacing: 1, color: "var(--text-75)",
              }}>{f.n}</div>
              
              <div style={{
                position: "absolute", right: 6, bottom: 4, fontSize: 8,
                letterSpacing: 1, color: "var(--text-45)",
              }}>{f.storyCat}</div>

              {(f.star || f.is_star === 1) && (
                <div style={{
                  position: "absolute", top: 4, right: 6,
                  color: "var(--accent-red)", fontSize: 18, lineHeight: 1,
                  fontFamily: 'var(--font-script)',
                }}>★</div>
              )}

              {isHovered && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85))",
                  display: "flex", alignItems: "flex-end", padding: 10,
                }}>
                  <div style={{ fontSize: 9, letterSpacing: 1, lineHeight: 1.4 }}>
                    <div style={{ opacity: 0.6, fontSize: 8, letterSpacing: 2 }}>▸ APRI STORIA</div>
                    <div style={{ marginTop: 3, color: "var(--text-primary)" }}>{f.lbl}</div>
                  </div>
                </div>
              )}
            </a>
          );
        })}

        {/* Tape Piece Decorators */}
        <div style={{
          position: "absolute", top: 2, left: "28%", width: 96, height: 28,
          background: "rgba(217,58,43,0.78)", transform: "rotate(-3deg)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)", pointerEvents: "none",
          zIndex: 20,
        }} />
        <div style={{
          position: "absolute", top: 6, right: "20%", width: 118, height: 28,
          background: "var(--tape-crema)", transform: "rotate(2deg)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)", pointerEvents: "none",
          zIndex: 20,
        }} />
      </main>

      {/* Footer */}
      <footer className="dotted-border-t" style={{
        position: "absolute",
        bottom: 0,
        left: 44,
        right: 44,
        height: "var(--footer-h)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 10,
        letterSpacing: 2,
        opacity: 0.75,
      }}>
        <span>◉ {initialSheet.filter(f => f.src).length} / 36 ESPOSTI</span>
        <span style={{ fontSize: 11, letterSpacing: 0.5 }}>
          <span style={{ color: "var(--accent-red)" }}>★</span>{" "}
          {hoveredStory ? (
            <span>{hoveredStory.title} — {hoveredStory.loc}, {hoveredStory.year}</span>
          ) : (
            <span style={{ opacity: 0.6 }}>PASSA SOPRA UN FOTOGRAMMA PER LEGGERE LA STORIA</span>
          )}
        </span>
        <span style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href={`mailto:${email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{email}</a>
          <a href="/admin/login" style={{ color: 'inherit', textDecoration: 'none', opacity: 0.3, fontSize: 9, letterSpacing: 2 }}>ADMIN</a>
        </span>
      </footer>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          {/* Image */}
          <div style={{ position: 'relative', maxWidth: '72vw', maxHeight: '84vh' }}
               onClick={e => e.stopPropagation()}>
            <img
              src={lightbox.frame.src}
              alt={lightbox.frame.lbl}
              style={{
                display: 'block', maxWidth: '100%', maxHeight: '84vh',
                objectFit: 'contain',
                boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
              }}
            />
            {/* Caption bar */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
              padding: '32px 24px 20px',
            }}>
              <div style={{ fontSize: 9, letterSpacing: 2.5, opacity: 0.55, marginBottom: 4 }}>
                {lightbox.frame.n} ∙ {lightbox.story?.cat}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, letterSpacing: -0.3, marginBottom: 4 }}>
                {lightbox.frame.lbl}
              </div>
              <div style={{ fontSize: 10, letterSpacing: 1.5, opacity: 0.55 }}>
                {lightbox.story?.title} — {lightbox.story?.loc}, {lightbox.story?.year}
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div style={{
            width: 260, padding: '0 0 0 40px', color: 'var(--text-primary)',
            display: 'flex', flexDirection: 'column', gap: 24,
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setLightbox(null)} style={{
              alignSelf: 'flex-end', background: 'none', border: '1px solid rgba(232,226,212,0.2)',
              color: 'var(--text-primary)', width: 32, height: 32, cursor: 'pointer', fontSize: 13,
            }}>✕</button>

            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, opacity: 0.4, marginBottom: 12 }}>◆ STORIA</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 26, letterSpacing: -0.5, lineHeight: 1.1 }}>
                {lightbox.story?.title}
              </div>
              <div style={{ fontSize: 10, letterSpacing: 2, opacity: 0.5, marginTop: 8 }}>
                {lightbox.story?.loc} ∙ {lightbox.story?.year}
              </div>
            </div>

            <a
              href={`/storie/${lightbox.frame.storySlug}`}
              style={{
                display: 'block', padding: '13px 20px', textAlign: 'center',
                background: 'var(--text-primary)', color: '#000',
                textDecoration: 'none', fontSize: 10, letterSpacing: 2.5,
                fontFamily: 'var(--font-mono)',
              }}
            >
              APRI STORIA →
            </a>

            <div style={{ fontSize: 9, letterSpacing: 1, opacity: 0.35, textAlign: 'center' }}>
              ESC per chiudere
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .home-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          grid-template-rows: repeat(4, 1fr);
        }
        @media (max-width: 1024px) {
          .home-grid {
            grid-template-columns: repeat(4, 1fr);
            grid-template-rows: repeat(6, 1fr);
          }
        }
        @media (max-width: 640px) {
          .home-grid {
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(8, 1fr);
          }
          .loupe-container {
            display: none !important;
          }
        }
      ` }} />
    </div>
  );
};
