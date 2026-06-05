# Waves HTML cache

Waves blocks most automated fetchers. The build script reads cached HTML from this folder.

## Plugin catalog

- `subscriptions-ultimate.html` — full plugin list (~247 plugins)
- `free-plugin-pack.html` — optional backup with the same plugin JSON

Save these from https://www.waves.com/subscriptions/ultimate in your browser
(View Source → Save As) if the cache is missing.

## Bundle catalog

Each bundle page is cached as `bundles/{slug}.html`, e.g. `bundles/platinum.html`.

Re-run `npm run build:waves-catalog` after updating cache files when Waves adds products.
