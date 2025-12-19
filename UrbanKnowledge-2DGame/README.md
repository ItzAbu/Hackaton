# UrbanKnowledge — 2D Game (Phaser 3)

## Requisiti
- Node.js (consigliato 18+)
- npm (incluso con Node)

## Installazione
```bash
npm install
```

## Avvio in sviluppo
```bash
npm run dev
```
Apri l'URL mostrato da Vite (di solito http://localhost:5173).

## Build produzione
```bash
npm run build
```
Output in `dist/`.

## Librerie / Moduli usati
- Phaser 3 (game framework)
- Vite (dev server + build)

## Note integrazione nel sito
- In produzione puoi copiare `dist/` nelle static di Django e servire `index.html` come pagina del gioco,
  oppure includere il gioco in una route dedicata.
