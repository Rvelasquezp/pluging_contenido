/**
 * PixelCore Gallery — layout "masonry".
 *
 * Empaqueta los items en N columnas balanceadas por altura acumulada
 * (siempre se agrega al item a la columna más corta). Vanilla JS, sin
 * dependencias — se reconstruye por completo en cada resize (debounced por
 * js/gallery/core.js), lo cual es más simple y robusto que mover nodos
 * incrementalmente.
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

	function layout( el ) {
		var items = el._pixelcoreItems || Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		el._pixelcoreItems = items;

		if ( ! items.length ) {
			return;
		}

		var styles = getComputedStyle( el );
		var cols = readInt( styles, "--pc-gallery-cols-" + currentBreakpointName(), 3 );

		var existingCols = el.querySelectorAll( ".pixelcore-gallery__masonry-col" );
		Array.prototype.forEach.call( existingCols, function ( col ) {
			col.remove();
		} );

		var columns = [];

		for ( var i = 0; i < cols; i++ ) {
			var colEl = document.createElement( "div" );
			colEl.className = "pixelcore-gallery__masonry-col";
			el.appendChild( colEl );
			columns.push( colEl );
		}

		items.forEach( function ( item ) {
			var shortest = columns[ 0 ];

			columns.forEach( function ( col ) {
				if ( col.offsetHeight < shortest.offsetHeight ) {
					shortest = col;
				}
			} );

			shortest.appendChild( item );
		} );
	}

	function init( el ) {
		el.classList.add( "pixelcore-gallery--masonry-js" );
		layout( el );
	}

	init.onResize = layout;

	window.PixelCoreGallery.registerLayout( "masonry", init );
} )( window, document );
