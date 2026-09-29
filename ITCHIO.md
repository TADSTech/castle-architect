# Castle Architect — Siege Lab · itch.io release notes

## Upload

1. itch.io → **Games** → **+ New project**.
2. **Upload file**: `castle-architect-siege-lab.zip` → tick **This file will be played in the browser**.
3. **Recommended viewport**: **760 × 1340** (portrait). Layout: **Fullscreen**, or **Responsive** if you prefer it to fit the window.
4. Tick **Mobile friendly** — it runs on touch as well as mouse.
5. Visibility: start as **draft/private**, playtest, then publish.

The zip is plain static files (`index.html` + `assets/`) built with relative paths, so it works from any itch.io URL and from `file://`-style hosts.

## Store copy

**Title:** Castle Architect — Siege Lab

**Tagline:** Design a castle. Watch it break. Find out why.

**Short description:**

> You are the royal architect. Eight pieces, one keep, and a siege that keeps
> coming back.
>
> Build your castle from walls, towers, moats, traps, gates and cannons —
> then press **START SIEGE** and watch the army walk into your design. Every
> wave is simulated: if there is a hole, they will find it; if there is a
> choke point, your towers will own it.
>
> The pieces interact in ways the game never lists for you. A wall flanked by
> walls holds twice as long. A tower on a wall reaches further. A cannon with
> nothing beside it is a very expensive rock. None of it is in a tutorial —
> you find it, and when you do, it tells you.
>
> - **BUILD** between waves with the gold you have
> - **OBSERVE** the siege and learn what your design actually does
> - **HOLD** five waves to unlock new pieces
> - **FAIL** and keep the legacy — unlocks and workshop upgrades persist
> - Procedural pixel art and an adaptive soundtrack that darkens as your Keep falls — no downloads, no accounts

**Tags:** `defense`, `tower-defense`, `pixel-art`, `building`, `sandbox`, `html5`, `singleplayer`, `short`

**Genre:** Strategy

**Controls:**

| | |
|---|---|
| Mouse / touch | tap a piece in the palette, tap a square on the board |
| `1`–`7` | select a piece (`Q` / `E` / `Tab` to cycle) |
| `WASD` / arrows | move the build cursor |
| `Enter` / `Space` | place, sell, repair — or fire the Royal Aid volley |
| `B` | start the siege |
| `X` / `R` | sell tool / repair tool |
| `Esc` | menu (or cancel an open dialog) |

**Screenshots to grab** (from `C:\Users\TADS\AppData\Local\Temp\opencode\smoke\`):

- `h-02-explainer2.png` — build phase with palette and a synergy firing
- `z-01-panel.png` — siege phase with the wave panel
- `01-menu.png` — title screen

## Custom music

The soundtrack is three tracks that crossfade with your Keep's health. Drop
your own files into `public/music/` using these exact names:

| File | Plays when |
|---|---|
| `game-music.mp3` | Keep at 50% HP or more |
| `game-music-low.mp3` | Keep below 50% HP |
| `game-music-critical.mp3` | Keep below 20% HP |

`.mp3` / `.ogg` / `.m4a` / `.wav` all work (same name, different ending —
`.mp3` is tried first). Missing files fall back along the chain
(calm → low → critical); an empty folder falls back to the built-in synth
drone, so the game is never silent. See `public/music/README.txt`.

The files are copied into `dist/` when you build, so **put them in place
before `bun run build`**.

## Rebuild before every upload

```powershell
bun run build
Compress-Archive -Path dist\* -DestinationPath castle-architect-siege-lab.zip -Force
```
