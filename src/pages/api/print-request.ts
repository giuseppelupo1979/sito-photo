import type { APIRoute } from 'astro';
import db, { getSettings } from '../../lib/db';
import nodemailer from 'nodemailer';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { frameSrc, frameLbl, storyTitle, storyId, name, email, size, paper, notes } = body;

    if (!frameSrc || !storyTitle || !storyId || !name || !email || !size || !paper) {
      return new Response(JSON.stringify({ error: 'Campi obbligatori mancanti.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    db.prepare(`
      INSERT INTO print_requests (frame_src, frame_lbl, story_title, story_id, name, email, size, paper, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(frameSrc, frameLbl ?? '', storyTitle, storyId, name, email, size, paper, notes ?? '');

    // Send email notification if SMTP is configured
    const cfg = getSettings();
    if (cfg.smtp_host && cfg.smtp_user && cfg.smtp_pass) {
      try {
        const transporter = nodemailer.createTransport({
          host: cfg.smtp_host,
          port: parseInt(cfg.smtp_port || '587'),
          secure: parseInt(cfg.smtp_port || '587') === 465,
          auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
        });

        await transporter.sendMail({
          from: `"Giuseppe Lupo — Sito" <${cfg.smtp_user}>`,
          to: cfg.notify_email || cfg.email,
          subject: `📷 Nuova richiesta stampa: ${storyTitle}`,
          html: `
            <div style="font-family:monospace;font-size:13px;color:#111;max-width:520px">
              <h2 style="font-size:18px;margin-bottom:4px">Nuova richiesta stampa fine art</h2>
              <p style="opacity:0.6;margin:0 0 24px">${new Date().toLocaleString('it-IT')}</p>

              <table style="border-collapse:collapse;width:100%">
                <tr><td style="padding:6px 0;opacity:0.5;width:120px">STORIA</td><td>${storyTitle}</td></tr>
                <tr><td style="padding:6px 0;opacity:0.5">FOTOGRAMMA</td><td>${frameLbl || '—'}</td></tr>
                <tr><td style="padding:6px 0;opacity:0.5">NOME</td><td>${name}</td></tr>
                <tr><td style="padding:6px 0;opacity:0.5">EMAIL</td><td><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding:6px 0;opacity:0.5">FORMATO</td><td>${size}</td></tr>
                <tr><td style="padding:6px 0;opacity:0.5">CARTA</td><td>${paper}</td></tr>
                ${notes ? `<tr><td style="padding:6px 0;opacity:0.5">NOTE</td><td style="font-style:italic">${notes}</td></tr>` : ''}
              </table>

              <div style="margin-top:24px;padding-top:16px;border-top:1px solid #ddd;font-size:11px;opacity:0.5">
                Gestisci le richieste dalla dashboard admin del tuo sito.
              </div>
            </div>
          `,
        });
      } catch (mailErr) {
        console.error('[print-request] email send failed:', mailErr);
        // Don't fail the request if email fails — request is already saved in DB
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Errore interno del server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
