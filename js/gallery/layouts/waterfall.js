/**
 * PixelCore Gallery — layout "waterfall" (parallax por columna).
 *
 * Arma N columnas balanceadas (mismo algoritmo que masonry.js) y, si GSAP +
 * ScrollTrigger están disponibles, anima CADA COLUMNA COMPLETA a su propia
 * velocidad relativa mientras la sección entera pasa por la pantalla: unas
 * columnas se adelantan un poco, otras se atrasan un poco respecto al
 * scroll normal — esa diferencia de velocidades es lo que da la sensación
 * de profundidad ("waterfall").
 *
 * A propósito, esto es una DERIVA relativa, no una "ventana" que recorta y
 * revela contenido oculto: todas las imágenes de todas las columnas están
 * siempre presentes en el flujo normal de la página (nada se esconde ni se
 * recorta — ver _waterfall.scss, la galería ya no tiene height:100vh ni
 * overflow:hidden). Cada columna solo se corre un poco de su posición de
 * reposo, en px calculados a partir de la altura del viewport, según qué
 * tan lejos esté su velocidad de 1.0 (la velocidad "neutra": esa columna no
 * se mueve nada).
 *
 * Todas las columnas comparten el MISMO trigger (la galería completa, no
 * cada columna) con start:"top bottom" / end:"bottom top" / scrub — así se
 * mueven en sincro relativo entre sí a medida que la sección scrollea, sin
 * pin ni sticky. En este sitio, pin/sticky están rotos por el transform que
 * el ScrollSmoother del theme le aplica a un ancestro compartido (ver notas
 * de horizontal/vertical/fullscreen) — este layout lo evita por completo
 * desde el diseño, no necesita ningún workaround.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	// Velocidad relativa de cada columna, cíclica (columna 1, 5, 9… vuelve a
	// usar la primera velocidad, etc.). 1.0 = no se mueve (neutra); <1 se
	// atrasa (se corre hacia abajo); >1 se adelanta (se corre hacia arriba).
	var SPEEDS = [ 0.6, 1.0, 1.4, 0.8 ];

	// Cuánto se corre, como máximo, la columna que más se aleja de la
	// velocidad neutra (1.0), en % de la altura del viewport — una deriva
	// sutil, no un recorrido que dependa de cuánto contenido de más tenga
	// la columna (ya no hace falta: nada se recorta).
	var MAX_DRIFT_VH = 15;

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

	function speedClass( speed ) {
		if ( speed < 0.85 ) {
			return "pixelcore-gallery__waterfall-col--slow";
		}

		if ( speed > 1.15 ) {
			return "pixelcore-gallery__waterfall-col--fast";
		}

		return "pixelcore-gallery__waterfall-col--medium";
	}

	function buildColumns( el, items ) {
		var cols = readInt( getComputedStyle( el ), "--pc-gallery-cols-" + currentBreakpointName(), 3 );

		var existingCols = el.querySelectorAll( ".pixelcore-gallery__waterfall-col" );
		Array.prototype.forEach.call( existingCols, function ( col ) {
			col.remove();
		} );

		var columns = [];

		for ( var i = 0; i < cols; i++ ) {
			var speed = SPEEDS[ i % SPEEDS.length ];
			var colEl = document.createElement( "div" );

			colEl.className = "pixelcore-gallery__waterfall-col " + speedClass( speed );
			colEl.style.transform = "";
			colEl.dataset.pcSpeed = String( speed );

			el.appendChild( colEl );
			columns.push( colEl );
		}

		items.forEach( function ( item, index ) {
			columns[ index % cols ].appendChild( item );
		} );

		return columns;
	}

	function applyParallax( el, columns ) {
		if ( ! window.gsap || ! window.ScrollTrigger ) {
			return;
		}

		var gsap = window.gsap;
		var ScrollTrigger = window.ScrollTrigger;

		gsap.registerPlugin( ScrollTrigger );

		var maxDeviation = SPEEDS.reduce( function ( max, speed ) {
			return Math.max( max, Math.abs( speed - 1 ) );
		}, 0 );

		var driftPx = ( MAX_DRIFT_VH / 100 ) * window.innerHeight;

		columns.forEach( function ( col ) {
			if ( col._pcWaterfallTrigger ) {
				col._pcWaterfallTrigger.kill();
				gsap.set( col, { y: 0 } );
			}

			var speed = parseFloat( col.dataset.pcSpeed ) || 1;
			var deviation = maxDeviation > 0 ? ( speed - 1 ) / maxDeviation : 0;
			var movement = -deviation * driftPx;

			var tween = gsap.to( col, {
				y: movement,
				ease: "none",
				scrollTrigger: {
					trigger: el,
					start: "top bottom",
					end: "bottom top",
					scrub: true,
				},
			} );

			col._pcWaterfallTrigger = tween.scrollTrigger;
		} );
	}

	function init( el ) {
		el.classList.add( "pixelcore-gallery--waterfall-js" );

		var items = el._pixelcoreItems || Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		el._pixelcoreItems = items;

		if ( ! items.length ) {
			return;
		}

		var columns = buildColumns( el, items );
		applyParallax( el, columns );
	}

	init.onResize = function ( el ) {
		var items = el._pixelcoreItems;

		if ( ! items || ! items.length ) {
			return;
		}

		var columns = buildColumns( el, items );
		applyParallax( el, columns );

		if ( window.ScrollTrigger ) {
			window.ScrollTrigger.refresh();
		}
	};

	window.PixelCoreGallery.registerLayout( "waterfall", init );
} )( window, document );
