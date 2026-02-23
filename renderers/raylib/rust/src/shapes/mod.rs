pub mod rectangle;
pub mod circle;
pub mod diamond;
pub mod triangle;
pub mod text;
pub mod connector;
pub mod sticky_note;

use crate::renderer::RaylibRenderer;
use crate::render_pipeline;
use crate::types::DrawingElement;
use raylib::prelude::*;

/// Render a single element using the appropriate shape renderer.
pub fn render_element(renderer: &mut RaylibRenderer, el: &DrawingElement, font: &WeakFont, layer_opacity: f64) {
    let alpha = render_pipeline::get_element_alpha(el, layer_opacity);
    renderer.set_global_alpha(alpha);

    // Apply transforms (rotation, flip)
    render_pipeline::apply_transform(renderer, el);

    match el.element_type.as_str() {
        "rectangle" => rectangle::render(renderer, el, font),
        "circle" => circle::render(renderer, el),
        "diamond" => diamond::render(renderer, el),
        "triangle" | "rightTriangle" => triangle::render(renderer, el),
        "text" | "richtext" => text::render(renderer, el, font),
        "line" | "arrow" => connector::render(renderer, el),
        "connector" | "bezier" | "polyline" | "elbow" => connector::render(renderer, el),
        "stickyNote" => sticky_note::render(renderer, el, font),
        // For unknown types, render a placeholder rectangle
        _ => rectangle::render_fallback(renderer, el),
    }

    render_pipeline::restore_transform(renderer);
}
