use crate::render_pipeline::*;
use crate::renderer::RaylibRenderer;
use crate::types::DrawingElement;

pub fn render(renderer: &mut RaylibRenderer, el: &DrawingElement) {
    let x = el.x as f32;
    let y = el.y as f32;
    let w = el.width as f32;
    let h = el.height as f32;

    let cx = x + w * 0.5;
    let cy = y + h * 0.5;

    // Diamond vertices: top, right, bottom, left
    let top = (cx, y);
    let right = (x + w, cy);
    let bottom = (cx, y + h);
    let left = (x, cy);

    // Fill - two triangles
    let fill_color = get_fill_color(el);
    renderer.set_fill_color(fill_color);
    renderer.fill_triangle(top.0, top.1, right.0, right.1, bottom.0, bottom.1);
    renderer.fill_triangle(top.0, top.1, bottom.0, bottom.1, left.0, left.1);

    // Stroke
    apply_stroke_style(renderer, el);
    renderer.begin_path();
    renderer.move_to(top.0, top.1);
    renderer.line_to(right.0, right.1);
    renderer.line_to(bottom.0, bottom.1);
    renderer.line_to(left.0, left.1);
    renderer.close_path();
    renderer.stroke();
}
