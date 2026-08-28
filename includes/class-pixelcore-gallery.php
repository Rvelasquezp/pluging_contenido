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

	const CORE_HANDLE       = 'pixelcore-gallery-core';
	const MASONRY_HANDLE    = 'pixelcore-gallery-masonry';
	const JUSTIFIED_HANDLE  = 'pixelcore-gallery-justified';
	const CAROUSEL_HANDLE   = 'pixelcore-gallery-carousel';
	const HORIZONTAL_HANDLE = 'pixelcore-gallery-horizontal';
	const VERTICAL_HANDLE   = 'pixelcore-gallery-vertical';
	const THUMBNAIL_HANDLE  = 'pixelcore-gallery-thumbnail';
	const FULLSCREEN_HANDLE = 'pixelcore-gallery-fullscreen';
	const WATERFALL_HANDLE  = 'pixelcore-gallery-waterfall';
	const AFTERGLOW_HANDLE  = 'pixelcore-gallery-afterglow';
	const STAGGERED_HANDLE  = 'pixelcore-gallery-staggered';
	const LIGHTBOX_HANDLE   = 'pixelcore-gallery-lightbox';

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
				'label'             => __( 'Grid', 'capixel-components' ),
				'needs_columns'     => true,
				'needs_gap'         => true,
				// Zoom suave de la imagen al pasar el mouse — toggle opcional,
				// igual que el lightbox. Ver scss/blocks/gallery/_grid.scss.
				'needs_hover_zoom'  => true,
				'js_handle'         => null,
			),
			'masonry'    => array(
				'label'            => __( 'Masonry', 'capixel-components' ),
				'needs_columns'    => true,
				'needs_gap'        => true,
				'needs_hover_zoom' => true,
				'js_handle'        => self::MASONRY_HANDLE,
			),
			'justified'  => array(
				'label'         => __( 'Justified Gallery', 'capixel-components' ),
				// A diferencia de Grid/Masonry, "justified" no arma columnas
				// fijas — empaqueta filas por altura objetivo, escalando cada
				// imagen según su aspect ratio real. Igual exponemos el mismo
				// control de "Columns" que el resto de layouts (mismo
				// attrs.columns, mismos sliders) porque es el lenguaje que ya
				// conoce quien edita el bloque; js/gallery/layouts/justified.js
				// lo traduce a la altura de fila objetivo que el algoritmo
				// necesita (más columnas = filas más bajas = más imágenes por
				// fila, y viceversa).
				'needs_columns'    => true,
				'needs_gap'        => true,
				'needs_hover_zoom' => true,
				'js_handle'        => self::JUSTIFIED_HANDLE,
			),
			'carousel'   => array(
				'label'             => __( 'Carousel / Slider', 'capixel-components' ),
				// Cuántos slides se ven a la vez en el viewport del carrusel,
				// por breakpoint (mismo control que Grid/Masonry/Justified) —
				// ver scss/blocks/gallery/_carousel.scss, ancho de
				// .pixelcore-gallery__item calculado a partir de estas
				// columnas, sin necesitar JS.
				'needs_columns'     => true,
				'needs_gap'         => true,
				'needs_arrow_color' => true,
				'needs_hover_zoom'  => true,
				'js_handle'         => self::CAROUSEL_HANDLE,
			),
			'horizontal' => array(
				'label'         => __( 'Horizontal Gallery', 'capixel-components' ),
				// Cuántos slides se ven a la vez, por breakpoint (mismo control
				// que Grid/Masonry/Justified/Carousel) — ver
				// scss/blocks/gallery/_horizontal.scss, ancho de
				// .pixelcore-gallery__item calculado a partir de estas columnas,
				// tanto en el fallback sin JS como en el modo pin de GSAP.
				'needs_columns'    => true,
				'needs_gap'        => true,
				'needs_hover_zoom' => true,
				// Con GSAP+ScrollTrigger disponibles, se "pinea" la sección y el
				// scroll vertical mueve las imágenes en horizontal hasta la
				// última, y ahí se despinea sola. Sin GSAP (ver
				// register_assets()), degrada a scroll horizontal nativo por
				// CSS — nunca se rompe, solo pierde el efecto.
				'js_handle'        => self::HORIZONTAL_HANDLE,
			),
			'vertical'   => array(
				'label'         => __( 'Vertical Gallery', 'capixel-components' ),
				'needs_columns' => false,
				'needs_gap'     => true,
				// Con GSAP+ScrollTrigger: se pinea el padre y las imágenes se
				// van apilando una encima de otra (cada una "pasa por arriba"
				// de la anterior) a medida que se scrollea, hasta despinear
				// sola en la última. Sin GSAP, degrada a una lista vertical
				// simple por CSS (ver register_assets() / _vertical.scss).
				'js_handle'     => self::VERTICAL_HANDLE,
			),
			'thumbnail'  => array(
				'label'         => __( 'Thumbnail Gallery', 'capixel-components' ),
				'needs_columns' => false,
				'needs_gap'     => true,
				// Imagen principal grande + tira de miniaturas clickeables debajo
				// para cambiarla — no un grid. Sin JS (ver register_assets()),
				// degrada a un grid simple de cuadrados por CSS.
				'js_handle'     => self::THUMBNAIL_HANDLE,
			),
			'fullscreen' => array(
				'label'         => __( 'Fullscreen Gallery', 'capixel-components' ),
				'needs_columns' => false,
				'needs_gap'     => false,
				// Una sola pantalla (100vh) con todas las imágenes apiladas en el
				// mismo lugar. En cuanto la sección entra en pantalla
				// (IntersectionObserver, sin scroll de por medio), arranca un
				// slideshow automático por tiempo (crossfade CSS, sin GSAP). Sin
				// JS, degrada a una lista simple de secciones de 100vh, una tras
				// otra.
				'js_handle'     => self::FULLSCREEN_HANDLE,
			),
			'waterfall'  => array(
				'label'              => __( 'Parallax Waterfall', 'capixel-components' ),
				// N columnas balanceadas (mismo algoritmo que Masonry — ver
				// js/gallery/layouts/waterfall.js), cada una con imágenes de
				// distinto aspect-ratio y offset vertical alternado. Con GSAP
				// ScrollTrigger, cada COLUMNA COMPLETA (no cada imagen) se
				// traslada a su propia velocidad relativa (unas más rápido
				// que el scroll, otras más lento) mientras la sección entera
				// pasa por la pantalla — todas comparten el mismo trigger (la
				// galería), SIN pin: no depende para nada de pin/sticky, que
				// en este sitio están rotos por el transform del
				// ScrollSmoother del theme (ver notas de
				// horizontal/vertical/fullscreen). Sin GSAP, degrada a un
				// grid de columnas estático (ver register_assets() /
				// _waterfall.scss).
				'needs_columns'      => true,
				'needs_gap'          => true,
				// Título + descripción posicionados libremente (X/Y en vw/vh)
				// por encima de las imágenes — mismo mecanismo que "Use custom
				// position" del bloque Hero. Ver render.php / index.js.
				'needs_overlay_text' => true,
				'js_handle'          => self::WATERFALL_HANDLE,
			),
			'afterglow'  => array(
				'label'         => __( 'Afterglow (drift & dissolve)', 'capixel-components' ),
				// Grid tipo mosaico (celdas de distinto tamaño por posición,
				// ver _afterglow.scss) — no columnas balanceadas por JS como
				// Masonry/Waterfall, es un solo CSS Grid con grid-auto-flow:
				// dense. Con GSAP ScrollTrigger, cada imagen es su propio
				// trigger (SIN pin, mismo criterio que el resto): al entrar a
				// pantalla aparece desde un costado agrandándose desde 0, se
				// mantiene normal mientras está visible, y al salir se va
				// deslizando hacia el lado opuesto mientras se encoge de
				// nuevo a 0 — efecto "deriva y disolución". La dirección
				// alterna par/impar para que las imágenes vecinas no se
				// muevan todas para el mismo lado. Sin GSAP, degrada al
				// mosaico estático (ver register_assets() / _afterglow.scss).
				'needs_columns' => true,
				'needs_gap'     => true,
				'js_handle'     => self::AFTERGLOW_HANDLE,
			),
			'staggered'  => array(
				'label'         => __( 'Staggered Image Grid', 'capixel-components' ),
				// A propósito, SIN sistema de columnas — nada de
				// needs_columns/needs_gap acá. Cada imagen flota de forma
				// independiente: posición X propia (aleatoria pero
				// determinística), tamaño propio (escala aleatoria) y su
				// propio ciclo infinito de abajo hacia arriba (GSAP,
				// repeat:-1) — nunca se alinean en filas/columnas, la
				// cantidad y distribución las decide la lógica de la
				// animación, no una configuración de columnas en Gutenberg.
				// Sin GSAP, degrada a una lista simple (ver
				// register_assets() / _staggered.scss).
				'needs_columns' => false,
				'needs_gap'     => false,
				'js_handle'     => self::STAGGERED_HANDLE,
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

		// El pin+scroll horizontal del layout "horizontal" necesita GSAP +
		// ScrollTrigger. Se agregan como dependencia SOLO si ya están
		// habilitados en Settings (mismo ajuste que usa el sistema de
		// animaciones) — si el theme trae su propio GSAP y el usuario
		// desactivó el vendorizado del plugin, horizontal.js igual carga,
		// pero internamente detecta que no hay window.gsap/ScrollTrigger y
		// degrada al scroll horizontal nativo por CSS en vez de fallar.
		$horizontal_deps = array( self::CORE_HANDLE );

		if ( PixelCore_Settings::get( 'enable_gsap' ) && PixelCore_Settings::get( 'enable_scrolltrigger' ) ) {
			$horizontal_deps[] = PixelCore_Assets::ST_HANDLE;
		}

		wp_register_script( self::HORIZONTAL_HANDLE, PIXELCORE_URL . 'js/gallery/layouts/horizontal.js', $horizontal_deps, $this->asset_version( 'js/gallery/layouts/horizontal.js' ), true );

		// Mismo criterio que "horizontal": el pin apilado de "vertical"
		// necesita GSAP + ScrollTrigger, solo como dependencia si están
		// habilitados en Settings.
		$vertical_deps = array( self::CORE_HANDLE );

		if ( PixelCore_Settings::get( 'enable_gsap' ) && PixelCore_Settings::get( 'enable_scrolltrigger' ) ) {
			$vertical_deps[] = PixelCore_Assets::ST_HANDLE;
		}

		wp_register_script( self::VERTICAL_HANDLE, PIXELCORE_URL . 'js/gallery/layouts/vertical.js', $vertical_deps, $this->asset_version( 'js/gallery/layouts/vertical.js' ), true );

		wp_register_script( self::THUMBNAIL_HANDLE, PIXELCORE_URL . 'js/gallery/layouts/thumbnail.js', array( self::CORE_HANDLE ), $this->asset_version( 'js/gallery/layouts/thumbnail.js' ), true );

		// El slideshow automático de "fullscreen" es CSS + IntersectionObserver
		// puro, no necesita GSAP.
		wp_register_script( self::FULLSCREEN_HANDLE, PIXELCORE_URL . 'js/gallery/layouts/fullscreen.js', array( self::CORE_HANDLE ), $this->asset_version( 'js/gallery/layouts/fullscreen.js' ), true );

		// Mismo criterio que "horizontal"/"vertical": el scrub por-imagen de
		// "waterfall" necesita GSAP + ScrollTrigger, solo como dependencia si
		// están habilitados en Settings. Sin GSAP, waterfall.js igual arma las
		// columnas (sin animación) — nunca se rompe.
		$waterfall_deps = array( self::CORE_HANDLE );

		if ( PixelCore_Settings::get( 'enable_gsap' ) && PixelCore_Settings::get( 'enable_scrolltrigger' ) ) {
			$waterfall_deps[] = PixelCore_Assets::ST_HANDLE;
		}

		wp_register_script( self::WATERFALL_HANDLE, PIXELCORE_URL . 'js/gallery/layouts/waterfall.js', $waterfall_deps, $this->asset_version( 'js/gallery/layouts/waterfall.js' ), true );

		// Mismo criterio: el drift+disolución por-imagen de "afterglow"
		// necesita GSAP + ScrollTrigger, solo como dependencia si están
		// habilitados en Settings. Sin GSAP, afterglow.js igual arma el
		// mosaico (sin animación) — nunca se rompe.
		$afterglow_deps = array( self::CORE_HANDLE );

		if ( PixelCore_Settings::get( 'enable_gsap' ) && PixelCore_Settings::get( 'enable_scrolltrigger' ) ) {
			$afterglow_deps[] = PixelCore_Assets::ST_HANDLE;
		}

		wp_register_script( self::AFTERGLOW_HANDLE, PIXELCORE_URL . 'js/gallery/layouts/afterglow.js', $afterglow_deps, $this->asset_version( 'js/gallery/layouts/afterglow.js' ), true );

		// "staggered" no depende del scroll para nada (es una animación por
		// tiempo, siempre corriendo) — solo necesita GSAP a secas, nunca
		// ScrollTrigger. Sin GSAP, staggered.js igual arma las columnas
		// (sin animación) — nunca se rompe.
		$staggered_deps = array( self::CORE_HANDLE );

		if ( PixelCore_Settings::get( 'enable_gsap' ) ) {
			$staggered_deps[] = PixelCore_Assets::GSAP_HANDLE;
		}

		wp_register_script( self::STAGGERED_HANDLE, PIXELCORE_URL . 'js/gallery/layouts/staggered.js', $staggered_deps, $this->asset_version( 'js/gallery/layouts/staggered.js' ), true );
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
				'value'           => $slug,
				'label'           => $layout['label'],
				'needsColumns'    => ! empty( $layout['needs_columns'] ),
				'needsGap'        => ! empty( $layout['needs_gap'] ),
				'needsArrowColor' => ! empty( $layout['needs_arrow_color'] ),
				'needsHoverZoom'  => ! empty( $layout['needs_hover_zoom'] ),
				'needsOverlayText' => ! empty( $layout['needs_overlay_text'] ),
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
