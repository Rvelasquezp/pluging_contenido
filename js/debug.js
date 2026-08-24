/**
 * PixelCore Debug — panel flotante de solo-desarrollo.
 *
 * Solo se encola cuando PixelCore_Debug::is_enabled() es true (ajuste
 * "Enable debug mode" + capacidad manage_options), así que nunca aparece
 * para un visitante normal en producción.
 */
( function ( window, document ) {
	"use strict";

	var errors = [];

	window.addEventListener( "error", function ( event ) {
		errors.push( ( event.error && event.error.message ) || event.message || "Unknown error" );
		render();
	} );

	function el( tag, attrs, children ) {
		var node = document.createElement( tag );

		Object.keys( attrs || {} ).forEach( function ( key ) {
			if ( "text" === key ) {
				node.textContent = attrs[ key ];
			} else {
				node.setAttribute( key, attrs[ key ] );
			}
		} );

		( children || [] ).forEach( function ( child ) {
			node.appendChild( child );
		} );

		return node;
	}

	function styleTag() {
		var style = document.createElement( "style" );
		style.textContent =
			"#pixelcore-debug-panel{position:fixed;bottom:16px;right:16px;z-index:999999;width:320px;max-height:70vh;overflow:auto;" +
			"background:#111827;color:#e5e7eb;font:12px/1.5 -apple-system,sans-serif;border-radius:8px;box-shadow:0 12px 32px rgba(0,0,0,.35)}" +
			"#pixelcore-debug-panel h2{font-size:12px;margin:0;padding:10px 12px;background:#1f2937;border-radius:8px 8px 0 0;display:flex;justify-content:space-between;align-items:center}" +
			"#pixelcore-debug-panel h3{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin:10px 12px 4px}" +
			"#pixelcore-debug-panel ul{list-style:none;margin:0;padding:0 12px 10px}" +
			"#pixelcore-debug-panel li{padding:4px 0;border-bottom:1px solid #1f2937;word-break:break-word}" +
			"#pixelcore-debug-panel button{background:none;border:0;color:#9ca3af;cursor:pointer;font-size:14px;line-height:1}" +
			"#pixelcore-debug-panel .pc-error{color:#f87171}" +
			"#pixelcore-debug-panel.is-collapsed .pc-body{display:none}";
		document.head.appendChild( style );
	}

	function render() {
		var root = document.getElementById( "pixelcore-debug-root" );

		if ( ! root ) {
			return;
		}

		var panel = document.getElementById( "pixelcore-debug-panel" );

		if ( ! panel ) {
			panel = el( "div", { id: "pixelcore-debug-panel" } );
			root.appendChild( panel );
		}

		panel.innerHTML = "";

		var toggle = el( "button", { text: "—", "aria-label": "Toggle" } );
		toggle.addEventListener( "click", function () {
			panel.classList.toggle( "is-collapsed" );
		} );

		panel.appendChild( el( "h2", {}, [ el( "span", { text: "PixelCore Debug" } ), toggle ] ) );

		var body = el( "div", { class: "pc-body" } );

		var animations = window.PixelCoreAnimations ? window.PixelCoreAnimations.getInstances() : [];
		var stCount     = window.ScrollTrigger ? window.ScrollTrigger.getAll().length : 0;
		var breakpoint  = window.PixelCoreAnimations ? window.PixelCoreAnimations.currentBreakpoint() : "n/a";

		body.appendChild( el( "h3", { text: "Estado" } ) );
		body.appendChild(
			el( "ul", {}, [
				el( "li", { text: "Breakpoint: " + breakpoint } ),
				el( "li", { text: "GSAP: " + ( window.gsap ? window.gsap.version : "no cargado" ) } ),
				el( "li", { text: "ScrollTriggers activos: " + stCount } ),
				el( "li", { text: "Elementos animados: " + animations.length } ),
			] )
		);

		body.appendChild( el( "h3", { text: "Animaciones (" + animations.length + ")" } ) );

		var list = el( "ul" );

		animations.forEach( function ( instance ) {
			var label = ( instance.el.getAttribute( "class" ) || instance.el.tagName ).split( " " )[ 0 ];
			list.appendChild(
				el( "li", {
					text: label + " → " + instance.config.preset + " / " + instance.config.trigger,
				} )
			);
		} );

		body.appendChild( list );

		if ( errors.length ) {
			body.appendChild( el( "h3", { text: "Errores JS (" + errors.length + ")" } ) );
			var errorList = el( "ul" );
			errors.forEach( function ( message ) {
				errorList.appendChild( el( "li", { class: "pc-error", text: message } ) );
			} );
			body.appendChild( errorList );
		}

		panel.appendChild( body );
	}

	function boot() {
		styleTag();
		render();
		window.addEventListener( "resize", render );
		setInterval( render, 4000 );
	}

	if ( "loading" === document.readyState ) {
		document.addEventListener( "DOMContentLoaded", boot );
	} else {
		boot();
	}
} )( window, document );
