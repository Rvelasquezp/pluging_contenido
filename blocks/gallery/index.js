/**
 * PixelCore Gallery — UI del editor.
 *
 * Sin build step: usa wp.element.createElement directamente (sin JSX), igual
 * que el resto de bloques del plugin.
 */
( function ( wp ) {
	"use strict";

	var el                = wp.element.createElement;
	var Fragment          = wp.element.Fragment;
	var useState          = wp.element.useState;
	var __                = wp.i18n.__;
	var useBlockProps      = wp.blockEditor.useBlockProps;
	var InspectorControls  = wp.blockEditor.InspectorControls;
	var MediaUpload        = wp.blockEditor.MediaUpload;
	var MediaUploadCheck   = wp.blockEditor.MediaUploadCheck;
	var ColorPalette       = wp.components.ColorPalette;
	var FontSizePicker     = wp.components.FontSizePicker;
	var PanelBody          = wp.components.PanelBody;
	var TextControl        = wp.components.TextControl;
	var TextareaControl    = wp.components.TextareaControl;
	var ToggleControl      = wp.components.ToggleControl;
	var RangeControl       = wp.components.RangeControl;
	var SelectControl      = wp.components.SelectControl;
	var Button             = wp.components.Button;
	var Placeholder        = wp.components.Placeholder;

	var PALETTE = [
		{ name: "Primary", color: "#1f2937" },
		{ name: "Secondary", color: "#f97316" },
		{ name: "Surface", color: "#f9fafb" },
		{ name: "White", color: "#ffffff" },
		{ name: "Black", color: "#000000" },
	];

	var CAPTION_FONT_SIZES = [
		{ name: "Small", size: "0.8125rem", slug: "small" },
		{ name: "Medium", size: "0.9375rem", slug: "medium" },
		{ name: "Large", size: "1.125rem", slug: "large" },
	];

	// Fallback si por algún motivo window.PixelCoreGalleryData no llegó a
	// inyectarse (ver PixelCore_Gallery::enqueue_editor_data()) — así el
	// bloque no se queda sin SelectControl utilizable.
	var FALLBACK_LAYOUTS = [
		{ value: "grid", label: "Grid", needsColumns: true, needsGap: true, needsHoverZoom: true },
		{ value: "masonry", label: "Masonry", needsColumns: true, needsGap: true, needsHoverZoom: true },
		{ value: "justified", label: "Justified Gallery", needsColumns: true, needsGap: true, needsHoverZoom: true },
		{ value: "carousel", label: "Carousel / Slider", needsColumns: true, needsGap: true, needsArrowColor: true, needsHoverZoom: true },
		{ value: "horizontal", label: "Horizontal Gallery", needsColumns: true, needsGap: true, needsHoverZoom: true },
		{ value: "vertical", label: "Vertical Gallery", needsColumns: false, needsGap: true },
		{ value: "thumbnail", label: "Thumbnail Gallery", needsColumns: false, needsGap: true },
		{ value: "fullscreen", label: "Fullscreen Gallery", needsColumns: false, needsGap: false },
	];

	function getLayouts() {
		return ( window.PixelCoreGalleryData && window.PixelCoreGalleryData.layouts ) || FALLBACK_LAYOUTS;
	}

	function getLayoutConfig( type, layouts ) {
		for ( var i = 0; i < layouts.length; i++ ) {
			if ( layouts[ i ].value === type ) {
				return layouts[ i ];
			}
		}
		return layouts[ 0 ];
	}

	wp.blocks.registerBlockType( "pixelcore/gallery", {
		edit: function ( props ) {
			var attrs = props.attributes;
			var setAttributes = props.setAttributes;
			var images = attrs.images || [];
			var layouts = getLayouts();
			var currentLayout = getLayoutConfig( attrs.galleryType, layouts );

			var selectedState = useState( null );
			var selectedIndex = selectedState[ 0 ];
			var setSelectedIndex = selectedState[ 1 ];

			var dragIndex = null;

			function set( patch ) {
				setAttributes( patch );
			}

			function setColumns( key, value ) {
				var next = Object.assign( {}, attrs.columns, {} );
				next[ key ] = value;
				set( { columns: next } );
			}

			function addImages( media ) {
				var mediaList = Array.isArray( media ) ? media : [ media ];
				var added = mediaList.map( function ( item ) {
					return { id: item.id, url: item.url, alt: item.alt || "", title: "", description: "" };
				} );
				set( { images: images.concat( added ) } );
			}

			function replaceImage( index, media ) {
				var next = images.slice();
				next[ index ] = Object.assign( {}, next[ index ], { id: media.id, url: media.url, alt: media.alt || next[ index ].alt } );
				set( { images: next } );
			}

			function updateImageField( index, key, value ) {
				var next = images.slice();
				next[ index ] = Object.assign( {}, next[ index ] );
				next[ index ][ key ] = value;
				set( { images: next } );
			}

			function removeImage( index ) {
				var next = images.slice();
				next.splice( index, 1 );
				set( { images: next } );
				if ( selectedIndex === index ) {
					setSelectedIndex( null );
				}
			}

			function reorder( from, to ) {
				if ( null === from || undefined === from || from === to ) {
					return;
				}
				var next = images.slice();
				var moved = next.splice( from, 1 )[ 0 ];
				next.splice( to, 0, moved );
				set( { images: next } );
				if ( selectedIndex === from ) {
					setSelectedIndex( to );
				}
			}

			function moveImage( index, delta ) {
				var to = index + delta;
				if ( to < 0 || to >= images.length ) {
					return;
				}
				reorder( index, to );
			}

			var blockProps = useBlockProps( {
				className: "pixelcore-gallery pixelcore-gallery--editor pixelcore-gallery--" + attrs.galleryType,
			} );

			// -- Gallery Settings ---------------------------------------------
			var galleryPanelChildren = [
				el( SelectControl, {
					key: "type",
					label: __( "Gallery type", "capixel-components" ),
					value: attrs.galleryType,
					options: layouts.map( function ( layout ) {
						return { value: layout.value, label: layout.label };
					} ),
					onChange: function ( value ) {
						set( { galleryType: value } );
					},
				} ),
			];

			if ( currentLayout.needsColumns ) {
				galleryPanelChildren.push(
					el( RangeControl, {
						key: "colsDesktop",
						label: __( "Columns — desktop", "capixel-components" ),
						value: attrs.columns.desktop,
						min: 1,
						max: 8,
						onChange: function ( value ) {
							setColumns( "desktop", value );
						},
					} ),
					el( RangeControl, {
						key: "colsTablet",
						label: __( "Columns — tablet", "capixel-components" ),
						value: attrs.columns.tablet,
						min: 1,
						max: 6,
						onChange: function ( value ) {
							setColumns( "tablet", value );
						},
					} ),
					el( RangeControl, {
						key: "colsMobile",
						label: __( "Columns — mobile", "capixel-components" ),
						value: attrs.columns.mobile,
						min: 1,
						max: 4,
						onChange: function ( value ) {
							setColumns( "mobile", value );
						},
					} )
				);
			}

			if ( currentLayout.needsGap ) {
				galleryPanelChildren.push(
					el( RangeControl, {
						key: "gap",
						label: __( "Gap (px)", "capixel-components" ),
						value: attrs.gap,
						min: 0,
						max: 80,
						onChange: function ( value ) {
							set( { gap: value } );
						},
					} )
				);
			}

			galleryPanelChildren.push(
				el( ToggleControl, {
					key: "lightbox",
					label: __( "Lightbox", "capixel-components" ),
					help: __( "Al hacer click en una imagen, se abre en un lightbox con navegación y miniaturas.", "capixel-components" ),
					checked: attrs.lightbox,
					onChange: function ( value ) {
						set( { lightbox: value } );
					},
				} )
			);

			if ( currentLayout.needsHoverZoom ) {
				galleryPanelChildren.push(
					el( ToggleControl, {
						key: "imageHoverZoom",
						label: __( "Image hover zoom", "capixel-components" ),
						help: __( "Al pasar el mouse sobre una imagen, hace un zoom suave.", "capixel-components" ),
						checked: attrs.imageHoverZoom,
						onChange: function ( value ) {
							set( { imageHoverZoom: value } );
						},
					} )
				);
			}

			if ( currentLayout.needsArrowColor ) {
				galleryPanelChildren.push(
					el( "p", { key: "arrowColorLabel" }, __( "Arrow color", "capixel-components" ) ),
					el( ColorPalette, {
						key: "arrowColor",
						colors: PALETTE,
						value: attrs.carouselArrowColor,
						onChange: function ( value ) {
							set( { carouselArrowColor: value || "#495156" } );
						},
					} ),
					el( "p", { key: "arrowHoverColorLabel" }, __( "Arrow hover color", "capixel-components" ) ),
					el( ColorPalette, {
						key: "arrowHoverColor",
						colors: PALETTE,
						value: attrs.carouselArrowHoverColor,
						onChange: function ( value ) {
							set( { carouselArrowHoverColor: value || "#f97316" } );
						},
					} )
				);
			}

			var galleryPanel = el( PanelBody, { title: __( "Gallery Settings", "capixel-components" ), key: "gallery-settings" }, galleryPanelChildren );

			// -- Image Settings (estilo global del caption + detalle de la
			// imagen seleccionada en la grilla de abajo) ---------------------
			var selectedImage = null !== selectedIndex ? images[ selectedIndex ] : null;

			var imagePanelChildren = [];

			if ( selectedImage ) {
				imagePanelChildren.push(
					el( "p", { key: "sel-label" }, __( "Editando imagen", "capixel-components" ) + " #" + ( selectedIndex + 1 ) ),
					el( TextControl, {
						key: "title",
						label: __( "Title", "capixel-components" ),
						value: selectedImage.title || "",
						onChange: function ( value ) {
							updateImageField( selectedIndex, "title", value );
						},
					} ),
					el( TextareaControl, {
						key: "description",
						label: __( "Description", "capixel-components" ),
						help: __( "Se muestra como overlay flotante sobre la imagen al hacer hover.", "capixel-components" ),
						value: selectedImage.description || "",
						onChange: function ( value ) {
							updateImageField( selectedIndex, "description", value );
						},
					} ),
					el( TextControl, {
						key: "alt",
						label: __( "Alt text", "capixel-components" ),
						value: selectedImage.alt || "",
						onChange: function ( value ) {
							updateImageField( selectedIndex, "alt", value );
						},
					} ),
					el( "hr", { key: "sep" } )
				);
			} else {
				imagePanelChildren.push(
					el( "p", { key: "no-sel" }, __( "Selecciona una imagen en la galería para editar su título, descripción y alt text.", "capixel-components" ) )
				);
			}

			imagePanelChildren.push(
				el( "p", { key: "l1" }, __( "Description text color", "capixel-components" ) ),
				el( ColorPalette, {
					key: "captionColor",
					colors: PALETTE,
					value: attrs.captionTextColor,
					onChange: function ( value ) {
						set( { captionTextColor: value || "" } );
					},
				} ),
				el( FontSizePicker, {
					key: "captionSize",
					fontSizes: CAPTION_FONT_SIZES,
					value: attrs.captionFontSize || undefined,
					withReset: true,
					onChange: function ( value ) {
						set( { captionFontSize: value || "" } );
					},
				} ),
				el( "p", { key: "l2" }, __( "Overlay background color", "capixel-components" ) ),
				el( ColorPalette, {
					key: "captionBg",
					colors: PALETTE,
					value: attrs.captionBgColor,
					onChange: function ( value ) {
						set( { captionBgColor: value || "" } );
					},
				} ),
				el( RangeControl, {
					key: "captionOpacity",
					label: __( "Overlay opacity (%)", "capixel-components" ),
					value: attrs.captionBgOpacity,
					min: 0,
					max: 100,
					onChange: function ( value ) {
						set( { captionBgOpacity: value } );
					},
				} ),
				el( SelectControl, {
					key: "captionAlign",
					label: __( "Text align", "capixel-components" ),
					value: attrs.captionTextAlign,
					options: [
						{ value: "left", label: __( "Left", "capixel-components" ) },
						{ value: "center", label: __( "Center", "capixel-components" ) },
						{ value: "right", label: __( "Right", "capixel-components" ) },
					],
					onChange: function ( value ) {
						set( { captionTextAlign: value } );
					},
				} ),
				el( SelectControl, {
					key: "captionPosition",
					label: __( "Text position", "capixel-components" ),
					value: attrs.captionPosition,
					options: [
						{ value: "top", label: __( "Top", "capixel-components" ) },
						{ value: "center", label: __( "Center", "capixel-components" ) },
						{ value: "bottom", label: __( "Bottom", "capixel-components" ) },
					],
					onChange: function ( value ) {
						set( { captionPosition: value } );
					},
				} )
			);

			var imagePanel = el( PanelBody, { title: __( "Image Settings", "capixel-components" ), key: "image-settings", initialOpen: false }, imagePanelChildren );

			var animationPanel =
				window.PixelCoreEditor &&
				el( window.PixelCoreEditor.AnimationPanel, {
					key: "animation",
					animation: attrs.animation,
					onChange: function ( next ) {
						set( { animation: next } );
					},
				} );

			// -- Canvas: placeholder o grilla editable de miniaturas ---------
			var addButton = el( MediaUploadCheck, { key: "upload-check" }, [
				el( MediaUpload, {
					key: "upload",
					multiple: true,
					gallery: true,
					addToGallery: images.length > 0,
					allowedTypes: [ "image" ],
					value: images.map( function ( img ) {
						return img.id;
					} ),
					onSelect: addImages,
					render: function ( obj ) {
						return el(
							Button,
							{ variant: images.length ? "secondary" : "primary", onClick: obj.open },
							images.length ? __( "Add more images", "capixel-components" ) : __( "Add images", "capixel-components" )
						);
					},
				} ),
			] );

			var canvasContent;

			if ( ! images.length ) {
				canvasContent = el(
					Placeholder,
					{
						icon: "format-gallery",
						label: __( "PixelCore Gallery", "capixel-components" ),
						instructions: __( "Selecciona o sube las imágenes de la galería desde la Media Library.", "capixel-components" ),
					},
					[ addButton ]
				);
			} else {
				var thumbs = images.map( function ( image, index ) {
					var isSelected = index === selectedIndex;

					return el(
						"figure",
						{
							key: image.id + "-" + index,
							className: "pixelcore-gallery-editor__item" + ( isSelected ? " is-selected" : "" ),
							draggable: true,
							onDragStart: function () {
								dragIndex = index;
							},
							onDragOver: function ( e ) {
								e.preventDefault();
							},
							onDrop: function ( e ) {
								e.preventDefault();
								reorder( dragIndex, index );
								dragIndex = null;
							},
							onClick: function () {
								setSelectedIndex( isSelected ? null : index );
							},
						},
						[
							el( "img", { key: "img", src: image.url, alt: image.alt || "" } ),
							( image.title || image.description ) &&
								el( "span", { key: "hasCaption", className: "pixelcore-gallery-editor__caption-dot" } ),
							el(
								"div",
								{ key: "toolbar", className: "pixelcore-gallery-editor__item-toolbar" },
								[
									el( Button, {
										key: "up",
										icon: "arrow-up-alt2",
										label: __( "Move earlier", "capixel-components" ),
										isSmall: true,
										onClick: function ( e ) {
											e.stopPropagation();
											moveImage( index, -1 );
										},
									} ),
									el( Button, {
										key: "down",
										icon: "arrow-down-alt2",
										label: __( "Move later", "capixel-components" ),
										isSmall: true,
										onClick: function ( e ) {
											e.stopPropagation();
											moveImage( index, 1 );
										},
									} ),
									el( MediaUploadCheck, { key: "replace-check" }, [
										el( MediaUpload, {
											key: "replace",
											allowedTypes: [ "image" ],
											value: image.id,
											onSelect: function ( media ) {
												replaceImage( index, media );
											},
											render: function ( obj ) {
												return el( Button, {
													icon: "format-image",
													label: __( "Replace", "capixel-components" ),
													isSmall: true,
													onClick: function ( e ) {
														e.stopPropagation();
														obj.open();
													},
												} );
											},
										} ),
									] ),
									el( Button, {
										key: "remove",
										icon: "trash",
										label: __( "Remove", "capixel-components" ),
										isSmall: true,
										isDestructive: true,
										onClick: function ( e ) {
											e.stopPropagation();
											removeImage( index );
										},
									} ),
								]
							),
						]
					);
				} );

				canvasContent = el( Fragment, {}, [
					el( "div", { key: "grid", className: "pixelcore-gallery-editor__grid" }, thumbs ),
					el( "div", { key: "add", className: "pixelcore-gallery-editor__add" }, [ addButton ] ),
				] );
			}

			return el( Fragment, {}, [
				el( InspectorControls, { key: "inspector" }, [ galleryPanel, imagePanel, animationPanel ] ),
				el( "div", blockProps, [ canvasContent ] ),
			] );
		},
		save: function () {
			return null;
		},
	} );
} )( window.wp );
