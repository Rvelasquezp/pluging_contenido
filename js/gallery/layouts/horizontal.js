/**
 * PixelCore Gallery — layout "horizontal", con pin de GSAP ScrollTrigger.
 *
 * Mientras el usuario scrollea verticalmente, la sección se "pinea" (queda
 * fija en pantalla) y ese mismo scroll mueve el track de imágenes en
 * horizontal — al llegar a la última imagen, ScrollTrigger despinea solo y
 * el scroll vertical continúa normal. Patrón estándar de GSAP para
 * secciones horizontales ("scroll-jacking" controlado).
 *
 * Sin GSAP/ScrollTrigger disponibles (ver register_assets() en
 * class-pixelcore-gallery.php — solo se agregan como dependencia si
 * "Enable GSAP"/"Enable ScrollTrigger" están activos en Settings), este
 * módulo no hace nada y el layout se queda con el scroll horizontal nativo
 * ya definido en scss/blocks/gallery/_horizontal.scss — nunca rompe.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	function scrollDistance( el, track ) {
		return Math.max( track.scrollWidth - el.clientWidth, 0 );
	}

	function init( el ) {
		if ( ! window.gsap || ! window.ScrollTrigger ) {
			return;
		}

		if ( el.querySelector( ".pixelcore-gallery__track" ) ) {
			return;
		}

		var gsap = window.gsap;
		var ScrollTrigger = window.ScrollTrigger;

		gsap.registerPlugin( ScrollTrigger );

		var items = Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		if ( items.length < 2 ) {
			return; // Nada que desplazar horizontalmente con 0 o 1 imagen.
		}

		var track = document.createElement( "div" );
		track.className = "pixelcore-gallery__track";

		items.forEach( function ( item ) {
			track.appendChild( item );
		} );

		el.appendChild( track );
		el.classList.add( "pixelcore-gallery--horizontal-pin" );

		// Se pinea el PADRE de la galería, no la galería misma. Dos motivos:
		// 1) El padre normalmente incluye el heading/spacer alrededor de la
		//    galería (ver markup del bloque Group que la envuelve), así que
		//    pinear ese contenedor más alto deja ver todo ese contexto
		//    mientras las imágenes se desplazan, en vez de fijar solo una
		//    tira angosta del alto de una fila.
		// 2) Pinear el MISMO elemento que además tiene overflow:hidden (la
		//    galería, necesario para la "ventana" del slide) puede dar
		//    problemas de render en algunos navegadores — GSAP transforma/
		//    fija el elemento pineado, y combinarlo con su propio recorte
		//    interno es justo el tipo de mezcla que conviene evitar.
		// Separando ambos roles (el padre se pinea, la galería solo recorta)
		// se evita esa combinación.
		var pinTarget = el.parentElement || el;

		var tween = gsap.to( track, {
			x: function () {
				return -scrollDistance( el, track );
			},
			ease: "none",
		} );

		var scrollTrigger = ScrollTrigger.create( {
			trigger: pinTarget,
			start: function () {
				var offset = window.PixelCoreGallery.fixedHeaderOffset();

				return offset > 0 ? "top " + offset + "px" : "top top";
			},
			end: function () {
				return "+=" + scrollDistance( el, track );
			},
			pin: pinTarget,
			scrub: true,
			invalidateOnRefresh: true,
			animation: tween,
		} );

		el._pcHorizontalScrollTrigger = scrollTrigger;
	}

	init.onResize = function () {
		if ( window.ScrollTrigger ) {
			window.ScrollTrigger.refresh();
		}
	};

	window.PixelCoreGallery.registerLayout( "horizontal", init );
} )( window, document );
