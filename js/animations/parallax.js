/**
 * PixelCore Animation — preset "parallax".
 *
 * A diferencia de fade/scale/slide/rotate, parallax NO es un "reveal"
 * (no aparece una vez y se queda quieto): se mueve de forma continua
 * mientras el usuario scrollea, así que siempre usa scrub y su propio
 * ScrollTrigger en lugar de pasar por applyTrigger().
 */
( function ( PixelCoreAnimations ) {
	"use strict";

	if ( ! PixelCoreAnimations ) {
		return;
	}

	PixelCoreAnimations.registerPreset( "parallax", function ( el, config ) {
		if ( ! window.ScrollTrigger ) {
			return null;
		}

		var vars = Object.keys( config.vars ).length ? config.vars : { yPercent: 20 };

		return window.gsap.to(
			el,
			Object.assign( { ease: "none" }, vars, {
				scrollTrigger: {
					trigger: el,
					start: config.start && "top 80%" !== config.start ? config.start : "top bottom",
					end: config.end && "bottom 20%" !== config.end ? config.end : "bottom top",
					scrub: false === config.scrub ? true : config.scrub,
					markers: config.markers && PixelCoreAnimations.getSettings().debug,
				},
			} )
		);
	} );
} )( window.PixelCoreAnimations );
