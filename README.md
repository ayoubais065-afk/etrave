# ÉTRAVE

**AI-assisted preliminary ship design.**

In naval architecture, the *étrave* (the stem) is the first part of a vessel to cut through the water. ÉTRAVE focuses on the first stage of every project: turning a client's brief into a preliminary design the client can see before the detailed design begins.

> Status: in development. This repository currently contains the project website.

## Planned features

- **Parametric hull form**: hard chine or round bilge, with a lines plan and a 3D view
- **Hydrostatics**: displacement, LCB, KB, BM and an initial GM estimate
- **Propulsion**: power estimate (empirical methods; Savitsky method for planing hulls)
- **Preliminary scantlings** in accordance with ISO 12215-5: design pressures, plating and stiffeners
- **Weight and cost**: weight estimate and construction cost in DZD, with editable unit prices
- **PDF report** for the client
- **MCP server**: the calculations exposed as Model Context Protocol tools, so an AI assistant can generate a preliminary design from a plain-language brief

All results are preliminary and are not valid for construction or approval.

## Project structure

```
index.html                       Website (home page)
scantlings.html                  Scantling calculator (beta)
css/style.css                    Shared styles; colours are CSS variables at the top
css/scantlings.css               Calculator styles and print layout
js/main.js                       Shared behaviour
js/scantlings-app.js             Calculator page
js/scantling/iso12215-5.js       ISO 12215-5:2008 engine: pressures, factors, plating, stiffeners
js/scantling/bv-nr546.js         BV NR546 engine: layer properties, laminate theory, ply-by-ply check
test/scantling.test.mjs          Unit tests against hand calculations and tabulated values
assets/                          Logo and favicon
```

## Scantling calculator

**Method 1 – ISO 12215-5:2008.** Dynamic load factor, kL, kAR, kZ, kSUP; motor and sailing craft design pressures (bottom, side, deck, superstructure, watertight bulkheads, tanks); plating for FRP single skin (Annex C), FRP sandwich (Annex D), aluminium and steel (Annex F) and plywood; minimum thickness and fibre mass; stiffener section modulus, web area and second moment.

**Method 2 – BV NR546 methodology.** The actual laminate is entered layer by layer (CSM, woven roving, UD, double bias, cores). Layer elastic constants and breaking stresses are derived from fibre and resin (Sec 5), the laminate is analysed with classical lamination theory (Sec 6), clamped-panel moments are applied and every ply is checked in fibre, transverse, shear and interlaminar directions and with the Hoffman criterion (Sec 2). Loads come from Method 1.

Known limitations:

- The 2019 edition of ISO 12215-5 is not yet included.
- BV partial safety factors are editable, provisional defaults; the official values are in NR600 / NR500.
- ISO 12215-5 is written for recreational craft; professional vessels may fall under other rules.

Run the tests with `npm test` (Node.js 18 or later).

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
