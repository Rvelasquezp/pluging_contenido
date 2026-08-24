<?php
/**
 * Render server-side del bloque PixelCore Card.
 *
 * @package PixelCore_Components
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$image_url       = $attributes['imageUrl'] ?? '';
$image_alt       = $attributes['imageAlt'] ?? '';
$icon             = $attributes['icon'] ?? '';
$title            = $attributes['title'] ?? '';
$description      = $attributes['description'] ?? '';
$link             = $attributes['link'] ?? '';
$button_text      = $attributes['buttonText'] ?? '';
$button_url       = $attributes['buttonUrl'] ?? ( $link ?: '' );
$orientation      = $attributes['orientation'] ?? 'vertical';
$card_style       = $attributes['cardStyle'] ?? 'elevated';
$hover_animation  = $attributes['hoverAnimation'] ?? 'lift';

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => implode(
			' ',
			array(
				'pixelcore-card',
				'pixelcore-card--' . sanitize_html_class( $orientation ),
				'pixelcore-card--' . sanitize_html_class( $card_style ),
				'pixelcore-card--hover-' . sanitize_html_class( $hover_animation ),
			)
		),
	)
);

$animation_attrs = capixel_animation_attributes( $attributes['animation'] ?? array() );
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput ?> <?php echo $animation_attrs; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
	<?php if ( $image_url ) : ?>
		<div class="pixelcore-card__media">
			<img src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( $image_alt ); ?>" />
		</div>
	<?php endif; ?>

	<div class="pixelcore-card__body">
		<?php if ( $icon ) : ?>
			<span class="pixelcore-card__icon dashicons <?php echo esc_attr( $icon ); ?>" aria-hidden="true"></span>
		<?php endif; ?>

		<?php if ( $title ) : ?>
			<h3 class="pixelcore-card__title cp-h3">
				<?php if ( $link ) : ?>
					<a href="<?php echo esc_url( $link ); ?>"><?php echo esc_html( $title ); ?></a>
				<?php else : ?>
					<?php echo esc_html( $title ); ?>
				<?php endif; ?>
			</h3>
		<?php endif; ?>

		<?php if ( $description ) : ?>
			<p class="pixelcore-card__description"><?php echo wp_kses_post( $description ); ?></p>
		<?php endif; ?>

		<?php if ( $button_text && $button_url ) : ?>
			<a class="pixelcore-card__button cp-btn cp-btn--outline" href="<?php echo esc_url( $button_url ); ?>">
				<?php echo esc_html( $button_text ); ?>
			</a>
		<?php endif; ?>
	</div>
</div>
