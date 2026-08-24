/**
 * PixelCore Card — UI del editor.
 */
( function ( wp ) {
	"use strict";

	var el               = wp.element.createElement;
	var Fragment          = wp.element.Fragment;
	var __                = wp.i18n.__;
	var useBlockProps     = wp.blockEditor.useBlockProps;
	var InspectorControls = wp.blockEditor.InspectorControls;
	var RichText          = wp.blockEditor.RichText;
	var MediaUpload       = wp.blockEditor.MediaUpload;
	var MediaUploadCheck  = wp.blockEditor.MediaUploadCheck;
	var PanelBody         = wp.components.PanelBody;
	var TextControl       = wp.components.TextControl;
	var SelectControl     = wp.components.SelectControl;
	var Button            = wp.components.Button;

	wp.blocks.registerBlockType( "pixelcore/card", {
		edit: function ( props ) {
			var attrs = props.attributes;
			var setAttributes = props.setAttributes;

			function set( patch ) {
				setAttributes( patch );
			}

			var blockProps = useBlockProps( {
				className:
					"pixelcore-card pixelcore-card--" +
					attrs.orientation +
					" pixelcore-card--" +
					attrs.cardStyle +
					" pixelcore-card--hover-" +
					attrs.hoverAnimation,
			} );

			var mediaPanel = el( PanelBody, { title: __( "Media & Icon", "capixel-components" ), key: "media" }, [
				el( MediaUploadCheck, { key: "check" }, [
					el( MediaUpload, {
						key: "upload",
						onSelect: function ( media ) {
							set( { imageUrl: media.url, imageId: media.id, imageAlt: media.alt || "" } );
						},
						allowedTypes: [ "image" ],
						value: attrs.imageId,
						render: function ( obj ) {
							return el(
								Button,
								{ variant: "secondary", onClick: obj.open },
								attrs.imageUrl ? __( "Replace image", "capixel-components" ) : __( "Select image", "capixel-components" )
							);
						},
					} ),
				] ),
				attrs.imageUrl &&
					el(
						Button,
						{
							key: "remove",
							variant: "link",
							isDestructive: true,
							onClick: function () {
								set( { imageUrl: "", imageId: 0 } );
							},
						},
						__( "Remove image", "capixel-components" )
					),
				el( TextControl, {
					key: "icon",
					label: __( "Icon (dashicon class)", "capixel-components" ),
					help: __( "Ej: dashicons-admin-home, dashicons-star-filled", "capixel-components" ),
					value: attrs.icon,
					onChange: function ( value ) {
						set( { icon: value } );
					},
				} ),
			] );

			var linkPanel = el( PanelBody, { title: __( "Link & Button", "capixel-components" ), key: "link" }, [
				el( TextControl, {
					key: "link",
					label: __( "Card link (título)", "capixel-components" ),
					value: attrs.link,
					onChange: function ( value ) {
						set( { link: value } );
					},
				} ),
				el( TextControl, {
					key: "btnText",
					label: __( "Button text", "capixel-components" ),
					value: attrs.buttonText,
					onChange: function ( value ) {
						set( { buttonText: value } );
					},
				} ),
				el( TextControl, {
					key: "btnUrl",
					label: __( "Button URL", "capixel-components" ),
					help: __( "Si se deja vacío, usa el link de la card.", "capixel-components" ),
					value: attrs.buttonUrl,
					onChange: function ( value ) {
						set( { buttonUrl: value } );
					},
				} ),
			] );

			var stylePanel = el( PanelBody, { title: __( "Style", "capixel-components" ), key: "style", initialOpen: false }, [
				el( SelectControl, {
					key: "orientation",
					label: __( "Orientation", "capixel-components" ),
					value: attrs.orientation,
					options: [
						{ value: "vertical", label: __( "Vertical", "capixel-components" ) },
						{ value: "horizontal", label: __( "Horizontal", "capixel-components" ) },
					],
					onChange: function ( value ) {
						set( { orientation: value } );
					},
				} ),
				el( SelectControl, {
					key: "cardStyle",
					label: __( "Style", "capixel-components" ),
					value: attrs.cardStyle,
					options: [
						{ value: "elevated", label: "Elevated" },
						{ value: "flat", label: "Flat" },
						{ value: "outline", label: "Outline" },
					],
					onChange: function ( value ) {
						set( { cardStyle: value } );
					},
				} ),
				el( SelectControl, {
					key: "hover",
					label: __( "Hover animation", "capixel-components" ),
					value: attrs.hoverAnimation,
					options: [
						{ value: "none", label: "None" },
						{ value: "lift", label: "Lift" },
						{ value: "shadow", label: "Shadow" },
						{ value: "zoom-image", label: "Zoom image" },
					],
					onChange: function ( value ) {
						set( { hoverAnimation: value } );
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
				el( InspectorControls, { key: "inspector" }, [ mediaPanel, linkPanel, stylePanel, animationPanel ] ),
				el( "div", blockProps, [
					attrs.imageUrl &&
						el( "div", { className: "pixelcore-card__media", key: "media" }, [
							el( "img", { src: attrs.imageUrl, alt: attrs.imageAlt, key: "img" } ),
						] ),
					el( "div", { className: "pixelcore-card__body", key: "body" }, [
						attrs.icon && el( "span", { className: "pixelcore-card__icon dashicons " + attrs.icon, key: "icon" } ),
						el( RichText, {
							key: "title",
							tagName: "h3",
							className: "pixelcore-card__title cp-h3",
							placeholder: __( "Título…", "capixel-components" ),
							value: attrs.title,
							onChange: function ( value ) {
								set( { title: value } );
							},
						} ),
						el( RichText, {
							key: "description",
							tagName: "p",
							className: "pixelcore-card__description",
							placeholder: __( "Descripción…", "capixel-components" ),
							value: attrs.description,
							onChange: function ( value ) {
								set( { description: value } );
							},
						} ),
						attrs.buttonText &&
							el( "span", { className: "pixelcore-card__button cp-btn cp-btn--outline", key: "btn" }, attrs.buttonText ),
					] ),
				] ),
			] );
		},
		save: function () {
			return null;
		},
	} );
} )( window.wp );
