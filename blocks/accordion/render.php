<?php
/**
 * Render server-side del bloque PixelCore Accordion (contenedor).
 *
 * $content ya trae los pixelcore/accordion-item renderizados (InnerBlocks).
 *
 * @package PixelCore_Components
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$allow_multiple = ! empty( $attributes['allowMultiple'] );
$icon_position  = $attributes['iconPosition'] ?? 'right';

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => 'pixelcore-accordion pixelcore-accordion--icon-' . sanitize_html_class( $icon_position ),
	)
);

$animation_attrs = capixel_animation_attributes( $attributes['animation'] ?? array() );
?>
<div
	<?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput ?>
	data-cp-allow-multiple="<?php echo $allow_multiple ? 'true' : 'false'; ?>"
	<?php echo $animation_attrs; // phpcs:ignore WordPress.Security.EscapeOutput ?>
>
	<?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput -- InnerBlocks ya renderizado/escapado por WP. ?>
</div>
