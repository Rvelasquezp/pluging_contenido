/**
 * PixelCore Animation — familia "fade".
 *
 * Fade / Fade Up / Fade Down / Fade Left / Fade Right comparten exactamente
 * la misma mecánica (animan desde los `vars` del preset hasta su estado
 * neutro): la diferencia entre ellos vive en PHP
 * (PixelCore_Animation_Presets::builtins()), no aquí. Por eso los cuatro se
 * registran con el mismo handler genérico.
 */
( function ( PixelCoreAnimations ) {
	"use strict";

	if ( ! PixelCoreAnimations ) {
		return;
	}

	[ "fade", "fade-up", "fade-down", "fade-left", "fade-right" ].forEach( function ( preset ) {
		PixelCoreAnimations.registerPreset( preset, PixelCoreAnimations.genericReveal );
	} );
} )( window.PixelCoreAnimations );
