/**
 * PixelCore Gallery — layout "staggered" (grid flotante, escalonado,
 * infinito — sin sistema de columnas).
 *
 * A propósito NO hay ningún grid/masonry/columnas acá: cada imagen flota
 * de forma completamente independiente dentro de la galería —
 *
 *   - Una posición X propia (aleatoria pero determinística — misma
 *     semilla, mismo resultado siempre, no cambia entre cargas de
 *     página), fija durante todo el recorrido de esa imagen.
 *   - Un tamaño propio (escala aleatoria) — no todas del mismo tamaño.
 *   - Su propio ciclo infinito: arranca abajo de la galería (fuera de
 *     vista), sube en línea recta hasta salir por arriba (también fuera
 *     de vista), y ahí GSAP la reaparece abajo de nuevo para el próximo
 *     ciclo (repeat:-1) — como burbujas subiendo sin parar.
 *   - Su propia duración y un desfasaje propio en su ciclo (delay
 *     negativo), así ninguna imagen sube a la misma velocidad ni en el
 *     mismo momento que las demás — el "escalonado".
 *
 * Es una animación por TIEMPO, no por scroll — corre siempre, sea cual
 * sea la posición de scroll de la página, sin pin/sticky/ScrollTrigger.
 *
 * @package PixelCore_Components
 */
( function ( window, document ) {
	"use strict";

	if ( ! window.PixelCoreGallery ) {
		return;
	}

	// Ancho base de cada imagen (px) antes de aplicar su propia escala
	// aleatoria (ver SCALE_MIN/SCALE_MAX) — todas parten del mismo tamaño
	// de referencia, la variedad sale de la escala, no de anchos distintos
	// puestos a mano.
	var BASE_WIDTH = 240;
	var SCALE_MIN = 0.55;
	var SCALE_MAX = 1.05;

	// Segundos que tarda una imagen en recorrer toda la galería de abajo
	// hacia arriba, antes de aplicar la variación propia (más rápida/más
	// lenta) por imagen.
	var BASE_DURATION = 22;

	// Pseudo-aleatorio determinístico (0 a 1) a partir de un número
	// semilla — mismo resultado siempre para el mismo índice, no cambia
	// entre cargas de página.
	function seeded( seed ) {
		var x = Math.sin( seed * 12.9898 ) * 43758.5453;

		return x - Math.floor( x );
	}

	function intrinsicRatio( item ) {
		var img = item.querySelector( "img" );
		var w = img && parseInt( img.getAttribute( "width" ), 10 );
		var h = img && parseInt( img.getAttribute( "height" ), 10 );

		return w && h ? h / w : 2 / 3;
	}

	function applyFloat( el, items ) {
		if ( ! window.gsap ) {
			return;
		}

		var gsap = window.gsap;
		var containerWidth = el.clientWidth;
		var containerHeight = el.clientHeight;

		items.forEach( function ( item, index ) {
			if ( item._pcStaggeredTween ) {
				item._pcStaggeredTween.kill();
			}

			var scale = SCALE_MIN + seeded( index * 3.1 ) * ( SCALE_MAX - SCALE_MIN );
			var width = BASE_WIDTH * scale;
			var height = width * intrinsicRatio( item );

			item.style.position = "absolute";
			item.style.top = "0px";
			item.style.left = "0px";
			item.style.width = width + "px";

			var maxX = Math.max( containerWidth - width, 0 );
			var x = seeded( index * 7.7 ) * maxX;

			var duration = BASE_DURATION * ( 0.7 + seeded( index * 5.3 ) * 0.6 );
			var startOffset = seeded( index * 2.2 ) * duration;

			gsap.set( item, { x: x, y: containerHeight } );

			item._pcStaggeredTween = gsap.to( item, {
				y: -height,
				duration: duration,
				delay: -startOffset,
				ease: "none",
				repeat: -1,
			} );
		} );
	}

	// Arma el flotado, pero SOLO si el contenedor ya tiene un ancho/alto
	// real medible — igual que waterfall.js: el wrapper de scroll suave
	// del theme puede no haber terminado de acomodarse en el momento
	// exacto en que esto corre, y calcular posiciones contra un
	// clientWidth/Height en 0 daría imágenes todas amontonadas en el
	// mismo lugar.
	function tryBuild( el, items ) {
		if ( el.clientWidth <= 0 || el.clientHeight <= 0 ) {
			return false;
		}

		applyFloat( el, items );
		el.classList.add( "pixelcore-gallery--staggered-js" );

		return true;
	}

	function init( el ) {
		var items = el._pixelcoreItems || Array.prototype.slice.call( el.querySelectorAll( ".pixelcore-gallery__item" ) );

		el._pixelcoreItems = items;

		if ( ! items.length ) {
			return;
		}

		if ( tryBuild( el, items ) ) {
			return;
		}

		var attempts = 0;

		function retry() {
			attempts++;

			if ( tryBuild( el, items ) || attempts >= 10 ) {
				return;
			}

			requestAnimationFrame( retry );
		}

		requestAnimationFrame( retry );
	}

	init.onResize = function ( el ) {
		var items = el._pixelcoreItems;

		if ( ! items || ! items.length ) {
			return;
		}

		tryBuild( el, items );
	};

	window.PixelCoreGallery.registerLayout( "staggered", init );
} )( window, document );
