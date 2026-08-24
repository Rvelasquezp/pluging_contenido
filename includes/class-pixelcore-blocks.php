<?php
/**
 * Descubre y registra los bloques Gutenberg de PixelCore, y expone la API
 * `capixel_register_component()` para que bloques externos (de un theme o
 * de otro plugin) se sumen al mismo registro sin tocar este archivo.
 *
 * @package PixelCore_Components
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PixelCore_Blocks {

	/**
	 * Componentes registrados, indexados por nombre de bloque
	 * (ej. "pixelcore/hero"). Usado por el modo debug para listarlos.
	 *
	 * @var array<string, array>
	 */
	private static $components = array();

	/**
	 * Bloques incluidos en el core del plugin.
	 *
	 * @var string[]
	 */
	const CORE_COMPONENTS = array( 'hero', 'card', 'accordion', 'accordion-item', 'cta' );

	/**
	 * Hooks de arranque.
	 */
	public function init() {
		add_action( 'init', array( $this, 'register_core_components' ) );
		add_filter( 'block_categories_all', array( $this, 'register_category' ) );
	}

	/**
	 * Registra la categoría "PixelCore" en el inserter de bloques.
	 *
	 * @param array $categories Categorías existentes.
	 * @return array
	 */
	public function register_category( $categories ) {
		foreach ( $categories as $category ) {
			if ( 'pixelcore' === $category['slug'] ) {
				return $categories;
			}
		}

		$categories[] = array(
			'slug'  => 'pixelcore',
			'title' => __( 'PixelCore', 'capixel-components' ),
			'icon'  => 'admin-customizer',
		);

		return $categories;
	}

	/**
	 * Registra los componentes que vienen incluidos en /blocks.
	 */
	public function register_core_components() {
		foreach ( self::CORE_COMPONENTS as $slug ) {
			self::register_component( PIXELCORE_PATH . 'blocks/' . $slug );
		}
	}

	/**
	 * Registra un bloque a partir de una carpeta que contenga block.json.
	 *
	 * Esta es la función que respalda `capixel_register_component()`: cualquier
	 * theme o plugin puede llamarla (en `init`, con prioridad >= 10) para
	 * sumar un bloque nuevo al ecosistema PixelCore.
	 *
	 * @param string $path Ruta absoluta a la carpeta del bloque.
	 * @param array  $args Argumentos extra, ver capixel_register_component().
	 * @return string|WP_Error Nombre del bloque o WP_Error.
	 */
	public static function register_component( $path, $args = array() ) {
		$path = untrailingslashit( $path );

		if ( ! file_exists( $path . '/block.json' ) ) {
			return new WP_Error(
				'pixelcore_missing_block_json',
				sprintf(
					/* translators: %s: ruta de carpeta. */
					__( 'No se encontró block.json en %s', 'capixel-components' ),
					$path
				)
			);
		}

		$settings = isset( $args['settings'] ) ? $args['settings'] : array();

		if ( ! empty( $args['render_callback'] ) && is_callable( $args['render_callback'] ) ) {
			$settings['render_callback'] = $args['render_callback'];
		}

		$block_type = register_block_type( $path, $settings );

		if ( is_wp_error( $block_type ) || ! $block_type ) {
			return is_wp_error( $block_type ) ? $block_type : new WP_Error( 'pixelcore_register_failed', $path );
		}

		self::$components[ $block_type->name ] = array(
			'name' => $block_type->name,
			'path' => $path,
			'core' => 0 === strpos( $path, PIXELCORE_PATH ),
		);

		/**
		 * Se ejecuta justo después de registrar un componente PixelCore.
		 *
		 * @param string $name Nombre del bloque (ej. "pixelcore/hero").
		 * @param string $path Ruta de la carpeta del bloque.
		 */
		do_action( 'capixel_component_registered', $block_type->name, $path );

		return $block_type->name;
	}

	/**
	 * Devuelve todos los componentes registrados (core + externos).
	 * Usado por el modo debug.
	 *
	 * @return array<string, array>
	 */
	public static function get_components() {
		return self::$components;
	}
}
