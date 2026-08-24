/**
 * PixelCore Animation — preset "slide" (y "rotate", misma mecánica).
 */
( function ( PixelCoreAnimations ) {
	"use strict";

	if ( ! PixelCoreAnimations ) {
		return;
	}

	PixelCoreAnimations.registerPreset( "slide", PixelCoreAnimations.genericReveal );
	PixelCoreAnimations.registerPreset( "rotate", PixelCoreAnimations.genericReveal );
} )( window.PixelCoreAnimations );
