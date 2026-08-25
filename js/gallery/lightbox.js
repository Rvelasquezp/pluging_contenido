/**
 * PixelCore Gallery — Lightbox.
 *
 * Modal singleton (una sola instancia en el DOM sin importar cuántas
 * galerías haya en la página): navegación prev/next, tira de miniaturas,
 * teclado, swipe táctil, y caption (título/descripción) por imagen.
 * Vanilla JS, sin dependencias — inspirado en el comportamiento de
 * lightGallery pero implementado desde cero para integrarse con el resto
 * del motor PixelCore.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( window.PixelCoreLightbox ) {
		return;
	}

	var root = null;
	var stageImage = null;
	var captionTitle = null;
	var captionDesc = null;
	var thumbsEl = null;
	var closeButton = null;

	var images = [];
	var currentIndex = 0;
	var triggerEl = null;
	var touchStartX = null;

	function buildDOM() {
		if ( root ) {
			return;
		}

		root = document.createElement( "div" );
		root.className = "pixelcore-lightbox";
		root.setAttribute( "role", "dialog" );
		root.setAttribute( "aria-modal", "true" );
		root.setAttribute( "aria-hidden", "true" );

		root.innerHTML =
			'<div class="pixelcore-lightbox__backdrop"></div>' +
			'<button type="button" class="pixelcore-lightbox__close" aria-label="Close">&times;</button>' +
			'<button type="button" class="pixelcore-lightbox__nav pixelcore-lightbox__nav--prev" aria-label="Previous">&#8249;</button>' +
			'<button type="button" class="pixelcore-lightbox__nav pixelcore-lightbox__nav--next" aria-label="Next">&#8250;</button>' +
			'<div class="pixelcore-lightbox__stage">' +
				'<img class="pixelcore-lightbox__image" src="" alt="" />' +
				'<div class="pixelcore-lightbox__caption">' +
					'<div class="pixelcore-lightbox__caption-title"></div>' +
					'<div class="pixelcore-lightbox__caption-desc"></div>' +
				'</div>' +
			'</div>' +
			'<div class="pixelcore-lightbox__thumbs"></div>';

		document.body.appendChild( root );

		stageImage = root.querySelector( ".pixelcore-lightbox__image" );
		captionTitle = root.querySelector( ".pixelcore-lightbox__caption-title" );
		captionDesc = root.querySelector( ".pixelcore-lightbox__caption-desc" );
		thumbsEl = root.querySelector( ".pixelcore-lightbox__thumbs" );
		closeButton = root.querySelector( ".pixelcore-lightbox__close" );

		root.querySelector( ".pixelcore-lightbox__backdrop" ).addEventListener( "click", close );
		closeButton.addEventListener( "click", close );
		root.querySelector( ".pixelcore-lightbox__nav--prev" ).addEventListener( "click", function () {
			go( -1 );
		} );
		root.querySelector( ".pixelcore-lightbox__nav--next" ).addEventListener( "click", function () {
			go( 1 );
		} );

		var stage = root.querySelector( ".pixelcore-lightbox__stage" );

		stage.addEventListener( "touchstart", function ( event ) {
			touchStartX = event.touches[ 0 ].clientX;
		}, { passive: true } );

		stage.addEventListener( "touchend", function ( event ) {
			if ( null === touchStartX ) {
				return;
			}

			var deltaX = event.changedTouches[ 0 ].clientX - touchStartX;

			if ( Math.abs( deltaX ) > 50 ) {
				go( deltaX > 0 ? -1 : 1 );
			}

			touchStartX = null;
		} );

		document.addEventListener( "keydown", function ( event ) {
			if ( ! isOpen() ) {
				return;
			}

			if ( "Escape" === event.key ) {
				close();
			} else if ( "ArrowLeft" === event.key ) {
				go( -1 );
			} else if ( "ArrowRight" === event.key ) {
				go( 1 );
			}
		} );
	}

	function isOpen() {
		return !! root && root.classList.contains( "is-open" );
	}

	function renderThumbs() {
		thumbsEl.innerHTML = "";

		images.forEach( function ( image, index ) {
			var thumb = document.createElement( "button" );
			thumb.type = "button";
			thumb.className = "pixelcore-lightbox__thumb";
			thumb.setAttribute( "aria-label", image.title || "Image " + ( index + 1 ) );

			var img = document.createElement( "img" );
			img.src = image.fullUrl;
			img.alt = "";
			thumb.appendChild( img );

			thumb.addEventListener( "click", function () {
				show( index );
			} );

			thumbsEl.appendChild( thumb );
		} );
	}

	function show( index ) {
		if ( ! images.length ) {
			return;
		}

		currentIndex = ( index + images.length ) % images.length;

		var image = images[ currentIndex ];

		stageImage.src = image.fullUrl;
		stageImage.alt = image.alt || "";

		captionTitle.textContent = image.title || "";
		captionDesc.textContent = image.description || "";

		var hasCaption = !! ( image.title || image.description );
		root.querySelector( ".pixelcore-lightbox__caption" ).style.display = hasCaption ? "" : "none";

		var thumbs = thumbsEl.querySelectorAll( ".pixelcore-lightbox__thumb" );

		Array.prototype.forEach.call( thumbs, function ( thumb, thumbIndex ) {
			thumb.classList.toggle( "is-active", thumbIndex === currentIndex );
		} );

		var activeThumb = thumbs[ currentIndex ];

		if ( activeThumb && activeThumb.scrollIntoView ) {
			activeThumb.scrollIntoView( { block: "nearest", inline: "center" } );
		}
	}

	function go( direction ) {
		show( currentIndex + direction );
	}

	function open( imageList, startIndex, sourceTrigger ) {
		buildDOM();

		images = imageList || [];
		triggerEl = sourceTrigger || null;

		if ( ! images.length ) {
			return;
		}

		renderThumbs();
		show( startIndex || 0 );

		root.classList.add( "is-open" );
		root.setAttribute( "aria-hidden", "false" );
		document.documentElement.classList.add( "pixelcore-lightbox-open" );
		closeButton.focus();
	}

	function close() {
		if ( ! root ) {
			return;
		}

		root.classList.remove( "is-open" );
		root.setAttribute( "aria-hidden", "true" );
		document.documentElement.classList.remove( "pixelcore-lightbox-open" );

		if ( triggerEl && triggerEl.focus ) {
			triggerEl.focus();
		}
	}

	window.PixelCoreLightbox = {
		open: open,
		close: close,
	};
} )( window, document );
