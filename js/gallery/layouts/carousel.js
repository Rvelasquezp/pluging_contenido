/**
 * PixelCore Gallery — layout "carousel" / slider.
 *
 * El scroll horizontal + snap lo hace el CSS (overflow-x, scroll-snap-type)
 * — así el swipe táctil funciona nativo, gratis, sin JS. Este módulo solo
 * agrega los botones prev/next y el scroll suave al hacer click en ellos.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	function scrollByOne( track, direction ) {
		var item = track.querySelector( ".pixelcore-gallery__item" );
		var gap = parseInt( getComputedStyle( track ).getPropertyValue( "--pc-gallery-gap" ), 10 ) || 16;
		var amount = item ? item.getBoundingClientRect().width + gap : track.clientWidth * 0.8;

		track.scrollBy( { left: amount * direction, behavior: "smooth" } );
	}

	function init( el ) {
		if ( el.querySelector( ".pixelcore-gallery__nav" ) ) {
			return;
		}

		el.classList.add( "pixelcore-gallery--carousel-js" );

		var prev = document.createElement( "button" );
		prev.type = "button";
		prev.className = "pixelcore-gallery__nav pixelcore-gallery__nav--prev";
		prev.setAttribute( "aria-label", "Previous" );
		prev.innerHTML = "&#8249;";

		var next = document.createElement( "button" );
		next.type = "button";
		next.className = "pixelcore-gallery__nav pixelcore-gallery__nav--next";
		next.setAttribute( "aria-label", "Next" );
		next.innerHTML = "&#8250;";

		prev.addEventListener( "click", function () {
			scrollByOne( el, -1 );
		} );

		next.addEventListener( "click", function () {
			scrollByOne( el, 1 );
		} );

		el.appendChild( prev );
		el.appendChild( next );
	}

	window.PixelCoreGallery.registerLayout( "carousel", init );
} )( window, document );
