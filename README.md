# ÉTRAVE

**AI-assisted preliminary ship design.**

In naval architecture, the *étrave* (the stem) is the first part of a vessel to cut through the water. ÉTRAVE focuses on the first stage of every project: turning a client's brief into a preliminary design the client can see before the detailed design begins.

> Status: in development. This repository currently contains the project website.

## Planned features

- **Parametric hull form**: hard chine or round bilge, with a lines plan and a 3D view
- **Hydrostatics**: displacement, LCB, KB, BM and an initial GM estimate
- **Scantlings in accordance with Bureau Veritas rules** (available: `scantlings.html`), see below
- **Weight and cost**: weight estimate and construction cost in DZD, with editable unit prices
- **PDF report** for the client
- **MCP server**: the calculations exposed as Model Context Protocol tools, so an AI assistant can generate a preliminary design from a plain-language brief

All results are preliminary and are not valid for construction or approval. Rule texts are not reproduced in this repository; calculations refer to rule clauses by number.

## Scantling calculator (Bureau Veritas NR600 and NR546)

`scantlings.html` gives preliminary local scantlings for monohulls within the scope of NR600 (cargo ships under 65 m, other ships under 90 m):

- Ship data: L<sub>W</sub>, C<sub>B</sub>, C<sub>W</sub>, navigation coefficients, relative motion h<sub>1</sub> by area, planing guidance and design acceleration a<sub>CG</sub>
- Loads (NR600 Ch 3, Sec 3): sea pressure on bottom, side and exposed deck; side shell impact; bottom slamming of planing hulls; fishing vessel working deck (Ch 6, Sec 1)
- Steel and aluminium (Ch 4, Sec 3 and Sec 4): plating thickness and secondary stiffener section modulus and shear area, with rule minimums and the +0.5 mm fishing vessel addition
- Composite: ply-by-ply analysis following NR546 (micromechanics, laminate theory, panel moments and shear) checked against the NR600 rule safety factors for each load case

Not yet included: primary supporting members, hull girder strength, buckling, internal and wheeled loads, multihulls, high speed craft (NR396). Welded aluminium properties are typical values to be checked against NR561.

Run the checks with `npm test` (Node 18 or later).

## Project structure

```
index.html        Website (home page)
css/style.css     Styles; colours are CSS variables at the top of the file
js/main.js        Shared behaviour
js/i18n.js        Translations (English, French, Arabic) and language switcher
scantlings.html   Scantling calculator
js/rules/         Rule engines: nr600.js (loads, steel and aluminium), nr546.js (composite)
js/scantlings-app.js  Calculator page
test/             Reference cases (npm test)
assets/           Logo and favicon
```

## Languages

The site is available in English, French and Arabic (right-to-left). The switcher in the header remembers the choice; a link can also force a language with `?lang=en`, `?lang=fr` or `?lang=ar`. All texts live in `js/i18n.js`, one line per entry with the three languages side by side.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Publish with GitHub Pages

1. Go to **Settings → Pages** in this repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select the `main` branch and the `/ (root)` folder, then **Save**.

The site will be available at `https://<your-username>.github.io/<repository-name>/`.

## Brand

| Token | Value | Use |
|---|---|---|
| Background | `#07111F` | Page ground |
| Surface | `#0C1A2D` | Panels |
| Text | `#EAF0F6` | Primary text and drawings |
| Accent | `#F26B3A` | International orange; calls to action and the design waterline only |

Typefaces: **Archivo** (headings and text), **JetBrains Mono** (data and technical labels).

## Contributing

Suggestions from practising naval architects and marine engineers are welcome. Please open an issue describing the calculation or feature you would like to see. Contributors will be credited on the project page.
