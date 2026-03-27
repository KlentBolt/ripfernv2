# Fern V2 Search

Fern V2 Search is a static search page that works on GitHub Pages and redirects searches to live DuckDuckGo results.

## What it does

- Serves a branded static homepage
- Accepts search queries from the user
- Redirects the current tab to DuckDuckGo results
- Works without Node, Docker, or a backend

## Files

- `index.html`: search UI
- `style.css`: styling for the app
- `script.js`: frontend redirect behavior

## Deploy

Upload the static files to GitHub Pages, Netlify, Vercel static hosting, or any normal web host.

## Important notes

- This version is fully static, so it cannot render third-party search results inside your own page.
- It opens the real DuckDuckGo results page instead, which is the reliable option for GitHub Pages.
