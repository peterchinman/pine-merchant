# Pine Merchant

A small static website for Pine Merchant, built with [Astro](https://astro.build/).

The site uses Astro components for explicit DOM/CSS structure and Markdown files in `text/` for editable content.

## Pages

The site currently builds these routes:

```txt
/                  Bio/home page
/about/            Timeline/about page
/projects/         Projects page
/blog/             Blog index
/blog/first-post/  Example blog post
```

## Requirements

- Node.js 22 or newer recommended
- npm

The GitHub Pages workflow currently uses Node 22.

## Install dependencies

From the project root:

```sh
npm install
```

Or, to install exactly from `package-lock.json`, use:

```sh
npm ci
```

## Run locally

Start the Astro development server:

```sh
npm run dev
```

## Add a blog post

Create a new Markdown file in `text/blog/`:

```txt
text/blog/my-post.md
```

Add frontmatter at the top:

```md
---
title: My Post
description: A short summary of the post.
date: 2026-06-25
---

Write the post here.
```

The filename becomes the URL slug, so `text/blog/my-post.md` becomes:

```txt
/blog/my-post/
```

## Edit components and styles

Astro components live in `src/components/`.

Each component can contain its own HTML-like markup and scoped CSS:

```astro
<section class="example">
  <h2>Example</h2>
</section>

<style>
  .example {
    padding: 2rem;
  }
</style>
```

Global styles live in:

```txt
src/styles/global.css
```

## Build for production

Create a production build:

```sh
npm run build
```

Astro writes the static site to:

```txt
dist/
```

## Preview the production build locally

After building, preview the generated site:

```sh
npm run preview
```

Astro will print a local preview URL.

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow at:

```txt
.github/workflows/deploy.yml
```

On every push to `main`, GitHub Actions will:

1. install dependencies with `npm ci`
2. build the site with `npm run build`
3. upload `dist/`
4. deploy to GitHub Pages

In the GitHub repository settings, set Pages to deploy from **GitHub Actions**.

## Useful commands

```sh
npm run dev      # run local development server
npm run build    # build static production site
npm run preview  # preview production build locally
```
