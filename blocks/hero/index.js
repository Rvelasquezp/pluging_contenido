/**
 * PixelCore Hero — UI del editor.
 *
 * Sin build step: usa wp.element.createElement directamente (sin JSX), así
 * el plugin no depende de webpack/babel para funcionar en un sitio nuevo.
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
	var FontSizePicker     = wp.components.FontSizePicker;
	var PanelBody          = wp.components.PanelBody;
	var TextControl        = wp.components.TextControl;
	var ToggleControl      = wp.components.ToggleControl;
	var RangeControl       = wp.components.RangeControl;
	var SelectControl      = wp.components.SelectControl;
	var Button             = wp.components.Button;

	var PALETTE = [
		{ name: "Primary", color: "#1f2937" },
		{ name: "Secondary", color: "#f97316" },
		{ name: "Surface", color: "#f9fafb" },
		{ name: "White", color: "#ffffff" },
		{ name: "Black", color: "#000000" },
	];

	var TITLE_FONT_SIZES = [
		{ name: "Small", size: "2.25rem", slug: "small" },
		{ name: "Medium", size: "3.5rem", slug: "medium" },
		{ name: "Large", size: "4.5rem", slug: "large" },
		{ name: "X-Large", size: "5.5rem", slug: "x-large" },
		{ name: "Huge", size: "6.5rem", slug: "huge" },
	];

	var DESCRIPTION_FONT_SIZES = [
		{ name: "Small", size: "0.875rem", slug: "small" },
		{ name: "Medium", size: "1.125rem", slug: "medium" },
		{ name: "Large", size: "1.5rem", slug: "large" },
		{ name: "X-Large", size: "2rem", slug: "x-large" },
	];

	wp.blocks.registerBlockType( "pixelcore/hero", {
		edit: function ( props ) {
			var attrs = props.attributes;
			var setAttributes = props.setAttributes;

			function set( patch ) {
				setAttributes( patch );
			}

			var blockProps = useBlockProps( {
				className: "pixelcore-hero pixelcore-hero--align-" + attrs.contentAlign + ( attrs.mediaUrl ? "" : " pixelcore-hero--no-media" ),
				style: {
					minHeight: attrs.minHeight,
					backgroundColor: attrs.backgroundColor || undefined,
				},
			} );

			var mediaPanel = el( PanelBody, { title: __( "Media", "capixel-components" ), key: "media" }, [
				el( SelectControl, {
					key: "mediaType",
					label: __( "Type", "capixel-components" ),
					value: attrs.mediaType,
					options: [
						{ value: "image", label: __( "Image", "capixel-components" ) },
						{ value: "video", label: __( "Video", "capixel-components" ) },
					],
					onChange: function ( value ) {
						set( { mediaType: value } );
					},
				} ),
				el( MediaUploadCheck, { key: "upload-check" }, [
					el( MediaUpload, {
						key: "upload",
						onSelect: function ( media ) {
							set( { mediaUrl: media.url, mediaId: media.id, mediaAlt: media.alt || "" } );
						},
						allowedTypes: "video" === attrs.mediaType ? [ "video" ] : [ "image" ],
						value: attrs.mediaId,
						render: function ( obj ) {
							return el(
								Button,
								{ variant: "secondary", onClick: obj.open },
								attrs.mediaUrl ? __( "Replace media", "capixel-components" ) : __( "Select media", "capixel-components" )
							);
						},
					} ),
				] ),
				attrs.mediaUrl &&
					el(
						Button,
						{
							key: "remove",
							variant: "link",
							isDestructive: true,
							onClick: function () {
								set( { mediaUrl: "", mediaId: 0 } );
							},
						},
						__( "Remove media", "capixel-components" )
					),
				attrs.mediaUrl &&
					"image" === attrs.mediaType &&
					el( TextControl, {
						key: "alt",
						label: __( "Alt text", "capixel-components" ),
						value: attrs.mediaAlt,
						onChange: function ( value ) {
							set( { mediaAlt: value } );
						},
					} ),
			] );

			var contentPanel = el( PanelBody, { title: __( "Content", "capixel-components" ), key: "content" }, [
				el( SelectControl, {
					key: "align",
					label: __( "Text align", "capixel-components" ),
					value: attrs.contentAlign,
					options: [
						{ value: "left", label: __( "Left", "capixel-components" ) },
						{ value: "center", label: __( "Center", "capixel-components" ) },
						{ value: "right", label: __( "Right", "capixel-components" ) },
					],
					onChange: function ( value ) {
						set( { contentAlign: value } );
					},
				} ),
				el( SelectControl, {
					key: "titleTag",
					label: __( "Title tag", "capixel-components" ),
					help: __( "Cambia el tag HTML del título (SEO/jerarquía) sin cambiar su tamaño visual.", "capixel-components" ),
					value: attrs.titleTag,
					options: [
						{ value: "h1", label: "H1" },
						{ value: "h2", label: "H2" },
						{ value: "h3", label: "H3" },
						{ value: "h4", label: "H4" },
						{ value: "h5", label: "H5" },
						{ value: "h6", label: "H6" },
					],
					onChange: function ( value ) {
						set( { titleTag: value } );
					},
				} ),
				el( "p", { key: "l3" }, __( "Title color", "capixel-components" ) ),
				el( ColorPalette, {
					key: "titleColor",
					colors: PALETTE,
					value: attrs.titleColor,
					onChange: function ( value ) {
						set( { titleColor: value || "" } );
					},
				} ),
				el( FontSizePicker, {
					key: "titleFontSize",
					fontSizes: TITLE_FONT_SIZES,
					value: attrs.titleFontSize || undefined,
					withReset: true,
					onChange: function ( value ) {
						set( { titleFontSize: value || "" } );
					},
				} ),
				el( "p", { key: "l4" }, __( "Description color", "capixel-components" ) ),
				el( ColorPalette, {
					key: "descriptionColor",
					colors: PALETTE,
					value: attrs.descriptionColor,
					onChange: function ( value ) {
						set( { descriptionColor: value || "" } );
					},
				} ),
				el( FontSizePicker, {
					key: "descriptionFontSize",
					fontSizes: DESCRIPTION_FONT_SIZES,
					value: attrs.descriptionFontSize || undefined,
					withReset: true,
					onChange: function ( value ) {
						set( { descriptionFontSize: value || "" } );
					},
				} ),
				el( RangeControl, {
					key: "maxWidth",
					label: __( "Content max width (px)", "capixel-components" ),
					value: attrs.maxWidth,
					min: 400,
					max: 1200,
					step: 20,
					onChange: function ( value ) {
						set( { maxWidth: value } );
					},
				} ),
				el( TextControl, {
					key: "minHeight",
					label: __( "Min height (CSS)", "capixel-components" ),
					help: __( "Ej: 70vh, 600px", "capixel-components" ),
					value: attrs.minHeight,
					onChange: function ( value ) {
						set( { minHeight: value } );
					},
				} ),
			] );

			var buttonsPanel = el( PanelBody, { title: __( "Buttons", "capixel-components" ), key: "buttons", initialOpen: false }, [
				el( TextControl, {
					key: "btn1text",
					label: __( "Button text", "capixel-components" ),
					value: attrs.buttonText,
					onChange: function ( value ) {
						set( { buttonText: value } );
					},
				} ),
				el( TextControl, {
					key: "btn1url",
					label: __( "Button URL", "capixel-components" ),
					value: attrs.buttonUrl,
					onChange: function ( value ) {
						set( { buttonUrl: value } );
					},
				} ),
				el( ToggleControl, {
					key: "btn1target",
					label: __( "Open in new tab", "capixel-components" ),
					checked: attrs.buttonTarget,
					onChange: function ( value ) {
						set( { buttonTarget: value } );
					},
				} ),
				el( TextControl, {
					key: "btn2text",
					label: __( "Second button text", "capixel-components" ),
					value: attrs.button2Text,
					onChange: function ( value ) {
						set( { button2Text: value } );
					},
				} ),
				el( TextControl, {
					key: "btn2url",
					label: __( "Second button URL", "capixel-components" ),
					value: attrs.button2Url,
					onChange: function ( value ) {
						set( { button2Url: value } );
					},
				} ),
				el( ToggleControl, {
					key: "btn2target",
					label: __( "Open in new tab", "capixel-components" ),
					checked: attrs.button2Target,
					onChange: function ( value ) {
						set( { button2Target: value } );
					},
				} ),
			] );

			var backgroundPanel = el( PanelBody, { title: __( "Background & Overlay", "capixel-components" ), key: "bg", initialOpen: false }, [
				el( "p", { key: "l1" }, __( "Background color (visible sin media)", "capixel-components" ) ),
				el( ColorPalette, {
					key: "bgcolor",
					colors: PALETTE,
					value: attrs.backgroundColor,
					onChange: function ( value ) {
						set( { backgroundColor: value || "" } );
					},
				} ),
				el( "p", { key: "l2" }, __( "Overlay color (sobre la media)", "capixel-components" ) ),
				el( ColorPalette, {
					key: "overlaycolor",
					colors: PALETTE,
					value: attrs.overlayColor,
					onChange: function ( value ) {
						set( { overlayColor: value || "#000000" } );
					},
				} ),
				el( RangeControl, {
					key: "overlayOpacity",
					label: __( "Overlay opacity (%)", "capixel-components" ),
					value: attrs.overlayOpacity,
					min: 0,
					max: 100,
					onChange: function ( value ) {
						set( { overlayOpacity: value } );
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
				el( InspectorControls, { key: "inspector" }, [ mediaPanel, contentPanel, buttonsPanel, backgroundPanel, animationPanel ] ),
				el( "div", blockProps, [
					attrs.mediaUrl &&
						el( "div", { className: "pixelcore-hero__media", key: "media" }, [
							"video" === attrs.mediaType
								? el( "video", { src: attrs.mediaUrl, muted: true, loop: true, autoPlay: true, key: "v" } )
								: el( "img", { src: attrs.mediaUrl, alt: attrs.mediaAlt, key: "i" } ),
						] ),
					attrs.mediaUrl &&
						el( "div", {
							className: "pixelcore-hero__overlay",
							key: "overlay",
							style: { backgroundColor: attrs.overlayColor, opacity: attrs.overlayOpacity / 100 },
						} ),
					el(
						"div",
						{ className: "pixelcore-hero__content cp-container", key: "content", style: { maxWidth: attrs.maxWidth + "px" } },
						[
							el( RichText, {
								key: "title",
								tagName: attrs.titleTag || "h1",
								className: "pixelcore-hero__title cp-h1",
								// Variables CSS (no "color"/"fontSize" directos): el SCSS del
								// bloque las lee con !important, así siempre se ven en el
								// editor sin pelear con el color/tamaño por defecto de RichText.
								style: {
									"--pc-title-color": attrs.titleColor || undefined,
									"--pc-title-font-size": attrs.titleFontSize || undefined,
								},
								placeholder: __( "Título del hero…", "capixel-components" ),
								value: attrs.title,
								onChange: function ( value ) {
									set( { title: value } );
								},
							} ),
							el( RichText, {
								key: "description",
								tagName: "p",
								className: "pixelcore-hero__description",
								style: {
									"--pc-description-color": attrs.descriptionColor || undefined,
									"--pc-description-font-size": attrs.descriptionFontSize || undefined,
								},
								placeholder: __( "Descripción…", "capixel-components" ),
								value: attrs.description,
								onChange: function ( value ) {
									set( { description: value } );
								},
							} ),
							( attrs.buttonText || attrs.button2Text ) &&
								el( "div", { className: "pixelcore-hero__actions cp-flex cp-gap-md", key: "actions" }, [
									attrs.buttonText && el( "span", { className: "cp-btn cp-btn--primary", key: "b1" }, attrs.buttonText ),
									attrs.button2Text && el( "span", { className: "cp-btn cp-btn--outline", key: "b2" }, attrs.button2Text ),
								] ),
						]
					),
				] ),
			] );
		},
		save: function () {
			return null;
		},
	} );
} )( window.wp );
