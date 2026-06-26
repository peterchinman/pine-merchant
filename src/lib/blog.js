import { withBase } from "./base.js";

const postModules = import.meta.glob("../../text/blog/*.md", { eager: true });

function slugFromPath(path) {
   return path.split("/").pop().replace(/\.md$/, "");
}

function formatDate(value) {
   if (!value) {
      return "Undated";
   }

   const date = new Date(value);

   if (Number.isNaN(date.valueOf())) {
      return "Undated";
   }

   return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
   }).format(date);
}

function sortByDateDescending(a, b) {
   return b.dateValue - a.dateValue;
}

export const blogPosts = Object.entries(postModules)
   .map(([path, module]) => {
      const slug = slugFromPath(path);
      const frontmatter = module.frontmatter ?? {};
      const rawDate = frontmatter.date;
      const date = rawDate ? new Date(rawDate) : null;
      const dateValue =
         date && !Number.isNaN(date.valueOf()) ? date.valueOf() : 0;

      return {
         slug,
         url: withBase(`blog/${slug}/`),
         title: frontmatter.title ?? slug,
         subtitle: frontmatter.subtitle ?? "",
         description: frontmatter.description ?? "",
         date,
         dateValue,
         formattedDate: formatDate(rawDate),
         frontmatter,
         Content: module.Content ?? module.default,
      };
   })
   .sort(sortByDateDescending);

export function getBlogPost(slug) {
   return blogPosts.find((post) => post.slug === slug);
}
