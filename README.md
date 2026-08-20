# FRAMELIO

Un MVP local-first pentru comprimarea de imagini și videoclipuri la o dimensiune țintă. Nu are backend, conturi, API-uri, bază de date sau storage extern.

## Rulează local

```bash
npm install
npm run dev
```

Prima rulare copiază motorul FFmpeg WebAssembly în `public/ffmpeg`. În producție, Vercel livrează aceste fișiere static; videoclipul utilizatorului nu este încărcat pe niciun server.

## Ce include MVP-ul

- Imagini JPG, PNG și WebP (maximum 50 MB), cu export JPG sau WebP.
- Videoclipuri MP4, MOV și WebM (maximum 250 MB), cu export MP4 și compresie în două treceri în browser.
- Preseturi: 500 KB / 1 MB / 2 MB / 5 MB pentru imagini și 10 MB / 16 MB / 25 MB / 50 MB pentru video.
- Drag & drop, alegere de fișier, progres, comparație dimensiuni și download local.

## Limitări intenționate

- Rezultatul depinde de memorie, performanța dispozitivului și codec-ul suportat de browser. Videoclipurile mari pot dura câteva minute, mai ales pe telefon.
- Pentru video, folosește o versiune actuală de Chrome, Edge sau Firefox. Dacă motorul WebAssembly nu pornește în 45 de secunde, aplicația oprește procesul și afișează un mesaj clar, fără upload sau pierdere de fișier.
- Compresia video oferă download doar când rezultatul intră sub limita aleasă; pentru fișiere dificil de comprimat, alege o țintă mai mare.
- Nu sunt incluse PDF, audio, conturi sau plăți.

## Pregătire pentru deploy

Proiectul include acum endpointurile Vercel pentru Stripe și Supabase:

- `/api/checkout` creează o sesiune Stripe Checkout de tip plată unică pentru utilizatorul autentificat.
- `/api/webhook` sincronizează abonamentul în Supabase.
- `/api/verify-license` validează statusul Pro la pornirea aplicației.
- `supabase/schema.sql` creează profilul și triggerul pentru utilizatori noi.
- pagini de legal și success/cancel pentru checkout.

## Variabile de mediu recomandate

Copiază `.env.example` în `.env.local` și completează:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_REDIRECT_URL=http://localhost:5173/
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_PRO_PRICE_ID=
APP_URL=http://localhost:5173
```

## Configurare personală obligatorie

1. Creează un proiect Supabase și rulează `supabase/schema.sql` în SQL Editor.
2. Copiază URL-ul și anon key în Vercel ca `VITE_SUPABASE_URL` și `VITE_SUPABASE_ANON_KEY`.
3. Activează email auth în Supabase și setează URL-urile de redirect pentru domeniul final.
4. Creează în Stripe produsul „FRAMELIO Pro”, cu un preț one-time de **5 EUR** și copiază price ID în `STRIPE_PRO_PRICE_ID`.
5. Adaugă `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APP_URL` în Vercel; nu le prefixa cu `VITE_`.
6. După deploy, adaugă webhook Stripe la `https://framelio.online/api/webhook` pentru `checkout.session.completed` și `checkout.session.async_payment_succeeded`; copiază signing secret în `STRIPE_WEBHOOK_SECRET`.
7. Setează domeniul în Vercel și rulează `npm run build` înainte de deploy.
8. Adaugă analytics, datele reale ale firmei în paginile legal și o politică de refund înainte să încasezi. Emailul actual de suport este `frameliocontact@gmail.com`.

## Recomandare de monetizare

- Free: limitare de utilizare
- Pro lifetime: 5 EUR, plată unică

Produsul rămâne local-first pentru compresia efectivă, iar statusul Pro este verificat din server pentru a evita fraudele și abuzul.
