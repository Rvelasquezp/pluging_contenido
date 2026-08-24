# PixelCore Components

Mini-framework de componentes Gutenberg reutilizables (Hero, Card, Accordion/FAQ, CTA) con un sistema de animaciones GSAP + ScrollTrigger integrado, design system SCSS y utility classes. Pensado para instalarse tal cual en cualquier proyecto WordPress nuevo.

## Instalación

1. Copia la carpeta `pixelcore-components` completa a `wp-content/plugins/`.
2. Activa **PixelCore Components** desde Plugins → Instaladas (o `wp plugin activate pixelcore-components`).
3. No requiere `npm install` ni build step para funcionar: el CSS ya viene compilado en `assets/css/`, el JS ya viene minificado en `js/dist/`, y GSAP viene vendorizado en `assets/vendor/gsap/`.
4. Ve a **PixelCore → Settings** para ajustar GSAP/ScrollTrigger/ScrollSmoother, utility classes y performance.
5. En el editor de bloques, busca la categoría **PixelCore** e inserta Hero, Card, Accordion o CTA.

Si quieres modificar el design system, edita los archivos en `scss/` y recompílalos:

## compilation

```bash
cd "wp-content/plugins/pixelcore-components"
npx sass scss/pixelcore.scss assets/css/pixelcore.css --style=compressed --no-source-map
npx sass scss/editor.scss assets/css/pixelcore-editor.css --style=compressed --no-source-map
```

Como el CSS ya viene versionado con `filemtime()` (ver `class-pixelcore-assets.php`), no necesitas limpiar caché del navegador después de recompilar — la URL del archivo cambia sola.

Si modificas `js/core.js` o `js/animations/*.js` y quieres regenerar el bundle de producción (`js/dist/pixelcore.min.js`, usado cuando "Minify assets" está activo):

```bash
cat js/core.js js/animations/fade.js js/animations/scale.js js/animations/slide.js \
    js/animations/parallax.js js/animations/custom.js js/animations/scroll.js \
    js/accordion.js js/bootstrap.js > /tmp/pixelcore.concat.js
npx esbuild /tmp/pixelcore.concat.js --minify --outfile=js/dist/pixelcore.min.js
```

Con "Minify assets" desactivado (o `SCRIPT_DEBUG` activo), el plugin carga cada archivo JS por separado, sin necesidad de regenerar nada — útil mientras desarrollas.

## Estructura de carpetas

```
pixelcore-components.php   Bootstrap: header del plugin, constantes, requires
includes/                  Lógica PHP (una clase por responsabilidad)
  class-pixelcore-plugin.php            Orquestador (instancia todo lo demás)
  class-pixelcore-assets.php            Registro de CSS/JS/GSAP + carga condicional
  class-pixelcore-blocks.php            Descubre/registra bloques + capixel_register_component()
  class-pixelcore-animation-presets.php Presets/triggers/eases (fuente única de verdad)
  class-pixelcore-settings.php          Settings → PixelCore Components + PixelCore → Animation
  class-pixelcore-debug.php             Modo debug (solo manage_options)
  helpers.php                           Developer API (funciones capixel_*)
blocks/                    Un bloque por carpeta: block.json, render.php, index.js, index.asset.php
  hero/  card/  accordion/  accordion-item/  cta/
  shared-animation-panel.js  Panel "Animation" del Inspector, compartido por los 5 bloques
scss/                       Design system (fuente). abstracts/ base/ utilities/ blocks/
assets/
  css/                      pixelcore.css + pixelcore-editor.css (ya compilados)
  vendor/gsap/              gsap.min.js, ScrollTrigger.min.js, ScrollSmoother.min.js (pinned 3.13.0)
js/                         Motor de animaciones (fuente, sin build step)
  core.js                   Escanea data-cp-*, arma el tween, gsap.context() + cleanup
  animations/                fade.js scale.js slide.js parallax.js custom.js scroll.js
  accordion.js               Interactividad abrir/cerrar (no depende de GSAP)
  bootstrap.js                Llama a PixelCoreAnimations.init() al final de la cadena
  dist/pixelcore.min.js       Bundle minificado (fade+scale+slide+parallax+custom+scroll+accordion+bootstrap)
templates/                  Punto de extensión para partials PHP de futuros componentes
```

## Cómo funciona la carga condicional (performance)

- **CSS/JS por bloque**: cada `block.json` referencia los handles `pixelcore-css` / `pixelcore-js` (no rutas `file:`), y WordPress solo los encola cuando ese bloque específico está presente en la página — es el mismo mecanismo nativo que usa `@wordpress/scripts`, aplicado a mano.
- **GSAP**: solo se registra como dependencia de `pixelcore-js` si "Enable GSAP" está activo en Settings; si el theme ya carga su propio GSAP, puedes desactivarlo aquí sin tocar código.
- **Utility classes** (`cp-container`, `cp-mt-md`, …): se cargan en todo el sitio solo si "Enable utility classes" está activo, porque a diferencia del CSS de los bloques, están pensadas para usarse en cualquier markup, no solo dentro de un bloque PixelCore.
- **Debug panel**: solo se encola si el ajuste está activo Y el usuario tiene `manage_options` — nunca le llega a un visitante normal.

## El sistema de animación (`data-cp-*`)

`includes/helpers.php::capixel_animation_attributes()` convierte el atributo `animation` de un bloque en atributos `data-cp-*`:

```html
<div data-cp-animation="fade-up" data-cp-trigger="scroll" data-cp-start="top 80%"
     data-cp-end="bottom 20%" data-cp-duration="1" data-cp-ease="power2.out"
     data-cp-vars='{"opacity":0,"y":50}' data-cp-once="true">
```

`js/core.js` escanea `[data-cp-animation]`, y cada preset (`fade`, `scale`, `slide`, `rotate`, `parallax`, `custom`) está registrado vía `PixelCoreAnimations.registerPreset()`. Los 4 primeros comparten un único handler genérico (`genericReveal`): animan desde `data-cp-vars` hasta su estado neutro — la diferencia entre "Fade" y "Scale" vive solo en `PixelCore_Animation_Presets::builtins()` (PHP), no en JS duplicado.

Responsive: `data-cp-responsive='{"tablet":{"scrub":1},"mobile":{"disabled":true}}'` — `core.js` aplica el override según el breakpoint actual y lo recalcula en cada resize.

## Developer API

**PHP** — registra un bloque propio sin tocar el core del plugin:

```php
add_action( 'init', function () {
    capixel_register_component( __DIR__ . '/blocks/testimonial' );
} );
```

Filtros disponibles:

| Filtro | Para qué |
|---|---|
| `capixel_animation_presets` | Añadir/sobrescribir presets de animación |
| `capixel_animation_triggers` | Añadir triggers custom |
| `capixel_animation_eases` | Añadir eases custom |
| `capixel_component_settings` | Modificar los ajustes resueltos de un componente antes de renderizarlo |

Funciones públicas: `capixel_setting( $key, $default )`, `capixel_is_debug()`, `capixel_get_animation_presets()`.

**JS** — usa el mismo motor desde tu propio código:

```js
window.PixelCoreAnimations.registerPreset( "reveal-mask", function ( el, config ) {
  return window.PixelCoreAnimations.applyTrigger( el, config, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" } );
} );
```

## Cómo agregar un nuevo componente (V2+)

1. Crea `blocks/mi-bloque/` con `block.json` (usa los handles `pixelcore-css` / `pixelcore-js` en `style`/`viewScript` para heredar la carga condicional), `render.php`, `index.js` e `index.asset.php`.
2. Si necesita el panel de animación, en `index.js` llama a `window.PixelCoreEditor.AnimationPanel({ animation, onChange })` dentro de tu `InspectorControls`.
3. En el `render.php`, usa `capixel_animation_attributes( $attributes['animation'] ?? [] )` para imprimir los `data-cp-*`.
4. Regístralo con `capixel_register_component( __DIR__ )` desde tu propio `functions.php` o plugin — no necesitas editar `class-pixelcore-blocks.php`.

## V1 — qué incluye

Hero, Card, Accordion/FAQ (con InnerBlocks), CTA · presets Fade/Fade Up/Fade Down/Fade Left/Fade Right, Scale/Scale Up/Scale Down, Slide, Rotate, Parallax, Custom · triggers Load/Scroll/Hover/Click · controles responsive (tablet/mobile: disable, scrub, duration) · design system SCSS + utility classes (`cp-*`) · GSAP vendorizado (sin CDN) · carga condicional · Settings page · modo debug · Developer API.

Fuera de alcance de V1 (mencionado en el brief original, pendiente para V2): Tabs, Testimonials, Gallery, y un editor visual de presets (por ahora se extienden vía el filtro `capixel_animation_presets`).
# pluging_contenido
