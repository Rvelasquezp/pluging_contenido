/**
 * PixelCore Gallery — layout "afterglow" (mosaico disperso, deriva y
 * disolución independiente por imagen).
 *
 * A diferencia del resto de layouts (grid/masonry/waterfall), acá NO hay
 * ningún sistema de columnas ni CSS Grid por debajo — cada imagen se
 * posiciona de forma independiente (position:absolute, X/Y propios) para
 * lograr un collage disperso, no una grilla prolija. El posicionamiento se
 * calcula acá (JS), no en CSS, porque necesita el ancho/alto real de cada
 * imagen (que varía por foto) para decidir dónde entra cada una sin que se
 * choquen.
 *
 * "Carriles" (lanes): la galería se divide en N franjas verticales
 * angostas (según --pc-gallery-cols-*), y cada imagen cae en un carril por
 * índice (round-robin). DENTRO de su carril, cada imagen tiene:
 *   - un ancho propio, variable (ciclo grande/chico + un poco de jitter).
 *   - un corrimiento horizontal aleatorio (nunca se sale del carril, así
 *     nunca choca con el carril vecino).
 *   - un espacio vertical propio hasta la siguiente imagen del mismo
 *     carril (gap fijo + un extra aleatorio).
 * El resultado: nunca se alinean en filas/columnas parejas, aunque por
 * debajo siga habiendo una estructura simple (carriles) que garantiza que
 * ninguna imagen se superponga con otra.
 *
 * El "aleatorio" es DETERMINÍSTICO (una función seno con el índice como
 * semilla, no Math.random()) — mismo layout siempre en la misma página,
 * no cambia composición cada vez que se refresca.
 *
 * Animación (GSAP + ScrollTrigger, si están disponibles): cada imagen es
 * su propio trigger, con tres cosas pasando en simultáneo mientras
 * atraviesa la pantalla —
 *   1. Entra corriéndose desde un costado (dirección propia, no alternada
 *      par/impar) agrandándose desde escala 0, se mantiene normal, y al
 *      salir se corre hacia el lado opuesto encogiéndose de nuevo — la
 *      "disolución". La distancia de corrida (DRIFT) y la dirección son
 *      propias de cada imagen, no todas iguales.
 *   2. Una deriva vertical suave y continua durante TODO el recorrido
 *      (no solo al entrar/salir) — el efecto "floating".
 * Nada de esto pinea nada: cada imagen es su propio ScrollTrigger con
 * start:"top bottom" / end:"bottom top" / scrub, igual que
 * horizontal/vertical/waterfall — no depende de pin/sticky, que en este
 * sitio están rotos por el transform del ScrollSmoother del theme.
 *
 * OJO: el trigger nunca es el mismo elemento que GSAP transforma. El ITEM
 * (con su position:absolute/left/top/width ya calculados acá) es la
 * referencia ESTABLE que mide ScrollTrigger; el contenido va envuelto en
 * un "inner" que es lo único que se anima (scale/xPercent/yPercent) — si
 * el trigger fuera el mismo elemento animado, ScrollTrigger lo mediría en
 * cuanto se crea el timeline, que es justo cuando ya está en escala 0, y
 * terminaría calculando un rango de scroll casi nulo (la animación se
 * vería como un salto instantáneo en vez de una transición).
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	function currentBreakpointName() {
		if ( window.PixelCoreAnimations && window.PixelCoreAnimations.currentBreakpoint ) {
			return window.PixelCoreAnimations.currentBreakpoint();
		}

		var width = window.innerWidth;

		if ( width <= 768 ) {
			return "mobile";
		}

		if ( width <= 1024 ) {
			return "tablet";
		}

		return "desktop";
	}

	function readInt( styles, name, fallback ) {
		var value = parseInt( styles.getPropertyValue( name ), 10 );

		return isNaN( value ) || value <= 0 ? fallback : value;
	}

	// Pseudo-aleatorio determinístico (0 a 1) a partir de un número semilla
	// — mismo resultado siempre para el mismo índice, no cambia entre
	// cargas de página.
	function seeded( seed ) {
		var x = Math.sin( seed * 12.9898 ) * 43758.5453;

		return x - Math.floor( x );
	}

	// Tamaño de cada imagen, como fracción del ancho de su carril — ciclo
	// grande/chico/mediano (variedad editorial) más un poco de jitter fino.
	var SIZE_CLASSES = [ 1, 0.68, 0.85, 0.55 ];

	function widthRatio( index ) {
		var base = SIZE_CLASSES[ index % SIZE_CLASSES.length ];
		var jitter = 0.9 + seeded( index * 3.1 ) * 0.2;

		return Math.min( 1, base * jitter );
	}

	function intrinsicRatio( item ) {
		var img = item.querySelector( "img" );
		var w = img && parseInt( img.getAttribute( "width" ), 10 );
		var h = img && parseInt( img.getAttribute( "height" ), 10 );

		return w && h ? h / w : 9 / 16;
	}

	function buildScatter( el, items ) {
		var styles = getComputedStyle( el );
		var lanes = readInt( styles, "--pc-gallery-cols-" + currentBreakpointName(), 4 );
		var gap = readInt( styles, "--pc-gallery-gap", 16 );
		var containerWidth = el.clientWidth;
		var laneWidth = containerWidth / lanes;
		var cursors = new Array( lanes ).fill( 0 );

		items.forEach( function ( item, index ) {
			var lane = index % lanes;
			var w = laneWidth * widthRatio( index );
			var h = w * intrinsicRatio( item );

			var maxJitterX = Math.max( laneWidth - w, 0 );
			var x = lane * laneWidth + seeded( index * 7.7 ) * maxJitterX;

			var extraGap = gap + seeded( index * 5.3 ) * gap * 2.5;
			var y = cursors[ lane ] + ( 0 === cursors[ lane ] ? seeded( index * 2.2 ) * gap * 3 : extraGap );

			item.style.position = "absolute";
			item.style.left = x + "px";
			item.style.top = y + "px";
			item.style.width = w + "px";

			cursors[ lane ] = y + h;
		} );

		el.style.height = Math.max.apply( null, cursors ) + "px";
	}

	function applyMotion( items ) {
		if ( ! window.gsap || ! window.ScrollTrigger ) {
			return;
		}

		var gsap = window.gsap;
		var ScrollTrigger = window.ScrollTrigger;

		gsap.registerPlugin( ScrollTrigger );

		items.forEach( function ( item, index ) {
			if ( item._pcAfterglowTrigger ) {
				item._pcAfterglowTrigger.kill();
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

			// Cada imagen tiene su propia dirección, distancia de corrida y
			// deriva vertical — nada calcado entre imágenes vecinas.
			var direction = seeded( index * 4.6 ) > 0.5 ? 1 : -1;
			var drift = 35 + seeded( index * 6.2 ) * 55; // 35% a 90%.
			var floatDir = seeded( index * 8.4 ) > 0.5 ? 1 : -1;
			var floatAmount = 6 + seeded( index * 9.1 ) * 14; // 6% a 20%.

			gsap.set( inner, {
				transformOrigin: direction > 0 ? "left center" : "right center",
			} );

			var timeline = gsap.timeline( {
				scrollTrigger: {
					trigger: item,
					start: "top bottom",
					end: "bottom top",
					// Número (no true): con scrub:true la animación sigue el
					// scroll 1:1, así que un scroll rápido/brusco se ve igual
					// de brusco. Con un número, GSAP interpola (lerp) hacia la
					// posición objetivo en vez de saltar directo — 3s de
					// colchón para que incluso un scroll muy brusco se vea
					// progresivo, nunca de golpe.
					scrub: 3,
				},
			} );

			// ease "power2" (no "none") en la entrada/salida a propósito: la
			// escala no crece/decrece a velocidad pareja, arranca/termina
			// más lento — se siente orgánico en vez de mecánico, reforzando
			// el suavizado del scrub de arriba.
			timeline
				.fromTo(
					inner,
					{ xPercent: direction * drift, scale: 0 },
					{ xPercent: 0, scale: 1, ease: "power2.out", duration: 0.3 },
					0
				)
				.to( inner, { xPercent: 0, scale: 1, ease: "none", duration: 0.4 } )
				.to( inner, { xPercent: -direction * drift, scale: 0, ease: "power2.in", duration: 0.3 } )
				// Deriva vertical continua ("floating"), en paralelo a lo
				// anterior — no está atada a las mismas 3 etapas, dura todo
				// el recorrido.
				.fromTo(
					inner,
					{ yPercent: floatDir * floatAmount },
					{ yPercent: -floatDir * floatAmount, ease: "none", duration: 1 },
					0
				);

			item._pcAfterglowTrigger = timeline.scrollTrigger;
		} );
	}

	function init( el ) {
		el.classList.add( "pixelcore-gallery--afterglow-js" );

		var items = el._pixelcoreItems || Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		el._pixelcoreItems = items;

		if ( ! items.length ) {
			return;
		}

		buildScatter( el, items );
		applyMotion( items );
	}

	init.onResize = function ( el ) {
		var items = el._pixelcoreItems;

		if ( ! items || ! items.length ) {
			return;
		}

		buildScatter( el, items );
		applyMotion( items );

		if ( window.ScrollTrigger ) {
			window.ScrollTrigger.refresh();
		}
	};

	window.PixelCoreGallery.registerLayout( "afterglow", init );
} )( window, document );
