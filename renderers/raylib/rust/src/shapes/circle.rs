use crate::render_pipeline::*;
use crate::renderer::RaylibRenderer;
use crate::types::DrawingElement;

pub fn render(renderer: &mut RaylibRenderer, el: &DrawingElement) {
    let cx = el.x as f32 + el.width as f32 * 0.5;
    let cy = el.y as f32 + el.height as f32 * 0.5;
    let rx = (el.width as f32 * 0.5).abs();
    let ry = (el.height as f32 * 0.5).abs();

    // Fill
    let fill_color = get_fill_color(el);
    renderer.set_fill_color(fill_color);
    renderer.fill_ellipse(cx, cy, rx, ry);

    // Stroke
    apply_stroke_style(renderer, el);
    renderer.stroke_ellipse(cx, cy, rx, ry);
}
