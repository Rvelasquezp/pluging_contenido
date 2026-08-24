/**
 * PixelCore Animation — preset "custom".
 *
 * Permite definir `from`/`to` de GSAP a mano desde el panel "Custom
 * Animation" del editor (ver blocks/shared-animation-panel.js), sin tener
 * que tocar código del plugin. Espera un atributo `data-cp-custom` con JSON
 * de la forma: {"from":{"opacity":0,"y":80},"to":{"opacity":1,"y":0}}
 */
( function ( PixelCoreAnimations ) {
	"use strict";

	if ( ! PixelCoreAnimations ) {
		return;
	}

	PixelCoreAnimations.registerPreset( "custom", function ( el, config ) {
		var raw = el.dataset.cpCustom;

		if ( ! raw ) {
			return null;
		}

		var custom;

		try {
			custom = JSON.parse( raw );
		} catch ( error ) {
			return null;
		}

		if ( ! custom || ( ! custom.from && ! custom.to ) ) {
			return null;
		}

		return PixelCoreAnimations.applyTrigger( el, config, custom.from || {}, custom.to || {} );
	} );
} )( window.PixelCoreAnimations );
