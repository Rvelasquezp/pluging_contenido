<?php
/**
 * Render server-side del bloque PixelCore CTA.
 *
 * @package PixelCore_Components
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$title       = $attributes['title'] ?? '';
$description = $attributes['description'] ?? '';
$media_url   = $attributes['mediaUrl'] ?? '';
$media_alt   = $attributes['mediaAlt'] ?? '';
$button_text = $attributes['buttonText'] ?? '';
$button_url  = $attributes['buttonUrl'] ?? '';
$button2_text = $attributes['button2Text'] ?? '';
$button2_url  = $attributes['button2Url'] ?? '';
$layout        = $attributes['layout'] ?? 'center';
$background    = $attributes['backgroundColor'] ?? '';
$border_radius = (int) ( $attributes['borderRadius'] ?? 24 );

$wrapper_style = array( 'border-radius:' . $border_radius . 'px' );

if ( $background ) {
	$wrapper_style[] = 'background-color:' . esc_attr( $background );
}

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => 'pixelcore-cta pixelcore-cta--' . sanitize_html_class( $layout ),
		'style' => implode( ';', $wrapper_style ),
	)
);

$animation_attrs = capixel_animation_attributes( $attributes['animation'] ?? array() );
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput ?> <?php echo $animation_attrs; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
	<?php if ( $media_url && 'center' !== $layout ) : ?>
		<div class="pixelcore-cta__media">
			<img src="<?php echo esc_url( $media_url ); ?>" alt="<?php echo esc_attr( $media_alt ); ?>" />
		</div>
	<?php endif; ?>

	<div class="pixelcore-cta__content">
		<?php if ( $title ) : ?>
			<h2 class="pixelcore-cta__title cp-h2"><?php echo wp_kses_post( $title ); ?></h2>
		<?php endif; ?>

		<?php if ( $description ) : ?>
			<p class="pixelcore-cta__description"><?php echo wp_kses_post( $description ); ?></p>
		<?php endif; ?>

		<?php if ( $button_text || $button2_text ) : ?>
			<div class="pixelcore-cta__actions">
				<?php if ( $button_text ) : ?>
					<a class="cp-btn cp-btn--primary" href="<?php echo esc_url( $button_url ); ?>"><?php echo esc_html( $button_text ); ?></a>
				<?php endif; ?>
				<?php if ( $button2_text ) : ?>
					<a class="cp-btn cp-btn--outline" href="<?php echo esc_url( $button2_url ); ?>"><?php echo esc_html( $button2_text ); ?></a>
				<?php endif; ?>
			</div>
		<?php endif; ?>
	</div>
</div>
