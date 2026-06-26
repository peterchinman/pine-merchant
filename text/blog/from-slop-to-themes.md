---
title: From Tailwind Slop to Configurable Themes
subtitle: Implementing a color design system across a large code base.
tags:
  - macro
  - design
  - theme
coolness: 4
date: 2024-12-30
---   

When I joined Macro, we wrote Tailwind colors directly into components: `bg-neutral-100`, `border-black/5`. The company had already been building the app for years, and it had a wide surface area: a markdown text editor, messaging platform, AI chat, and more. Devs had a lot of freedom to do their own designing as they developed features—there was rarely a Figma to reference. The “design system” lived entirely inside our CEO Jacob’s head.[^1] The result of which was that we had 13 different border colors, 19 shades of background grey.

[^1]: When I got hired it seemed like almost a point of pride that we had no designers, only engineers. Jacob owned the app design. One of my first tasks was to re-design our toasts. Jacob did not think my first iteration was very *Macro*, and so he pulled me into a room, and, over the course of an hour, explained how Macro used Tailwind. e.g

For our inaugural Anti-Mald (a semi-regular company “holiday” where we work on something fun) S***** and I cooked up a Dark Mode for the site. It was, admittedly, janky: with the help of Claude, we remapped every Tailwind color variable to point to, roughly, its inverse (followed by hours of ad hoc tweaking). But it worked, the other devs loved it, and so we shipped it.

Dark Mode was good, but I wanted us to have a fully customizable theming system. I wrote up a document describing my vision for implementing this, the heart of which was switching to Semantic Design Tokens. In short: instead of saying what color and element should be, you describe what function that element serves. Instead of `bg-neutral-50` you write `bg-panel`. Instead of `border-neutral-200` you write `border-edge`. 

This would give us the ability to design themes that would precisely target elements based on what they did, instead of making global color changes like our hacky Dark Mode. You could, for instance, change the color all of text inputs, and only the text inputs, across the whole app.[^2]

[^2]: My initial vision was to use semantic tokens not just for colors, but for *all* of the app design: border radii, padding, fonts, etc. I did not get buy-in for this wider vision, but it was agreed that colors were worth doing.

It would also, I hoped, be simpler for devs. Instead of remembering which shade of `neutral` we use on a dialog, you just wrote `bg-dialog`.

I got buy-in for this project, and proceeded to do an audit across our app of what tokens we would need. I needed to come up with a system wide enough to cover our current use-cases, simple enough to be easy for devs to use, and extensible enough to handle the future. I ended up with ten "surfaces" (`panel`, `dialog`, `input`, etc.), five flavors of text (`ink`, `placeholder` etc.), two styles of border (`edge`, `edge-muted`) and a smattering of other tokens (`accent`, `success`, `failure`, etc.).

Then came the actual execution—replacing every Tailwind color token in the entire codebase. I tried first to see if AI could do this. It would confidently replace all the color tokens in a component with semantic tokens, and got enough of them wrong that I realized I was going to have to carefully pore over all of its work. This was, I decided, a job for a human.[^3]

[^3]: This was in April 2025. I wonder if the current models would do a better job of this?

And so, for a week that felt like a month, I did nothing but replace Tailwind colors. It was extremely tedious. I had a regex that would find Tailwind color strings. I worked file-by-file. Parts of it would go fast, but then I'd get to a component that I couldn't even *find* in the app. I'd have to ask the last dev in the git blame how one actually got to this component.

And finally, it was done. While I was doing completing this R****** was designing the first iteration of our theme picker. The user could set 3 three "base colors": a surface color, a text color, and an accent color. We then generated 4 variants of both the surface color and the text color, that varied only in lightness. There was a knob that determined the lightness curve for these variants. That left us with 11 colors (5 surfaces, 5 texts, and an accent) that we wired up to the design tokens.

It worked. It was beautiful. And it almost didn't stick. I had thought this would be easier for devs, but everybody was used to writing Tailwind colors, and, even the helpful documentation I had prepared, no one wanted to learn a *new* system. And so I wrote a script that ran during our CI—if your PR included a Tailwind color string, you couldn't merge.

The biggest mistake I made in this initial system, was not accounting for situations where you wanted a surface color that would lightly contrast with the background. Imagine, e.g. a sidepanel that you want to set off from the main panel. We didn't have a token for this, and so we ended up using the `edge` token to accomplish this (because it was guaranteed to contrast with the base `panel` color). This led to `edge` losing its semantic meaning and started to just mean "contrast".
