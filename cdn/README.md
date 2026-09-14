# YappyDraw SDK (v0.8.253)

Built from this commit by the release process — do not edit by hand.

The drawing API without the editor, as an ES module. `yappy.js` is the entry;
`chunks/` holds the core and the features it loads on first use (MathJax, the
exporters), so keep the folder together.

```html
<div id="stage"></div>
<script type="module">
  import { Yappy, mount } from 'https://cdn.jsdelivr.net/gh/algorisys-oss/yappydraw@v0.8.253/cdn/yappy.js'

  const sun = Yappy.createCircle(40, 40, 120, 120, { backgroundColor: '#ffd166', fillStyle: 'hachure' })
  mount('#stage')   // inline SVG; every shape is a <g data-yappy-id="…">
</script>
```

| Export | What |
|---|---|
| `Yappy` | The full `window.Yappy` API: `create*`, `importDSL`, `loadDocument`, … |
| `toSVG(options?)` | SVG markup, element ids on by default. Never downloads a file. |
| `mount(target, options?)` | Render into an element as inline SVG; returns the `<svg>` |
| `clear()` | Start a fresh drawing |
| `version` | The YappyDraw version this was built from |

Pin a version tag (`@v0.8.253`) in production. Tags are never moved, so a pinned URL
keeps serving the same files. `@main` follows the latest publish and is cached by
jsDelivr for up to a day. License: AGPL-3.0-only, as the rest of this repository.
