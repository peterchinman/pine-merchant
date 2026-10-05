import { defineConfig, fontProviders } from "astro/config";
import remarkDeflist from "remark-deflist";

const [owner, repository] = process.env.GITHUB_REPOSITORY?.split("/") ?? [];
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const isUserOrOrgPage = owner && repository === `${owner}.github.io`;
const deploysToGithubProjectPage =
   isGithubActions && owner && repository && !isUserOrOrgPage;

export default defineConfig({
   server: {
      port: Number(process.env.PORT) || 4321,
   },
   // Self-hosted at build time, with metric-matched fallbacks so the swap from
   // fallback to web font doesn't shift layout. Rendered by <Font> in
   // BaseLayout, which also defines these CSS variables.
   fonts: [
      {
         provider: fontProviders.google(),
         name: "IBM Plex Mono",
         cssVariable: "--font-mono",
         weights: [400],
         styles: ["normal"],
         fallbacks: ["monospace"],
      },
      {
         provider: fontProviders.google(),
         name: "IBM Plex Sans",
         cssVariable: "--font-sans",
         // variable font: one file covers every weight the CSS uses
         weights: ["400 700"],
         styles: ["normal", "italic"],
         fallbacks: ["sans-serif"],
      },
      {
         provider: fontProviders.google(),
         name: "Tiny5",
         cssVariable: "--font-display",
         weights: [400],
         styles: ["normal"],
         // A pixel font no fallback can imitate, so hide text briefly instead
         // of swapping. It's tiny and preloaded, so the wait is short.
         display: "block",
         // Astro sizes its fallback from lowercase widths, but Tiny5 is always
         // shown uppercase here, so use a hand-tuned one (see global.css).
         // Hidden Tiny5 text still takes up space, so the fallback's size
         // keeps neighbouring visible text, like the bio, from jumping.
         fallbacks: ["Tiny5 Fallback", "monospace"],
         optimizedFallbacks: false,
      },
   ],
   markdown: {
      remarkPlugins: [remarkDeflist],
   },
   site:
      isGithubActions && owner && repository
         ? `https://${owner}.github.io${deploysToGithubProjectPage ? `/${repository}` : ""}`
         : undefined,
   base: deploysToGithubProjectPage ? `/${repository}` : undefined,
});
