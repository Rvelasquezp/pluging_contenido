/**
 * PixelCore Animation — motor central.
 *
 * Escanea el DOM en busca de elementos `[data-cp-animation]`, lee su
 * configuración desde los `data-cp-*` (ver includes/helpers.php →
 * capixel_animation_attributes()) y delega la construcción del tween a los
 * presets registrados en `js/animations/*.js` vía
 * `PixelCoreAnimations.registerPreset()`.
 *
 * No hace nada por sí solo hasta que `js/bootstrap.js` llama a
 * `PixelCoreAnimations.init()` (una vez que todos los presets ya se
 * registraron).
 *
 * @package PixelCore_Components
 */

( function ( window, document ) {
	"use strict";

	if ( window.PixelCoreAnimations ) {
		return; // Ya inicializado (evita doble carga si el script se encola dos veces).
	}

	var presets = {};
	var initialized = false;
	var instances = [];
	var resizeTimer = null;

	/**
	 * Ajustes globales inyectados desde PHP (ver PixelCore_Assets::settings_inline_script()).
	 */
	function getSettings() {
		return window.PixelCoreSettings || {
			disableMobile: false,
			respectReducedMotion: true,
			debug: false,
			mobileBreakpoint: 768,
			tabletBreakpoint: 1024,
		};
	}

	function prefersReducedMotion() {
		var settings = getSettings();

		return !! ( settings.respectReducedMotion && window.matchMedia && window.matchMedia( "(prefers-reduced-motion: reduce)" ).matches );
	}

	function currentBreakpoint() {
		var width    = window.innerWidth;
		var settings = getSettings();

		if ( width <= settings.mobileBreakpoint ) {
			return "mobile";
		}

		if ( width <= settings.tabletBreakpoint ) {
			return "tablet";
		}

		return "desktop";
	}

	function parseJSON( value, fallback ) {
		if ( ! value ) {
			return fallback;
		}

		try {
			return JSON.parse( value );
		} catch ( error ) {
			return fallback;
		}
	}

	function parseScrub( raw ) {
		if ( undefined === raw || "false" === raw || "" === raw ) {
			return false;
		}

		if ( "true" === raw ) {
			return true;
		}

		var num = parseFloat( raw );

		return isNaN( num ) ? false : num;
	}

	/**
	 * Traduce los data-cp-* de un elemento a un objeto de configuración,
	 * ya resuelto para el breakpoint actual (aplica overrides de
	 * data-cp-responsive y el ajuste global "Disable animations on mobile").
	 */
	function readConfig( el ) {
		var ds = el.dataset;

		var config = {
			preset:   ds.cpAnimation,
			vars:     parseJSON( ds.cpVars, {} ),
			trigger:  ds.cpTrigger || "scroll",
			start:    ds.cpStart || "top 80%",
			end:      ds.cpEnd || "bottom 20%",
			duration: parseFloat( ds.cpDuration || "1" ),
			delay:    parseFloat( ds.cpDelay || "0" ),
			ease:     ds.cpEase || "power2.out",
			scrub:    parseScrub( ds.cpScrub ),
			once:     "false" !== ds.cpOnce,
			pin:      "true" === ds.cpPin,
			markers:  "true" === ds.cpMarkers,
			disabled: false,
		};

		var breakpoint = currentBreakpoint();
		var responsive = parseJSON( ds.cpResponsive, null );

		if ( responsive && responsive[ breakpoint ] ) {
			config = Object.assign( config, responsive[ breakpoint ] );
		}

		if ( getSettings().disableMobile && "mobile" === breakpoint ) {
			config.disabled = true;
		}

		return config;
	}

	/**
	 * Valor "neutro" (estado final visible) para una propiedad GSAP típica
	 * de reveal — usado por el handler genérico de fade/scale/slide/rotate.
	 */
	var NEUTRAL_VALUES = {
		opacity: 1,
		x: 0,
		y: 0,
		xPercent: 0,
		scale: 1,
		scaleX: 1,
		scaleY: 1,
		rotation: 0,
		rotationX: 0,
		rotationY: 0,
		skewX: 0,
		skewY: 0,
	};

	function neutralize( vars ) {
		var to = {};

		Object.keys( vars ).forEach( function ( key ) {
			to[ key ] = key in NEUTRAL_VALUES ? NEUTRAL_VALUES[ key ] : 0;
		} );

		return to;
	}

	/**
	 * Conecta un tween from→to al trigger elegido (load/scroll/hover/click).
	 * Los presets "reveal" (fade, scale, slide, rotate) usan esto tal cual;
	 * parallax construye su propio ScrollTrigger porque no es un reveal.
	 */
	function applyTrigger( el, config, fromVars, toVars ) {
		var gsap = window.gsap;
		var base = Object.assign( { duration: config.duration, delay: config.delay, ease: config.ease }, toVars );

		if ( "load" === config.trigger ) {
			return gsap.fromTo( el, fromVars, base );
		}

		if ( "hover" === config.trigger ) {
			gsap.set( el, fromVars );
			el.addEventListener( "mouseenter", function () {
				gsap.to( el, base );
			} );
			el.addEventListener( "mouseleave", function () {
				gsap.to( el, Object.assign( {}, base, fromVars, { duration: config.duration, ease: config.ease } ) );
			} );
			return null;
		}

		if ( "click" === config.trigger ) {
			gsap.set( el, fromVars );
			el.addEventListener( "click", function () {
				gsap.to( el, base );
			} );
			return null;
		}

		// Scroll (default): ScrollTrigger si está disponible, si no cae a "load".
		if ( ! window.ScrollTrigger ) {
			return gsap.fromTo( el, fromVars, base );
		}

		return gsap.fromTo(
			el,
			fromVars,
			Object.assign( {}, base, {
				scrollTrigger: {
					trigger: el,
					start: config.start,
					end: config.end,
					scrub: config.scrub,
					once: config.once,
					pin: config.pin,
					markers: config.markers && getSettings().debug,
				},
			} )
		);
	}

	/**
	 * Handler genérico para presets "reveal" (fade*, scale*, slide, rotate):
	 * animan DESDE los `vars` del preset (data-cp-vars) HASTA su estado
	 * neutro. Registrado por cada archivo en animations/*.js bajo distintos
	 * nombres de preset — no hay lógica duplicada entre ellos.
	 */
	function genericReveal( el, config ) {
		if ( ! Object.keys( config.vars ).length ) {
			return null;
		}

		return applyTrigger( el, config, config.vars, neutralize( config.vars ) );
	}

	function registerPreset( name, handler ) {
		presets[ name ] = handler;
	}

	function cleanup( el ) {
		if ( el._pixelcoreCtx ) {
			el._pixelcoreCtx.revert();
			el._pixelcoreCtx = null;
		}
	}

	function animateElement( el ) {
		var config = readConfig( el );

		cleanup( el );

		if ( config.disabled || ! config.preset || "none" === config.preset ) {
			return;
		}

		if ( prefersReducedMotion() ) {
			return;
		}

		if ( "undefined" === typeof window.gsap ) {
			return;
		}

		var handler = presets[ config.preset ];

		if ( ! handler ) {
			return;
		}

		var ctx = window.gsap.context( function () {
			handler( el, config );
		} );

		el._pixelcoreCtx = ctx;
		instances.push( { el: el, config: config } );
	}

	function scan( root ) {
		root = root || document;

		var els = root.querySelectorAll( "[data-cp-animation]" );

		Array.prototype.forEach.call( els, animateElement );
	}

	function reinitAll() {
		instances.forEach( function ( instance ) {
			cleanup( instance.el );
		} );
		instances = [];
		scan( document );

		if ( window.ScrollTrigger ) {
			window.ScrollTrigger.refresh();
		}
	}

	function onResize() {
		clearTimeout( resizeTimer );
		resizeTimer = setTimeout( reinitAll, 200 );
	}

	function init() {
		if ( initialized ) {
			return;
		}

		initialized = true;

		if ( "undefined" === typeof window.gsap ) {
			return;
		}

		if ( window.ScrollTrigger ) {
			window.gsap.registerPlugin( window.ScrollTrigger );
		}

		scan( document );
		window.addEventListener( "resize", onResize );
	}

	window.PixelCoreAnimations = {
		registerPreset: registerPreset,
		genericReveal: genericReveal,
		applyTrigger: applyTrigger,
		neutralize: neutralize,
		init: init,
		scan: scan,
		reinitAll: reinitAll,
		getSettings: getSettings,
		currentBreakpoint: currentBreakpoint,
		getInstances: function () {
			return instances.slice();
		},
	};
} )( window, document );
