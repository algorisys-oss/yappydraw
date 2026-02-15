use crate::color::parse_css_color;
use crate::render_pipeline::*;
use crate::renderer::{RaylibRenderer, TextAlign};
use crate::text as text_utils;
use crate::types::{DrawingElement, RichTextSpan};
use raylib::prelude::*;

pub fn render(renderer: &mut RaylibRenderer, el: &DrawingElement, font: &WeakFont) {
    let x = el.x as f32;
    let y = el.y as f32;
    let w = el.width as f32;
    let h = el.height as f32;

    let fill_color = get_fill_color(el);
    let radius = calculate_radius(el);

    // Fill
    renderer.set_fill_color(fill_color);
    renderer.fill_rounded_rect(x, y, w, h, radius);

    // Stroke
    apply_stroke_style(renderer, el);
    renderer.stroke_rounded_rect(x, y, w, h, radius);

    // Container text
    render_container_text(renderer, el, font);
}

/// Render a fallback rectangle for unknown shape types.
pub fn render_fallback(renderer: &mut RaylibRenderer, el: &DrawingElement) {
    let x = el.x as f32;
    let y = el.y as f32;
    let w = el.width as f32;
    let h = el.height as f32;

    let fill_color = get_fill_color(el);
    renderer.set_fill_color(fill_color);
    renderer.fill_rect(x, y, w, h);

    apply_stroke_style(renderer, el);
    renderer.stroke_rect(x, y, w, h);
}

fn calculate_radius(el: &DrawingElement) -> f32 {
    let border_radius = el.border_radius.unwrap_or(0.0) as f32;
    if border_radius <= 0.0 {
        return 0.0;
    }
    let min_dim = (el.width as f32).min(el.height as f32);
    // borderRadius is a percentage (0-50) of min dimension
    (border_radius / 100.0) * min_dim
}

/// Render text centered in the container (for shapes with containerText).
/// Supports richContainerText spans when available.
pub fn render_container_text(renderer: &mut RaylibRenderer, el: &DrawingElement, font: &WeakFont) {
    let x = el.x as f32;
    let y = el.y as f32;
    let w = el.width as f32;
    let h = el.height as f32;
    let padding = 8.0;

    // Try rich container text first
    if let Some(ref spans) = el.rich_container_text {
        if !spans.is_empty() {
            render_rich_container_text(renderer, el, font, spans, x, y, w, h, padding);
            return;
        }
    }

    // Plain text fallback
    let text = el.container_text.as_deref().or(el.text.as_deref());
    let text = match text {
        Some(t) if !t.is_empty() => t,
        _ => return,
    };

    let font_size = get_font_size(el);
    let text_color = get_text_color(el);
    let line_height = font_size * 1.2;
    let available_width = w - padding * 2.0;

    let lines = text_utils::wrap_text(font, text, font_size, available_width);
    let total_text_height = lines.len() as f32 * line_height;

    // Vertical alignment
    let v_align = el.vertical_align.as_deref().unwrap_or("middle");
    let start_y = match v_align {
        "top" => y + padding,
        "bottom" => y + h - total_text_height - padding,
        _ => y + (h - total_text_height) * 0.5, // middle
    };

    // Horizontal alignment
    let h_align = el.text_align.as_deref().unwrap_or("center");

    renderer.set_fill_color(text_color);
    renderer.set_font_size(font_size);

    let align = match h_align {
        "left" => TextAlign::Left,
        "right" => TextAlign::Right,
        _ => TextAlign::Center,
    };
    renderer.set_text_align(align);

    for (i, line) in lines.iter().enumerate() {
        let line_y = start_y + i as f32 * line_height;
        let line_x = match h_align {
            "left" => x + padding,
            "right" => x + w - padding,
            _ => x + w * 0.5, // center
        };
        renderer.fill_text(line, line_x, line_y);
    }
}

/// Render rich text spans inside a container shape.
fn render_rich_container_text(
    renderer: &mut RaylibRenderer,
    el: &DrawingElement,
    font: &WeakFont,
    spans: &[RichTextSpan],
    x: f32, y: f32, w: f32, h: f32,
    padding: f32,
) {
    let base_font_size = get_font_size(el);
    let available_width = w - padding * 2.0;

    // Layout spans into word-wrapped segments
    let segments = layout_container_spans(font, spans, base_font_size, available_width);
    if segments.is_empty() {
        return;
    }

    // Compute total height and per-line info
    let max_line = segments.iter().map(|s| s.line_index).max().unwrap_or(0);
    let mut line_heights: Vec<f32> = vec![0.0; max_line + 1];
    for seg in &segments {
        let fs = seg.span.font_size.map(|f| f as f32).unwrap_or(base_font_size);
        let lh = fs * 1.2;
        if lh > line_heights[seg.line_index] {
            line_heights[seg.line_index] = lh;
        }
    }
    let total_text_height: f32 = line_heights.iter().sum();

    // Vertical alignment
    let v_align = el.vertical_align.as_deref().unwrap_or("middle");
    let start_y = match v_align {
        "top" => y + padding,
        "bottom" => y + h - total_text_height - padding,
        _ => y + (h - total_text_height) * 0.5,
    };

    // Horizontal alignment
    let h_align = el.text_align.as_deref().unwrap_or("center");

    // Group by line
    let mut y_offset = 0.0;
    for line_idx in 0..=max_line {
        let line_segs: Vec<&ContainerSegment> = segments.iter().filter(|s| s.line_index == line_idx).collect();
        let line_width: f32 = line_segs.iter().map(|s| s.width).sum();
        let line_y = start_y + y_offset;

        let base_x = match h_align {
            "center" => x + (w - line_width) * 0.5,
            "right" => x + w - padding - line_width,
            _ => x + padding,
        };

        let mut cursor_x = base_x;
        for seg in &line_segs {
            let span = seg.span;
            let seg_font_size = span.font_size.map(|s| s as f32).unwrap_or(base_font_size);
            let seg_line_height = seg_font_size * 1.2;

            let text_color = if let Some(ref c) = span.color {
                parse_css_color(c)
            } else {
                get_text_color(el)
            };

            renderer.set_fill_color(text_color);
            renderer.set_font_size(seg_font_size);
            renderer.set_text_align(TextAlign::Left);
            renderer.fill_text(&seg.text, cursor_x, line_y);

            if span.underline {
                let uy = line_y + seg_line_height * 0.9;
                renderer.set_stroke_color(text_color);
                renderer.set_line_width(1.0);
                renderer.draw_line(cursor_x, uy, cursor_x + seg.width, uy);
            }

            if span.strikethrough {
                let sy = line_y + seg_line_height * 0.5;
                renderer.set_stroke_color(text_color);
                renderer.set_line_width(1.0);
                renderer.draw_line(cursor_x, sy, cursor_x + seg.width, sy);
            }

            cursor_x += seg.width;
        }

        y_offset += line_heights[line_idx].max(base_font_size * 1.2);
    }
}

struct ContainerSegment<'a> {
    span: &'a RichTextSpan,
    text: String,
    width: f32,
    line_index: usize,
}

fn layout_container_spans<'a>(
    font: &WeakFont,
    spans: &'a [RichTextSpan],
    base_font_size: f32,
    max_width: f32,
) -> Vec<ContainerSegment<'a>> {
    let mut segments: Vec<ContainerSegment<'a>> = Vec::new();
    let mut line_index: usize = 0;
    let mut x_in_line: f32 = 0.0;

    for span in spans {
        let span_font_size = span.font_size.map(|s| s as f32).unwrap_or(base_font_size);
        let spacing = span_font_size * 0.05;

        let paragraphs: Vec<&str> = span.text.split('\n').collect();

        for (pi, paragraph) in paragraphs.iter().enumerate() {
            if pi > 0 {
                line_index += 1;
                x_in_line = 0.0;
            }

            if paragraph.is_empty() {
                continue;
            }

            let words: Vec<&str> = paragraph.split_whitespace().collect();
            if words.is_empty() {
                continue;
            }

            for (wi, word) in words.iter().enumerate() {
                let word_with_space = if wi > 0 || x_in_line > 0.0 {
                    format!(" {}", word)
                } else {
                    word.to_string()
                };

                let word_width = font.measure_text(&word_with_space, span_font_size, spacing).x;

                if x_in_line > 0.0 && x_in_line + word_width > max_width {
                    line_index += 1;
                    x_in_line = 0.0;
                    let word_str = word.to_string();
                    let w = font.measure_text(&word_str, span_font_size, spacing).x;
                    segments.push(ContainerSegment {
                        span,
                        text: word_str,
                        width: w,
                        line_index,
                    });
                    x_in_line += w;
                } else {
                    segments.push(ContainerSegment {
                        span,
                        text: word_with_space,
                        width: word_width,
                        line_index,
                    });
                    x_in_line += word_width;
                }
            }
        }
    }

    segments
}
