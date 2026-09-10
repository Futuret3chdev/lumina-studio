# Lumina

Cinematic 3D asset studio in the browser. Stage cars, houses, trees, furniture, and props under studio lighting, then export a PNG render or a GLB model for games.

**Repo:** [github.com/Futuret3chdev/lumina-studio](https://github.com/Futuret3chdev/lumina-studio)

## Try it

- **Take a photo** or upload one — Lumina sculpts it into a 3D relief
- Toggle **Wrap onto model** to skin a car, house, or prop with that shot
- Drag to orbit, scroll to zoom
- Pick an asset from the left rail
- Tune color, metal, roughness, and shape
- Switch stage lighting (Studio, Sunset, Night, City…)
- Export PNG or GLB, or save to the local gallery

## Deploy on Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Futuret3chdev/lumina-studio&project-name=futuret3ch-lumina&repository-name=lumina-studio)

Or: Vercel dashboard → **Add New** → **Project** → import `Futuret3chdev/lumina-studio` as a **new** project (do not attach it to an existing one).

If the repo does not appear in the import list, open [Vercel GitHub App permissions](https://github.com/settings/installations) and grant access to `lumina-studio`.

## Local

```bash
npm install
npm run dev
```

```bash
npm run build
npm run typecheck
```

## Stack

React 19, TanStack Start, Three.js, React Three Fiber, Tailwind v4.

Auth and database are off. Gallery state lives in `localStorage`.
