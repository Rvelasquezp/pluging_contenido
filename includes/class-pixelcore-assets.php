<?php
/**
 * Registro de todos los assets del plugin (CSS, GSAP vendorizado y el motor
 * de animaciones JS).
 *
 * La carga condicional real ("no cargar GSAP si la página no tiene ningún
 * bloque PixelCore") no se hace a mano aquí: se apoya en el mecanismo nativo
 * de WordPress para assets de bloque (`register_block_script_handle` /
 * `register_block_style_handle`), que solo encola un handle cuando el bloque
 * que lo referencia está presente en la página. Ver blocks/*\/block.json —
 * cada uno referencia los handles registrados aquí (no rutas "file:")
 * precisamente para poder controlarlos también desde Settings.
 *
 * @package PixelCore_Components
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PixelCore_Assets {

	const CSS_HANDLE        = 'pixelcore-css';
	const CSS_EDITOR_HANDLE = 'pixelcore-editor-css';
	const JS_HANDLE         = 'pixelcore-js';
	const GSAP_HANDLE       = 'pixelcore-gsap';
	const ST_HANDLE         = 'pixelcore-gsap-scrolltrigger';
	const SS_HANDLE         = 'pixelcore-gsap-scrollsmoother';
	const DEBUG_HANDLE      = 'pixelcore-debug';
	const EDITOR_SHARED_HANDLE = 'pixelcore-editor-shared';

	const GSAP_VERSION = '3.13.0';

	/**
	 * Versión de cache-busting para un archivo propio del plugin.
	 *
	 * Usa filemtime() en vez de la constante PIXELCORE_VERSION fija: así,
	 * cada vez que se recompila el SCSS o se edita un JS, la URL del asset
	 * cambia solo y el navegador deja de servir la copia vieja de caché.
	 *
	 * @param string $relative_path Ruta relativa a la carpeta del plugin (ej. 'assets/css/pixelcore.css').
	 * @return string|bool
	 */
	private function asset_version( $relative_path ) {
		$path = PIXELCORE_PATH . $relative_path;

		return file_exists( $path ) ? (string) filemtime( $path ) : PIXELCORE_VERSION;
	}

	/**
	 * Hooks de arranque.
	 */
	public function init() {
		add_action( 'init', array( $this, 'register_assets' ), 5 );
		add_action( 'wp_enqueue_scripts', array( $this, 'maybe_enqueue_utilities' ) );
		add_action( 'wp_footer', array( $this, 'maybe_enqueue_debug' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_shared' ) );
	}

	/**
	 * Registra (sin encolar) todos los handles. El encolado real de
	 * pixelcore-css/pixelcore-js ocurre solo cuando un bloque los referencia
	 * (ver comentario de cabecera), excepto pixelcore-css cuando el usuario
	 * activa "Enable utility classes" a nivel de sitio.
	 */
	public function register_assets() {
		$this->register_styles();

		if ( ! is_admin() ) {
			$this->register_frontend_scripts();
		}

		wp_register_script(
			self::EDITOR_SHARED_HANDLE,
			PIXELCORE_URL . 'blocks/shared-animation-panel.js',
			array( 'wp-element', 'wp-components', 'wp-i18n' ),
			$this->asset_version( 'blocks/shared-animation-panel.js' ),
			true
		);
	}

	/**
	 * Encola el panel de animación compartido + los datos (presets/triggers/
	 * eases) que necesita, para cualquier pantalla del editor de bloques.
	 */
	public function enqueue_editor_shared() {
		wp_enqueue_script( self::EDITOR_SHARED_HANDLE );

		$data = array(
			'presets'  => $this->as_options( PixelCore_Animation_Presets::get_presets(), true ),
			'triggers' => $this->as_options( PixelCore_Animation_Presets::get_triggers() ),
			'eases'    => $this->as_options( PixelCore_Animation_Presets::get_eases() ),
		);

		wp_add_inline_script( self::EDITOR_SHARED_HANDLE, 'window.PixelCoreEditorData = ' . wp_json_encode( $data ) . ';', 'before' );
	}

	/**
	 * Normaliza distintas formas de listas PHP a { value, label } para los
	 * SelectControl del editor.
	 *
	 * @param array $items          Lista a normalizar.
	 * @param bool  $items_have_label Si cada item ya es un array con 'label'.
	 * @return array
	 */
	private function as_options( $items, $items_have_label = false ) {
		$options = array();

		foreach ( $items as $key => $value ) {
			$options[] = array(
				'value' => $key,
				'label' => $items_have_label ? $value['label'] : $value,
			);
		}

		return $options;
	}

	/**
	 * CSS: un único bundle de producción (design system + utilities +
	 * estilos de los bloques) y una hoja pequeña solo para el editor.
	 */
	private function register_styles() {
		wp_register_style( self::CSS_HANDLE, PIXELCORE_URL . 'assets/css/pixelcore.css', array(), $this->asset_version( 'assets/css/pixelcore.css' ) );

		wp_register_style(
			self::CSS_EDITOR_HANDLE,
			PIXELCORE_URL . 'assets/css/pixelcore-editor.css',
			array( self::CSS_HANDLE ),
			$this->asset_version( 'assets/css/pixelcore-editor.css' )
		);
	}

	/**
	 * GSAP (vendorizado) + motor de animaciones PixelCore.
	 *
	 * Si "minify_assets" está activo se registra el bundle único
	 * (js/dist/pixelcore.min.js); si no, cada módulo se registra por
	 * separado para que sea fácil depurarlos en el navegador.
	 */
	private function register_frontend_scripts() {
		$js_deps = array();

		if ( PixelCore_Settings::get( 'enable_gsap' ) ) {
			wp_register_script( self::GSAP_HANDLE, PIXELCORE_URL . 'assets/vendor/gsap/gsap.min.js', array(), self::GSAP_VERSION, true );
			$js_deps[] = self::GSAP_HANDLE;

			if ( PixelCore_Settings::get( 'enable_scrolltrigger' ) ) {
				wp_register_script( self::ST_HANDLE, PIXELCORE_URL . 'assets/vendor/gsap/ScrollTrigger.min.js', array( self::GSAP_HANDLE ), self::GSAP_VERSION, true );
				$js_deps[] = self::ST_HANDLE;

				if ( PixelCore_Settings::get( 'enable_scrollsmoother' ) ) {
					wp_register_script( self::SS_HANDLE, PIXELCORE_URL . 'assets/vendor/gsap/ScrollSmoother.min.js', array( self::ST_HANDLE ), self::GSAP_VERSION, true );
					$js_deps[] = self::SS_HANDLE;
				}
			}
		}

		$use_bundle = PixelCore_Settings::get( 'minify_assets' ) && file_exists( PIXELCORE_PATH . 'js/dist/pixelcore.min.js' ) && ! ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG );

		if ( $use_bundle ) {
			wp_register_script( self::JS_HANDLE, PIXELCORE_URL . 'js/dist/pixelcore.min.js', $js_deps, $this->asset_version( 'js/dist/pixelcore.min.js' ), true );
		} else {
			$modules = array(
				'pixelcore-core'         => array( 'js/core.js', $js_deps ),
				'pixelcore-anim-fade'    => array( 'js/animations/fade.js', array( 'pixelcore-core' ) ),
				'pixelcore-anim-scale'   => array( 'js/animations/scale.js', array( 'pixelcore-core' ) ),
				'pixelcore-anim-slide'    => array( 'js/animations/slide.js', array( 'pixelcore-core' ) ),
				'pixelcore-anim-parallax' => array( 'js/animations/parallax.js', array( 'pixelcore-core' ) ),
				'pixelcore-anim-custom'   => array( 'js/animations/custom.js', array( 'pixelcore-core' ) ),
				'pixelcore-scroll'        => array( 'js/animations/scroll.js', array( 'pixelcore-core' ) ),
				'pixelcore-accordion'     => array( 'js/accordion.js', array( 'pixelcore-core' ) ),
			);

			foreach ( $modules as $handle => $def ) {
				wp_register_script( $handle, PIXELCORE_URL . $def[0], $def[1], $this->asset_version( $def[0] ), true );
			}

			wp_register_script(
				'pixelcore-bootstrap',
				PIXELCORE_URL . 'js/bootstrap.js',
				array_keys( $modules ),
				$this->asset_version( 'js/bootstrap.js' ),
				true
			);

			// Handle "meta": sin src propio, solo agrupa la cadena de
			// dependencias para que block.json pueda referenciar un único
			// nombre (self::JS_HANDLE) sin importar el modo de carga.
			wp_register_script( self::JS_HANDLE, false, array( 'pixelcore-bootstrap' ), PIXELCORE_VERSION, true );
		}

		wp_add_inline_script( self::JS_HANDLE, $this->settings_inline_script(), 'before' );

		wp_register_script( self::DEBUG_HANDLE, PIXELCORE_URL . 'js/debug.js', array( self::JS_HANDLE ), $this->asset_version( 'js/debug.js' ), true );
	}

	/**
	 * Ajustes que el motor JS necesita conocer en runtime (no son secretos,
	 * no requieren nonce: solo configuran comportamiento del lado cliente).
	 *
	 * @return string
	 */
	private function settings_inline_script() {
		$data = array(
			'disableMobile'        => (bool) PixelCore_Settings::get( 'disable_mobile' ),
			'respectReducedMotion' => (bool) PixelCore_Settings::get( 'respect_reduced_motion' ),
			'debug'                => PixelCore_Debug::is_enabled(),
			'mobileBreakpoint'     => 768,
			'tabletBreakpoint'     => 1024,
		);

		return 'window.PixelCoreSettings = ' . wp_json_encode( $data ) . ';';
	}

	/**
	 * "Enable utility classes" hace disponibles las clases cp-* en todo el
	 * sitio (no solo dentro de bloques PixelCore), por eso se encola aparte
	 * del mecanismo automático de block.json.
	 */
	public function maybe_enqueue_utilities() {
		if ( PixelCore_Settings::get( 'enable_utility_classes' ) ) {
			wp_enqueue_style( self::CSS_HANDLE );
		}
	}

	/**
	 * El panel de debug solo se carga si el modo debug está activo
	 * (ver PixelCore_Debug::is_enabled(), ya filtra por capacidad).
	 */
	public function maybe_enqueue_debug() {
		if ( PixelCore_Debug::is_enabled() ) {
			wp_enqueue_style( self::CSS_HANDLE );
			wp_enqueue_script( self::JS_HANDLE );
			wp_enqueue_script( self::DEBUG_HANDLE );
		}
	}
}
