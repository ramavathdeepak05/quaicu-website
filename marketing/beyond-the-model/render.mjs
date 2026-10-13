// Render "QUAICU: Beyond the Model" frame by frame.
//
//   node render.mjs                       full film, 1920x1080, video only -> .work/<WxH>/video.mp4
//   node render.mjs --w 3840 --h 2160     4K master
//   node render.mjs --shots 3,4           only these shots (1-based), for review
//   node render.mjs --stills              three stills per shot into .work/stills/
//   node render.mjs --stills --at 1.2,4.8 stills at given times
//   node render.mjs --mux                 rendered video + .work/audio/mix.wav -> out/*.mp4 (-14 LUFS)
//
// Options: --workers N (default 4), --w/--h resolution, --jpeg (faster capture).
// Every frame is a screenshot of the page after window.seek(t), so frames are
// exact and identical on every run. Audio is built and muxed by audio/build.sh.

import { chromium } from "playwright-core";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { SHOTS, FPS } from "./src/timeline.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const WORK = path.join(HERE, ".work");

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(n);
const opt = (n, d) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : d;
};
const W = +opt("--w", 1920);
const H = +opt("--h", 1080);
const workers = +opt("--workers", Math.min(4, os.cpus().length));
const shotSel = opt("--shots", null);
const shots = shotSel ? shotSel.split(",").map((s) => +s - 1) : SHOTS.map((_, i) => i);
const jpeg = flag("--jpeg");
const limit = +opt("--limit", 0); // frames per shot (benchmarking)

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
  return undefined;
}

const launch = () =>
  chromium.launch({
    executablePath: chromePath(),
    args: [
      "--font-render-hinting=none",
      "--force-color-profile=srgb",
      "--disable-lcd-text",
      "--hide-scrollbars",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--ignore-gpu-blocklist",
      "--enable-webgl",
    ],
  });

async function open(browser, base, warm) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.setDefaultTimeout(0);
  page.on("pageerror", (e) => console.error("page error:", e.message));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") console.error(`[console.${m.type()}]`, m.text().slice(0, 400));
  });
  await page.goto(`${base}/marketing/beyond-the-model/src/index.html?w=${W}&h=${H}${warm !== undefined ? `&warm=${warm}` : ""}`);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 300000, polling: 200 });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  return page;
}

async function shot(page, t) {
  await page.evaluate(async (tt) => await window.seek(tt), t);
  const clip = { x: 0, y: 0, width: W, height: H };
  return page.screenshot(jpeg ? { type: "jpeg", quality: 98, clip, timeout: 0 } : { type: "png", clip, timeout: 0 });
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(" ")}\n${r.stderr}`);
  return r;
}

// Visually lossless intermediate per shot; final delivery encodes come from these.
const X264 = [
  "-vf", "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p",
  "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-profile:v", "high", "-tune", "film",
  "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
];

async function renderVideo(base) {
  const dir = path.join(WORK, `${W}x${H}`);
  fs.mkdirSync(dir, { recursive: true });
  const jobs = shots.map((i) => {
    const f0 = Math.round(SHOTS[i].start * FPS);
    const f1 = Math.round((SHOTS[i].start + SHOTS[i].dur) * FPS);
    return { i, f0, f1: limit ? Math.min(f1, f0 + limit) : f1, file: path.join(dir, `shot-${String(i + 1).padStart(2, "0")}.mp4`) };
  });
  const total = jobs.reduce((a, j) => a + j.f1 - j.f0, 0);
  let done = 0;
  const started = Date.now();
  const queue = [...jobs];
  async function worker() {
    const browser = await launch();
    while (queue.length) {
      const job = queue.shift();
      const page = await open(browser, base, job.i);
      const tmp = job.file + ".part.mp4";
      const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", jpeg ? "mjpeg" : "png", "-i", "-", ...X264, "-r", String(FPS), tmp], { stdio: ["pipe", "inherit", "inherit"] });
      const closed = new Promise((ok, bad) => ff.on("close", (c) => (c === 0 ? ok() : bad(new Error("ffmpeg failed on " + job.file)))));
      for (let f = job.f0; f < job.f1; f++) {
        const buf = await shot(page, f / FPS);
        if (!ff.stdin.write(buf)) await new Promise((ok) => ff.stdin.once("drain", ok));
        done++;
        const s = (Date.now() - started) / 1000;
        process.stdout.write(`\r  frames ${done}/${total}  ${(s / done).toFixed(2)} s/frame  eta ${Math.round(((total - done) * s) / done)}s   `);
      }
      ff.stdin.end();
      await closed;
      fs.renameSync(tmp, job.file);
      await page.close();
    }
    await browser.close();
  }
  console.log(`Rendering ${jobs.length} shots, ${total} frames at ${W}x${H} on ${workers} workers`);
  await Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, worker));
  process.stdout.write("\n");
  const all = SHOTS.map((_, i) => path.join(dir, `shot-${String(i + 1).padStart(2, "0")}.mp4`));
  if (all.every((f) => fs.existsSync(f))) {
    fs.writeFileSync(path.join(dir, "shots.txt"), all.map((f) => `file '${f}'`).join("\n"));
    run("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(dir, "shots.txt"), "-c", "copy", path.join(dir, "video.mp4")]);
    console.log("  wrote", path.relative(HERE, path.join(dir, "video.mp4")));
  }
}

async function renderStills(base) {
  const b = await launch();
  const at = opt("--at", null);
  const dir = path.join(WORK, "stills");
  fs.mkdirSync(dir, { recursive: true });
  const times = at ? at.split(",").map(Number) : shots.flatMap((i) => [0.2, 1.5, 2.85].map((x) => SHOTS[i].start + x));
  let page = null;
  let cur = -1;
  for (const t of times) {
    const i = Math.min(SHOTS.length - 1, Math.floor(t / 3));
    if (i !== cur) {
      if (page) await page.close();
      page = await open(b, base, i);
      cur = i;
    }
    const t0 = Date.now();
    const buf = await shot(page, t);
    const f = path.join(dir, `t${t.toFixed(2).padStart(5, "0")}.png`);
    fs.writeFileSync(f, buf);
    console.log(`  ${path.relative(HERE, f)}  ${Date.now() - t0}ms`);
  }
  await b.close();
}

// Final delivery encode: picture from the intermediate, soundtrack loudness
// normalised in two passes to -14 LUFS / -1.5 dBTP (YouTube, LinkedIn and
// Instagram all normalise around there), AAC 320k, faststart for the web.
function mux() {
  const dir = path.join(WORK, `${W}x${H}`);
  const video = path.join(dir, "video.mp4");
  const wav = opt("--audio", path.join(WORK, "audio", "mix.wav"));
  const tag = H >= 2160 ? "4k" : `${H}p`;
  const out = path.join(HERE, "out", `quaicu-beyond-the-model-30s-${tag}${opt("--suffix", "")}.mp4`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const target = "I=-14:TP=-1.5:LRA=11";
  const m = run("ffmpeg", ["-hide_banner", "-i", wav, "-af", `loudnorm=${target}:print_format=json`, "-f", "null", "-"]);
  const j = JSON.parse(m.stderr.slice(m.stderr.lastIndexOf("{")));
  const af = `loudnorm=${target}:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=48000`;
  const v = H >= 2160 ? ["-crf", "17", "-maxrate", "24M", "-bufsize", "48M", "-level:v", "5.1"] : ["-crf", "16", "-maxrate", "14M", "-bufsize", "28M", "-level:v", "4.1"];
  run("ffmpeg", [
    "-y", "-loglevel", "error", "-i", video, "-i", wav, "-map", "0:v", "-map", "1:a",
    "-c:v", "libx264", "-preset", "slow", "-tune", "film", "-profile:v", "high", ...v, "-pix_fmt", "yuv420p", "-g", "48",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
    "-af", af, "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-ac", "2",
    "-t", "30", "-movflags", "+faststart", out,
  ]);
  console.log("  wrote", path.relative(HERE, out));
}

const server = await serve();
const base = `http://127.0.0.1:${server.address().port}`;
try {
  if (flag("--mux")) mux();
  else if (flag("--stills")) await renderStills(base);
  else await renderVideo(base);
} finally {
  server.close();
}
