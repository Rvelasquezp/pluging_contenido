/**
 * PixelCore CTA — UI del editor.
 */
( function ( wp ) {
	"use strict";

	var el                = wp.element.createElement;
	var Fragment           = wp.element.Fragment;
	var __                 = wp.i18n.__;
	var useBlockProps      = wp.blockEditor.useBlockProps;
	var InspectorControls  = wp.blockEditor.InspectorControls;
	var RichText           = wp.blockEditor.RichText;
	var MediaUpload        = wp.blockEditor.MediaUpload;
	var MediaUploadCheck   = wp.blockEditor.MediaUploadCheck;
	var ColorPalette       = wp.components.ColorPalette;
	var PanelBody          = wp.components.PanelBody;
	var TextControl        = wp.components.TextControl;
	var SelectControl      = wp.components.SelectControl;
	var RangeControl       = wp.components.RangeControl;
	var Button             = wp.components.Button;

	var PALETTE = [
		{ name: "Primary", color: "#1f2937" },
		{ name: "Secondary", color: "#f97316" },
		{ name: "Surface", color: "#f9fafb" },
		{ name: "White", color: "#ffffff" },
	];

	wp.blocks.registerBlockType( "pixelcore/cta", {
		edit: function ( props ) {
			var attrs = props.attributes;
			var setAttributes = props.setAttributes;

			function set( patch ) {
				setAttributes( patch );
			}

			var blockProps = useBlockProps( {
				className: "pixelcore-cta pixelcore-cta--" + attrs.layout,
				style: {
					backgroundColor: attrs.backgroundColor || undefined,
					borderRadius: attrs.borderRadius + "px",
				},
			} );

			var contentPanel = el( PanelBody, { title: __( "Layout", "capixel-components" ), key: "layout" }, [
				el( SelectControl, {
					key: "layout",
					label: __( "Layout", "capixel-components" ),
					value: attrs.layout,
					options: [
						{ value: "center", label: __( "Centered", "capixel-components" ) },
						{ value: "split-right", label: __( "Media right", "capixel-components" ) },
						{ value: "split-left", label: __( "Media left", "capixel-components" ) },
					],
					onChange: function ( value ) {
						set( { layout: value } );
					},
				} ),
				"center" !== attrs.layout &&
					el( MediaUploadCheck, { key: "check" }, [
						el( MediaUpload, {
							onSelect: function ( media ) {
								set( { mediaUrl: media.url, mediaId: media.id, mediaAlt: media.alt || "" } );
							},
							allowedTypes: [ "image" ],
							value: attrs.mediaId,
							render: function ( obj ) {
								return el(
									Button,
									{ variant: "secondary", onClick: obj.open },
									attrs.mediaUrl ? __( "Replace image", "capixel-components" ) : __( "Select image", "capixel-components" )
								);
							},
						} ),
					] ),
				el( "p", { key: "l" }, __( "Background color", "capixel-components" ) ),
				el( ColorPalette, {
					key: "bg",
					colors: PALETTE,
					value: attrs.backgroundColor,
					onChange: function ( value ) {
						set( { backgroundColor: value || "" } );
					},
				} ),
				el( RangeControl, {
					key: "borderRadius",
					label: __( "Border radius (px)", "capixel-components" ),
					value: attrs.borderRadius,
					min: 0,
					max: 100,
					onChange: function ( value ) {
						set( { borderRadius: value } );
					},
				} ),
			] );

			var buttonsPanel = el( PanelBody, { title: __( "Buttons", "capixel-components" ), key: "buttons", initialOpen: false }, [
				el( TextControl, {
					key: "b1t",
					label: __( "Button text", "capixel-components" ),
					value: attrs.buttonText,
					onChange: function ( value ) {
						set( { buttonText: value } );
					},
				} ),
				el( TextControl, {
					key: "b1u",
					label: __( "Button URL", "capixel-components" ),
					value: attrs.buttonUrl,
					onChange: function ( value ) {
						set( { buttonUrl: value } );
					},
				} ),
				el( TextControl, {
					key: "b2t",
					label: __( "Second button text", "capixel-components" ),
					value: attrs.button2Text,
					onChange: function ( value ) {
						set( { button2Text: value } );
					},
				} ),
				el( TextControl, {
					key: "b2u",
					label: __( "Second button URL", "capixel-components" ),
					value: attrs.button2Url,
					onChange: function ( value ) {
						set( { button2Url: value } );
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
				el( InspectorControls, { key: "inspector" }, [ contentPanel, buttonsPanel, animationPanel ] ),
				el( "div", blockProps, [
					attrs.mediaUrl &&
						"center" !== attrs.layout &&
						el( "div", { className: "pixelcore-cta__media", key: "media" }, [
							el( "img", { src: attrs.mediaUrl, alt: attrs.mediaAlt, key: "img" } ),
						] ),
					el( "div", { className: "pixelcore-cta__content", key: "content" }, [
						el( RichText, {
							key: "title",
							tagName: "h2",
							className: "pixelcore-cta__title cp-h2",
							placeholder: __( "Título…", "capixel-components" ),
							value: attrs.title,
							onChange: function ( value ) {
								set( { title: value } );
							},
						} ),
						el( RichText, {
							key: "description",
							tagName: "p",
							className: "pixelcore-cta__description",
							placeholder: __( "Descripción…", "capixel-components" ),
							value: attrs.description,
							onChange: function ( value ) {
								set( { description: value } );
							},
						} ),
						( attrs.buttonText || attrs.button2Text ) &&
							el( "div", { className: "pixelcore-cta__actions", key: "actions" }, [
								attrs.buttonText && el( "span", { className: "cp-btn cp-btn--primary", key: "b1" }, attrs.buttonText ),
								attrs.button2Text && el( "span", { className: "cp-btn cp-btn--outline", key: "b2" }, attrs.button2Text ),
							] ),
					] ),
				] ),
			] );
		},
		save: function () {
			return null;
		},
	} );
} )( window.wp );
