<?php
/**
 * Developer API — funciones públicas pensadas para que otros plugins/temas
 * interactúen con PixelCore Components sin tocar el core del plugin.
 *
 * @package PixelCore_Components
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registra un componente (bloque) externo dentro de PixelCore.
 *
 * Permite a un theme o a otro plugin añadir un bloque nuevo que aparezca en
 * el registro interno de PixelCore (visible en el modo debug) y que se
 * registre con `register_block_type()` de forma estándar, sin tener que
 * modificar los archivos de este plugin.
 *
 * Ejemplo:
 *
 *     add_action( 'init', function () {
 *         capixel_register_component( __DIR__ . '/blocks/testimonial' );
 *     } );
 *
 * @param string $path Ruta absoluta a la carpeta que contiene block.json.
 * @param array  $args {
 *     Opcional.
 *
 *     @type callable $render_callback Callback de render, si no viene definido en block.json.
 *     @type array    $settings        Ajustes extra pasados a register_block_type_from_metadata().
 * }
 * @return string|WP_Error Nombre del bloque registrado o WP_Error si falla.
 */
function capixel_register_component( $path, $args = array() ) {
	return PixelCore_Blocks::register_component( $path, $args );
}

/**
 * Devuelve la lista de presets de animación disponibles.
 *
 * Filtrable vía `capixel_animation_presets` — usa ese filtro para añadir o
 * modificar presets desde un theme/plugin externo.
 *
 * @return array<string, array> Presets indexados por slug.
 */
function capixel_get_animation_presets() {
	return PixelCore_Animation_Presets::get_presets();
}

/**
 * Devuelve la lista de tipos de layout disponibles para el bloque Gallery.
 *
 * Filtrable vía `capixel_gallery_layouts` — usa ese filtro para añadir un
 * tipo de layout nuevo desde un theme/plugin externo.
 *
 * @return array<string, array> Layouts indexados por slug.
 */
function capixel_get_gallery_layouts() {
	return PixelCore_Gallery::get_layouts();
}

/**
 * Lee un ajuste guardado en Settings → PixelCore Components.
 *
 * @param string $key     Clave del ajuste (ver PixelCore_Settings::defaults()).
 * @param mixed  $default Valor por defecto si la clave no existe.
 * @return mixed
 */
function capixel_setting( $key, $default = null ) {
	return PixelCore_Settings::get( $key, $default );
}

/**
 * True si el modo debug de PixelCore está activo (ajuste + WP_DEBUG).
 *
 * @return bool
 */
function capixel_is_debug() {
	return PixelCore_Debug::is_enabled();
}

/**
 * Convierte el atributo "animation" (objeto) de un bloque en los
 * `data-cp-*` que el motor JS (`js/core.js`) entiende. Se usa desde el
 * render.php de cada bloque, ej.:
 *
 *     <div <?php echo capixel_animation_attributes( $attributes['animation'] ?? array() ); ?>>
 *
 * @param array $animation Atributo "animation" del bloque (ver block.json de hero/card/accordion/cta).
 * @return string Atributos HTML ya escapados, listos para imprimir.
 */
function capixel_animation_attributes( $animation ) {
	if ( empty( $animation ) || empty( $animation['preset'] ) || 'none' === $animation['preset'] ) {
		return '';
	}

	if ( ! capixel_setting( 'enable_animations' ) ) {
		return '';
	}

	$defaults = array(
		'preset'     => 'none',
		'trigger'    => 'scroll',
		'start'      => 'top 80%',
		'end'        => 'bottom 20%',
		'duration'   => 1,
		'delay'      => 0,
		'ease'       => 'power2.out',
		'scrub'      => false,
		'once'       => true,
		'pin'        => false,
		'markers'    => false,
		'responsive' => array(),
	);

	$animation = wp_parse_args( $animation, $defaults );

	$preset = PixelCore_Animation_Presets::get_preset( $animation['preset'] );

	$attrs = array(
		'data-cp-animation' => $animation['preset'],
		'data-cp-vars'      => wp_json_encode( ! empty( $preset['vars'] ) ? $preset['vars'] : array() ),
		'data-cp-trigger'   => $animation['trigger'],
		'data-cp-start'     => $animation['start'],
		'data-cp-end'       => $animation['end'],
		'data-cp-duration'  => $animation['duration'],
		'data-cp-delay'     => $animation['delay'],
		'data-cp-ease'      => $animation['ease'],
		'data-cp-once'      => $animation['once'] ? 'true' : 'false',
		'data-cp-pin'       => $animation['pin'] ? 'true' : 'false',
	);

	if ( false !== $animation['scrub'] && '' !== $animation['scrub'] ) {
		$attrs['data-cp-scrub'] = $animation['scrub'];
	}

	if ( ! empty( $animation['markers'] ) && capixel_is_debug() ) {
		$attrs['data-cp-markers'] = 'true';
	}

	if ( ! empty( $animation['responsive'] ) ) {
		$attrs['data-cp-responsive'] = wp_json_encode( $animation['responsive'] );
	}

	if ( 'custom' === $animation['preset'] && ! empty( $animation['custom'] ) ) {
		$attrs['data-cp-custom'] = wp_json_encode( $animation['custom'] );
	}

	$html = '';

	foreach ( $attrs as $name => $value ) {
		$html .= sprintf( ' %s="%s"', esc_attr( $name ), esc_attr( $value ) );
	}

	return trim( $html );
}

/**
 * Arma un atributo style="" a partir de variables CSS (--pc-*), ignorando
 * las que vengan vacías. Pensado para colores/tamaños de texto editables
 * desde el Inspector: el SCSS de cada bloque lee estas variables con
 * `!important` (ej. `color: var(--pc-title-color, inherit) !important;`),
 * así el valor elegido siempre se ve — en el editor y en el frontend, sin
 * pelear con estilos por defecto de otras hojas — sin tener que concatenar
 * "!important" a mano en cada string de color.
 *
 * Uso:
 *
 *     <h1<?php echo capixel_css_vars_attribute( [ '--pc-title-color' => $color ] ); ?>>
 *
 * @param array<string,string|int> $vars Ej: [ '--pc-title-color' => '#fff' ].
 * @return string Atributo style="" ya escapado, o cadena vacía si no hay nada que imprimir.
 */
function capixel_css_vars_attribute( $vars ) {
	$declarations = array();

	foreach ( $vars as $name => $value ) {
		if ( '' !== $value && null !== $value ) {
			$declarations[] = esc_attr( $name ) . ':' . esc_attr( $value );
		}
	}

	return $declarations ? ' style="' . implode( ';', $declarations ) . '"' : '';
}

/**
 * Convierte un color hex (#rgb o #rrggbb) + opacidad (0-100) a "rgba(...)".
 * Usado por el overlay de descripción del bloque Gallery, donde el usuario
 * elige el color de fondo y la opacidad por separado (dos controles nativos)
 * en vez de un color picker con canal alfa custom.
 *
 * @param string $hex     Color en formato #rgb o #rrggbb. Cadena vacía → fallback negro.
 * @param int    $opacity Opacidad de 0 a 100.
 * @return string Ej. "rgba(0,0,0,0.6)".
 */
function capixel_hex_to_rgba( $hex, $opacity = 60 ) {
	$hex = trim( (string) $hex );

	if ( '' === $hex || ! preg_match( '/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i', $hex, $matches ) ) {
		$hex = '#000000';
	} else {
		$hex = '#' . $matches[1];
	}

	$hex = ltrim( $hex, '#' );

	if ( 3 === strlen( $hex ) ) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}

	$r = hexdec( substr( $hex, 0, 2 ) );
	$g = hexdec( substr( $hex, 2, 2 ) );
	$b = hexdec( substr( $hex, 4, 2 ) );
	$a = max( 0, min( 100, (int) $opacity ) ) / 100;

	return sprintf( 'rgba(%d,%d,%d,%s)', $r, $g, $b, $a );
}

/**
 * Devuelve los ajustes específicos de un componente, ya filtrados.
 *
 * Filtrable vía `capixel_component_settings` — un theme puede usar esto para
 * cambiar valores por defecto de un bloque (ej. deshabilitar animaciones en
 * un componente concreto) sin editar el bloque.
 *
 * @param string $component Slug del componente (ej. 'hero').
 * @param array  $settings  Ajustes actuales del bloque (atributos ya resueltos).
 * @return array
 */
function capixel_get_component_settings( $component, $settings = array() ) {
	/**
	 * Filtra los ajustes resueltos de un componente antes de renderizarlo.
	 *
	 * @param array  $settings  Ajustes del componente.
	 * @param string $component Slug del componente.
	 */
	return apply_filters( 'capixel_component_settings', $settings, $component );
}
