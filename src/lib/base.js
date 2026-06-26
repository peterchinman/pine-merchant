// Join a path onto the site's base path, tolerating a base with or without a
// trailing slash. import.meta.env.BASE_URL is "/" locally but "/pine-merchant"
// (no trailing slash) on a GitHub Pages project page — concatenating directly
// produces "/pine-merchantblog/…", so always go through this helper.
const rawBase = import.meta.env.BASE_URL;
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;

export function withBase(path = "") {
   return `${base}${String(path).replace(/^\//, "")}`;
}
