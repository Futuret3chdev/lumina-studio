# Lumina

Cinematic 3D asset studio in the browser. Stage cars, houses, trees, furniture, and props under studio lighting, then export a PNG render or a GLB model for games.

## Try it

- Drag to orbit, scroll to zoom
- Pick an asset from the left rail
- Tune color, metal, roughness, and shape
- Switch stage lighting (Studio, Sunset, Night, City…)
- Export PNG or GLB, or save to the local gallery

## Local

```bash
npm install
npm run dev
```

Open the URL Vite prints (this sandbox uses port 8080).

```bash
npm run build
npm run typecheck
```

## Stack

React 19, TanStack Start, Three.js, React Three Fiber, Tailwind v4.

Auth and database are off. Gallery state lives in `localStorage`.
