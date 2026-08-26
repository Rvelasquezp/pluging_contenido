/**
 * PixelCore Gallery — layout "thumbnail".
 *
 * Imagen principal grande + una tira de miniaturas clickeables debajo. Click
 * en una miniatura cambia cuál imagen se muestra en grande — click en la
 * imagen grande abre el lightbox (reutiliza la delegación de clicks que ya
 * hace core.js sobre [data-cp-gallery-index], sin tocar nada ahí).
 *
 * Vanilla JS, sin dependencias. Sin este script, el layout degrada a un
 * grid simple de cuadrados por CSS (ver scss/blocks/gallery/_thumbnail.scss).
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	function setActive( items, thumbs, index ) {
		items.forEach( function ( item, i ) {
			item.classList.toggle( "is-active", i === index );
		} );

		Array.prototype.forEach.call( thumbs, function ( thumb, i ) {
			thumb.classList.toggle( "is-active", i === index );
		} );
	}

	function init( el ) {
		if ( el.querySelector( ".pixelcore-gallery__thumbnail-strip" ) ) {
			return;
		}

		var items = Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		if ( items.length < 2 ) {
			return; // Nada que navegar con 0 o 1 imagen.
		}

		el.classList.add( "pixelcore-gallery--thumbnail-js" );

		var main = document.createElement( "div" );
		main.className = "pixelcore-gallery__thumbnail-main";

		var strip = document.createElement( "div" );
		strip.className = "pixelcore-gallery__thumbnail-strip";

		items.forEach( function ( item, index ) {
			main.appendChild( item );

			var sourceImg = item.querySelector( "img" );

			var thumb = document.createElement( "button" );
			thumb.type = "button";
			thumb.className = "pixelcore-gallery__thumb";
			thumb.setAttribute( "aria-label", sourceImg && sourceImg.alt ? sourceImg.alt : "Image " + ( index + 1 ) );

			if ( sourceImg ) {
				var thumbImg = document.createElement( "img" );
				thumbImg.src = sourceImg.currentSrc || sourceImg.src;
				thumbImg.alt = "";
				thumb.appendChild( thumbImg );
			}

			thumb.addEventListener( "click", function () {
				setActive( items, strip.children, index );
			} );

			strip.appendChild( thumb );
		} );

		el.appendChild( main );
		el.appendChild( strip );

		setActive( items, strip.children, 0 );
	}

	window.PixelCoreGallery.registerLayout( "thumbnail", init );
} )( window, document );
