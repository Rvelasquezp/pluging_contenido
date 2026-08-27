<?php
/**
 * Render server-side del bloque PixelCore Gallery.
 *
 * @package PixelCore_Components
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$images        = is_array( $attributes['images'] ?? null ) ? $attributes['images'] : array();
$gallery_type  = $attributes['galleryType'] ?? 'grid';
$columns       = wp_parse_args(
	is_array( $attributes['columns'] ?? null ) ? $attributes['columns'] : array(),
	array( 'desktop' => 3, 'tablet' => 2, 'mobile' => 1 )
);
$gap             = (int) ( $attributes['gap'] ?? 16 );
$lightbox        = ! empty( $attributes['lightbox'] );
$hover_zoom      = ! isset( $attributes['imageHoverZoom'] ) || ! empty( $attributes['imageHoverZoom'] );
$caption_color   = $attributes['captionTextColor'] ?? '';
$caption_size    = $attributes['captionFontSize'] ?? '';
$caption_bg      = $attributes['captionBgColor'] ?? '';
$caption_opacity = (int) ( $attributes['captionBgOpacity'] ?? 60 );
$caption_align   = $attributes['captionTextAlign'] ?? 'left';
$caption_position = $attributes['captionPosition'] ?? 'bottom';
$arrow_color       = $attributes['carouselArrowColor'] ?? '#495156';
$arrow_hover_color = $attributes['carouselArrowHoverColor'] ?? '#f97316';

if ( empty( $images ) ) {
	return;
}

$layout = PixelCore_Gallery::get_layout( $gallery_type );

// Carga condicional por instancia: solo lo que esta galería en particular
// necesita, no lo que el bloque podría necesitar en abstracto.
if ( ! empty( $layout['js_handle'] ) ) {
	wp_enqueue_script( $layout['js_handle'] );
}

if ( $lightbox ) {
	wp_enqueue_script( PixelCore_Gallery::LIGHTBOX_HANDLE );
}

$wrapper_classes = array(
	'pixelcore-gallery',
	'pixelcore-gallery--' . sanitize_html_class( $gallery_type ),
);

if ( $hover_zoom ) {
	$wrapper_classes[] = 'pixelcore-gallery--hover-zoom';
}

$wrapper_style = array(
	'--pc-gallery-cols-desktop:' . (int) $columns['desktop'],
	'--pc-gallery-cols-tablet:' . (int) $columns['tablet'],
	'--pc-gallery-cols-mobile:' . (int) $columns['mobile'],
	'--pc-gallery-gap:' . $gap . 'px',
	'--pc-gallery-arrow-color:' . esc_attr( $arrow_color ),
	'--pc-gallery-arrow-hover-color:' . esc_attr( $arrow_hover_color ),
);

// Datos para el lightbox: siempre a tamaño "full" (independiente del
// tamaño mostrado en la grilla), para que la navegación no dependa de qué
// tan grande se ve la miniatura en este layout en particular.
$lightbox_images = array();

foreach ( $images as $image ) {
	$id = isset( $image['id'] ) ? (int) $image['id'] : 0;

	$lightbox_images[] = array(
		'fullUrl'     => $id ? wp_get_attachment_image_url( $id, 'full' ) : ( $image['url'] ?? '' ),
		'alt'         => $image['alt'] ?? '',
		'title'       => $image['title'] ?? '',
		'description' => $image['description'] ?? '',
	);
}

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => implode( ' ', $wrapper_classes ),
		'style' => implode( ';', $wrapper_style ),
	)
);

$animation_attrs = capixel_animation_attributes( $attributes['animation'] ?? array() );

$gallery_data_attrs = sprintf(
	' data-cp-gallery data-cp-gallery-type="%s" data-cp-gallery-lightbox="%s" data-cp-gallery-images="%s"',
	esc_attr( $gallery_type ),
	$lightbox ? 'true' : 'false',
	esc_attr( wp_json_encode( $lightbox_images ) )
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput -- ya escapado por get_block_wrapper_attributes(). ?> <?php echo $gallery_data_attrs; // phpcs:ignore WordPress.Security.EscapeOutput -- construido con esc_attr() arriba. ?> <?php echo $animation_attrs; // phpcs:ignore WordPress.Security.EscapeOutput -- ya escapado por capixel_animation_attributes(). ?>>
	<?php foreach ( $images as $index => $image ) : ?>
		<?php
		$id          = isset( $image['id'] ) ? (int) $image['id'] : 0;
		$alt         = $image['alt'] ?? '';
		$title       = $image['title'] ?? '';
		$description = $image['description'] ?? '';
		$has_caption = '' !== $title || '' !== $description;
		?>
		<figure class="pixelcore-gallery__item">
			<button
				type="button"
				class="pixelcore-gallery__trigger"
				data-cp-gallery-index="<?php echo (int) $index; ?>"
				aria-label="<?php echo esc_attr( $title ? $title : __( 'Ver imagen', 'capixel-components' ) ); ?>"
			>
				<?php
				if ( $id ) {
					echo wp_get_attachment_image(
						$id,
						'large',
						false,
						array(
							'class' => 'pixelcore-gallery__image',
							'alt'   => $alt,
						)
					);
				} elseif ( ! empty( $image['url'] ) ) {
					printf(
						'<img class="pixelcore-gallery__image" src="%s" alt="%s" loading="lazy" />',
						esc_url( $image['url'] ),
						esc_attr( $alt )
					);
				}
				?>

				<?php if ( $has_caption ) : ?>
					<span
						class="pixelcore-gallery__caption pixelcore-gallery__caption--<?php echo esc_attr( $caption_position ); ?> pixelcore-gallery__caption--align-<?php echo esc_attr( $caption_align ); ?>"
						<?php
						echo capixel_css_vars_attribute(
							array(
								'--pc-gallery-caption-color'    => $caption_color,
								'--pc-gallery-caption-size'     => $caption_size,
								'--pc-gallery-caption-bg'       => capixel_hex_to_rgba( $caption_bg, $caption_opacity ),
							)
						);
						?>
					>
						<?php if ( '' !== $title ) : ?>
							<span class="pixelcore-gallery__caption-title"><?php echo esc_html( $title ); ?></span>
						<?php endif; ?>
						<?php if ( '' !== $description ) : ?>
							<span class="pixelcore-gallery__caption-desc"><?php echo esc_html( $description ); ?></span>
						<?php endif; ?>
					</span>
				<?php endif; ?>
			</button>
		</figure>
	<?php endforeach; ?>
</div>
