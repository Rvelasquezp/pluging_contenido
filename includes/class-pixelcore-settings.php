<?php
/**
 * Página de ajustes: Settings → PixelCore Components, más el submenú
 * PixelCore → Animation con información de los presets disponibles.
 *
 * Usa la Settings API nativa de WordPress (register_setting,
 * add_settings_section, add_settings_field) — sin JS de terceros.
 *
 * @package PixelCore_Components
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PixelCore_Settings {

	const OPTION_KEY = 'pixelcore_settings';
	const PAGE_SLUG  = 'pixelcore-components';

	/**
	 * Ajustes cacheados en memoria durante el request.
	 *
	 * @var array|null
	 */
	private static $cache = null;

	/**
	 * Hooks de arranque.
	 */
	public function init() {
		add_action( 'admin_menu', array( $this, 'register_menu' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
	}

	/**
	 * Valores por defecto. Sirve tanto de "schema" como de fallback.
	 *
	 * @return array
	 */
	public static function defaults() {
		return array(
			// General.
			'enable_animations'      => true,
			'enable_utility_classes' => true,
			'enable_debug'           => false,
			// GSAP.
			'enable_gsap'            => true,
			'enable_scrolltrigger'   => true,
			'enable_scrollsmoother'  => false,
			// Performance.
			'conditional_loading'    => true,
			'minify_assets'          => true,
			'disable_mobile'         => false,
			'respect_reduced_motion' => true,
		);
	}

	/**
	 * Devuelve todos los ajustes guardados, fusionados con los defaults.
	 *
	 * @return array
	 */
	public static function get_all() {
		if ( null !== self::$cache ) {
			return self::$cache;
		}

		$saved        = get_option( self::OPTION_KEY, array() );
		self::$cache  = wp_parse_args( is_array( $saved ) ? $saved : array(), self::defaults() );

		return self::$cache;
	}

	/**
	 * Lee un ajuste puntual.
	 *
	 * @param string $key     Clave del ajuste.
	 * @param mixed  $default Valor de respaldo si la clave no existe siquiera en defaults().
	 * @return mixed
	 */
	public static function get( $key, $default = null ) {
		$all = self::get_all();

		return array_key_exists( $key, $all ) ? $all[ $key ] : $default;
	}

	/**
	 * Menú de administración: PixelCore (top-level) → Settings / Animation.
	 */
	public function register_menu() {
		add_menu_page(
			__( 'PixelCore Components', 'capixel-components' ),
			__( 'PixelCore', 'capixel-components' ),
			'manage_options',
			self::PAGE_SLUG,
			array( $this, 'render_settings_page' ),
			'dashicons-layout',
			80
		);

		add_submenu_page(
			self::PAGE_SLUG,
			__( 'PixelCore Components — Settings', 'capixel-components' ),
			__( 'Settings', 'capixel-components' ),
			'manage_options',
			self::PAGE_SLUG,
			array( $this, 'render_settings_page' )
		);

		add_submenu_page(
			self::PAGE_SLUG,
			__( 'PixelCore — Animation', 'capixel-components' ),
			__( 'Animation', 'capixel-components' ),
			'manage_options',
			'pixelcore-animation',
			array( $this, 'render_animation_page' )
		);
	}

	/**
	 * Registra el setting único (array serializado) y sus secciones/campos.
	 */
	public function register_settings() {
		register_setting(
			self::PAGE_SLUG,
			self::OPTION_KEY,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( $this, 'sanitize' ),
				'default'           => self::defaults(),
			)
		);

		add_settings_section( 'pixelcore_general', __( 'General', 'capixel-components' ), '__return_false', self::PAGE_SLUG );
		add_settings_section( 'pixelcore_gsap', __( 'GSAP', 'capixel-components' ), array( $this, 'render_gsap_intro' ), self::PAGE_SLUG );
		add_settings_section( 'pixelcore_performance', __( 'Performance', 'capixel-components' ), '__return_false', self::PAGE_SLUG );

		$this->add_checkbox_field( 'enable_animations', __( 'Enable animations', 'capixel-components' ), __( 'Habilita el sistema PixelCore Animation (data-cp-*) en todo el sitio.', 'capixel-components' ), 'pixelcore_general' );
		$this->add_checkbox_field( 'enable_utility_classes', __( 'Enable utility classes', 'capixel-components' ), __( 'Carga el CSS de utilidades (cp-container, cp-grid, cp-mt-md, …).', 'capixel-components' ), 'pixelcore_general' );
		$this->add_checkbox_field( 'enable_debug', __( 'Enable debug mode', 'capixel-components' ), __( 'Muestra un panel flotante en el frontend con las animaciones y ScrollTriggers activos. Solo para desarrollo.', 'capixel-components' ), 'pixelcore_general' );

		$this->add_checkbox_field( 'enable_gsap', __( 'Enable GSAP', 'capixel-components' ), __( 'Carga la librería GSAP vendorizada (assets/vendor/gsap). Si tu theme ya carga su propio GSAP, puedes desactivar esto.', 'capixel-components' ), 'pixelcore_gsap' );
		$this->add_checkbox_field( 'enable_scrolltrigger', __( 'Enable ScrollTrigger', 'capixel-components' ), __( 'Necesario para animaciones con trigger "Scroll" (scrub, pin, start/end, etc).', 'capixel-components' ), 'pixelcore_gsap' );
		$this->add_checkbox_field( 'enable_scrollsmoother', __( 'Enable ScrollSmoother', 'capixel-components' ), __( 'Opcional. Requiere un wrapper #smooth-wrapper/#smooth-content en el theme — déjalo desactivado si no lo usas.', 'capixel-components' ), 'pixelcore_gsap' );

		$this->add_checkbox_field( 'conditional_loading', __( 'Load assets conditionally', 'capixel-components' ), __( 'Solo carga GSAP y el motor de animaciones en páginas que realmente tengan un bloque PixelCore o un elemento data-cp-animation.', 'capixel-components' ), 'pixelcore_performance' );
		$this->add_checkbox_field( 'minify_assets', __( 'Minify assets', 'capixel-components' ), __( 'Sirve el bundle JS minificado (pixelcore.min.js) en lugar de los archivos individuales sin minificar.', 'capixel-components' ), 'pixelcore_performance' );
		$this->add_checkbox_field( 'disable_mobile', __( 'Disable animations on mobile', 'capixel-components' ), __( 'Desactiva todas las animaciones por debajo de 768px, sin importar la configuración de cada bloque.', 'capixel-components' ), 'pixelcore_performance' );
		$this->add_checkbox_field( 'respect_reduced_motion', __( 'Respect reduced motion', 'capixel-components' ), __( 'Desactiva las animaciones si el visitante tiene activado "prefers-reduced-motion" en su sistema.', 'capixel-components' ), 'pixelcore_performance' );
	}

	/**
	 * Registra un campo checkbox estándar.
	 *
	 * @param string $key     Clave dentro del array de ajustes.
	 * @param string $label   Título del campo.
	 * @param string $desc    Texto de ayuda.
	 * @param string $section Sección donde se muestra.
	 */
	private function add_checkbox_field( $key, $label, $desc, $section ) {
		add_settings_field(
			$key,
			$label,
			function () use ( $key, $desc ) {
				$value = self::get( $key );
				printf(
					'<label><input type="checkbox" name="%1$s[%2$s]" value="1" %3$s /> %4$s</label>',
					esc_attr( self::OPTION_KEY ),
					esc_attr( $key ),
					checked( true, (bool) $value, false ),
					esc_html( $desc )
				);
			},
			self::PAGE_SLUG,
			$section
		);
	}

	/**
	 * Sanitiza el array completo de ajustes antes de guardarlo.
	 *
	 * @param array $input Valores enviados desde el formulario.
	 * @return array
	 */
	public function sanitize( $input ) {
		$input      = is_array( $input ) ? $input : array();
		$sanitized  = array();

		foreach ( self::defaults() as $key => $default_value ) {
			$sanitized[ $key ] = ! empty( $input[ $key ] );
		}

		return $sanitized;
	}

	/**
	 * Introducción de la sección GSAP (recuerda la versión vendorizada).
	 */
	public function render_gsap_intro() {
		printf(
			'<p>%s</p>',
			esc_html__( 'PixelCore incluye su propia copia de GSAP (vendorizada en /assets/vendor/gsap), así evitamos conflictos de versión con lo que ya tenga instalado el theme.', 'capixel-components' )
		);
	}

	/**
	 * Renderiza Settings → PixelCore Components.
	 */
	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap pixelcore-settings">
			<h1><?php esc_html_e( 'PixelCore Components', 'capixel-components' ); ?></h1>
			<p><?php esc_html_e( 'Componentes Gutenberg + sistema de animaciones GSAP, reutilizables entre proyectos.', 'capixel-components' ); ?></p>
			<form action="options.php" method="post">
				<?php
				settings_fields( self::PAGE_SLUG );
				do_settings_sections( self::PAGE_SLUG );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Renderiza PixelCore → Animation: info de solo lectura sobre los
	 * presets, triggers y eases disponibles, y cómo extenderlos.
	 */
	public function render_animation_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$presets  = PixelCore_Animation_Presets::get_presets();
		$triggers = PixelCore_Animation_Presets::get_triggers();
		?>
		<div class="wrap pixelcore-settings">
			<h1><?php esc_html_e( 'PixelCore — Animation', 'capixel-components' ); ?></h1>
			<p>
				<?php esc_html_e( 'Estos son los presets y triggers disponibles actualmente para el panel "Animation" de cada bloque PixelCore. Se configuran por bloque desde el editor (InspectorControls), con valores independientes para Desktop / Tablet / Mobile.', 'capixel-components' ); ?>
			</p>

			<h2><?php esc_html_e( 'Presets', 'capixel-components' ); ?></h2>
			<table class="widefat striped" style="max-width:720px">
				<thead>
					<tr>
						<th><?php esc_html_e( 'Slug', 'capixel-components' ); ?></th>
						<th><?php esc_html_e( 'Label', 'capixel-components' ); ?></th>
						<th><?php esc_html_e( 'GSAP vars', 'capixel-components' ); ?></th>
					</tr>
				</thead>
				<tbody>
					<?php foreach ( $presets as $slug => $preset ) : ?>
						<tr>
							<td><code><?php echo esc_html( $slug ); ?></code></td>
							<td><?php echo esc_html( $preset['label'] ); ?></td>
							<td><code><?php echo esc_html( ! empty( $preset['vars'] ) ? wp_json_encode( $preset['vars'] ) : '—' ); ?></code></td>
						</tr>
					<?php endforeach; ?>
				</tbody>
			</table>

			<h2><?php esc_html_e( 'Triggers', 'capixel-components' ); ?></h2>
			<p><?php echo esc_html( implode( ', ', $triggers ) ); ?></p>

			<h2><?php esc_html_e( 'Extender presets', 'capixel-components' ); ?></h2>
			<p><?php esc_html_e( 'Añade o modifica presets desde el functions.php de tu theme (o desde otro plugin):', 'capixel-components' ); ?></p>
			<pre style="background:#fff;border:1px solid #ccd0d4;padding:12px;max-width:720px;overflow:auto;">add_filter( 'capixel_animation_presets', function ( $presets ) {
	$presets['reveal'] = array(
		'label'    => 'Reveal',
		'category' => 'custom',
		'vars'     => array( 'clipPath' => 'inset(0 100% 0 0)' ),
	);

	return $presets;
} );</pre>
		</div>
		<?php
	}
}
