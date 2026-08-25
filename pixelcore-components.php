<?php
/**
 * Plugin Name:       PixelCore Components
 * Plugin URI:        https://agencepixel.ca
 * Description:       Mini-framework de componentes Gutenberg reutilizables (Hero, Card, Accordion, CTA…) con un sistema de animaciones GSAP + ScrollTrigger integrado, design system SCSS y utility classes. Pensado para reutilizarse entre proyectos WordPress.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            Agence Pixel
 * Author URI:        https://agencepixel.ca
 * License:            GPL v2 or later
 * License URI:        https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:        capixel-components
 * Domain Path:        /languages
 *
 * @package PixelCore_Components
 */

// Evita el acceso directo al archivo.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// ---------------------------------------------------------------------------
// Constantes del plugin.
// ---------------------------------------------------------------------------

define( 'PIXELCORE_VERSION', '1.0.0' );
define( 'PIXELCORE_FILE', __FILE__ );
define( 'PIXELCORE_PATH', plugin_dir_path( __FILE__ ) );
define( 'PIXELCORE_URL', plugin_dir_url( __FILE__ ) );
define( 'PIXELCORE_BASENAME', plugin_basename( __FILE__ ) );

// ---------------------------------------------------------------------------
// Carga de dependencias.
//
// El plugin no usa un autoloader PSR-4/Composer a propósito: mantenerlo en
// requires explícitos hace que sea trivial copiar/pegar este plugin en otro
// proyecto sin depender de `composer install`.
// ---------------------------------------------------------------------------

require_once PIXELCORE_PATH . 'includes/helpers.php';
require_once PIXELCORE_PATH . 'includes/class-pixelcore-animation-presets.php';
require_once PIXELCORE_PATH . 'includes/class-pixelcore-assets.php';
require_once PIXELCORE_PATH . 'includes/class-pixelcore-blocks.php';
require_once PIXELCORE_PATH . 'includes/class-pixelcore-gallery.php';
require_once PIXELCORE_PATH . 'includes/class-pixelcore-settings.php';
require_once PIXELCORE_PATH . 'includes/class-pixelcore-debug.php';
require_once PIXELCORE_PATH . 'includes/class-pixelcore-plugin.php';

/**
 * Punto de entrada único. El resto del plugin se orquesta desde
 * PixelCore_Plugin::instance().
 */
function capixel_plugin() {
	return PixelCore_Plugin::instance();
}

capixel_plugin();
