# CLAUDE.md — Sito Photo (Giuseppe Lupo)

Questo file documenta l'architettura, le funzionalità e le istruzioni operative del progetto. Va aggiornato ad ogni modifica significativa.

---

## Dev server

```bash
npm run dev        # avvia su http://localhost:4322 (o porta libera successiva)
npm run build      # build di produzione
npm run preview    # anteprima del build
```

---

## Panoramica

Portfolio fotografico museum-style con dashboard admin. Il sito mostra le storie fotografiche di Giuseppe Lupo in formato contact sheet (griglia 6×4) e permette ai visitatori di richiedere stampe fine art.

**Stack:** Astro 6 + React 19 · SSR via Node adapter · SQLite (better-sqlite3) · TypeScript strict

---

## Struttura directory

```
src/
├── components/
│   ├── HomeSheet.tsx       — griglia home 6×4 con hover + loupe cursor
│   ├── StoryPage.tsx       — slideshow storia (split 64/36) + modale stampa
│   ├── LocationMap.tsx     — mappa Leaflet per coordinate EXIF
│   └── LoupeCursor.tsx     — cursore personalizzato a lente
├── layouts/
│   └── BaseLayout.astro    — layout globale, font, film grain
├── lib/
│   ├── db.ts               — init SQLite, schema, seed, getSettings()
│   └── auth.ts             — session cookie admin (checkPassword, setSession, isAuthenticated)
├── pages/
│   ├── index.astro                  — home (contact sheet)
│   ├── storie/[slug].astro          — pagina storia pubblica
│   ├── api/print-request.ts         — POST endpoint richieste stampa
│   └── admin/
│       ├── login.astro              — login admin
│       ├── logout.astro             — logout admin
│       ├── dashboard.astro          — gestione storie + richieste stampa
│       ├── settings.astro           — profilo, stampa, SMTP
│       └── storia/[id].astro        — editor fotogrammi storia
└── styles/
    └── tokens.css          — CSS variables (colori, font, spaziature)

public/photos/              — foto caricate tramite admin
database.sqlite             — database SQLite locale
```

---

## Database — schema

### `stories`
| colonna | tipo | note |
|---|---|---|
| `id` | TEXT PK | es. "LMP", "PLR" |
| `slug` | TEXT UNIQUE | URL-friendly |
| `cat` | TEXT | REPORTAGE / RITRATTO / VIAGGIO |
| `title` | TEXT | |
| `loc` | TEXT | es. "Lampedusa, IT" |
| `year` | INTEGER | |
| `blurb` | TEXT | testo narrativo |
| `lat` / `lng` | REAL | coordinate GPS da EXIF |
| `cover_src` | TEXT | path immagine copertina |
| `cover_angle` | INTEGER | default 0 |
| `cover_tone` | TEXT | default 'dark' |

### `frames`
| colonna | tipo | note |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `story_id` | TEXT FK → stories(id) | CASCADE DELETE |
| `n` | TEXT | numero fotogramma es. "01A" |
| `lbl` | TEXT | didascalia |
| `src` | TEXT | path es. "/photos/..." |
| `angle` | INTEGER | default 0 |
| `tone` | TEXT | default 'dark' |
| `is_star` | BOOLEAN | 1 = in evidenza |
| `camera_data` | TEXT | JSON EXIF (Model, LensModel, ExposureTime, FNumber, ISO) |

### `settings`
| colonna | tipo |
|---|---|
| `key` | TEXT PK |
| `value` | TEXT |

**Chiavi settings:**

| chiave | default | descrizione |
|---|---|---|
| `email` | hello@giuseppelupo.it | email pubblica |
| `ig_handle` | @giuseppelupo | handle Instagram |
| `admin_password` | Admin123! | password admin |
| `print_sizes` | 30×40 cm\n40×60 cm\n... | formati stampa (uno per riga) |
| `print_papers` | Baryta\nCotton Rag\n... | tipi carta (uno per riga) |
| `print_edition` | 8 | copie per edizione |
| `print_response_time` | entro 48 ore | testo tempo di risposta |
| `print_intro` | Ogni stampa è... | testo introduttivo modale |
| `smtp_host` | — | es. smtp.gmail.com |
| `smtp_port` | 587 | |
| `smtp_user` | — | email mittente |
| `smtp_pass` | — | App Password Gmail |
| `notify_email` | hello@giuseppelupo.it | destinatario notifiche stampa |
| `social_links` | — | URL extra (virgola-separati) |

### `print_requests`
| colonna | tipo | note |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `frame_src` | TEXT | path fotogramma richiesto |
| `frame_lbl` | TEXT | didascalia fotogramma |
| `story_title` | TEXT | titolo storia |
| `story_id` | TEXT | id storia |
| `name` | TEXT | nome cliente |
| `email` | TEXT | email cliente |
| `size` | TEXT | formato richiesto |
| `paper` | TEXT | tipo carta richiesto |
| `notes` | TEXT | note libere |
| `status` | TEXT | pending / contacted / confirmed / shipped / closed |
| `created_at` | TEXT | datetime('now') |

---

## Funzionalità pubbliche

- **Home (contact sheet):** griglia 6×4 di fotogrammi con hover che mostra titolo storia, loupe cursor personalizzato, link alla storia al clic
- **Pagina storia:** slideshow auto-avanzante (6s/frame), pausa al clic, progresso lineare, pannello info a destra con blurb + mappa + thumbnails
- **EXIF drawer:** pannello tecnico (camera, obiettivo, esposizione) attivato hovering sul pulsante "T"
- **Modale stampa fine art:** clic su "richiedi →" apre form con formati e carte configurabili da admin; conferma visiva dopo invio
- **Link ADMIN:** in fondo a destra nella home (footer), opacità ridotta (30%)

---

## Funzionalità admin

Tutte le pagine admin richiedono cookie `admin_session=authenticated`.

### Dashboard (`/admin/dashboard`)
- **Nuova storia:** form con titolo, categoria, luogo, anno → genera id e slug automatici
- **Carica fotogrammi:** upload multiplo con drag-and-drop, anteprima thumbnail ridimensionata via canvas (max 400×300), EXIF estratto client-side prima del caricamento, filtro MIME type esteso (jpeg/jpg/png/webp/heic)
- **Storie pubblicate:** lista con link GESTISCI / VEDI / ELIMINA
- **Richieste stampa:** tabella con miniatura, dati cliente, formato/carta, menu stato aggiornabile inline (il form invia nello stesso blocco POST per evitare doppia lettura del body)

### Editor storia (`/admin/storia/[id]`)
- Aggiorna metadati storia (titolo, cat, luogo, anno, blurb)
- Griglia fotogrammi: modifica numero, didascalia, stella, elimina singolo o multiplo

### Impostazioni (`/admin/settings`)
Tre sezioni in una grid 2 colonne:
1. **Profilo e contatti:** email, ig_handle, social_links, cambio password
2. **Servizio Stampa Fine Art:** testo intro, formati (textarea, uno per riga), tipi carta (textarea, uno per riga), copie edizione, tempo di risposta
3. **Notifiche Email (SMTP):** host, porta, utente, password app, email destinazione notifiche

La pagina usa `INSERT OR REPLACE` per upsert corretto di tutte le chiavi.

---

## Notifiche email per richieste stampa

Configurate nella sezione SMTP delle impostazioni. Se `smtp_host`, `smtp_user` e `smtp_pass` sono valorizzati, ad ogni richiesta di stampa viene inviata un'email HTML a `notify_email`. L'invio usa **nodemailer**. Se fallisce, la richiesta è comunque salvata nel DB e il visitatore riceve conferma.

Istruzioni Gmail: usare `smtp.gmail.com`, porta `587`, e una **App Password** (non la password principale).

---

## Dipendenze principali

| pacchetto | uso |
|---|---|
| `astro` + `@astrojs/react` + `@astrojs/node` | framework SSR |
| `better-sqlite3` | database SQLite sincrono |
| `exifr` | lettura EXIF (server e browser) |
| `nodemailer` + `@types/nodemailer` | invio email notifiche |
| `leaflet` + `react-leaflet` | mappa posizione storia |
| `bcryptjs` | installato ma non usato (placeholder per futuro hashing password) |
| `@types/node` | tipi TypeScript per Node.js |

---

## Design tokens (src/styles/tokens.css)

| variabile | valore | uso |
|---|---|---|
| `--bg-home` | `#141210` | sfondo home |
| `--bg-story` | `#08070a` | sfondo storia |
| `--bg-frame` | `#1a1714` | sfondo card/frame |
| `--text-primary` | `#e8e2d4` | testo principale |
| `--accent-red` | `#d93a2b` | rosso accento (stelle, errori, delete) |
| `--font-mono` | JetBrains Mono | font predefinito |
| `--font-serif` | Fraunces | titoli eleganti |
| `--header-h` / `--footer-h` | 108px / 90px | altezze layout home |

---

## Note tecniche importanti

- **formData si legge una sola volta:** in Astro il body HTTP può essere consumato una sola volta. Tutti i `if (action === '...')` devono stare nello stesso blocco `if (method === 'POST')` che chiama `formData`.
- **Query DB dopo il POST:** le query per visualizzare dati aggiornati vanno eseguite *dopo* il blocco POST, non prima.
- **Script Astro con import npm:** usare `<script>` senza attributi (Vite li processa). `<script type="module">` viene trattato come inline e non supporta import da pacchetti né TypeScript.
- **Thumbnail preview:** il client ridimensiona via canvas a max 400×300 prima di mostrare l'anteprima; il file originale viene inviato al server invariato.
- **@types/node:** installato come devDependency; `"types": ["node"]` aggiunto in tsconfig.json.

---

## Miglioramenti implementati

### 1. Lightbox sulla home (`HomeSheet.tsx`)
Clic su un fotogramma apre un overlay fullscreen con immagine ingrandita, didascalia, info storia e pulsante "APRI STORIA →". Chiusura con ESC o clic sul backdrop. La navigazione alla storia avviene solo dal pulsante esplicito dentro il lightbox.

### 2. Password admin con bcrypt (`auth.ts` + `settings.astro`)
`checkPassword()` legge l'hash dal DB via `getSettings()`. Se il valore inizia con `$2` usa `bcrypt.compare()`; se è testo in chiaro (legacy) confronta direttamente e auto-aggiorna l'hash a bcrypt-12 rounds. Il cambio password da impostazioni usa `bcrypt.hash(pwd, 12)` prima di salvare.

### 3. Drag-and-drop ordinamento fotogrammi (`storia/[id].astro` + `db.ts`)
Aggiunta colonna `order_idx INTEGER DEFAULT 0` via `ALTER TABLE` con try/catch (sicuro su DB esistenti). Back-fill automatico. Nell'editor storia ogni card ha una drag handle (⠿), usa HTML5 drag API. Al drop invia un form hidden `action=reorder_frames` con la lista ID nell'ordine corrente. Query `ORDER BY order_idx, id`.

### 4. Pagina conferma stampa (`/stampa/conferma`)
Nuova pagina `src/pages/stampa/conferma.astro` con checkmark animato, riepilogo richiesta (storia/formato/carta passati via query string), e 3 step illustrativi (conferma → produzione → spedizione). `StoryPage.tsx` dopo invio riuscito redirige con `window.location.href` invece di mostrare messaggio inline.

### 5. Slug duplicati (`dashboard.astro`)
Alla creazione storia: slug generato con regex `/[^a-z0-9]+/g → '-'`, poi loop che incrementa suffisso (`-2`, `-3`…) finché non è unico. Stesso controllo per l'ID a 3 lettere + numero. INSERT wrappato in try/catch con messaggio di errore visibile.

## Istruzioni future

*Questa sezione verrà aggiornata con ogni nuova indicazione ricevuta.*
