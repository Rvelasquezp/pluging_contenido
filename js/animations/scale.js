/**
 * PixelCore Animation — familia "scale" (Scale / Scale Up / Scale Down) y
 * "rotate". Igual que fade.js: la mecánica es idéntica, delega en el
 * handler genérico de core.js.
 */
( function ( PixelCoreAnimations ) {
	"use strict";

	if ( ! PixelCoreAnimations ) {
		return;
	}

	[ "scale", "scale-up", "scale-down" ].forEach( function ( preset ) {
		PixelCoreAnimations.registerPreset( preset, PixelCoreAnimations.genericReveal );
	} );
} )( window.PixelCoreAnimations );
