<?php
/**
 * Render server-side del bloque PixelCore Hero.
 *
 * Variables disponibles automáticamente porque block.json declara
 * "render": "file:./render.php": $attributes, $content, $block.
 *
 * @package PixelCore_Components
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$title              = $attributes['title'] ?? '';
$title_tag          = $attributes['titleTag'] ?? 'h1';
$title_color        = $attributes['titleColor'] ?? '';
$title_font_size    = $attributes['titleFontSize'] ?? '';
$description        = $attributes['description'] ?? '';
$description_color  = $attributes['descriptionColor'] ?? '';
$description_font_size = $attributes['descriptionFontSize'] ?? '';

// Whitelist estricto: nunca imprimir un nombre de tag que no controlemos.
if ( ! in_array( $title_tag, array( 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ), true ) ) {
	$title_tag = 'h1';
}
$media_type      = $attributes['mediaType'] ?? 'image';
$media_url       = $attributes['mediaUrl'] ?? '';
$media_alt       = $attributes['mediaAlt'] ?? '';
$button_text     = $attributes['buttonText'] ?? '';
$button_url      = $attributes['buttonUrl'] ?? '';
$button_target   = ! empty( $attributes['buttonTarget'] );
$button2_text    = $attributes['button2Text'] ?? '';
$button2_url     = $attributes['button2Url'] ?? '';
$button2_target  = ! empty( $attributes['button2Target'] );
$content_align      = $attributes['contentAlign'] ?? 'center';
$use_custom_position = ! empty( $attributes['useCustomPosition'] );
$position_x         = (float) ( $attributes['positionX'] ?? 0 );
$position_y         = (float) ( $attributes['positionY'] ?? 0 );
$max_width       = (int) ( $attributes['maxWidth'] ?? 800 );
$min_height      = $attributes['minHeight'] ?? '70vh';
$background      = $attributes['backgroundColor'] ?? '';
$overlay_color   = $attributes['overlayColor'] ?? '#000000';
$overlay_opacity = (int) ( $attributes['overlayOpacity'] ?? 40 );

$wrapper_classes = array( 'pixelcore-hero', 'pixelcore-hero--align-' . sanitize_html_class( $content_align ) );

if ( $use_custom_position ) {
	$wrapper_classes[] = 'pixelcore-hero--custom-position';
}

if ( empty( $media_url ) ) {
	$wrapper_classes[] = 'pixelcore-hero--no-media';
}

$wrapper_style = array( 'min-height:' . esc_attr( $min_height ) );

if ( $background ) {
	$wrapper_style[] = 'background-color:' . esc_attr( $background );
}

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => implode( ' ', $wrapper_classes ),
		'style' => implode( ';', $wrapper_style ),
	)
);

$animation_attrs = capixel_animation_attributes( $attributes['animation'] ?? array() );
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput -- ya escapado por get_block_wrapper_attributes(). ?> <?php echo $animation_attrs; // phpcs:ignore WordPress.Security.EscapeOutput -- ya escapado por capixel_animation_attributes(). ?>>

	<?php if ( $media_url ) : ?>
		<div class="pixelcore-hero__media">
			<?php if ( 'video' === $media_type ) : ?>
				<video src="<?php echo esc_url( $media_url ); ?>" autoplay muted loop playsinline></video>
			<?php else : ?>
				<img src="<?php echo esc_url( $media_url ); ?>" alt="<?php echo esc_attr( $media_alt ); ?>" />
			<?php endif; ?>
		</div>
		<div class="pixelcore-hero__overlay" style="background-color:<?php echo esc_attr( $overlay_color ); ?>;opacity:<?php echo esc_attr( $overlay_opacity / 100 ); ?>"></div>
	<?php endif; ?>

	<div class="pixelcore-hero__content cp-container" style="max-width:<?php echo esc_attr( $max_width ); ?>px<?php echo $use_custom_position ? ';position:absolute;left:' . esc_attr( $position_x ) . 'vw;top:' . esc_attr( $position_y ) . 'vh;margin:0' : ''; ?>">
		<?php if ( $title ) : ?>
			<<?php echo esc_html( $title_tag ); ?>
				class="pixelcore-hero__title cp-h1"
				<?php
				echo capixel_css_vars_attribute(
					array(
						'--pc-title-color'     => $title_color,
						'--pc-title-font-size' => $title_font_size,
					)
				);
				?>
			><?php echo wp_kses_post( $title ); ?></<?php echo esc_html( $title_tag ); ?>>
		<?php endif; ?>

		<?php if ( $description ) : ?>
			<p
				class="pixelcore-hero__description"
				<?php
				echo capixel_css_vars_attribute(
					array(
						'--pc-description-color'     => $description_color,
						'--pc-description-font-size' => $description_font_size,
					)
				);
				?>
			><?php echo wp_kses_post( $description ); ?></p>
		<?php endif; ?>

		<?php if ( $button_text || $button2_text ) : ?>
			<div class="pixelcore-hero__actions cp-flex cp-gap-md">
				<?php if ( $button_text ) : ?>
					<a
						class="cp-btn cp-btn--primary"
						href="<?php echo esc_url( $button_url ); ?>"
						<?php echo $button_target ? 'target="_blank" rel="noopener noreferrer"' : ''; ?>
					>
						<?php echo esc_html( $button_text ); ?>
					</a>
				<?php endif; ?>

				<?php if ( $button2_text ) : ?>
					<a
						class="cp-btn cp-btn--outline"
						href="<?php echo esc_url( $button2_url ); ?>"
						<?php echo $button2_target ? 'target="_blank" rel="noopener noreferrer"' : ''; ?>
					>
						<?php echo esc_html( $button2_text ); ?>
					</a>
				<?php endif; ?>
			</div>
		<?php endif; ?>
	</div>
</div>
