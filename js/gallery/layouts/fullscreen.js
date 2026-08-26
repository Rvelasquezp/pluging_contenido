/**
 * PixelCore Gallery — layout "fullscreen", slideshow automático.
 *
 * Sección de tamaño fijo (una sola pantalla, 100vh) con todas las imágenes
 * apiladas exactamente en el mismo lugar. En cuanto el elemento PADRE de la
 * galería (normalmente el bloque Group/section que envuelve el heading +
 * spacer + galería — genérico, sirve igual si es un <section>, un <div>, o
 * cualquier otro contenedor) entra en pantalla, arranca un slideshow
 * automático: cambia de imagen cada INTERVAL_MS con un crossfade — YA NO
 * depende del scroll en absoluto.
 *
 * Se cambió de un crossfade con scrub (ligado al scroll) a este slideshow
 * por tiempo porque el enfoque con scroll necesitaba varias pantallas de
 * scroll disponibles DESPUÉS de la sección para completar el recorrido por
 * todas las imágenes — si la página no tenía suficiente contenido ahí, se
 * cortaba a mitad de camino. Un intervalo de tiempo no tiene ese problema en
 * absoluto: siempre termina de mostrar todas las imágenes, sin importar
 * dónde quede la sección en la página.
 *
 * CSS puro (transition: opacity) en vez de GSAP — no hace falta scrub ni
 * pin, así que tampoco hace falta el motor de animaciones del plugin acá.
 * Pausa el intervalo cuando la sección sale de pantalla (ahorra trabajo) y
 * lo retoma al volver a entrar.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	// Cada cuánto cambia de imagen, en milisegundos.
	var INTERVAL_MS = 1400;

	function init( el ) {
		if ( el._pcFullscreenInit ) {
			return;
		}

		var items = Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		if ( items.length < 2 ) {
			return; // Nada que alternar con 0 o 1 imagen.
		}

		el._pcFullscreenInit = true;
		el.classList.add( "pixelcore-gallery--fullscreen-stack" );

		items.forEach( function ( item, index ) {
			item.classList.toggle( "is-active", 0 === index );
		} );

		var currentIndex = 0;
		var timer = null;

		function next() {
			var nextIndex = ( currentIndex + 1 ) % items.length;

			items[ currentIndex ].classList.remove( "is-active" );
			items[ nextIndex ].classList.add( "is-active" );
			currentIndex = nextIndex;
		}

		function start() {
			if ( timer ) {
				return;
			}

			timer = setInterval( next, INTERVAL_MS );
		}

		function stop() {
			clearInterval( timer );
			timer = null;
		}

		// El padre directo de la galería, no la galería misma — así el
		// slideshow arranca en cuanto el heading/spacer que suele ir antes
		// de ella también está entrando en pantalla, no solo la galería.
		var visibilityTarget = el.parentElement || el;

		if ( "IntersectionObserver" in window ) {
			var observer = new IntersectionObserver(
				function ( entries ) {
					entries.forEach( function ( entry ) {
						if ( entry.isIntersecting ) {
							start();
						} else {
							stop();
						}
					} );
				},
				{ threshold: 0.25 }
			);

			observer.observe( visibilityTarget );
		} else {
			// Sin soporte de IntersectionObserver (navegadores muy viejos):
			// arranca directo, sin esperar a que entre en pantalla.
			start();
		}
	}

	window.PixelCoreGallery.registerLayout( "fullscreen", init );
} )( window, document );
