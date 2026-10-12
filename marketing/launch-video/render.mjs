// Render the QUAICU launch cuts to MP4.
//
//   node render.mjs --all                 render every cut (video + score)
//   node render.mjs --cut 9x16-15         render one cut (repeatable)
//   node render.mjs --all --stills        contact-sheet stills instead of video
//   node render.mjs --thumbs              YouTube thumbnail + Reels/Shorts cover
//   node render.mjs --all --score         compose the soundtrack only (.work/<cut>/score.wav)
//
// Options: --workers N (default 4), --guides (draw the 9:16 safe zone),
//          --music file.wav (use a licensed track instead of the composed score),
//          --no-audio, --at 1.5,3.2 (stills at these times).
//
// Each frame is a screenshot of the stage after window.seek(t), so frames
// are exact and the result is the same on every run.

import { chromium } from "playwright-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CUTS, VIDEO_CUTS, FPS } from "./src/cuts.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const OUT = path.join(HERE, "out");
const WORK = path.join(HERE, ".work");
const CHUNK = 150; // frames per encode chunk (5s)

// ---------- args ----------
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : d;
};
const optAll = (n) => argv.flatMap((a, i) => (a === n ? [argv[i + 1]] : []));
const workers = +opt("--workers", Math.min(4, os.cpus().length));
const cutsArg = flag("--all") ? VIDEO_CUTS : optAll("--cut");
const guides = flag("--guides");
const music = opt("--music", null);

// ---------- static server (repo root, so the page can load the brand logo) ----------
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".svg": "image/svg+xml" };
function serve() {
  const server = http.createServer((req, res) => {
    const p = path.normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT)) return res.writeHead(403).end();
    fs.readFile(file, (err, buf) => {
      if (err) return res.writeHead(404).end();
      res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
      res.end(buf);
    });
  });
  return new Promise((ok) => server.listen(0, "127.0.0.1", () => ok(server)));
}

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  if (fs.existsSync(base)) {
    const dirs = fs.readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort();
    for (const d of dirs.reverse()) {
      const p = path.join(base, d, "chrome-linux", "chrome");
      if (fs.existsSync(p)) return p;
    }
  }
  return undefined; // let playwright find its own
}

async function launch() {
  return chromium.launch({
    executablePath: chromePath(),
    args: ["--font-render-hinting=none", "--force-color-profile=srgb", "--disable-lcd-text", "--hide-scrollbars"],
  });
}

async function openCut(browser, base, cutId, extra = "") {
  const cut = CUTS[cutId];
  const [W, H] = cut.format === "16x9" ? [1920, 1080] : [1080, 1920];
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.error(`[${cutId}] page error:`, e.message));
  const url = `${base}/marketing/launch-video/src/index.html?cut=${cutId}${guides ? "&guides=1" : ""}${extra}`;
  await page.goto(url);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 30000 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(`[${cutId}] ${err}`);
  const meta = await page.evaluate(() => window.__meta);
  return { page, meta, W, H };
}

async function shot(page, t, W, H) {
  await page.evaluate((tt) => window.seek(tt), t);
  return page.screenshot({ type: "png", clip: { x: 0, y: 0, width: W, height: H } });
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")}\n${r.stderr}`);
  return r;
}

const X264 = [
  "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
  "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "6M", "-bufsize", "12M", "-profile:v", "high", "-level", "4.2",
  "-g", "30", "-bf", "2", "-x264-params", "aq-mode=3:aq-strength=0.9",
  "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
];

// ---------- video ----------
async function renderVideos(base) {
  fs.mkdirSync(OUT, { recursive: true });
  const jobs = [];
  const metas = {};
  {
    const b = await launch();
    for (const id of cutsArg) {
      const { page, meta } = await openCut(b, base, id);
      metas[id] = meta;
      await page.close();
      const dir = path.join(WORK, id);
      fs.rmSync(dir, { recursive: true, force: true });
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, "cues.json"), JSON.stringify(meta, null, 2));
      const frames = Math.round(meta.duration * FPS);
      for (let f0 = 0, i = 0; f0 < frames; f0 += CHUNK, i++) {
        jobs.push({ id, f0, f1: Math.min(frames, f0 + CHUNK), file: path.join(dir, `chunk-${String(i).padStart(3, "0")}.mp4`) });
      }
    }
    await b.close();
  }

  if (flag("--score")) {
    for (const id of cutsArg) {
      const dir = path.join(WORK, id);
      run("python3", [path.join(HERE, "audio", "compose.py"), "--cues", path.join(dir, "cues.json"), "--out", path.join(dir, "score.wav")], { stdio: ["ignore", "inherit", "pipe"] });
    }
    return;
  }

  const total = jobs.reduce((a, j) => a + j.f1 - j.f0, 0);
  let done = 0;
  const started = Date.now();
  const queue = [...jobs];

  async function worker() {
    const browser = await launch();
    let cur = null;
    while (queue.length) {
      const job = queue.shift();
      if (!cur || cur.id !== job.id) {
        if (cur) await cur.page.close();
        cur = { id: job.id, ...(await openCut(browser, base, job.id)) };
      }
      const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-", ...X264, job.file], { stdio: ["pipe", "inherit", "inherit"] });
      const closed = new Promise((ok, bad) => ff.on("close", (c) => (c === 0 ? ok() : bad(new Error("ffmpeg failed on " + job.file)))));
      for (let f = job.f0; f < job.f1; f++) {
        const buf = await shot(cur.page, f / FPS, cur.W, cur.H);
        if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once("drain", ok));
        done++;
        if (done % 60 === 0) {
          const s = (Date.now() - started) / 1000;
          process.stdout.write(`\r  frames ${done}/${total}  ${(done / s).toFixed(1)} fps  eta ${Math.round(((total - done) * s) / done)}s   `);
        }
      }
      ff.stdin.end();
      await closed;
    }
    await browser.close();
  }
  console.log(`Rendering ${cutsArg.join(", ")}: ${total} frames on ${workers} workers`);
  await Promise.all(Array.from({ length: workers }, worker));
  process.stdout.write("\n");

  for (const id of cutsArg) {
    const dir = path.join(WORK, id);
    const meta = metas[id];
    const chunks = jobs.filter((j) => j.id === id).map((j) => `file '${j.file}'`).join("\n");
    fs.writeFileSync(path.join(dir, "chunks.txt"), chunks);
    const video = path.join(dir, "video.mp4");
    run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "chunks.txt"), "-c", "copy", video]);

    const out = path.join(OUT, `quaicu-launch-${id.replace(/-(\d+)$/, "-$1s")}.mp4`);
    if (flag("--no-audio")) {
      run("ffmpeg", ["-y", "-loglevel", "error", "-i", video, "-c", "copy", "-movflags", "+faststart", out]);
    } else {
      const wav = music || path.join(dir, "score.wav");
      if (!music) {
        run("python3", [path.join(HERE, "audio", "compose.py"), "--cues", path.join(dir, "cues.json"), "--out", wav], { stdio: ["ignore", "inherit", "pipe"] });
      }
      mux(video, wav, out, meta.duration);
    }
    console.log("  wrote", path.relative(HERE, out));
  }
}

// Two-pass loudness normalisation to -14 LUFS (YouTube, Instagram and
// LinkedIn all normalise around there), true peak -1.5 dBTP, then mux.
function mux(video, wav, out, duration) {
  const target = "I=-14:TP=-1.5:LRA=11";
  const m = run("ffmpeg", ["-hide_banner", "-i", wav, "-t", String(duration), "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"]);
  const j = JSON.parse(m.stderr.slice(m.stderr.lastIndexOf("{")));
  const af =
    `loudnorm=${target}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}` +
    `:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`;
  run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", video, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
    "-af", af, "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-ac", "2",
    "-t", String(duration), "-movflags", "+faststart", out,
  ]);
}

// ---------- stills ----------
async function renderStills(base) {
  const b = await launch();
  const at = opt("--at", null);
  for (const id of cutsArg) {
    const { page, meta, W, H } = await openCut(b, base, id);
    const dir = path.join(WORK, "stills", id);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const times = at
      ? at.split(",").map(Number)
      : meta.scenes.flatMap((s) => [s.start + Math.min(0.9, s.dur * 0.3), s.start + s.dur * 0.82]);
    for (const t of times) {
      const buf = await shot(page, t, W, H);
      fs.writeFileSync(path.join(dir, `t${t.toFixed(2).padStart(6, "0")}.png`), buf);
    }
    await page.close();
    console.log(`  ${id}: ${times.length} stills in ${path.relative(HERE, dir)}`);
  }
  await b.close();
}

// ---------- thumbnails ----------
async function renderThumbs(base) {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await launch();
  const jobs = [
    ["thumb-16x9", "thumb-youtube-1280x720.jpg", "scale=1280:720:flags=lanczos"],
    ["thumb-9x16", "cover-9x16-1080x1920.jpg", "null"],
  ];
  for (const [id, name, vf] of jobs) {
    const { page, W, H } = await openCut(b, base, id);
    const png = path.join(WORK, id + ".png");
    fs.mkdirSync(WORK, { recursive: true });
    fs.writeFileSync(png, await shot(page, 0, W, H));
    run("ffmpeg", ["-y", "-loglevel", "error", "-i", png, "-vf", vf, "-q:v", "2", path.join(OUT, name)]);
    await page.close();
    console.log("  wrote", path.join("out", name));
  }
  await b.close();
}

// ---------- main ----------
const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;
try {
  if (flag("--thumbs")) await renderThumbs(base);
  if (cutsArg.length) {
    if (flag("--stills")) await renderStills(base);
    else await renderVideos(base);
  }
  if (!flag("--thumbs") && !cutsArg.length) console.log("Nothing to do. Try --all, --cut 9x16-15 or --thumbs.");
} finally {
  server.close();
}
