import React, { useState, useEffect } from 'react';
import { LocationMap } from './LocationMap';

interface Props {
  story: any;
  email: string;
  igHandle: string;
  printSizes: string[];
  printPapers: string[];
  printEdition: string;
  printResponseTime: string;
  printIntro: string;
}

type PrintForm = { name: string; email: string; size: string; paper: string; notes: string };
type PrintStatus = 'idle' | 'sending' | 'sent' | 'error';

export const StoryPage: React.FC<Props> = ({ story, email, igHandle, printSizes, printPapers, printEdition, printResponseTime, printIntro }) => {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [printForm, setPrintForm] = useState<PrintForm>({ name: '', email: '', size: printSizes[0] ?? '30×40 cm', paper: printPapers[0] ?? 'Baryta', notes: '' });
  const [printStatus, setPrintStatus] = useState<PrintStatus>('idle');

  const frames = story.frames || [];
  const currentFrame = frames[idx] || {};
  
  // Parse EXIF from database JSON string
  const exif = currentFrame.camera_data ? JSON.parse(currentFrame.camera_data) : null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (paused || !mounted || frames.length === 0) return;

    const interval = 10; // ms
    const duration = 6000; // 6s
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setIdx((i) => (i + 1) % frames.length);
          return 0;
        }
        return p + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [paused, frames.length, idx, mounted]);

  async function submitPrintRequest(e: React.FormEvent) {
    e.preventDefault();
    setPrintStatus('sending');
    try {
      const res = await fetch('/api/print-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frameSrc: currentFrame.src,
          frameLbl: currentFrame.lbl,
          storyTitle: story.title,
          storyId: story.id,
          ...printForm,
        }),
      });
      if (res.ok) {
        const params = new URLSearchParams({
          name: printForm.name,
          story: story.title,
          size: printForm.size,
          paper: printForm.paper,
        });
        window.location.href = `/stampa/conferma?${params}`;
        return;
      }
      setPrintStatus('error');
    } catch {
      setPrintStatus('error');
    }
  }

  const next = () => {
    setIdx((idx + 1) % frames.length);
    setProgress(0);
  };

  const prev = () => {
    setIdx((idx - 1 + frames.length) % frames.length);
    setProgress(0);
  };

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100vh',
      background: 'var(--bg-story)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    }}>
      {/* LEFT — Image Pane (64%) */}
      <div style={{
        flex: '0 0 64%',
        position: 'relative',
        borderRight: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        cursor: paused ? 'zoom-in' : 'pause',
      }} onClick={() => setPaused(!paused)}>
        
        {/* Vignette Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.55) 100%)',
          zIndex: 5,
          pointerEvents: 'none'
        }} />

        {/* Image */}
        <div key={idx} style={{
          width: '100%',
          height: '100%',
          animation: 'story-fade 1.1s ease-out',
        }}>
          {currentFrame.src ? (
            <img 
              src={currentFrame.src} 
              alt={currentFrame.lbl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#111' }} />
          )}
        </div>

        {/* Museum Caption */}
        <div style={{
          position: 'absolute',
          left: 44,
          bottom: 56,
          maxWidth: 520,
          zIndex: 10,
        }}>
          <div style={{ fontSize: 10, letterSpacing: 3, opacity: 0.55, textTransform: 'uppercase' }}>
            {currentFrame.n} ∙ {story.cat}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 40,
            letterSpacing: -0.6,
            lineHeight: 1.12,
            margin: '8px 0',
          }}>
            {currentFrame.lbl}
          </h2>
          <div style={{ fontSize: 11, letterSpacing: 1.5, opacity: 0.65 }}>
            {story.loc} ∙ {story.year} ∙ GELATINA D'ARGENTO, BARITATA 30×45 CM
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          position: 'absolute',
          left: 44,
          right: 44,
          bottom: 32,
          height: 1,
          background: 'var(--text-14)',
          zIndex: 10,
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'var(--text-primary)',
            transition: paused ? 'none' : 'width 0.01s linear',
          }} />
        </div>

        {/* Technical EXIF Drawer (Improvement #7) */}
        <div className="exif-trigger" style={{
          position: 'absolute',
          top: 32,
          right: 32,
          zIndex: 20,
        }} onClick={(e) => e.stopPropagation()}>
          <div className="exif-panel" style={{
            background: 'rgba(20,18,16,0.95)',
            border: '1px solid var(--border-subtle)',
            padding: '16px 20px',
            color: 'var(--text-primary)',
            fontSize: 10,
            letterSpacing: 1.5,
            width: 240,
            opacity: 0,
            transform: 'translateY(-10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'none',
          }}>
            <div style={{ opacity: 0.5, marginBottom: 12, letterSpacing: 3 }}>◆ TECHNICAL DATA</div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px 0' }}>
              <span style={{ opacity: 0.5 }}>CAMERA</span>
              <span>{exif?.Model || 'Leica M11'}</span>
              
              <span style={{ opacity: 0.5 }}>LENS</span>
              <span>{exif?.LensModel || 'Summilux 35mm f/1.4'}</span>
              
              <span style={{ opacity: 0.5 }}>EXPOSURE</span>
              <span>{exif?.ExposureTime ? `1/${Math.round(1/exif.ExposureTime)}s` : '1/250s'} ∙ f/{exif?.FNumber || '4.0'} ∙ ISO {exif?.ISO || '400'}</span>
              
              <span style={{ opacity: 0.5 }}>FILM</span>
              <span>Tri-X 400 Simulation</span>
            </div>
          </div>
          <div className="exif-button" style={{
            width: 28, height: 28,
            border: '1px solid rgba(232,226,212,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 12, marginLeft: 'auto',
            background: 'transparent', color: 'var(--text-primary)',
          }} title="Technical Data">T</div>
        </div>

        {/* Controls */}
        <div style={{
          position: 'absolute',
          top: 32,
          right: 76,
          display: 'flex',
          gap: 0,
          zIndex: 10,
        }} onClick={(e) => e.stopPropagation()}>
          <button onClick={prev} style={btnStyle}>←</button>
          <div style={{ 
            padding: '0 12px', height: 28, display: 'flex', alignItems: 'center', 
            border: '1px solid rgba(232,226,212,0.25)', borderLeft: 'none', borderRight: 'none',
            fontSize: 10, letterSpacing: 1,
          }}>
            {String(idx + 1).padStart(2, '0')} / {String(frames.length).padStart(2, '0')}
          </div>
          <button onClick={next} style={btnStyle}>→</button>
        </div>

        {paused && (
          <div style={{
            position: 'absolute', top: 32, left: 32,
            background: 'var(--accent-red)', color: 'white',
            fontSize: 10, padding: '4px 8px', letterSpacing: 1,
            zIndex: 10,
          }}>
            ◼ PAUSA — CLICK PER RIPRENDERE
          </div>
        )}
      </div>

      {/* RIGHT — Info Pane (36%) */}
      <div style={{
        flex: '1',
        padding: '40px 44px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minWidth: 420,
      }}>
        <div className="info-top">
          <a href="/" style={{
            display: 'inline-block',
            padding: '8px 16px',
            border: '1px solid rgba(232,226,212,0.3)',
            color: 'var(--text-primary)',
            fontSize: 10,
            letterSpacing: 2.5,
            textDecoration: 'none',
          }}>← TORNA AL PROVINO</a>
          
          <div style={{ marginTop: 42, fontSize: 10, letterSpacing: 3, opacity: 0.6 }}>
            STORIA ∙ {story.id}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 44,
            letterSpacing: -1,
            lineHeight: 1.05,
            margin: '14px 0',
          }}>
            {story.title}
          </h1>
          <div style={{ fontSize: 11, letterSpacing: 2, opacity: 0.6, textTransform: 'uppercase' }}>
            {story.loc} ∙ {story.year} ∙ {story.cat}
          </div>
          <p style={{
            marginTop: 28,
            fontSize: 13,
            lineHeight: 1.75,
            opacity: 0.82,
            maxWidth: 460,
          }}>
            {story.blurb}
          </p>

          {mounted && story.lat && story.lng && (
            <LocationMap lat={story.lat} lng={story.lng} />
          )}
        </div>

        <div className="info-middle" style={{ marginTop: 'auto', paddingBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: 2.5, opacity: 0.5, marginBottom: 12 }}>
            ◆ FOTOGRAMMI ({frames.length})
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(frames.length, 8)}, 1fr)`,
            gap: 6,
            height: 56,
          }}>
            {frames.map((f, i) => (
              <div
                key={i}
                onClick={() => { setIdx(i); setProgress(0); }}
                style={{
                  border: i === idx ? '1px solid var(--text-primary)' : '1px solid rgba(232,226,212,0.15)',
                  opacity: i === idx ? 1 : 0.55,
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                {f.src && <img src={f.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="info-bottom" style={{
          borderTop: '1px solid rgba(255,255,255,0.1)',
          paddingTop: 20,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '8px 0', fontSize: 11 }}>
            <span style={{ opacity: 0.5 }}>STAMPA</span>
            <span>
              Edizione limitata ∙ {printEdition} copie ∙{' '}
              <span
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => { setPrintOpen(true); setPrintStatus('idle'); }}
              >richiedi →</span>
            </span>
            
            <span style={{ opacity: 0.5 }}>LICENZA</span>
            <span>Editoriale/Commerciale ➔</span>
            
            <span style={{ opacity: 0.5 }}>EMAIL</span>
            <span><a href={`mailto:${email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{email}</a></span>
            
            <span style={{ opacity: 0.5 }}>IG</span>
            <span><a href={`https://instagram.com/${igHandle.replace('@','')}`} target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>{igHandle}</a></span>
          </div>
        </div>
      </div>

      {/* Print Request Modal */}
      {printOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setPrintOpen(false)}>
          <div style={{
            background: 'var(--bg-story)', border: '1px solid var(--border-subtle)',
            width: '100%', maxWidth: 520, padding: '40px 44px',
            position: 'relative',
          }} onClick={e => e.stopPropagation()}>

            <button onClick={() => setPrintOpen(false)} style={{
              position: 'absolute', top: 20, right: 20,
              background: 'none', border: 'none', color: 'var(--text-45)',
              fontSize: 14, cursor: 'pointer', padding: '4px 8px',
            }}>✕</button>

            <div style={{ fontSize: 9, letterSpacing: 3, opacity: 0.5, marginBottom: 8 }}>◆ RICHIESTA STAMPA FINE ART</div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, letterSpacing: -0.5, margin: '0 0 6px' }}>
              {currentFrame.lbl || story.title}
            </h2>
            <div style={{ fontSize: 10, letterSpacing: 1.5, opacity: 0.5, marginBottom: printIntro ? 12 : 32 }}>
              {story.title} ∙ {story.loc} ∙ {story.year}
            </div>
            {printIntro && (
              <div style={{ fontSize: 11, lineHeight: 1.65, opacity: 0.6, marginBottom: 28 }}>{printIntro}</div>
            )}

            {printStatus === 'sent' ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 24, marginBottom: 16 }}>✓</div>
                <div style={{ fontSize: 13, lineHeight: 1.7 }}>
                  Richiesta inviata.<br />
                  <span style={{ opacity: 0.6 }}>Ti risponderemo a <strong>{printForm.email}</strong> al più presto.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={submitPrintRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={fieldRowStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>NOME *</label>
                    <input style={inputStyle} required value={printForm.name}
                      onChange={e => setPrintForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>EMAIL *</label>
                    <input style={inputStyle} type="email" required value={printForm.email}
                      onChange={e => setPrintForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                </div>

                <div style={fieldRowStyle}>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>FORMATO *</label>
                    <select style={inputStyle} value={printForm.size}
                      onChange={e => setPrintForm(f => ({ ...f, size: e.target.value }))}>
                      {printSizes.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={fieldGroupStyle}>
                    <label style={labelStyle}>CARTA *</label>
                    <select style={inputStyle} value={printForm.paper}
                      onChange={e => setPrintForm(f => ({ ...f, paper: e.target.value }))}>
                      {printPapers.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={labelStyle}>NOTE</label>
                  <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                    placeholder="Numero di copie, dedica, spedizione…"
                    value={printForm.notes}
                    onChange={e => setPrintForm(f => ({ ...f, notes: e.target.value }))} />
                </div>

                {printStatus === 'error' && (
                  <div style={{ fontSize: 11, color: 'var(--accent-red)', letterSpacing: 1 }}>
                    Errore nell'invio. Riprova o scrivi a {email}.
                  </div>
                )}

                <button type="submit" disabled={printStatus === 'sending'} style={{
                  background: 'var(--text-primary)', color: '#000', border: 'none',
                  padding: '14px', fontFamily: 'var(--font-mono)', fontSize: 11,
                  letterSpacing: 2, cursor: printStatus === 'sending' ? 'wait' : 'pointer',
                  marginTop: 8,
                }}>
                  {printStatus === 'sending' ? 'INVIO IN CORSO…' : 'INVIA RICHIESTA'}
                </button>

                <div style={{ fontSize: 9, opacity: 0.4, letterSpacing: 1, textAlign: 'center' }}>
                  Edizione limitata a {printEdition} esemplari numerati e firmati. Risposta {printResponseTime}.
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes story-fade {
          0% { opacity: 0; transform: scale(1.015); }
          100% { opacity: 1; transform: scale(1); }
        }
        .exif-trigger:hover .exif-panel {
          opacity: 1 !important;
          transform: translateY(12px) !important;
          pointer-events: auto !important;
        }
        .exif-button:hover {
          background: rgba(232,226,212,0.1) !important;
        }
      ` }} />
    </div>
  );
};

const fieldRowStyle: React.CSSProperties = { display: 'flex', gap: 16 };
const fieldGroupStyle: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 };
const labelStyle: React.CSSProperties = { fontSize: 9, letterSpacing: 2, opacity: 0.45 };
const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
  padding: '10px 12px',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(232,226,212,0.25)',
  color: 'var(--text-primary)',
  width: 32,
  height: 28,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
};
