# FRAMELIO — Launch checklist and monetization plan

## 1. Status actual

Aplicatia e deja foarte aproape de un MVP bun:

- compresie imagine local in browser
- compresie video local in browser
- drag & drop
- preseturi de dimensiune
- progres si rezultatul final
- download local
- styling modern si premium
- local-first, fara storage backend

## 2. Ce lipseste pentru un launch solid

### Functionalitate minim necesara pentru release
- custom target input numeric (de ex. 1.5 MB, 12 MB)
- multiple file upload / batch compress
- preview final pentru imagine + video info
- abilitatea de a salva preseturi personalizate
- suport pentru mai multe formate si mai multe platforme
- tipuri de export clar diferite (JPG/WebP/MP4)
- mesaj clar de eroare pentru browser incompatibil
- overwrite protection / filename handling mai robust
- state persistence in localStorage pentru ultimele setari

### Business / monetization
- Stripe checkout pentru Pro / lifetime access
- cont user optional pentru pro status
- API / serverless pentru validarea license-ului
- planuri: Free / Pro / Team
- limitare de utilizare pentru free vs pro

### Deploy si infrastructura
- Vercel project set-up
- config environment variables
- domain + custom branding
- analytics (Vercel + Plausible/GA4)
- privacy docs + terms
- legal pages: privacy policy, terms, cookies

## 3. Strategia recomandata de monetizare

### Modelul cel mai realist

1. Free tier
   - 2 compresii / zi
   - max 5 MB / file
   - preseturi standard

2. Pro lifetime — 5 EUR, plată unică
   - acces Pro pe viață
   - custom targets
   - preseturi premium pentru platforme sociale
   - fără reînnoire automată

### Cum se implementeaza corect

Din cauza faptului ca produsul este local-first, monetizarea reala necesita si un layer de verificare server-side.

Ce trebuie sa adaugi:
- Stripe checkout + webhook
- serverless endpoint: /api/checkout
- serverless endpoint: /api/portal
- serverless endpoint: /api/verify-license
- o baza de date minima (Supabase / Neon / PlanetScale / Firebase)
- un user record cu status Pro / expiration date

### Ce sa nu faci
- sa nu pretinzi ca "nu poti folosi fara abonament" daca totul ruleaza local in browser
- sa nu te bazezi doar pe localStorage pentru un produs premium de tip SaaS

### Solutie recomandata

Cel mai elegant echilibru este:
- app-ul ramane local-first pentru compresie
- premium status este gestionat de la server
- app-ul verifica statusul Pro la pornire si in anumite actiuni
- daca e free, se aplica limitari soft sau preseturi standard

## 4. Recomandare arhitecturala

### For first launch
- Vercel static frontend
- Stripe for payments
- Supabase Auth + Postgres
- optional Vercel Edge Functions pentru license validation

### Minimal stack
- Frontend: Vite + static app
- Auth: Supabase Auth
- Billing: Stripe
- DB: Supabase Postgres
- Analytics: Plausible / GA4

## 5. Functionalitati de adaugat pentru a avea un produs mai complet

### A. Platform presets

Pentru Instagram, Discord, TikTok, WhatsApp etc. va fi foarte bine sa ai:
- preseturi de dimensiune propuse pentru fiecare platforma
- hover hint / explainers: de ce acea limita este buna
- save as default

### B. Custom target

Un input numeric recomandat:
- 300 KB
- 1 MB
- 2 MB
- 5 MB
- 10 MB
- 25 MB

### C. Batch mode
- select multiple files at once
- compress all in one action
- zip result optional

### D. Better UX
- fade/transitions light
- empty state with examples
- tips/fallback messaging
- result history in browser

## 6. Checklist pentru deploy

### Frontend deployment
- [ ] Vercel project created
- [ ] domain assigned
- [ ] build passes in production
- [ ] static assets in dist
- [ ] custom metadata + OG preview

### Security and legal
- [ ] privacy policy page
- [ ] terms of service page
- [ ] cookie banner if needed
- [ ] contact/support page
- [ ] refund policy if selling subscriptions

### Payment setup
- [ ] Stripe account created
- [ ] product + pricing configured
- [ ] webhook endpoint active
- [ ] success / cancel page created
- [ ] fallback for failed payment

### Analytics and tracking
- [ ] GA4 or Plausible configured
- [ ] conversion events for start compression / checkout / pro upgrade
- [ ] error monitoring (Sentry optional)

## 7. Ce trebuie sa faci tu personal

### Immediate (in order)
1. Create Vercel project and connect repo.
2. Configure production domain.
3. Set Stripe account and create Pro plan.
4. Create Supabase project.
5. Add auth + user table for pro status.
6. Add Protect API endpoints for license validation.
7. Add free vs pro feature gating in frontend.
8. Add legal pages.
9. Add analytics and basic tracking.
10. Test full flow end-to-end.

## 8. Simplified launch recommendation

Daca vrei sa lansezi rapid si sa nu te complici prea mult:

- primary offer: Pro lifetime 5 EUR, one-time payment
- free tier: limitat
- paid flow: Stripe checkout + webhook + local verification
- product positioning: premium social size optimizer for creators

## 9. Positioning recomandat

Branding-ul ideal pentru acest tip de tool:
- luxury minimal
- creator-first
- fast and premium
- built for content creators, community managers, ecommerce teams

## 10. Suggested naming direction

Mai degraba decat un brand generic, ai nevoie de un nume premium care transmite utilitatea si calitatea. Exemple:
- FRAMELIO
- FITSTUDIO
- SIZEFLOW
- QUICKFRAME
- RATIO
- COMPRESSA

## 11. Final recommendation

Cel mai bun plan pentru acest proiect:

- pastrezi frontend local-first
- transformi premium status intr-un produs cu Stripe + Supabase
- menții UX minimal luxury cu preseturi specifice pentru platforme
- lansezi ca tool premium pentru content creators, nu ca simplu utilitar gratuit

Daca vrei, pot continua si fac urmatorul pas practic:

1. pregatesc un plan exact de implementare pentru Stripe + Supabase
2. fac o versiune de landing page premium
3. adaug o schema de billing/pro features in app
4. pregatesc deploy-ul pentru Vercel
