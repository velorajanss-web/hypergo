const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const API_KEY = process.env.SERPER_API_KEY;

if (!API_KEY) {
  console.error("SERPER_API_KEY ortam değişkeni ayarlı değil.");
}
const PUBLIC = path.join(__dirname, "public");

function send(res, status, type, body) {
  res.writeHead(status, {
    "Content-Type": type,
    "Cache-Control": "no-store, no-cache, must-revalidate"
  });
  res.end(body);
}

function mime(file) {
  const ext = path.extname(file).toLowerCase();
  return ({
    ".html":"text/html; charset=utf-8",
    ".js":"text/javascript; charset=utf-8",
    ".css":"text/css; charset=utf-8",
    ".json":"application/json; charset=utf-8",
    ".png":"image/png",
    ".jpg":"image/jpeg",
    ".jpeg":"image/jpeg",
    ".webp":"image/webp",
    ".svg":"image/svg+xml",
    ".webmanifest":"application/manifest+json"
  })[ext] || "application/octet-stream";
}

async function serper(endpoint, q) {
  const r = await fetch("https://google.serper.dev/" + endpoint, {
    method: "POST",
    headers: {
      "X-API-KEY": API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ q, gl:"tr", hl:"tr", num:20 })
  });
  const text = await r.text();
  if (!r.ok) throw new Error("Serper HTTP " + r.status + ": " + text.slice(0,300));
  return JSON.parse(text);
}

function priceFromText(s) {
  if (!s) return null;
  const patterns = [
    /(\d{1,3}(?:[.\s]\d{3})+(?:,\d{1,2})?)\s*(?:TL|₺)/i,
    /(\d+(?:,\d{1,2})?)\s*(?:TL|₺)/i
  ];
  for (const re of patterns) {
    const m = String(s).match(re);
    if (m) return m[1] + " TL";
  }
  return null;
}

function cleanTitle(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

async function search(q) {
  let shopping = {shopping:[]};
  try { shopping = await serper("shopping", q); } catch (e) {
    console.log("Shopping sorgusu kullanilamadi:", e.message);
  }
  const normal = await serper("search", q);
  const results = [];
  const seen = new Set();

  for (const x of (shopping.shopping || [])) {
    const link = x.link;
    if (!link || seen.has(link.toLowerCase())) continue;
    seen.add(link.toLowerCase());
    results.push({
      id: results.length+1,
      title: cleanTitle(x.title),
      link,
      source: cleanTitle(x.source),
      snippet: cleanTitle(x.snippet),
      price: x.price || priceFromText((x.title||"")+" "+(x.snippet||"")),
      image: x.imageUrl || x.thumbnailUrl || null,
      type: "shopping"
    });
  }

  for (const x of (normal.organic || [])) {
    const link = x.link;
    if (!link || seen.has(link.toLowerCase())) continue;
    seen.add(link.toLowerCase());
    results.push({
      id: results.length+1,
      title: cleanTitle(x.title),
      link,
      source: cleanTitle(x.source),
      snippet: cleanTitle(x.snippet),
      price: priceFromText((x.title||"")+" "+(x.snippet||"")),
      image: x.imageUrl || null,
      type: "organic"
    });
  }
  return {results, count:results.length};
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, "http://localhost:"+PORT);

    if (u.pathname === "/api/health") {
      return send(res, 200, "application/json; charset=utf-8",
        JSON.stringify({ok:true, server:"node", shopping:true}));
    }

    if (u.pathname === "/api/search") {
      const q = (u.searchParams.get("q") || "").trim();
      if (!q) return send(res, 400, "application/json; charset=utf-8",
        JSON.stringify({error:"Arama kelimesi gerekli."}));
      try {
        const data = await search(q);
        return send(res, 200, "application/json; charset=utf-8", JSON.stringify(data));
      } catch (e) {
        console.error(e);
        return send(res, 502, "application/json; charset=utf-8",
          JSON.stringify({error:"Serper aramasi basarisiz: "+e.message}));
      }
    }

    let rel = decodeURIComponent(u.pathname);
    if (rel === "/") rel = "/index.html";
    const file = path.resolve(PUBLIC, "." + rel);
    if (!file.startsWith(path.resolve(PUBLIC) + path.sep))
      return send(res, 403, "text/plain; charset=utf-8", "Forbidden");

    if (!fs.existsSync(file) || !fs.statSync(file).isFile())
      return send(res, 404, "text/plain; charset=utf-8", "Not found");

    res.writeHead(200, {
      "Content-Type": mime(file),
      "Cache-Control": "no-store, no-cache, must-revalidate"
    });
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    console.error(e);
    send(res, 500, "text/plain; charset=utf-8", e.message);
  }
});

server.listen(PORT, HOST, () => {
  console.log("");
  console.log("======================================");
  console.log(" HYPERGO CALISIYOR");
  console.log(" http://localhost:"+PORT);
  console.log("======================================");
});
