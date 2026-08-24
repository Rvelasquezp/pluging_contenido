/**
 * PixelCore — panel "Animation" compartido por todos los bloques.
 *
 * Cada bloque (hero/card/accordion/cta) tiene su propio atributo
 * `animation` (mismo shape en block.json) y llama a
 * `window.PixelCoreEditor.AnimationPanel({ animation, onChange })` dentro de
 * su InspectorControls — así el UI de animación se escribe una sola vez.
 *
 * Los presets/triggers/eases vienen de PHP (ver
 * PixelCore_Assets::register_editor_assets()) en window.PixelCoreEditorData.
 */
( function ( wp ) {
	"use strict";

	var el          = wp.element.createElement;
	var Fragment     = wp.element.Fragment;
	var __           = wp.i18n.__;
	var PanelBody    = wp.components.PanelBody;
	var SelectControl = wp.components.SelectControl;
	var RangeControl = wp.components.RangeControl;
	var ToggleControl = wp.components.ToggleControl;
	var TextControl  = wp.components.TextControl;
	var TextareaControl = wp.components.TextareaControl;

	function getData() {
		return window.PixelCoreEditorData || { presets: [], triggers: [], eases: [] };
	}

	function toOptions( map ) {
		return Object.keys( map ).map( function ( value ) {
			return { value: value, label: map[ value ] };
		} );
	}

	var DEFAULT_ANIMATION = {
		preset: "none",
		trigger: "scroll",
		start: "top 80%",
		end: "bottom 20%",
		duration: 1,
		delay: 0,
		ease: "power2.out",
		scrub: false,
		once: true,
		pin: false,
		markers: false,
		responsive: {},
		custom: { from: "{}", to: "{}" },
	};

	/**
	 * @param {Object}   props
	 * @param {Object}   props.animation Atributo "animation" actual del bloque.
	 * @param {Function} props.onChange  ( nextAnimation ) => void
	 */
	function AnimationPanel( props ) {
		var animation = Object.assign( {}, DEFAULT_ANIMATION, props.animation || {} );
		var data      = getData();

		function update( patch ) {
			props.onChange( Object.assign( {}, animation, patch ) );
		}

		function updateResponsive( breakpoint, patch ) {
			var responsive = Object.assign( {}, animation.responsive );
			responsive[ breakpoint ] = Object.assign( {}, responsive[ breakpoint ], patch );
			update( { responsive: responsive } );
		}

		var isScroll = "scroll" === animation.trigger;
		var isCustom = "custom" === animation.preset;
		var isNone   = "none" === animation.preset || ! animation.preset;

		var fields = [
			el( SelectControl, {
				key: "preset",
				label: __( "Animation", "capixel-components" ),
				value: animation.preset,
				options: data.presets.length ? data.presets : toOptions( { none: "None" } ),
				onChange: function ( value ) {
					update( { preset: value } );
				},
			} ),
		];

		if ( ! isNone ) {
			fields.push(
				el( SelectControl, {
					key: "trigger",
					label: __( "Trigger", "capixel-components" ),
					value: animation.trigger,
					options: data.triggers.length ? data.triggers : toOptions( { scroll: "Scroll" } ),
					onChange: function ( value ) {
						update( { trigger: value } );
					},
				} )
			);

			if ( isScroll ) {
				fields.push(
					el( TextControl, {
						key: "start",
						label: __( "Start", "capixel-components" ),
						value: animation.start,
						onChange: function ( value ) {
							update( { start: value } );
						},
					} ),
					el( TextControl, {
						key: "end",
						label: __( "End", "capixel-components" ),
						value: animation.end,
						onChange: function ( value ) {
							update( { end: value } );
						},
					} ),
					el( ToggleControl, {
						key: "once",
						label: __( "Play once", "capixel-components" ),
						checked: !! animation.once,
						onChange: function ( value ) {
							update( { once: value } );
						},
					} ),
					el( ToggleControl, {
						key: "scrubToggle",
						label: __( "Scrub (ligado al scroll)", "capixel-components" ),
						checked: false !== animation.scrub,
						onChange: function ( value ) {
							update( { scrub: value ? 1 : false } );
						},
					} ),
					false !== animation.scrub &&
						el( RangeControl, {
							key: "scrub",
							label: __( "Scrub", "capixel-components" ),
							value: "number" === typeof animation.scrub ? animation.scrub : 1,
							min: 0.1,
							max: 5,
							step: 0.1,
							onChange: function ( value ) {
								update( { scrub: value } );
							},
						} ),
					el( ToggleControl, {
						key: "pin",
						label: __( "Pin", "capixel-components" ),
						checked: !! animation.pin,
						onChange: function ( value ) {
							update( { pin: value } );
						},
					} ),
					el( ToggleControl, {
						key: "markers",
						label: __( "Markers (solo con debug activo)", "capixel-components" ),
						checked: !! animation.markers,
						onChange: function ( value ) {
							update( { markers: value } );
						},
					} )
				);
			}

			fields.push(
				el( RangeControl, {
					key: "duration",
					label: __( "Duration", "capixel-components" ),
					value: animation.duration,
					min: 0.1,
					max: 3,
					step: 0.1,
					onChange: function ( value ) {
						update( { duration: value } );
					},
				} ),
				el( RangeControl, {
					key: "delay",
					label: __( "Delay", "capixel-components" ),
					value: animation.delay,
					min: 0,
					max: 2,
					step: 0.1,
					onChange: function ( value ) {
						update( { delay: value } );
					},
				} ),
				el( SelectControl, {
					key: "ease",
					label: __( "Ease", "capixel-components" ),
					value: animation.ease,
					options: data.eases.length ? data.eases : toOptions( { "power2.out": "power2.out" } ),
					onChange: function ( value ) {
						update( { ease: value } );
					},
				} )
			);

			if ( isCustom ) {
				fields.push(
					el( TextareaControl, {
						key: "customFrom",
						label: __( "Custom — from (JSON)", "capixel-components" ),
						value: ( animation.custom && animation.custom.from ) || "{}",
						onChange: function ( value ) {
							update( { custom: Object.assign( {}, animation.custom, { from: value } ) } );
						},
					} ),
					el( TextareaControl, {
						key: "customTo",
						label: __( "Custom — to (JSON)", "capixel-components" ),
						value: ( animation.custom && animation.custom.to ) || "{}",
						onChange: function ( value ) {
							update( { custom: Object.assign( {}, animation.custom, { to: value } ) } );
						},
					} )
				);
			}
		}

		var responsivePanel = isNone
			? null
			: el(
					PanelBody,
					{ key: "responsive", title: __( "Responsive", "capixel-components" ), initialOpen: false },
					[ "tablet", "mobile" ].map( function ( breakpoint ) {
						var override = animation.responsive[ breakpoint ] || {};

						return el( Fragment, { key: breakpoint }, [
							el( "p", { key: "label", style: { fontWeight: 600, textTransform: "capitalize" } }, breakpoint ),
							el( ToggleControl, {
								key: "disabled",
								label: __( "Disable", "capixel-components" ),
								checked: !! override.disabled,
								onChange: function ( value ) {
									updateResponsive( breakpoint, { disabled: value } );
								},
							} ),
							! override.disabled &&
								isScroll &&
								el( TextControl, {
									key: "scrub",
									label: __( "Scrub override", "capixel-components" ),
									type: "number",
									value: undefined === override.scrub ? "" : override.scrub,
									onChange: function ( value ) {
										updateResponsive( breakpoint, { scrub: "" === value ? undefined : parseFloat( value ) } );
									},
								} ),
							! override.disabled &&
								el( TextControl, {
									key: "duration",
									label: __( "Duration override", "capixel-components" ),
									type: "number",
									value: undefined === override.duration ? "" : override.duration,
									onChange: function ( value ) {
										updateResponsive( breakpoint, { duration: "" === value ? undefined : parseFloat( value ) } );
									},
								} ),
						] );
					} )
			  );

		return el( PanelBody, { title: __( "Animation", "capixel-components" ), initialOpen: false }, [ fields, responsivePanel ] );
	}

	window.PixelCoreEditor = window.PixelCoreEditor || {};
	window.PixelCoreEditor.AnimationPanel = AnimationPanel;
} )( window.wp );
