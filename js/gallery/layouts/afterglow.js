/**
 * PixelCore Gallery — layout "afterglow" (deriva y disolución por imagen).
 *
 * Mosaico de imágenes en un solo CSS Grid (celdas de distinto tamaño según
 * su posición, ver _afterglow.scss). Si GSAP + ScrollTrigger están
 * disponibles, cada imagen anima en 3 tramos mientras atraviesa la pantalla
 * (scrub, un timeline por imagen):
 *
 *   1. Entra corriéndose desde un costado, agrandándose desde escala 0.
 *   2. Se mantiene normal (posición y escala reales) mientras está visible.
 *   3. Al salir, se corre hacia el lado OPUESTO mientras se encoge de
 *      nuevo a escala 0 — la "disolución".
 *
 * La dirección alterna par/impar (por índice del item) para que las
 * imágenes vecinas no se corran todas para el mismo lado.
 *
 * CADA IMAGEN es su propio ScrollTrigger (trigger: el item mismo, no la
 * sección) — no hace falta pinear nada. En este sitio, pin/sticky están
 * rotos por el transform que el ScrollSmoother del theme le aplica a un
 * ancestro compartido (ver notas de horizontal/vertical/fullscreen/
 * waterfall) — este layout lo evita por completo desde el diseño.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	// Cuánto se corre horizontalmente al entrar/salir, en % del propio ancho
	// del item (xPercent — no depende del tamaño real de cada caja).
	var DRIFT_PERCENT = 60;

	function applyAfterglow( el, items ) {
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

			var direction = 0 === index % 2 ? 1 : -1;

			gsap.set( item, {
				transformOrigin: direction > 0 ? "left center" : "right center",
			} );

			var timeline = gsap.timeline( {
				scrollTrigger: {
					trigger: item,
					start: "top bottom",
					end: "bottom top",
					scrub: true,
				},
			} );

			timeline
				.fromTo(
					item,
					{ xPercent: direction * DRIFT_PERCENT, scale: 0 },
					{ xPercent: 0, scale: 1, ease: "none", duration: 0.25 }
				)
				.to( item, { xPercent: 0, scale: 1, ease: "none", duration: 0.5 } )
				.to( item, { xPercent: -direction * DRIFT_PERCENT, scale: 0, ease: "none", duration: 0.25 } );

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

		applyAfterglow( el, items );
	}

	init.onResize = function ( el ) {
		if ( window.ScrollTrigger ) {
			window.ScrollTrigger.refresh();
		}
	};

	window.PixelCoreGallery.registerLayout( "afterglow", init );
} )( window, document );
