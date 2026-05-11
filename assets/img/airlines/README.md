# Local airline logo overrides

Drop airline logo files here named by **ICAO code** (3 letters). The site
checks this folder *first* — before the Jxck-S CDN, before the generated
text-tile fallback — so anything you drop in will appear in every spot
the site shows that airline (Stats top-airlines card, flight log, flight
detail modals, achievement detail rows, etc.).

## Filename convention

```
<ICAO>.png
```

Square logos work best — anything that renders well at 22×22 px and again
at 44×44 px on high-DPI displays. Transparent backgrounds preferred. SVGs
also work if you rename one to `<ICAO>.png` (browsers don't care about
the extension as long as the content is valid), or you can change the
`LOCAL_LOGO_BASE` path in `assets/js/stats.js`.

## Most-useful overrides for a US traveler

These US carriers have **no logo on the upstream Jxck-S/airline-logos
repo** because they've merged or shut down:

| File          | Airline                | Note                                |
| ------------- | ---------------------- | ----------------------------------- |
| `TRS.png`     | AirTran Airways        | Merged into Southwest, 2014         |
| `COA.png`     | Continental Airlines   | Merged into United, 2012            |
| `NWA.png`     | Northwest Airlines     | Merged into Delta, 2010             |
| `USA.png`     | US Airways             | Merged into American, 2015          |
| `TWA.png`     | TWA                    | Acquired by American, 2001          |
| `AWE.png`     | America West Airlines  | Merged with US Airways, 2005        |
| `VRD.png`     | Virgin America         | Acquired by Alaska Airlines, 2018   |

If you don't add a file, the site renders a generated **brand-coloured
text-tile** (e.g. a red square with `TRS` in white for AirTran) so the
row still has a visual marker for the carrier.

## Where to find the originals

Wikipedia's articles for each defunct carrier usually have a PNG version
of the official logo at the top of the infobox. Click → "View source" →
download the file. Trademark-wise, identifying a carrier you flew on is
fair-use (nominative use), so dropping logos in for personal display is
standard practice.
