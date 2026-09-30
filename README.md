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
index.html        Website (single page)
css/style.css     Styles; colours are CSS variables at the top of the file
js/main.js        Drawing tabs and "Suggest a feature" link
assets/           Logo and favicon
```

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
