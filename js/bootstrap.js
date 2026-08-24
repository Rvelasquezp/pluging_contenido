/**
 * PixelCore — arranque.
 *
 * Se encola al final de la cadena de dependencias (después de core.js y de
 * todos los animations/*.js), así que cuando corre, todos los presets ya
 * están registrados. Es el único archivo que llama a
 * PixelCoreAnimations.init().
 */
( function ( document ) {
	"use strict";

	function boot() {
		if ( window.PixelCoreAnimations ) {
			window.PixelCoreAnimations.init();
		}
	}

	if ( "loading" === document.readyState ) {
		document.addEventListener( "DOMContentLoaded", boot );
	} else {
		boot();
	}
} )( document );
