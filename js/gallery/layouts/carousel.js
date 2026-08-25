/**
 * PixelCore Gallery — layout "carousel" / slider.
 *
 * El scroll horizontal + snap lo hace el CSS (overflow-x, scroll-snap-type)
 * sobre un track INTERNO (.pixelcore-gallery__track) — no sobre el wrapper
 * que también contiene los botones prev/next. Si los botones vivieran
 * dentro del propio elemento con overflow-x:auto, al hacer scroll se
 * moverían junto con el contenido (son parte de la misma caja de scroll,
 * aunque estén position:absolute). Por eso este módulo envuelve los items
 * en un track aparte antes de agregar los botones como hermanos del track,
 * no hijos.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	// SVG provistos por el usuario (círculo + flecha), como hermanos fijos
	// del track — nunca se mueven con el scroll.
	var PREV_SVG =
		'<svg xmlns="http://www.w3.org/2000/svg" width="59" height="59" viewBox="0 0 59 59">' +
			'<g class="circle" fill="#fff" stroke="#707070" stroke-width="1">' +
				'<circle cx="29.5" cy="29.5" r="29.5" stroke="none"></circle>' +
				'<circle cx="29.5" cy="29.5" r="29" fill="none"></circle>' +
			'</g>' +
			'<path class="arrow" d="M10.436,0l-1.9,1.9L15.721,9.08H0v2.711H15.721L8.538,18.974l1.9,1.9L20.871,10.436Z" transform="translate(39.936 39.936) rotate(180)"></path>' +
		'</svg>';

	var NEXT_SVG =
		'<svg xmlns="http://www.w3.org/2000/svg" width="59" height="59" viewBox="0 0 59 59">' +
		'<g transform="translate(59 59) rotate(180)">' +
			'<g class="circle" fill="#fff" stroke="#707070" stroke-width="1">' +
				'<circle cx="29.5" cy="29.5" r="29.5" stroke="none"></circle>' +
				'<circle cx="29.5" cy="29.5" r="29" fill="none"></circle>' +
			'</g>' +
			'<path class="arrow" d="M10.436,0l-1.9,1.9L15.721,9.08H0v2.711H15.721L8.538,18.974l1.9,1.9L20.871,10.436Z" transform="translate(39.936 39.936) rotate(180)"></path>' +
		'</g>' +
	'</svg>';

	// Margen chico para redondeo de sub-pixel al comparar contra los bordes
	// del scroll (distintos navegadores devuelven scrollWidth/clientWidth
	// con decimales ligeramente distintos).
	var EDGE_EPSILON = 2;

	function isAtEnd( track ) {
		return track.scrollLeft + track.clientWidth >= track.scrollWidth - EDGE_EPSILON;
	}

	function isAtStart( track ) {
		return track.scrollLeft <= EDGE_EPSILON;
	}

	// Carrusel infinito: en vez de detenerse en los extremos, "next" desde
	// la última imagen vuelve a la primera y "prev" desde la primera salta
	// a la última.
	function scrollByOne( track, direction ) {
		if ( direction > 0 && isAtEnd( track ) ) {
			track.scrollTo( { left: 0, behavior: "smooth" } );
			return;
		}

		if ( direction < 0 && isAtStart( track ) ) {
			track.scrollTo( { left: track.scrollWidth - track.clientWidth, behavior: "smooth" } );
			return;
		}

		var item = track.querySelector( ".pixelcore-gallery__item" );
		var gap = parseInt( getComputedStyle( track ).getPropertyValue( "--pc-gallery-gap" ), 10 ) || 16;
		var amount = item ? item.getBoundingClientRect().width + gap : track.clientWidth * 0.8;

		track.scrollBy( { left: amount * direction, behavior: "smooth" } );
	}

	function init( el ) {
		if ( el.querySelector( ".pixelcore-gallery__track" ) ) {
			return;
		}

		el.classList.add( "pixelcore-gallery--carousel-js" );

		var items = Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );
		var track = document.createElement( "div" );
		track.className = "pixelcore-gallery__track";

		items.forEach( function ( item ) {
			track.appendChild( item );
		} );

		el.appendChild( track );

		var prev = document.createElement( "button" );
		prev.type = "button";
		prev.className = "pixelcore-gallery__nav pixelcore-gallery__nav--prev";
		prev.setAttribute( "aria-label", "Previous" );
		prev.innerHTML = PREV_SVG;

		var next = document.createElement( "button" );
		next.type = "button";
		next.className = "pixelcore-gallery__nav pixelcore-gallery__nav--next";
		next.setAttribute( "aria-label", "Next" );
		next.innerHTML = NEXT_SVG;

		prev.addEventListener( "click", function () {
			scrollByOne( track, -1 );
		} );

		next.addEventListener( "click", function () {
			scrollByOne( track, 1 );
		} );

		// Hermanos del track, no hijos: así quedan fijos aunque el track
		// scrollee horizontalmente.
		el.appendChild( prev );
		el.appendChild( next );
	}

	window.PixelCoreGallery.registerLayout( "carousel", init );
} )( window, document );
