/**
 * PixelCore Gallery — layout "justified" (estilo Flickr/justified-gallery).
 *
 * Empaqueta imágenes por fila hasta llenar el ancho del contenedor a una
 * altura de fila objetivo, escalando cada imagen según su aspect ratio real.
 * Vanilla JS, sin dependencias.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	var TARGET_ROW_HEIGHT = 220;
	var DEFAULT_ASPECT = 1.5;

	function readInt( styles, name, fallback ) {
		var value = parseInt( styles.getPropertyValue( name ), 10 );

		return isNaN( value ) || value <= 0 ? fallback : value;
	}

	function aspectOf( item ) {
		var img = item.querySelector( "img" );

		if ( img && img.naturalWidth && img.naturalHeight ) {
			return img.naturalWidth / img.naturalHeight;
		}

		return DEFAULT_ASPECT;
	}

	function layout( el ) {
		var items = el._pixelcoreItems || Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		el._pixelcoreItems = items;

		if ( ! items.length ) {
			return;
		}

		var styles = getComputedStyle( el );
		var gap = readInt( styles, "--pc-gallery-gap", 16 );
		var containerWidth = el.clientWidth;

		var row = [];
		var rowAspectSum = 0;

		function flushRow( isLast ) {
			if ( ! row.length ) {
				return;
			}

			var rowHeight = TARGET_ROW_HEIGHT;

			if ( ! isLast ) {
				var availableWidth = containerWidth - gap * ( row.length - 1 );
				rowHeight = availableWidth / rowAspectSum;
			}

			row.forEach( function ( entry ) {
				entry.item.style.flexBasis = ( entry.aspect * rowHeight ) + "px";
				entry.item.style.height = rowHeight + "px";
			} );

			row = [];
			rowAspectSum = 0;
		}

		items.forEach( function ( item ) {
			var aspect = aspectOf( item );

			row.push( { item: item, aspect: aspect } );
			rowAspectSum += aspect;

			var estimatedWidth = rowAspectSum * TARGET_ROW_HEIGHT + gap * ( row.length - 1 );

			if ( estimatedWidth >= containerWidth ) {
				flushRow( false );
			}
		} );

		flushRow( true );
	}

	function init( el ) {
		el.classList.add( "pixelcore-gallery--justified-js" );

		var images = el.querySelectorAll( ".pixelcore-gallery__image" );
		var pending = 0;

		Array.prototype.forEach.call( images, function ( img ) {
			if ( ! img.complete ) {
				pending++;
				img.addEventListener( "load", function () {
					pending--;
					if ( 0 === pending ) {
						layout( el );
					}
				} );
			}
		} );

		layout( el );
	}

	init.onResize = layout;

	window.PixelCoreGallery.registerLayout( "justified", init );
} )( window, document );
