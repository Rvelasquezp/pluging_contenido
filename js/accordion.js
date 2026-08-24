/**
 * PixelCore — interactividad del bloque Accordion.
 *
 * Deliberadamente NO depende de GSAP: abrir/cerrar es funcionalidad
 * (no decorativa), así que debe seguir funcionando aunque "Enable GSAP"
 * esté desactivado en Settings. El propio bloque Accordion puede además
 * tener su propio `data-cp-animation` (scroll-reveal) manejado por
 * core.js — son dos sistemas independientes sobre el mismo bloque.
 */
( function ( document ) {
	"use strict";

	function closeItem( item ) {
		item.classList.remove( "is-open" );
		var trigger = item.querySelector( ".pixelcore-accordion-item__trigger" );
		if ( trigger ) {
			trigger.setAttribute( "aria-expanded", "false" );
		}
	}

	function openItem( item ) {
		item.classList.add( "is-open" );
		var trigger = item.querySelector( ".pixelcore-accordion-item__trigger" );
		if ( trigger ) {
			trigger.setAttribute( "aria-expanded", "true" );
		}
	}

	function toggleItem( accordion, item ) {
		var isOpen       = item.classList.contains( "is-open" );
		var allowMultiple = "true" === accordion.dataset.cpAllowMultiple;

		if ( ! allowMultiple ) {
			Array.prototype.forEach.call(
				accordion.querySelectorAll( ".pixelcore-accordion-item.is-open" ),
				function ( openItemEl ) {
					if ( openItemEl !== item ) {
						closeItem( openItemEl );
					}
				}
			);
		}

		if ( isOpen ) {
			closeItem( item );
		} else {
			openItem( item );
		}
	}

	function init( root ) {
		root = root || document;

		var accordions = root.querySelectorAll( ".pixelcore-accordion" );

		Array.prototype.forEach.call( accordions, function ( accordion ) {
			if ( accordion._pixelcoreBound ) {
				return;
			}

			accordion._pixelcoreBound = true;

			accordion.addEventListener( "click", function ( event ) {
				var trigger = event.target.closest( ".pixelcore-accordion-item__trigger" );

				if ( ! trigger ) {
					return;
				}

				var item = trigger.closest( ".pixelcore-accordion-item" );

				if ( item ) {
					toggleItem( accordion, item );
				}
			} );
		} );
	}

	if ( "loading" === document.readyState ) {
		document.addEventListener( "DOMContentLoaded", function () {
			init( document );
		} );
	} else {
		init( document );
	}

	window.PixelCoreAccordion = { init: init };
} )( document );
