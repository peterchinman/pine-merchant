import { defineConfig } from "astro/config";
import remarkDeflist from "remark-deflist";

const [owner, repository] = process.env.GITHUB_REPOSITORY?.split("/") ?? [];
const isGithubActions = process.env.GITHUB_ACTIONS === "true";
const isUserOrOrgPage = owner && repository === `${owner}.github.io`;
const deploysToGithubProjectPage =
   isGithubActions && owner && repository && !isUserOrOrgPage;

export default defineConfig({
   markdown: {
      remarkPlugins: [remarkDeflist],
   },
   site:
      isGithubActions && owner && repository
         ? `https://${owner}.github.io${deploysToGithubProjectPage ? `/${repository}` : ""}`
         : undefined,
   base: deploysToGithubProjectPage ? `/${repository}` : undefined,
});
