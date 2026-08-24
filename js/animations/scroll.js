/**
 * PixelCore Animation — utilidades de ScrollTrigger para desarrolladores.
 *
 * El sistema data-cp-* ya crea sus propios ScrollTrigger internamente
 * (ver applyTrigger() en core.js). Este archivo expone un helper público
 * (`PixelCoreAnimations.scroll.create`) para quien quiera construir un
 * ScrollTrigger a mano desde su propio JS, reutilizando los mismos ajustes
 * globales (debug/markers, prefers-reduced-motion) sin duplicar esa lógica.
 */
( function ( PixelCoreAnimations ) {
	"use strict";

	if ( ! PixelCoreAnimations ) {
		return;
	}

	/**
	 * Crea un ScrollTrigger "crudo" (sin pasar por un preset), respetando
	 * el flag global de debug para los markers.
	 *
	 * @param {Element} el     Elemento trigger.
	 * @param {Object}  vars   Vars de gsap.to()/timeline(), sin scrollTrigger.
	 * @param {Object}  config { start, end, scrub, once, pin, markers }
	 * @return {gsap.core.Tween|null}
	 */
	function create( el, vars, config ) {
		if ( "undefined" === typeof window.gsap || ! window.ScrollTrigger ) {
			return null;
		}

		config = config || {};

		return window.gsap.to(
			el,
			Object.assign( {}, vars, {
				scrollTrigger: {
					trigger: el,
					start: config.start || "top 80%",
					end: config.end || "bottom 20%",
					scrub: config.scrub || false,
					once: !! config.once,
					pin: !! config.pin,
					markers: !! config.markers && PixelCoreAnimations.getSettings().debug,
				},
			} )
		);
	}

	PixelCoreAnimations.scroll = { create: create };
} )( window.PixelCoreAnimations );
