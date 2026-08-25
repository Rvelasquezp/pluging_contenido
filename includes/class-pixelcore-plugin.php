<?php
/**
 * Orquestador principal del plugin. Instancia y arranca cada subsistema.
 *
 * @package PixelCore_Components
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PixelCore_Plugin {

	/**
	 * Instancia única.
	 *
	 * @var PixelCore_Plugin|null
	 */
	private static $instance = null;

	/**
	 * @return PixelCore_Plugin
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Privado: usar PixelCore_Plugin::instance().
	 */
	private function __construct() {
		add_action( 'init', array( $this, 'load_textdomain' ) );

		( new PixelCore_Assets() )->init();
		( new PixelCore_Blocks() )->init();
		( new PixelCore_Gallery() )->init();
		( new PixelCore_Settings() )->init();
		( new PixelCore_Debug() )->init();
	}

	/**
	 * Carga las traducciones (text domain: capixel-components).
	 */
	public function load_textdomain() {
		load_plugin_textdomain( 'capixel-components', false, dirname( PIXELCORE_BASENAME ) . '/languages' );
	}
}
