# Joshua's Portfolio Website

A simple one-page website. No installing, no building. Just plain HTML, CSS and JavaScript.

```
index.html    <- all your text, links and sections
style.css     <- colours, fonts and layout
script.js     <- animations and smooth scrolling
images/       <- all pictures
```

## How to find things to edit
Open any file and search (Ctrl+F or Cmd+F) for **`[EDIT ME]`**. Every placeholder is marked with it.
Once you've changed something, delete the `[EDIT ME]` note next to it.

## Edit your text and links
Open `index.html`. Change the words between the tags, for example:
`<h3>Marketing Project One [EDIT ME]</h3>` becomes `<h3>My Real Campaign</h3>`.
- **Links:** change `href="#"` to your real web address, e.g. `href="https://example.com/my-project"`.
- **Email:** search for `mailto:` in the Contact section (the address appears twice on one line).
- **LinkedIn / GitHub:** search for `linkedin.com` and `github.com` in the Contact section.
- **Add a project:** copy a whole `<article class="card"> ... </article>` block and edit it.
  Keep `data-category` as `marketing` or `ai` so the filter buttons work.
- **Colours:** at the top of `style.css`, the `:root` block holds all the colours.
- **3D background colours:** at the top of `script.js`, in the `SETTINGS` block.

## Edit the case study pop-ups
Click a project card on the site and a pop-up opens with the full story. Each pop-up is a
`<template id="case-...">` block near the bottom of `index.html` (search for `CASE STUDY POP-UPS`).
Edit the headings, text, role, tools and the "Visit" link inside it.
To add a new one: copy a `<template>` block, give it a new `id`, and put the same id on your
new card (both `data-case="..."` spots on that card).

## Videos and side quests
- The tAIste Labs video lives in the `videos` folder (`taiste-labs.mp4`). To change it, replace that file, or point the `<video>` tag in its pop-up at a new file name. Keep videos short (under ~10 MB) so the page stays quick.
- Side Quests currently shows one block (tAIste Labs). To add more, copy an `<article class="quest ...">` block inside `sqTrack`. With two or more, the section turns back into a sideways-scrolling row.

## Swap images
All pictures live in the `images` folder.
1. Pick your new picture. Photos in **.jpg** or **.webp** are best (keep each under ~500 KB so the page loads fast).
2. Put it in the `images` folder.
3. Either save it with the **same name** as the placeholder (including the same file type, such as .svg), **or** open `index.html` and change the file name in the `src="images/..."` bit.
   Example: `src="images/profile.jpg"` becomes `src="images/me.jpg"`.

Sizes that work well: profile photo 800 x 1000 px, project images 1200 x 750 px.
Tip: `og-image.png` (1200 x 630 px) is the picture shown when your link is shared on LinkedIn, WhatsApp etc. Replace it with your own.

## Share-preview and page title
At the top of `index.html`, change the title, description and the `https://your-site.vercel.app` web address (once Vercel gives you your real address).

## Preview on your computer
Easiest: double-click `index.html` to open it in your browser. Everything works that way.
(Optional, closer to the real thing: in a terminal inside this folder, run `python3 -m http.server 8000`, then open http://localhost:8000.)

## Publish updates
Every time you save changes and push them to GitHub, Vercel updates your site automatically in about a minute:
```
git add .
git commit -m "Update my site"
git push
```
