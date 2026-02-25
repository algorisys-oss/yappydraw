use crate::color::parse_css_color;
use crate::renderer::RaylibRenderer;
use crate::types::DrawingElement;
use raylib::color::Color;

/// Resolve the fill color for an element.
pub fn get_fill_color(el: &DrawingElement) -> Color {
    let bg = el.background_color.as_deref().unwrap_or("transparent");
    parse_css_color(bg)
}

/// Resolve the stroke color for an element.
pub fn get_stroke_color(el: &DrawingElement) -> Color {
    let sc = el.stroke_color.as_deref().unwrap_or("#000000");
    parse_css_color(sc)
}

/// Resolve the text color.
pub fn get_text_color(el: &DrawingElement) -> Color {
    if let Some(ref tc) = el.text_color {
        parse_css_color(tc)
    } else {
        get_stroke_color(el)
    }
}

/// Get stroke width.
pub fn get_stroke_width(el: &DrawingElement) -> f32 {
    el.stroke_width.unwrap_or(2.0) as f32
}

/// Get font size.
pub fn get_font_size(el: &DrawingElement) -> f32 {
    el.font_size.unwrap_or(28.0) as f32
}

/// Apply element opacity (0-100) and layer opacity (0-1).
pub fn get_element_alpha(el: &DrawingElement, layer_opacity: f64) -> f32 {
    let el_opacity = el.opacity / 100.0;
    (el_opacity * layer_opacity) as f32
}

/// Apply stroke style (solid/dashed/dotted).
pub fn apply_stroke_style(renderer: &mut RaylibRenderer, el: &DrawingElement) {
    let stroke_color = get_stroke_color(el);
    let stroke_width = get_stroke_width(el);
    renderer.set_stroke_color(stroke_color);
    renderer.set_line_width(stroke_width);

    match el.stroke_style.as_deref() {
        Some("dashed") => renderer.set_line_dash(&[8.0, 8.0]),
        Some("dotted") => renderer.set_line_dash(&[2.0, 4.0]),
        _ => renderer.set_line_dash(&[]),
    }
}

/// Apply transformations: translate to center, rotate, flip, translate back.
pub fn apply_transform(renderer: &mut RaylibRenderer, el: &DrawingElement) {
    renderer.save();

    let cx = el.x as f32 + el.width as f32 * 0.5;
    let cy = el.y as f32 + el.height as f32 * 0.5;

    // Translate to center
    renderer.translate(cx, cy);

    // Rotate
    if el.angle != 0.0 {
        renderer.rotate(el.angle as f32);
    }

    // Flip
    let fx = if el.flip_x.unwrap_or(false) { -1.0 } else { 1.0 };
    let fy = if el.flip_y.unwrap_or(false) { -1.0 } else { 1.0 };
    if fx != 1.0 || fy != 1.0 {
        renderer.scale(fx, fy);
    }

    // Translate back
    renderer.translate(-cx, -cy);
}

/// Restore transform (call after apply_transform).
pub fn restore_transform(renderer: &mut RaylibRenderer) {
    renderer.restore();
}

