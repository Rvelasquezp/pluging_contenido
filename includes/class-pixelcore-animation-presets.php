<?php
/**
 * Registro central de presets de animación PixelCore.
 *
 * Cada preset describe *qué* anima (opacity, y, x, scale, rotation…) y sirve
 * de fuente única de verdad tanto para el selector "Animation" que se
 * muestra en el editor de bloques (InspectorControls) como para el motor
 * JS (`js/core.js` + `js/animations/*.js`), que traduce estos mismos slugs a
 * tweens de GSAP.
 *
 * @package PixelCore_Components
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class PixelCore_Animation_Presets {

	/**
	 * Presets built-in. No se calcula en el constructor para poder usar la
	 * clase de forma puramente estática.
	 *
	 * @return array<string, array>
	 */
	private static function builtins() {
		return array(
			'none'       => array(
				'label'    => __( 'Ninguna', 'capixel-components' ),
				'category' => 'none',
			),
			'fade'       => array(
				'label'    => __( 'Fade', 'capixel-components' ),
				'category' => 'fade',
				'vars'     => array( 'opacity' => 0 ),
			),
			'fade-up'    => array(
				'label'    => __( 'Fade Up', 'capixel-components' ),
				'category' => 'fade',
				'vars'     => array(
					'opacity' => 0,
					'y'       => 50,
				),
			),
			'fade-down'  => array(
				'label'    => __( 'Fade Down', 'capixel-components' ),
				'category' => 'fade',
				'vars'     => array(
					'opacity' => 0,
					'y'       => -50,
				),
			),
			'fade-left'  => array(
				'label'    => __( 'Fade Left', 'capixel-components' ),
				'category' => 'fade',
				'vars'     => array(
					'opacity' => 0,
					'x'       => 50,
				),
			),
			'fade-right' => array(
				'label'    => __( 'Fade Right', 'capixel-components' ),
				'category' => 'fade',
				'vars'     => array(
					'opacity' => 0,
					'x'       => -50,
				),
			),
			'scale'      => array(
				'label'    => __( 'Scale', 'capixel-components' ),
				'category' => 'scale',
				'vars'     => array(
					'opacity' => 0,
					'scale'   => 0.85,
				),
			),
			'scale-up'   => array(
				'label'    => __( 'Scale Up', 'capixel-components' ),
				'category' => 'scale',
				'vars'     => array(
					'opacity' => 0,
					'scale'   => 0.6,
				),
			),
			'scale-down' => array(
				'label'    => __( 'Scale Down', 'capixel-components' ),
				'category' => 'scale',
				'vars'     => array(
					'opacity' => 0,
					'scale'   => 1.3,
				),
			),
			'slide'      => array(
				'label'    => __( 'Slide', 'capixel-components' ),
				'category' => 'slide',
				'vars'     => array( 'x' => -100 ),
			),
			'rotate'     => array(
				'label'    => __( 'Rotate', 'capixel-components' ),
				'category' => 'rotate',
				'vars'     => array(
					'opacity'  => 0,
					'rotation' => -15,
				),
			),
			'parallax'   => array(
				'label'    => __( 'Parallax', 'capixel-components' ),
				'category' => 'parallax',
				'vars'     => array( 'yPercent' => 20 ),
			),
			'custom'     => array(
				'label'    => __( 'Custom', 'capixel-components' ),
				'category' => 'custom',
				'vars'     => array(),
			),
		);
	}

	/**
	 * Presets finales, con soporte para que un theme/plugin añada o
	 * sobrescriba entradas vía `capixel_animation_presets`.
	 *
	 * @return array<string, array>
	 */
	public static function get_presets() {
		/**
		 * Filtra la lista completa de presets de animación disponibles.
		 *
		 * @param array $presets Presets indexados por slug.
		 */
		return apply_filters( 'capixel_animation_presets', self::builtins() );
	}

	/**
	 * Triggers disponibles para el selector "Trigger" del editor.
	 *
	 * @return array<string, string>
	 */
	public static function get_triggers() {
		return apply_filters(
			'capixel_animation_triggers',
			array(
				'load'   => __( 'Load', 'capixel-components' ),
				'scroll' => __( 'Scroll', 'capixel-components' ),
				'hover'  => __( 'Hover', 'capixel-components' ),
				'click'  => __( 'Click', 'capixel-components' ),
			)
		);
	}

	/**
	 * Easings disponibles para el selector "Ease".
	 *
	 * @return array<string, string>
	 */
	public static function get_eases() {
		return apply_filters(
			'capixel_animation_eases',
			array(
				'none'          => 'none',
				'power1.out'    => 'power1.out',
				'power2.out'    => 'power2.out',
				'power3.out'    => 'power3.out',
				'power2.inOut'  => 'power2.inOut',
				'back.out(1.7)' => 'back.out(1.7)',
				'elastic.out'   => 'elastic.out',
			)
		);
	}

	/**
	 * Devuelve un único preset por slug (o el preset "none" si no existe).
	 *
	 * @param string $slug Slug del preset.
	 * @return array
	 */
	public static function get_preset( $slug ) {
		$presets = self::get_presets();

		return isset( $presets[ $slug ] ) ? $presets[ $slug ] : $presets['none'];
	}
}
