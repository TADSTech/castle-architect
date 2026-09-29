// Tiny A* over the 8x8 board. Cells are `row * GRID + col`.
import { GRID } from '../config/palette.js';

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/**
 * @param {number} start
 * @param {(cell:number)=>boolean} goalFn
 * @param {(cell:number)=>boolean} blocked   true = may not be ENTERED
 * @param {((cell:number)=>number)|null} cost extra cost to enter (null = 1)
 * @param {number} hx  heuristic anchor column
 * @param {number} hy  heuristic anchor row
 * @returns {number[]|null} path including `start`, or null
 */
export function findPath(start, goalFn, blocked, cost, hx, hy) {
  const N = GRID * GRID;
  if (goalFn(start)) return [start];

  const g = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  const open = [start];
  g[start] = 0;

  const h = (i) => {
    const dx = Math.abs((i % GRID) - hx);
    const dy = Math.abs(((i / GRID) | 0) - hy);
    return (dx + dy) * 1.0;
  };

  let found = -1;
  while (open.length) {
    let bi = 0;
    let best = Infinity;
    for (let i = 0; i < open.length; i++) {
      const f = g[open[i]] + h(open[i]);
      if (f < best) { best = f; bi = i; }
    }
    const cur = open.splice(bi, 1)[0];
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (goalFn(cur)) { found = cur; break; }

    const cx = cur % GRID, cy = (cur / GRID) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = cx + DIRS[d][0], ny = cy + DIRS[d][1];
      if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID) continue;
      const n = ny * GRID + nx;
      if (closed[n]) continue;
      if (blocked(n)) continue;
      const step = cost ? cost(n) : 1;
      const ng = g[cur] + step;
      if (ng < g[n]) {
        g[n] = ng;
        came[n] = cur;
        if (open.indexOf(n) === -1) open.push(n);
      }
    }
  }

  if (found === -1) return null;
  const path = [];
  let c = found;
  let guard = 0;
  while (c !== -1 && guard++ <= N + 2) {
    path.push(c);
    if (c === start) break;
    c = came[c];
  }
  path.reverse();
  return path[0] === start ? path : null;
}

/** Straight-line route used by flyers; they ignore the board entirely. */
export function linePath(from, to, isKeep) {
  const out = [from];
  let x = from % GRID, y = (from / GRID) | 0;
  const tx = to % GRID, ty = (to / GRID) | 0;
  let guard = 0;
  while ((x !== tx || y !== ty) && guard++ < 64) {
    const dx = tx - x, dy = ty - y;
    if (Math.abs(dx) > Math.abs(dy)) x += Math.sign(dx);
    else y += Math.sign(dy);
    if (x < 0 || y < 0 || x >= GRID || y >= GRID) break;
    const c = y * GRID + x;
    out.push(c);
    if (isKeep && isKeep(c)) break;
  }
  return out;
}
