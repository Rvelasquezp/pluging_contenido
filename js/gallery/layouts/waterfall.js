/**
 * PixelCore Gallery — layout "waterfall" (mosaico disperso, deriva vertical
 * independiente por imagen).
 *
 * Igual que afterglow.js, NO hay columnas ni CSS Grid por debajo — cada
 * imagen se posiciona de forma independiente (position:absolute, X/Y
 * propios) para lograr un collage disperso, no una grilla prolija. El
 * posicionamiento se calcula acá (JS), no en CSS, porque necesita el
 * ancho/alto real de cada imagen (que varía por foto) para decidir dónde
 * entra cada una sin que se choquen — ver el comentario grande de
 * buildScatter() más abajo (mismo algoritmo de "carriles" que
 * afterglow.js).
 *
 * La diferencia con Afterglow es la ANIMACIÓN: acá cada imagen SIEMPRE está
 * visible (nunca se disuelve ni se encoge a escala 0) — solo tiene su
 * propia deriva vertical continua y suave mientras atraviesa la pantalla:
 * algunas suben más rápido, otras más lento, cada una con su propia
 * velocidad y dirección — eso es lo que mantiene el espíritu "waterfall"
 * (cascada), ahora aplicado por imagen individual en vez de por columna.
 *
 * ANIMACIÓN — rediseñada a propósito para evitar el salto que daba la
 * versión anterior (un ScrollTrigger con scrub numérico POR IMAGEN): en
 * vez de eso, hay UN SOLO ScrollTrigger para toda la sección
 * (start:"top bottom" / end:"bottom top"), y el suavizado NO se lo pide a
 * GSAP (su "scrub" numérico puede arrancar de golpe en el primer scroll
 * real, en vez de suavizar desde el principio) — lo hacemos nosotros
 * mismos, a mano, con un lerp simple en cada frame (ver tick() más abajo):
 * se guarda el progreso "crudo" del scroll (0 a 1) y otro "suavizado" que
 * persigue al crudo un poquito en cada frame, sin importar qué tan grande
 * sea el salto entre un frame y el siguiente. Como el loop arranca desde
 * que la página carga (no desde el primer scroll del visitante), el
 * suavizado ya está "caliente" antes de que el usuario toque nada — nunca
 * hay un primer salto por partir de cero.
 *
 * Sin pin ni sticky, que en este sitio están rotos por el transform que el
 * ScrollSmoother del theme le aplica a un ancestro compartido.
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

		return w && h ? h / w : 3 / 4;
	}

	// "Carriles" verticales angostos (según --pc-gallery-cols-*): cada
	// imagen cae en uno por índice (round-robin). Dentro de su carril tiene
	// ancho propio, un corrimiento horizontal aleatorio (nunca se sale del
	// carril, así nunca choca con el vecino) y un espacio vertical propio
	// hasta la siguiente del mismo carril — nunca se alinean en filas ni
	// columnas parejas, aunque por debajo siga habiendo una estructura
	// simple que garantiza que nada se superponga.
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

	// Qué tan rápido el valor "suavizado" persigue al "crudo" en cada
	// frame (0 a 1 — más alto, alcanza más rápido; más bajo, más lag/más
	// suave). 0.09 es un lag chico pero notorio, se siente fluido sin
	// sentirse "atrasado".
	var LERP_FACTOR = 0.09;

	function applyMotion( el, items ) {
		if ( ! window.gsap || ! window.ScrollTrigger ) {
			return;
		}

		var gsap = window.gsap;
		var ScrollTrigger = window.ScrollTrigger;

		gsap.registerPlugin( ScrollTrigger );

		if ( el._pcWaterfallTrigger ) {
			el._pcWaterfallTrigger.kill();
		}

		if ( el._pcWaterfallTick ) {
			gsap.ticker.remove( el._pcWaterfallTick );
		}

		var params = items.map( function ( item, index ) {
			var inner = item.querySelector( ":scope > .pixelcore-gallery__waterfall-inner" );

			if ( ! inner ) {
				inner = document.createElement( "div" );
				inner.className = "pixelcore-gallery__waterfall-inner";

				while ( item.firstChild ) {
					inner.appendChild( item.firstChild );
				}

				item.appendChild( inner );
			}

			// Cada imagen tiene su propia velocidad y dirección vertical —
			// nada calcado entre imágenes vecinas. Un empujón horizontal
			// chico también propio, para que la deriva no se sienta
			// perfectamente vertical/mecánica.
			return {
				inner: inner,
				vDir: seeded( index * 4.6 ) > 0.5 ? 1 : -1,
				vDrift: 50 + seeded( index * 6.2 ) * 130, // 50 a 180px.
				hDir: seeded( index * 8.4 ) > 0.5 ? 1 : -1,
				hDrift: 6 + seeded( index * 9.1 ) * 18, // 6 a 24px.
			};
		} );

		var progress = { raw: 0, smooth: 0 };

		// En cuanto haya un refresh (al crear el trigger, o si cambia el
		// alto de la página más adelante), el valor "suavizado" salta
		// directo al "crudo" — así arranca siempre ya en el lugar
		// correcto, nunca desde 0 corriendo a alcanzar el valor real.
		function syncNow( self ) {
			progress.raw = self.progress;
			progress.smooth = self.progress;
		}

		var trigger = ScrollTrigger.create( {
			trigger: el,
			start: "top bottom",
			end: "bottom top",
			invalidateOnRefresh: true,
			onUpdate: function ( self ) {
				progress.raw = self.progress;
			},
			onRefresh: syncNow,
		} );

		function tick() {
			// Lerp manual: el valor mostrado persigue al progreso real del
			// scroll un poquito en cada frame, SIEMPRE — no depende de que
			// GSAP "note" el scroll para empezar a suavizar (ahí es donde
			// se producía el salto: la primera vez que el visitante
			// scrolleaba). Un salto grande en el progreso crudo solo hace
			// que tarde un poco más en alcanzarlo, nunca que aparezca de
			// golpe.
			progress.smooth += ( progress.raw - progress.smooth ) * LERP_FACTOR;

			var t = progress.smooth;

			params.forEach( function ( p ) {
				gsap.set( p.inner, {
					y: p.vDir * p.vDrift * ( 1 - 2 * t ),
					x: p.hDir * p.hDrift * ( 1 - 2 * t ),
				} );
			} );
		}

		gsap.ticker.add( tick );

		el._pcWaterfallTrigger = trigger;
		el._pcWaterfallTick = tick;
	}

	// Arma el mosaico y lo anima, pero SOLO si el contenedor ya tiene un
	// ancho real medible. El ancho puede no estar asentado todavía en el
	// momento exacto en que esto corre (ej. el wrapper de scroll suave del
	// theme todavía terminando de acomodarse) — construir con
	// el.clientWidth en 0 (o casi) da posiciones/anchos basura (todo
	// amontonado en 0,0) que después "se corrigen" de golpe apenas algo
	// vuelve a medir bien — y eso es justo lo que se veía como el salto al
	// primer scroll. Antes de tener un ancho real, ni siquiera se agrega la
	// clase --waterfall-js (así el fade-in de opacidad de _waterfall.scss
	// no llega a mostrar ese estado roto).
	function tryBuild( el, items ) {
		if ( el.clientWidth <= 0 ) {
			return false;
		}

		buildScatter( el, items );
		applyMotion( el, items );
		el.classList.add( "pixelcore-gallery--waterfall-js" );

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

		// El ancho todavía no estaba asentado (tryBuild devolvió false) —
		// reintenta en el próximo frame, unas pocas veces nomás. A
		// propósito NO es un ResizeObserver sobre "el": buildScatter() le
		// pone su propio el.style.height, y ese cambio de alto puede hacer
		// aparecer/desaparecer la barra de scroll de la página — eso
		// cambia el.clientWidth como efecto secundario de nuestro propio
		// cambio, y un observer mirando ese mismo ancho reconstruiría en
		// bucle sin parar (eso fue lo que pasó: el salto se volvió
		// constante en vez de solo al principio). Un reintento simple y
		// acotado evita ese problema por diseño.
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
	};

	window.PixelCoreGallery.registerLayout( "waterfall", init );
} )( window, document );
