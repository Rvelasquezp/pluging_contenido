<?php
/**
 * Dependencias del editorScript de este bloque. WordPress lee este archivo
 * automáticamente (mismo nombre que el JS, con .asset.php) al registrar el
 * bloque desde block.json — así podemos declarar 'pixelcore-editor-shared'
 * como dependencia sin necesitar un build step.
 */
return array(
	'dependencies' => array( 'wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'pixelcore-editor-shared' ),
	'version'      => PIXELCORE_VERSION,
);
