/**
 * PixelCore Gallery — layout "afterglow" (mosaico disperso, deriva y
 * disolución independiente por imagen).
 *
 * A diferencia del resto de layouts (grid/masonry/waterfall), acá NO hay
 * ningún sistema de columnas ni CSS Grid por debajo — ni siquiera "carriles"
 * internos (la versión anterior de este archivo sí tenía carriles fijos por
 * índice, y aunque no eran configurables desde el backend, el resultado
 * visual igual se leía como columnas: cada carril era una franja de ancho
 * fijo que ninguna imagen cruzaba nunca). Ahora cada imagen se posiciona de
 * forma completamente libre —
 *
 *   1. Se le calcula un tamaño propio (fracción del ancho TOTAL del
 *      contenedor, no de ningún carril — ciclo grande/chico/mediano más
 *      jitter fino).
 *   2. Se prueban varias posiciones (X, Y) candidatas al azar dentro de
 *      TODO el ancho disponible (nunca limitado a una franja), y se elige
 *      la que menos se superponga con las imágenes ya colocadas — si
 *      alguna candidata no se superpone con ninguna, se usa esa
 *      directamente.
 *   3. Si ningún candidato quedó libre de superposición, se la coloca
 *      simplemente debajo de todo lo ya construido (evita amontonar
 *      imágenes una sobre otra cuando el espacio ya está lleno).
 *
 * El resultado: una composición realmente irregular — el ancho de cada
 * imagen no está atado a ninguna banda, así que puede terminar en
 * cualquier punto horizontal, y las imágenes vecinas en el HTML pueden
 * terminar en cualquier parte de la composición final, no en una posición
 * predecible por su índice.
 *
 * El "aleatorio" es DETERMINÍSTICO (una función seno con el índice y el
 * intento como semilla, no Math.random()) — mismo layout siempre en la
 * misma página, no cambia composición cada vez que se refresca.
 *
 * Animación (GSAP + ScrollTrigger, si están disponibles) — DOS ciclos por
 * imagen, uno después del otro, nunca en simultáneo:
 *
 *   1. "Normal": desde que la imagen entra por abajo de la pantalla hasta
 *      justo antes de empezar a desaparecer — acá SÍ deriva lateralmente
 *      (xPercent, un valor propio por imagen, positivo o negativo).
 *   2. "Desaparición": desde ahí hasta que termina de salir por completo
 *      — acá la imagen se achica a escala 0 (nunca sigue derivando
 *      lateralmente; el xPercent queda quieto en el valor que alcanzó al
 *      terminar el ciclo normal, GSAP no le pide nada más a esa
 *      propiedad).
 *
 * El punto donde termina uno y empieza el otro NO es literalmente el
 * borde superior de la pantalla — es el borde INFERIOR de un header fixed
 * del theme, si hay uno (ver disappearStart() más abajo, usa la misma
 * utilidad que horizontal.js/vertical.js para detectarlo sin necesitar
 * saber su selector). Sin este ajuste, el achicamiento pasaría tapado
 * detrás del header — apenas se alcanzaría a ver.
 *
 * El transform-origin de la escala es propio por imagen (izquierda o
 * derecha) — decide hacia qué lado se "achica" al desvanecerse.
 *
 * Nada de esto pinea nada: los triggers usan scrub, no dependen de
 * pin/sticky, que en este sitio están rotos por el transform que el
 * ScrollSmoother del theme le aplica a un ancestro compartido.
 *
 * OJO: el trigger nunca es el mismo elemento que GSAP transforma. El ITEM
 * (con su position:absolute/left/top/width ya calculados acá) es la
 * referencia ESTABLE que miden los ScrollTrigger; el contenido va
 * envuelto en un "inner" que es lo único que se anima (xPercent/scale) —
 * si el trigger fuera el mismo elemento animado, ScrollTrigger podría
 * medirlo ya escalado a 0 y calcular mal el rango de scroll.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	// Pseudo-aleatorio determinístico (0 a 1) a partir de un número semilla
	// — mismo resultado siempre para el mismo índice, no cambia entre
	// cargas de página.
	function seeded( seed ) {
		var x = Math.sin( seed * 12.9898 ) * 43758.5453;

		return x - Math.floor( x );
	}

	// Tamaño de cada imagen, como fracción del ancho TOTAL del contenedor
	// (no de ningún carril) — ciclo grande/chico/mediano/chico-mediano
	// (variedad editorial) más un poco de jitter fino.
	var WIDTH_FRACTIONS = [ 0.24, 0.15, 0.19, 0.12 ];

	function itemWidth( containerWidth, index ) {
		var base = WIDTH_FRACTIONS[ index % WIDTH_FRACTIONS.length ];
		var jitter = 0.85 + seeded( index * 3.1 ) * 0.3;

		return containerWidth * base * jitter;
	}

	function intrinsicRatio( item ) {
		var img = item.querySelector( "img" );
		var w = img && parseInt( img.getAttribute( "width" ), 10 );
		var h = img && parseInt( img.getAttribute( "height" ), 10 );

		return w && h ? h / w : 9 / 16;
	}

	function rectsOverlap( a, b, gap ) {
		return (
			a.x < b.x + b.w + gap &&
			a.x + a.w + gap > b.x &&
			a.y < b.y + b.h + gap &&
			a.y + a.h + gap > b.y
		);
	}

	// Cuántas posiciones candidatas se prueban por imagen antes de resignarse
	// a colocarla debajo de todo lo construido — más intentos, composición
	// más compacta (menos huecos), a costa de un poco más de cálculo (nada
	// perceptible con la cantidad de imágenes típica de una galería).
	var PLACEMENT_ATTEMPTS = 24;
	var GAP = 16;

	function buildScatter( el, items ) {
		var containerWidth = el.clientWidth;
		var placed = [];
		var builtHeight = 0;

		items.forEach( function ( item, index ) {
			var w = itemWidth( containerWidth, index );
			var h = w * intrinsicRatio( item );
			var maxX = Math.max( containerWidth - w, 0 );

			var best = null;

			for ( var attempt = 0; attempt < PLACEMENT_ATTEMPTS; attempt++ ) {
				var candidate = {
					x: seeded( index * 11.3 + attempt * 17.9 ) * maxX,
					// El rango vertical candidato incluye un poco más de lo
					// ya construido — así una imagen puede terminar
					// "intercalada" con las de arriba en vez de siempre
					// abajo de todo, sin dejar de evitar superposiciones.
					y: seeded( index * 13.7 + attempt * 19.1 ) * ( builtHeight + h ),
					w: w,
					h: h,
				};

				var collisions = 0;

				for ( var p = 0; p < placed.length; p++ ) {
					if ( rectsOverlap( candidate, placed[ p ], GAP ) ) {
						collisions++;
					}
				}

				if ( ! best || collisions < best.collisions ) {
					best = { rect: candidate, collisions: collisions };
				}

				if ( 0 === collisions ) {
					break;
				}
			}

			// Ningún candidato quedó libre de superposición — en vez de
			// dejarla encimada, se la manda simplemente debajo de todo lo
			// ya construido (nunca se pierde una imagen, nunca queda tapada).
			if ( best.collisions > 0 ) {
				best = {
					rect: {
						x: seeded( index * 11.3 ) * maxX,
						y: builtHeight + GAP,
						w: w,
						h: h,
					},
					collisions: 0,
				};
			}

			item.style.position = "absolute";
			item.style.left = best.rect.x + "px";
			item.style.top = best.rect.y + "px";
			item.style.width = w + "px";

			placed.push( best.rect );
			builtHeight = Math.max( builtHeight, best.rect.y + best.rect.h );
		} );

		el.style.height = builtHeight + "px";
	}

	function applyMotion( el, items ) {
		if ( ! window.gsap || ! window.ScrollTrigger ) {
			return;
		}

		var gsap = window.gsap;
		var ScrollTrigger = window.ScrollTrigger;

		gsap.registerPlugin( ScrollTrigger );

		// El área de contenido real (lo que buildScatter usó como
		// contenedor, ya excluye el padding de la galería y de su parent
		// — ver comentario grande en buildScatter): ninguna imagen debe
		// derivar más allá de este ancho, nunca.
		var containerWidth = el.clientWidth;

		items.forEach( function ( item, index ) {
			if ( item._pcAfterglowTriggers ) {
				item._pcAfterglowTriggers.forEach( function ( st ) {
					st.kill();
				} );
			}

			var inner = item.querySelector( ":scope > .pixelcore-gallery__afterglow-inner" );

			if ( ! inner ) {
				inner = document.createElement( "div" );
				inner.className = "pixelcore-gallery__afterglow-inner";

				while ( item.firstChild ) {
					inner.appendChild( item.firstChild );
				}

				item.appendChild( inner );
			}

			// Punto donde termina el ciclo "normal" (deriva horizontal) y
			// empieza la desaparición (achicado) — el borde inferior de un
			// header fixed del theme, si hay uno, en vez de literalmente el
			// borde superior de la pantalla. Sin esto, ese tramo pasa TAPADO
			// detrás del header y no se alcanza a ver. Usa la misma utilidad
			// que ya usan horizontal.js/vertical.js para esto (detecta el
			// header pintado arriba sin necesitar saber su selector) — se
			// recalcula solo en cada refresh (core.js ya llama a
			// ScrollTrigger.refresh() cuando el alto real del header
			// cambia, ej. si se encoge al scrollear).
			function disappearStart() {
				var offset = window.PixelCoreGallery.fixedHeaderOffset();

				return offset > 0 ? "top " + offset + "px" : "top top";
			}

			// Un lado propio por imagen (izquierda o derecha) — decide hacia
			// dónde ancla el achicamiento al desaparecer.
			var anchorLeft = seeded( index * 4.6 ) < 0.5;

			gsap.set( inner, {
				transformOrigin: anchorLeft ? "0% 50%" : "100% 50%",
			} );

			// Un solo valor de deriva por imagen (puede salir negativo o
			// positivo) — PERO acotado al espacio real que esa imagen
			// tiene disponible hasta el borde del contenedor (que ya
			// respeta el padding del parent, ver containerWidth arriba),
			// según su propia posición. Sin este límite, el mismo rango
			// fijo de deriva (ej. ±50%) podía empujar una imagen cercana
			// al borde más allá del área de contenido real — ahora cada
			// imagen usa como máximo el margen que realmente tiene a cada
			// lado, así nunca invade el padding del parent, sin necesitar
			// overflow:hidden para lograrlo.
			var itemLeft = parseFloat( item.style.left ) || 0;
			var itemW = parseFloat( item.style.width ) || 1;

			// Cuánto puede moverse hacia cada lado sin pasar el borde del
			// contenedor, expresado como % del propio ancho de la imagen
			// (xPercent es relativo al ancho del elemento, no a px).
			var maxLeftPercent = -( itemLeft / itemW ) * 100;
			var maxRightPercent = ( ( containerWidth - ( itemLeft + itemW ) ) / itemW ) * 100;

			var rawDrift = -50 + seeded( index * 6.2 ) * 100; // -50 a 50, antes de acotar.
			var xTransform = Math.max( maxLeftPercent, Math.min( maxRightPercent, rawDrift ) );

			// Deriva horizontal — SOLO durante el ciclo "normal": desde que
			// la imagen entra por abajo hasta justo antes de empezar a
			// desaparecer (el mismo punto donde arranca el achicado, ver
			// abajo). Una vez que ese trigger termina, GSAP simplemente deja
			// el xPercent quieto en el valor que alcanzó — no sigue
			// corriéndose durante la desaparición.
			var driftTrigger = gsap.to( inner, {
				xPercent: xTransform,
				ease: "none",
				scrollTrigger: {
					trigger: item,
					start: "top bottom",
					end: disappearStart,
					scrub: true,
					invalidateOnRefresh: true,
				},
			} ).scrollTrigger;

			// Encogida a escala 0 — arranca justo donde termina la deriva de
			// arriba (el borde inferior del header, no el borde superior de
			// la pantalla) y termina cuando la imagen sale del todo.
			var scaleTrigger = gsap.to( inner, {
				scale: 0,
				ease: "none",
				scrollTrigger: {
					trigger: item,
					start: disappearStart,
					end: "bottom top",
					scrub: true,
					invalidateOnRefresh: true,
				},
			} ).scrollTrigger;

			item._pcAfterglowTriggers = [ driftTrigger, scaleTrigger ];
		} );
	}

	// Arma el mosaico y lo anima, pero SOLO si el contenedor ya tiene un
	// ancho real medible — si esto corre con el.clientWidth en 0 (el
	// wrapper de scroll suave del theme puede no haber terminado de
	// acomodarse en el momento exacto en que esto corre), TODAS las
	// imágenes salen con ancho/alto 0, y ScrollTrigger termina midiendo
	// cada trigger con start===end (0 píxeles de rango de scroll) — el
	// achicamiento pasaría de golpe en un solo pixel en vez de
	// progresivamente. Mismo patrón que waterfall.js/staggered.js.
	function tryBuild( el, items ) {
		if ( el.clientWidth <= 0 ) {
			return false;
		}

		buildScatter( el, items );
		applyMotion( el, items );
		el.classList.add( "pixelcore-gallery--afterglow-js" );

		return true;
	}

	function init( el ) {
		var items = el._pixelcoreItems || Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		el._pixelcoreItems = items;

		if ( ! items.length ) {
			return;
		}

		if ( tryBuild( el, items ) ) {
			return;
		}

		var attempts = 0;

		function retry() {
			attempts++;

			if ( tryBuild( el, items ) || attempts >= 10 ) {
				return;
			}

			requestAnimationFrame( retry );
		}

		requestAnimationFrame( retry );
	}

	init.onResize = function ( el ) {
		var items = el._pixelcoreItems;

		if ( ! items || ! items.length ) {
			return;
		}

		tryBuild( el, items );

		if ( window.ScrollTrigger ) {
			window.ScrollTrigger.refresh();
		}
	};

	window.PixelCoreGallery.registerLayout( "afterglow", init );
} )( window, document );
