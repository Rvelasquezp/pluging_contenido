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
 * Loop infinito SIN salto visible: se clona la primera imagen y se agrega
 * al final del track, y se clona la última y se agrega al principio. Así,
 * al hacer "next" desde la última imagen real, el scroll avanza de forma
 * natural hacia el clon (que se ve idéntico a la primera) — y en cuanto esa
 * animación termina, se reposiciona instantáneamente (sin transición) sobre
 * la imagen real correspondiente. Como el clon y la imagen real son
 * visualmente iguales, ese salto instantáneo es imperceptible. Es la misma
 * técnica que usan los carruseles infinitos "de verdad" (Swiper, Slick, etc).
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

	function itemGap( track ) {
		return parseInt( getComputedStyle( track ).getPropertyValue( "--pc-gallery-gap" ), 10 ) || 16;
	}

	function itemStep( track ) {
		var item = track.querySelector( ".pixelcore-gallery__item" );

		return item ? item.getBoundingClientRect().width + itemGap( track ) : track.clientWidth * 0.8;
	}

	// Posición de scroll a la que hay que llevar el track para que "item"
	// quede exactamente donde está ahora (usado para reposicionar sobre la
	// imagen real después de haber scrolleado visualmente hasta su clon).
	function scrollLeftFor( track, item ) {
		var trackRect = track.getBoundingClientRect();
		var itemRect = item.getBoundingClientRect();

		return track.scrollLeft + ( itemRect.left - trackRect.left );
	}

	// Después de un scroll (animado), si terminamos mostrando el clon del
	// extremo opuesto, reposiciona instantáneamente sobre la imagen real
	// equivalente. Sin animación en este paso — por eso es invisible.
	function fixLoopWhenSettled( track ) {
		var done = false;

		function fix() {
			if ( done ) {
				return;
			}

			done = true;
			track.removeEventListener( "scrollend", fix );

			if ( isAtEnd( track ) && track._pcRealFirst ) {
				track.scrollLeft = scrollLeftFor( track, track._pcRealFirst );
			} else if ( isAtStart( track ) && track._pcRealLast ) {
				track.scrollLeft = scrollLeftFor( track, track._pcRealLast );
			}
		}

		if ( "onscrollend" in window ) {
			track.addEventListener( "scrollend", fix );
		} else {
			// Respaldo para navegadores sin soporte de "scrollend": un poco
			// más que la duración típica del scroll suave nativo.
			setTimeout( fix, 500 );
		}
	}

	function scrollStep( track, direction ) {
		track.scrollBy( { left: itemStep( track ) * direction, behavior: "smooth" } );
		fixLoopWhenSettled( track );
	}

	function init( el ) {
		if ( el.querySelector( ".pixelcore-gallery__track" ) ) {
			return;
		}

		el.classList.add( "pixelcore-gallery--carousel-js" );

		var items = Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		if ( ! items.length ) {
			return;
		}

		var track = document.createElement( "div" );
		track.className = "pixelcore-gallery__track";

		items.forEach( function ( item ) {
			track.appendChild( item );
		} );

		el.appendChild( track );

		// Clones para el loop infinito (ver comentario de cabecera). Con una
		// sola imagen no hay nada que clonar/loopear.
		if ( items.length > 1 ) {
			var firstClone = items[ 0 ].cloneNode( true );
			var lastClone = items[ items.length - 1 ].cloneNode( true );

			firstClone.setAttribute( "aria-hidden", "true" );
			lastClone.setAttribute( "aria-hidden", "true" );

			track.appendChild( firstClone );
			track.insertBefore( lastClone, track.firstChild );

			track._pcRealFirst = items[ 0 ];
			track._pcRealLast = items[ items.length - 1 ];

			// Arranca mostrando la primera imagen real (no el clon del
			// último que quedó antepuesto) — sin animación, antes de que se
			// vea nada.
			track.scrollLeft = scrollLeftFor( track, track._pcRealFirst );
		}

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
			scrollStep( track, -1 );
		} );

		next.addEventListener( "click", function () {
			scrollStep( track, 1 );
		} );

		// Hermanos del track, no hijos: así quedan fijos aunque el track
		// scrollee horizontalmente.
		el.appendChild( prev );
		el.appendChild( next );
	}

	window.PixelCoreGallery.registerLayout( "carousel", init );
} )( window, document );
