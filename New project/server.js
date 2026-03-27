const express = require("express");
const https = require("https");
const path = require("path");

const app = express();
const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x2F;/g, "/");
}

function stripTags(value) {
  return decodeHtml(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function extractDuckDuckGoUrl(rawHref) {
  if (!rawHref) {
    return "";
  }

  const decodedHref = decodeHtml(rawHref);

  if (decodedHref.startsWith("//")) {
    return `https:${decodedHref}`;
  }

  if (decodedHref.startsWith("http://") || decodedHref.startsWith("https://")) {
    return decodedHref;
  }

  if (decodedHref.startsWith("/l/?")) {
    try {
      const redirectUrl = new URL(`https://duckduckgo.com${decodedHref}`);
      return redirectUrl.searchParams.get("uddg") || "";
    } catch (_error) {
      return "";
    }
  }

  return "";
}

function parseDuckDuckGoResults(html) {
  const results = [];
  const resultPattern = /<div class="result(?:.|\n|\r)*?<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>([\s\S]*?)<\/div>\s*<\/div>/gi;

  let match;

  while ((match = resultPattern.exec(html)) !== null && results.length < 10) {
    const url = extractDuckDuckGoUrl(match[1]);
    const title = stripTags(match[2]);
    const block = match[3] || "";
    const snippetMatch = block.match(/class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>|class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    const snippetSource = snippetMatch ? snippetMatch[1] || snippetMatch[2] || "" : "";
    const snippet = stripTags(snippetSource);

    if (!url || !title) {
      continue;
    }

    results.push({
      title,
      url,
      snippet
    });
  }

  return results;
}

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "accept-language": "en-US,en;q=0.9",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        }
      },
      (response) => {
        const chunks = [];

        response.on("data", (chunk) => {
          chunks.push(chunk);
        });

        response.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");

          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`Upstream responded with ${response.statusCode}`));
            return;
          }

          resolve(body);
        });
      }
    );

    request.on("error", reject);
  });
}

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "fern-v2-search"
  });
});

app.get("/api/search", async (req, res) => {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (!query) {
    return res.status(400).json({
      ok: false,
      error: "Missing search query"
    });
  }

  try {
    const html = await fetchHtml(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
    const results = parseDuckDuckGoResults(html);

    return res.json({
      ok: true,
      query,
      results
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      error: "Search provider unavailable",
      detail: error.message
    });
  }
});

app.use(express.static(path.join(__dirname)));

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(port, () => {
  console.log(`Fern V2 Search listening on http://localhost:${port}`);
});
