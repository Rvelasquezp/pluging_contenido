/**
 * PixelCore Gallery — motor central.
 *
 * Escanea el DOM en busca de `[data-cp-gallery]`, delega la construcción del
 * layout (si ese tipo necesita JS) a los módulos registrados en
 * js/gallery/layouts/*.js vía `PixelCoreGallery.registerLayout()`, y conecta
 * el click en cualquier imagen con el lightbox (si `data-cp-gallery-lightbox`
 * es "true" y js/gallery/lightbox.js está cargado).
 *
 * Mismo esqueleto que js/core.js (motor de animaciones): un registry simple
 * + un solo punto de entrada llamado por js/gallery/bootstrap.js.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( window.PixelCoreGallery ) {
		return; // Ya inicializado (evita doble carga si el script se encola dos veces).
	}

	var layouts = {};
	var initialized = false;
	var resizeTimer = null;

	function registerLayout( name, handler ) {
		layouts[ name ] = handler;
	}

	function parseImages( raw ) {
		if ( ! raw ) {
			return [];
		}

		try {
			return JSON.parse( raw );
		} catch ( error ) {
			return [];
		}
	}

	function openLightbox( galleryEl, startIndex, triggerEl ) {
		if ( ! window.PixelCoreLightbox ) {
			return;
		}

		var images = parseImages( galleryEl.getAttribute( "data-cp-gallery-images" ) );

		if ( ! images.length ) {
			return;
		}

		window.PixelCoreLightbox.open( images, startIndex, triggerEl );
	}

	function wireLightbox( galleryEl ) {
		if ( "true" !== galleryEl.getAttribute( "data-cp-gallery-lightbox" ) ) {
			return;
		}

		galleryEl.addEventListener( "click", function ( event ) {
			var trigger = event.target.closest( "[data-cp-gallery-index]" );

			if ( ! trigger || ! galleryEl.contains( trigger ) ) {
				return;
			}

			event.preventDefault();
			openLightbox( galleryEl, parseInt( trigger.getAttribute( "data-cp-gallery-index" ), 10 ) || 0, trigger );
		} );
	}

	// Alto de un header fijo/sticky del theme (si hay uno), sin hardcodear
	// ningún selector — busca qué elemento está pintado en el borde superior
	// de la pantalla y sube por sus ancestros buscando position:fixed/sticky.
	// La usan los layouts con pin (horizontal, vertical): si el pin arranca
	// en "top top" (y=0 del viewport) sin restar esto, el contenido pineado
	// queda tapado detrás del header en vez de aparecer completo debajo.
	function fixedHeaderOffset() {
		var probe = document.elementFromPoint( Math.floor( window.innerWidth / 2 ), 0 );
		var current = probe;

		while ( current && current !== document.body && current !== document.documentElement ) {
			var position = getComputedStyle( current ).position;

			if ( "fixed" === position || "sticky" === position ) {
				return current.getBoundingClientRect().height;
			}

			current = current.parentElement;
		}

		return 0;
	}

	function initGallery( galleryEl ) {
		if ( galleryEl._pixelcoreGalleryInit ) {
			return;
		}

		galleryEl._pixelcoreGalleryInit = true;

		var type = galleryEl.getAttribute( "data-cp-gallery-type" ) || "grid";
		var handler = layouts[ type ];

		if ( handler ) {
			handler( galleryEl );
		}

		wireLightbox( galleryEl );
	}

	function scan( root ) {
		root = root || document;

		var galleries = root.querySelectorAll( "[data-cp-gallery]" );

		Array.prototype.forEach.call( galleries, initGallery );
	}

	function onResize() {
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( function () {
			var galleries = document.querySelectorAll( "[data-cp-gallery]" );

			Array.prototype.forEach.call( galleries, function ( galleryEl ) {
				var type = galleryEl.getAttribute( "data-cp-gallery-type" ) || "grid";

				if ( layouts[ type ] && layouts[ type ].onResize ) {
					layouts[ type ].onResize( galleryEl );
				}
			} );
		}, 200 );
	}

	// Algunos themes encogen su header a medida que se scrollea (propio tween
	// con scroll, no un resize). PixelCoreGallery.fixedHeaderOffset() se usa
	// para calcular dónde debe "aterrizar" un pin (horizontal/vertical) justo
	// debajo del header — pero ScrollTrigger solo re-evalúa esos valores en
	// refresh() (carga, resize), no en cada scroll. Si el header todavía
	// estaba en su tamaño grande cuando se creó el pin, y para cuando el
	// scroll real llega a esa galería el header ya se encogió, el pin queda
	// calculado con una medida vieja — sobra espacio arriba de la sección.
	// Este listener detecta cuando el alto del header REALMENTE cambió y
	// fuerza un refresh para que los pines se recalculen contra la medida
	// actual.
	//
	// Dos resguardos importantes (su ausencia causaba un salto visible al
	// cruzar entre secciones pineadas, ej. horizontal → vertical):
	// 1) Redondea a pixel entero antes de comparar — getBoundingClientRect()
	//    devuelve sub-pixeles que varían solo por redondeo del navegador al
	//    scrollear, no porque el header realmente haya cambiado de tamaño;
	//    sin el redondeo, CADA scroll disparaba un refresh() (recalcula
	//    TODOS los pines de la página, no solo el que está a la vista).
	// 2) Deja de escuchar en cuanto el valor se mantiene estable dos
	//    veces seguidas — el header solo encoge una vez, cerca del tope de
	//    la página; una vez asentado no hace falta seguir revisando por el
	//    resto del scroll.
	var lastHeaderOffset = null;
	var stableHeaderChecks = 0;
	var headerWatchTimer = null;

	function watchHeaderOffset() {
		clearTimeout( headerWatchTimer );
		headerWatchTimer = setTimeout( function () {
			var current = Math.round( fixedHeaderOffset() );

			if ( current !== lastHeaderOffset ) {
				lastHeaderOffset = current;
				stableHeaderChecks = 0;

				if ( window.ScrollTrigger ) {
					window.ScrollTrigger.refresh();
				}

				return;
			}

			stableHeaderChecks++;

			if ( stableHeaderChecks >= 2 ) {
				window.removeEventListener( "scroll", watchHeaderOffset );
			}
		}, 150 );
	}

	function init() {
		if ( initialized ) {
			return;
		}

		initialized = true;

		lastHeaderOffset = Math.round( fixedHeaderOffset() );

		scan( document );
		window.addEventListener( "resize", onResize );
		window.addEventListener( "scroll", watchHeaderOffset, { passive: true } );
	}

	window.PixelCoreGallery = {
		registerLayout: registerLayout,
		init: init,
		scan: scan,
		fixedHeaderOffset: fixedHeaderOffset,
	};

	// A diferencia de js/core.js (animaciones), este init() NO se dispara
	// desde un bootstrap.js separado: los módulos de layout (masonry/
	// justified/carousel) y el lightbox se cargan de forma CONDICIONAL por
	// instancia (ver blocks/gallery/render.php), así que no hay garantía de
	// que impriman antes o después de este archivo — WP solo garantiza que
	// core.js (su dependencia declarada) va antes de ellos, no el orden
	// entre hermanos. Usar el evento "load" (en vez de DOMContentLoaded o
	// ejecución inmediata) asegura que, para ese momento, cualquier script
	// hermano ya ejecutó su propio registerLayout(), sin importar el orden
	// de impresión relativo entre ambos.
	if ( "complete" === document.readyState ) {
		init();
	} else {
		window.addEventListener( "load", init );
	}
} )( window, document );
