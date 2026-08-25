<?php
/**
 * Registro del bloque Gallery: registry de tipos de layout (filtrable) +
 * los handles JS/CSS que cada tipo pueda necesitar.
 *
 * Mismo patrón que PixelCore_Animation_Presets: un array de "builtins"
 * filtrable, así un theme/plugin externo puede sumar un tipo de galería
 * nuevo (ej. "coverflow") sin tocar este archivo ni blocks/gallery/*.
 *
 * @package PixelCore_Components
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PixelCore_Gallery {

	const CORE_HANDLE      = 'pixelcore-gallery-core';
	const MASONRY_HANDLE   = 'pixelcore-gallery-masonry';
	const JUSTIFIED_HANDLE = 'pixelcore-gallery-justified';
	const CAROUSEL_HANDLE  = 'pixelcore-gallery-carousel';
	const LIGHTBOX_HANDLE  = 'pixelcore-gallery-lightbox';

	/**
	 * Hooks de arranque.
	 */
	public function init() {
		add_action( 'init', array( $this, 'register_assets' ), 6 );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_data' ) );
	}

	/**
	 * Tipos de layout incluidos. `js_handle` es null cuando el tipo es CSS
	 * puro (no necesita JS propio, solo clases + el registry de columnas).
	 *
	 * @return array<string, array>
	 */
	public static function builtins() {
		return array(
			'grid'       => array(
				'label'         => __( 'Grid', 'capixel-components' ),
				'needs_columns' => true,
				'needs_gap'     => true,
				'js_handle'     => null,
			),
			'masonry'    => array(
				'label'         => __( 'Masonry', 'capixel-components' ),
				'needs_columns' => true,
				'needs_gap'     => true,
				'js_handle'     => self::MASONRY_HANDLE,
			),
			'justified'  => array(
				'label'         => __( 'Justified Gallery', 'capixel-components' ),
				'needs_columns' => false,
				'needs_gap'     => true,
				'js_handle'     => self::JUSTIFIED_HANDLE,
			),
			'carousel'   => array(
				'label'         => __( 'Carousel / Slider', 'capixel-components' ),
				'needs_columns' => false,
				'needs_gap'     => true,
				'js_handle'     => self::CAROUSEL_HANDLE,
			),
			'horizontal' => array(
				'label'         => __( 'Horizontal Gallery', 'capixel-components' ),
				'needs_columns' => false,
				'needs_gap'     => true,
				'js_handle'     => null,
			),
			'vertical'   => array(
				'label'         => __( 'Vertical Gallery', 'capixel-components' ),
				'needs_columns' => false,
				'needs_gap'     => true,
				'js_handle'     => null,
			),
			'thumbnail'  => array(
				'label'         => __( 'Thumbnail Gallery', 'capixel-components' ),
				'needs_columns' => true,
				'needs_gap'     => true,
				'js_handle'     => null,
			),
			'fullscreen' => array(
				'label'         => __( 'Fullscreen Gallery', 'capixel-components' ),
				'needs_columns' => false,
				'needs_gap'     => false,
				'js_handle'     => null,
			),
		);
	}

	/**
	 * Tipos de layout disponibles, filtrados.
	 *
	 * Para sumar un tipo nuevo desde un theme/plugin:
	 *
	 *     add_filter( 'capixel_gallery_layouts', function ( $layouts ) {
	 *         $layouts['coverflow'] = array(
	 *             'label'         => 'Coverflow',
	 *             'needs_columns' => false,
	 *             'needs_gap'     => true,
	 *             'js_handle'     => 'my-theme-gallery-coverflow', // registrado aparte por el theme.
	 *         );
	 *         return $layouts;
	 *     } );
	 *
	 * @return array<string, array>
	 */
	public static function get_layouts() {
		return apply_filters( 'capixel_gallery_layouts', self::builtins() );
	}

	/**
	 * Devuelve la config de un tipo puntual (o el fallback "grid" si no existe).
	 *
	 * @param string $type Slug del tipo de galería.
	 * @return array
	 */
	public static function get_layout( $type ) {
		$layouts = self::get_layouts();

		return isset( $layouts[ $type ] ) ? $layouts[ $type ] : $layouts['grid'];
	}

	/**
	 * Registra (sin encolar) los handles JS del bloque Gallery. El encolado
	 * real por-instancia ocurre en blocks/gallery/render.php, según el
	 * galleryType/lightbox que esa instancia realmente use — así una página
	 * con una galería "grid" sin lightbox no carga masonry.js ni lightbox.js.
	 */
	public function register_assets() {
		if ( is_admin() ) {
			return;
		}

		wp_register_script( self::CORE_HANDLE, PIXELCORE_URL . 'js/gallery/core.js', array(), $this->asset_version( 'js/gallery/core.js' ), true );

		wp_register_script( self::MASONRY_HANDLE, PIXELCORE_URL . 'js/gallery/layouts/masonry.js', array( self::CORE_HANDLE ), $this->asset_version( 'js/gallery/layouts/masonry.js' ), true );
		wp_register_script( self::JUSTIFIED_HANDLE, PIXELCORE_URL . 'js/gallery/layouts/justified.js', array( self::CORE_HANDLE ), $this->asset_version( 'js/gallery/layouts/justified.js' ), true );
		wp_register_script( self::CAROUSEL_HANDLE, PIXELCORE_URL . 'js/gallery/layouts/carousel.js', array( self::CORE_HANDLE ), $this->asset_version( 'js/gallery/layouts/carousel.js' ), true );
		wp_register_script( self::LIGHTBOX_HANDLE, PIXELCORE_URL . 'js/gallery/lightbox.js', array( self::CORE_HANDLE ), $this->asset_version( 'js/gallery/lightbox.js' ), true );
	}

	/**
	 * Inyecta los tipos de layout disponibles para que blocks/gallery/index.js
	 * pueble el SelectControl sin hardcodear la lista (mismo mecanismo que
	 * PixelCore_Assets::enqueue_editor_shared() usa para animaciones).
	 */
	public function enqueue_editor_data() {
		$layouts = array();

		foreach ( self::get_layouts() as $slug => $layout ) {
			$layouts[] = array(
				'value'        => $slug,
				'label'        => $layout['label'],
				'needsColumns' => ! empty( $layout['needs_columns'] ),
				'needsGap'     => ! empty( $layout['needs_gap'] ),
			);
		}

		wp_add_inline_script(
			'pixelcore-editor-shared',
			'window.PixelCoreGalleryData = ' . wp_json_encode( array( 'layouts' => $layouts ) ) . ';',
			'before'
		);
	}

	/**
	 * Versión de cache-busting (filemtime), igual que PixelCore_Assets.
	 *
	 * @param string $relative_path Ruta relativa a la carpeta del plugin.
	 * @return string
	 */
	private function asset_version( $relative_path ) {
		$path = PIXELCORE_PATH . $relative_path;

		return file_exists( $path ) ? (string) filemtime( $path ) : PIXELCORE_VERSION;
	}
}
