/**
 * PixelCore Accordion — UI del editor (bloque contenedor).
 *
 * Usa InnerBlocks restringido a pixelcore/accordion-item, así cada item
 * puede llevar cualquier bloque de Gutenberg como contenido.
 */
( function ( wp ) {
	"use strict";

	var el                    = wp.element.createElement;
	var Fragment               = wp.element.Fragment;
	var __                     = wp.i18n.__;
	var useBlockProps          = wp.blockEditor.useBlockProps;
	var useInnerBlocksProps    = wp.blockEditor.useInnerBlocksProps;
	var InnerBlocks            = wp.blockEditor.InnerBlocks;
	var InspectorControls      = wp.blockEditor.InspectorControls;
	var PanelBody              = wp.components.PanelBody;
	var ToggleControl          = wp.components.ToggleControl;
	var SelectControl          = wp.components.SelectControl;

	var TEMPLATE = [
		[ "pixelcore/accordion-item", { title: __( "Pregunta 1", "capixel-components" ) } ],
		[ "pixelcore/accordion-item", { title: __( "Pregunta 2", "capixel-components" ) } ],
	];

	wp.blocks.registerBlockType( "pixelcore/accordion", {
		edit: function ( props ) {
			var attrs = props.attributes;
			var setAttributes = props.setAttributes;

			function set( patch ) {
				setAttributes( patch );
			}

			var blockProps = useBlockProps( {
				className: "pixelcore-accordion pixelcore-accordion--icon-" + attrs.iconPosition,
			} );

			var innerBlocksProps = useInnerBlocksProps( blockProps, {
				allowedBlocks: [ "pixelcore/accordion-item" ],
				template: TEMPLATE,
				templateInsertUpdatesSelection: false,
			} );

			var settingsPanel = el( PanelBody, { title: __( "Settings", "capixel-components" ), key: "settings" }, [
				el( ToggleControl, {
					key: "allowMultiple",
					label: __( "Allow multiple open", "capixel-components" ),
					checked: attrs.allowMultiple,
					onChange: function ( value ) {
						set( { allowMultiple: value } );
					},
				} ),
				el( SelectControl, {
					key: "iconPosition",
					label: __( "Icon position", "capixel-components" ),
					value: attrs.iconPosition,
					options: [
						{ value: "right", label: __( "Right", "capixel-components" ) },
						{ value: "left", label: __( "Left", "capixel-components" ) },
					],
					onChange: function ( value ) {
						set( { iconPosition: value } );
					},
				} ),
			] );

			var animationPanel =
				window.PixelCoreEditor &&
				el( window.PixelCoreEditor.AnimationPanel, {
					key: "animation",
					animation: attrs.animation,
					onChange: function ( next ) {
						set( { animation: next } );
					},
				} );

			return el( Fragment, {}, [
				el( InspectorControls, { key: "inspector" }, [ settingsPanel, animationPanel ] ),
				el( "div", innerBlocksProps ),
			] );
		},
		save: function () {
			return el( InnerBlocks.Content );
		},
	} );
} )( window.wp );
