use crate::render_pipeline::*;
use crate::renderer::RaylibRenderer;
use crate::types::DrawingElement;

pub fn render(renderer: &mut RaylibRenderer, el: &DrawingElement) {
    let x = el.x as f32;
    let y = el.y as f32;
    let w = el.width as f32;
    let h = el.height as f32;

    let is_right = el.element_type == "rightTriangle";

    let (p1, p2, p3) = if is_right {
        // Right triangle: bottom-left, bottom-right, top-left
        ((x, y + h), (x + w, y + h), (x, y))
    } else {
        // Equilateral-ish triangle: top-center, bottom-right, bottom-left
        ((x + w * 0.5, y), (x + w, y + h), (x, y + h))
    };

    // Fill
    let fill_color = get_fill_color(el);
    renderer.set_fill_color(fill_color);
    renderer.fill_triangle(p1.0, p1.1, p2.0, p2.1, p3.0, p3.1);

    // Stroke
    apply_stroke_style(renderer, el);
    renderer.begin_path();
    renderer.move_to(p1.0, p1.1);
    renderer.line_to(p2.0, p2.1);
    renderer.line_to(p3.0, p3.1);
    renderer.close_path();
    renderer.stroke();
}
