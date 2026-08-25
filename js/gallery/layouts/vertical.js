/**
 * PixelCore Gallery — layout "vertical", con pin de GSAP ScrollTrigger.
 *
 * Todas las imágenes quedan apiladas exactamente en el mismo lugar (una
 * encima de otra). Mientras el usuario scrollea, la sección se "pinea" y
 * cada imagen va pasando por encima de la anterior en secuencia — al llegar
 * a la última, ScrollTrigger despinea solo y el scroll vertical continúa
 * normal. Mismo patrón que horizontal.js (pin en el padre, offset de header
 * fijo vía PixelCoreGallery.fixedHeaderOffset()), pero la animación mueve
 * cada imagen en Y en vez de mover un track en X.
 *
 * Sin GSAP/ScrollTrigger disponibles (ver register_assets() en
 * class-pixelcore-gallery.php), este módulo no hace nada y el layout se
 * queda con la lista vertical simple por CSS ya definida en
 * scss/blocks/gallery/_vertical.scss — nunca rompe.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	function init( el ) {
		if ( ! window.gsap || ! window.ScrollTrigger ) {
			return;
		}

		if ( el._pcVerticalInit ) {
			return;
		}

		var gsap = window.gsap;
		var ScrollTrigger = window.ScrollTrigger;

		gsap.registerPlugin( ScrollTrigger );

		var items = Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		if ( items.length < 2 ) {
			return; // Nada que apilar con 0 o 1 imagen.
		}

		el._pcVerticalInit = true;
		el.classList.add( "pixelcore-gallery--vertical-pin" );

		// Cada imagen apilada exactamente en el mismo lugar, en orden: la
		// primera visible desde el inicio, el resto esperando justo debajo
		// (yPercent:100) con z-index creciente — así, cuando suben, pasan
		// VISUALMENTE por encima de la anterior en vez de aparecer detrás.
		items.forEach( function ( item, index ) {
			gsap.set( item, {
				position: "absolute",
				inset: 0,
				zIndex: index + 1,
				yPercent: index === 0 ? 0 : 100,
			} );
		} );

		var pinTarget = el.parentElement || el;

		// Un "paso" de scroll por cada transición entre imágenes, del alto de
		// la propia galería — mismo criterio que la mayoría de demos de este
		// patrón (GSAP "ScrollTrigger vertical image gallery").
		function stepDistance() {
			return el.clientHeight || window.innerHeight;
		}

		var timeline = gsap.timeline( { paused: true } );

		for ( var i = 1; i < items.length; i++ ) {
			timeline.to( items[ i ], { yPercent: 0, ease: "none", duration: 1 }, i - 1 );
		}

		var scrollTrigger = ScrollTrigger.create( {
			trigger: pinTarget,
			start: function () {
				var offset = window.PixelCoreGallery.fixedHeaderOffset();

				return offset > 0 ? "top " + offset + "px" : "top top";
			},
			end: function () {
				return "+=" + stepDistance() * ( items.length - 1 );
			},
			pin: pinTarget,
			scrub: true,
			invalidateOnRefresh: true,
			animation: timeline,
		} );

		el._pcVerticalScrollTrigger = scrollTrigger;
	}

	init.onResize = function () {
		if ( window.ScrollTrigger ) {
			window.ScrollTrigger.refresh();
		}
	};

	window.PixelCoreGallery.registerLayout( "vertical", init );
} )( window, document );
