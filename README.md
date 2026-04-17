# Giuseppe Lupo — Portfolio Fotografico

Portfolio fotografico personale in stile museum/contact-sheet con dashboard admin integrata, gestione storie fotografiche e servizio richieste stampa fine art.

---

## Anteprima

Il sito si presenta come un **provino fotografico** (contact sheet 6×4) da cui ogni fotogramma apre una storia. L'estetica è ispirata alle stampe da laboratorio: font monospaziato, grana cinematografica, accenti rosso Leica.

---

## Funzionalità

### Sito pubblico
- **Contact sheet** interattiva (griglia 6×4) con hover e lightbox
- **Pagine storia** con slideshow auto-avanzante, pausa al clic, barra di progresso
- **Dati EXIF** tecnici per ogni fotogramma (camera, obiettivo, esposizione)
- **Mappa interattiva** con posizione GPS estratta dall'EXIF
- **Richiesta stampa fine art** — modale con formati e carte configurabili, notifica email automatica e pagina di conferma dedicata
- Cursore a lente personalizzato sulla home
- Link ADMIN discreto nel footer

### Dashboard admin (`/admin`)
- Creazione e gestione storie fotografiche
- Upload foto con anteprima thumbnail + EXIF client-side, drag & drop
- **Riordinamento fotogrammi** via drag-and-drop
- Gestione richieste stampa con aggiornamento stato e eliminazione
- Impostazioni: profilo, servizio stampa, configurazione SMTP per notifiche email
- Autenticazione con password hashata bcrypt (auto-upgrade da testo in chiaro)

---

## Tecnologie utilizzate

| Categoria | Tecnologia |
|---|---|
| Framework | [Astro 6](https://astro.build) — SSR con Node adapter |
| UI interattiva | [React 19](https://react.dev) |
| Database | [SQLite](https://sqlite.org) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Mappe | [Leaflet](https://leafletjs.com) + [React-Leaflet](https://react-leaflet.js.org) |
| EXIF | [exifr](https://github.com/MikeKovarik/exifr) (server e browser) |
| Email | [Nodemailer](https://nodemailer.com) |
| Auth | [bcryptjs](https://github.com/dcodeIO/bcrypt.js) |
| Linguaggio | TypeScript (strict) |
| Runtime | Node.js ≥ 22.12.0 |

---

## Struttura del progetto

```
src/
├── components/
│   ├── HomeSheet.tsx        # Griglia home con lightbox
│   ├── StoryPage.tsx        # Slideshow storia + modale stampa
│   ├── LocationMap.tsx      # Mappa Leaflet
│   └── LoupeCursor.tsx      # Cursore a lente
├── layouts/
│   └── BaseLayout.astro     # Layout globale, font, film grain
├── lib/
│   ├── db.ts                # Database SQLite, schema, seed
│   └── auth.ts              # Autenticazione session cookie + bcrypt
├── pages/
│   ├── index.astro          # Home (contact sheet)
│   ├── storie/[slug].astro  # Pagina storia pubblica
│   ├── stampa/conferma.astro # Conferma richiesta stampa
│   ├── api/
│   │   └── print-request.ts # API richieste stampa (POST)
│   └── admin/
│       ├── login.astro
│       ├── dashboard.astro
│       ├── settings.astro
│       └── storia/[id].astro
└── styles/
    └── tokens.css           # Design tokens (colori, font, spaziature)

public/
└── photos/                  # Foto caricate (escluse da git)
```

---

## Installazione locale

### Prerequisiti
- Node.js **≥ 22.12.0** ([scarica qui](https://nodejs.org))
- npm

### Avvio

```bash
# 1. Clona il repository
git clone https://github.com/giuseppelupo1979/sito-photo.git
cd sito-photo

# 2. Installa le dipendenze
npm install

# 3. Avvia il server di sviluppo
npm run dev
```

Il sito sarà disponibile su **http://localhost:4321**

Il database SQLite (`database.sqlite`) viene **creato automaticamente** al primo avvio con dati di esempio (3 storie, 5 fotogrammi, impostazioni predefinite).

### Credenziali admin predefinite

```
URL:       http://localhost:4321/admin/login
Password:  Admin123!
```

> **Cambia subito la password** dal pannello Impostazioni dopo il primo accesso. Verrà hashata automaticamente con bcrypt.

---

## Configurazione

Tutte le impostazioni sono gestibili dalla dashboard admin (`/admin/settings`) senza toccare il codice:

| Impostazione | Descrizione |
|---|---|
| Email pubblica | Email mostrata sul sito e destinazione notifiche |
| Instagram handle | Link Instagram nell'header |
| Password admin | Hashata con bcrypt (12 rounds) |
| Formati stampa | Uno per riga: `30×40 cm`, `40×60 cm`… |
| Tipi di carta | Uno per riga: `Baryta`, `Cotton Rag`… |
| Copie per edizione | Numero di copie dell'edizione limitata |
| SMTP | Host, porta, utente e App Password per le notifiche email |

### Notifiche email (opzionale)

Per ricevere un'email ad ogni richiesta di stampa, configura SMTP nelle impostazioni. Esempio con Gmail:

```
Host:     smtp.gmail.com
Porta:    587
Utente:   tuo@gmail.com
Password: [App Password Gmail — non la password principale]
```

---

## Deploy su server VPS / Ubuntu

### Prerequisiti server
- Ubuntu 22.04+
- Node.js ≥ 22 installato
- [PM2](https://pm2.keymetrics.io) per il processo persistente
- Nginx come reverse proxy (opzionale ma consigliato)

### 1. Build del progetto

```bash
npm run build
```

Genera la cartella `dist/` con il server standalone.

### 2. Carica sul server

```bash
# Copia i file sul server (esempio con rsync)
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='database.sqlite' \
  ./ utente@tuo-server.com:/var/www/sito-photo/

# Sul server: installa le dipendenze di produzione
ssh utente@tuo-server.com
cd /var/www/sito-photo
npm install --omit=dev
```

### 3. Avvia con PM2

```bash
# Installa PM2 globalmente (se non presente)
npm install -g pm2

# Avvia il server
pm2 start dist/server/entry.mjs --name "sito-photo" -- --host 0.0.0.0 --port 3000

# Avvio automatico al riavvio del server
pm2 save
pm2 startup
```

### 4. Configura Nginx come reverse proxy

```nginx
server {
    listen 80;
    server_name tuodominio.it www.tuodominio.it;

    # Limite upload foto
    client_max_body_size 50M;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Serve le foto direttamente da Nginx (più efficiente)
    location /photos/ {
        alias /var/www/sito-photo/public/photos/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5. HTTPS con Let's Encrypt (consigliato)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tuodominio.it -d www.tuodominio.it
```

### 6. Permessi cartella foto

```bash
mkdir -p /var/www/sito-photo/public/photos
chown -R $USER:$USER /var/www/sito-photo/public/photos
```

### Variabili d'ambiente (opzionale)

Crea un file `.env` nella root per la modalità produzione:

```env
NODE_ENV=production
PORT=3000
```

---

## Deploy su Railway / Render / Fly.io

Il progetto usa l'**adapter Node standalone** quindi è compatibile con qualsiasi piattaforma che supporti Node.js.

### Railway (il più semplice)

1. Crea un progetto su [railway.app](https://railway.app)
2. Collega il repository GitHub
3. Railway rileva automaticamente Astro e configura il build
4. Aggiungi le variabili d'ambiente se necessario

> **Nota:** Il database SQLite viene rigenerato ad ogni deploy su piattaforme stateless. Per dati persistenti usa un **volume** o migra a PostgreSQL.

---

## Aggiornamenti e manutenzione

```bash
# Aggiorna le dipendenze
npm update

# Stato del processo su server
pm2 status
pm2 logs sito-photo

# Riavvia dopo aggiornamento
pm2 restart sito-photo
```

---

## Note sulla sicurezza

- Password admin hashata con **bcrypt 12 rounds**, auto-upgrade da testo in chiaro al primo login
- Cookie di sessione `httpOnly`, `sameSite: lax`, `secure` in produzione
- Credenziali SMTP salvate nel database locale, mai nel codice
- Database SQLite escluso da git
- Foto caricate escluse da git

---

## Licenza

Codice rilasciato sotto licenza **MIT**. Le fotografie sono di proprietà esclusiva di Giuseppe Lupo — tutti i diritti riservati.
