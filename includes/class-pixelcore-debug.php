<?php
/**
 * Modo debug: un panel flotante en el frontend, visible solo para usuarios
 * con permiso `manage_options` y solo cuando el ajuste está activo. No debe
 * tener ningún efecto en producción para un visitante normal.
 *
 * @package PixelCore_Components
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PixelCore_Debug {

	/**
	 * Hooks de arranque.
	 */
	public function init() {
		add_action( 'wp_footer', array( $this, 'maybe_render_marker' ), 99 );
	}

	/**
	 * True si el modo debug debe estar activo para el request actual.
	 *
	 * Requiere el ajuste "Enable debug mode" Y capacidad manage_options,
	 * para que activar el toggle por error no expone nada a visitantes.
	 *
	 * @return bool
	 */
	public static function is_enabled() {
		if ( ! PixelCore_Settings::get( 'enable_debug' ) ) {
			return false;
		}

		return current_user_can( 'manage_options' );
	}

	/**
	 * Marca un nodo vacío que `debug.js` usa como "root" del panel, y evita
	 * que el panel dependa de document.body estar en un estado concreto.
	 */
	public function maybe_render_marker() {
		if ( ! self::is_enabled() ) {
			return;
		}

		echo '<div id="pixelcore-debug-root" aria-hidden="true"></div>';
	}
}
