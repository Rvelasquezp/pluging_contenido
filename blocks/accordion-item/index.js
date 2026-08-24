/**
 * PixelCore Accordion Item — UI del editor.
 */
( function ( wp ) {
	"use strict";

	var el                 = wp.element.createElement;
	var Fragment            = wp.element.Fragment;
	var __                  = wp.i18n.__;
	var useBlockProps       = wp.blockEditor.useBlockProps;
	var useInnerBlocksProps = wp.blockEditor.useInnerBlocksProps;
	var RichText            = wp.blockEditor.RichText;
	var InspectorControls   = wp.blockEditor.InspectorControls;
	var PanelBody           = wp.components.PanelBody;
	var ToggleControl       = wp.components.ToggleControl;

	wp.blocks.registerBlockType( "pixelcore/accordion-item", {
		edit: function ( props ) {
			var attrs = props.attributes;
			var setAttributes = props.setAttributes;

			var innerBlocksProps = useInnerBlocksProps(
				{ className: "pixelcore-accordion-item__panel-inner" },
				{ template: [ [ "core/paragraph", { placeholder: __( "Contenido de la respuesta…", "capixel-components" ) } ] ] }
			);

			var wrapperProps = useBlockProps( { className: "pixelcore-accordion-item is-open" } );

			return el( Fragment, {}, [
				el(
					InspectorControls,
					{ key: "inspector" },
					el( PanelBody, { title: __( "Settings", "capixel-components" ) }, [
						el( ToggleControl, {
							key: "open",
							label: __( "Open by default", "capixel-components" ),
							checked: attrs.openByDefault,
							onChange: function ( value ) {
								setAttributes( { openByDefault: value } );
							},
						} ),
					] )
				),
				el( "div", wrapperProps, [
					el( "div", { className: "pixelcore-accordion-item__trigger", key: "trigger" }, [
						el( RichText, {
							key: "title",
							tagName: "span",
							className: "pixelcore-accordion-item__title",
							placeholder: __( "Pregunta…", "capixel-components" ),
							value: attrs.title,
							onChange: function ( value ) {
								setAttributes( { title: value } );
							},
						} ),
						el( "span", { className: "pixelcore-accordion-item__icon", key: "icon", "aria-hidden": "true" } ),
					] ),
					el( "div", { className: "pixelcore-accordion-item__panel", key: "panel" }, [ el( "div", innerBlocksProps ) ] ),
				] ),
			] );
		},
		save: function () {
			return el( wp.blockEditor.InnerBlocks.Content );
		},
	} );
} )( window.wp );
