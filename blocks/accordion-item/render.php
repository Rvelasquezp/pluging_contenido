<?php
/**
 * Render server-side de un item del Accordion.
 *
 * @package PixelCore_Components
 * @var array    $attributes
 * @var string   $content
 * @var WP_Block $block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$title = $attributes['title'] ?? '';
$open  = ! empty( $attributes['openByDefault'] );

$wrapper_attributes = get_block_wrapper_attributes(
	array(
		'class' => 'pixelcore-accordion-item' . ( $open ? ' is-open' : '' ),
	)
);
?>
<div <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput ?>>
	<button type="button" class="pixelcore-accordion-item__trigger" aria-expanded="<?php echo $open ? 'true' : 'false'; ?>">
		<span class="pixelcore-accordion-item__title"><?php echo esc_html( $title ); ?></span>
		<span class="pixelcore-accordion-item__icon" aria-hidden="true"></span>
	</button>
	<div class="pixelcore-accordion-item__panel">
		<div class="pixelcore-accordion-item__panel-inner">
			<?php echo $content; // phpcs:ignore WordPress.Security.EscapeOutput -- InnerBlocks ya renderizado/escapado por WP. ?>
		</div>
	</div>
</div>
