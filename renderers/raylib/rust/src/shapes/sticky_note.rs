use crate::color::parse_css_color;
use crate::render_pipeline::*;
use crate::renderer::RaylibRenderer;
use crate::shapes::rectangle;
use crate::types::DrawingElement;
use raylib::prelude::*;

pub fn render(renderer: &mut RaylibRenderer, el: &DrawingElement, font: &WeakFont) {
    let x = el.x as f32;
    let y = el.y as f32;
    let w = el.width as f32;
    let h = el.height as f32;

    // Sticky notes have a solid colored background
    let bg = el.background_color.as_deref().unwrap_or("#fff9c4");
    let bg_color = parse_css_color(bg);

    // Fill
    renderer.set_fill_color(bg_color);
    renderer.fill_rect(x, y, w, h);

    // Subtle bottom shadow
    let shadow_color = Color::new(0, 0, 0, 30);
    renderer.set_fill_color(shadow_color);
    renderer.fill_rect(x + 2.0, y + h, w, 3.0);

    // Stroke
    apply_stroke_style(renderer, el);
    renderer.stroke_rect(x, y, w, h);

    // Container text (supports rich text via shared helper)
    rectangle::render_container_text(renderer, el, font);
}
