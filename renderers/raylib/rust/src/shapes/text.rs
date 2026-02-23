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

    // Draw background fill if set
    let bg = el.background_color.as_deref().unwrap_or("transparent");
    if bg != "transparent" && bg != "none" && !bg.is_empty() {
        let bg_color = parse_css_color(bg);
        renderer.set_fill_color(bg_color);
        renderer.fill_rect(x, y, w, h);
    }

    // Try rich text first, fall back to plain text
    if let Some(ref spans) = el.rich_text {
        if !spans.is_empty() {
            render_rich_text(renderer, el, font, spans, x, y, w, h);
            return;
        }
    }

    // Plain text fallback
    let raw_text = el.text.as_deref().unwrap_or("");
    if raw_text.is_empty() {
        return;
    }
    render_plain_text(renderer, el, font, raw_text, x, y, w, h);
}

fn render_plain_text(
    renderer: &mut RaylibRenderer,
    el: &DrawingElement,
    font: &WeakFont,
    raw_text: &str,
    x: f32, y: f32, w: f32, h: f32,
) {
    let font_size = get_font_size(el);
    let text_color = get_text_color(el);
    let line_height = font_size * 1.2;
    let padding = 4.0;
    let available_width = w - padding * 2.0;

    let lines = text_utils::wrap_text(font, raw_text, font_size, available_width);
    let total_text_height = lines.len() as f32 * line_height;

    // Text highlight background
    if el.text_highlight_enabled {
        draw_text_highlight(renderer, el, x, y, w, total_text_height, padding);
    }

    // Vertical alignment
    let v_align = el.vertical_align.as_deref().unwrap_or("top");
    let start_y = vertical_offset(v_align, y, h, total_text_height, padding);

    // Horizontal alignment
    let h_align = el.text_align.as_deref().unwrap_or("left");
    let align = text_align_from_str(h_align);

    renderer.set_fill_color(text_color);
    renderer.set_font_size(font_size);
    renderer.set_text_align(align);

    for (i, line) in lines.iter().enumerate() {
        let line_y = start_y + i as f32 * line_height;
        let line_x = horizontal_x(h_align, x, w, padding);
        renderer.fill_text(line, line_x, line_y);
    }
}

/// Render rich text spans with per-span formatting.
fn render_rich_text(
    renderer: &mut RaylibRenderer,
    el: &DrawingElement,
    font: &WeakFont,
    spans: &[RichTextSpan],
    x: f32, y: f32, w: f32, h: f32,
) {
    let base_font_size = get_font_size(el);
    let padding = 4.0;
    let available_width = w - padding * 2.0;

    // Layout rich text into positioned segments
    let segments = layout_rich_spans(font, spans, base_font_size, available_width);
    if segments.is_empty() {
        return;
    }

    let total_text_height = compute_segments_height(&segments);

    // Text highlight background
    if el.text_highlight_enabled {
        draw_text_highlight(renderer, el, x, y, w, total_text_height, padding);
    }

    // Vertical alignment
    let v_align = el.vertical_align.as_deref().unwrap_or("top");
    let start_y = vertical_offset(v_align, y, h, total_text_height, padding);

    // Horizontal alignment
    let h_align = el.text_align.as_deref().unwrap_or("left");

    // Group segments by line for horizontal alignment
    let lines = group_segments_by_line(&segments);

    for line in &lines {
        if line.segments.is_empty() {
            continue;
        }
        let line_y = start_y + line.y_offset;
        let line_width = line.total_width;

        // Calculate line x offset based on alignment
        let base_x = match h_align {
            "center" => x + (w - line_width) * 0.5,
            "right" => x + w - padding - line_width,
            _ => x + padding,
        };

        let mut cursor_x = base_x;
        for seg in &line.segments {
            let span = seg.span;
            let seg_font_size = span.font_size.map(|s| s as f32).unwrap_or(base_font_size);
            let seg_line_height = seg_font_size * 1.2;

            // Per-span text color
            let text_color = if let Some(ref c) = span.color {
                parse_css_color(c)
            } else {
                get_text_color(el)
            };

            renderer.set_fill_color(text_color);
            renderer.set_font_size(seg_font_size);
            renderer.set_text_align(TextAlign::Left);
            renderer.fill_text(&seg.text, cursor_x, line_y);

            // Underline
            if span.underline {
                let underline_y = line_y + seg_line_height * 0.9;
                renderer.set_stroke_color(text_color);
                renderer.set_line_width(1.0);
                renderer.draw_line(cursor_x, underline_y, cursor_x + seg.width, underline_y);
            }

            // Strikethrough
            if span.strikethrough {
                let strike_y = line_y + seg_line_height * 0.5;
                renderer.set_stroke_color(text_color);
                renderer.set_line_width(1.0);
                renderer.draw_line(cursor_x, strike_y, cursor_x + seg.width, strike_y);
            }

            cursor_x += seg.width;
        }
    }
}

// ── Rich text layout ──

/// A positioned text segment ready for rendering.
struct TextSegment<'a> {
    span: &'a RichTextSpan,
    text: String,
    width: f32,
    line_index: usize,
}

struct LineGroup<'a> {
    segments: Vec<&'a TextSegment<'a>>,
    y_offset: f32,
    total_width: f32,
}

/// Layout rich text spans into positioned segments with word wrapping.
fn layout_rich_spans<'a>(
    font: &WeakFont,
    spans: &'a [RichTextSpan],
    base_font_size: f32,
    max_width: f32,
) -> Vec<TextSegment<'a>> {
    let mut segments: Vec<TextSegment<'a>> = Vec::new();
    let mut line_index: usize = 0;
    let mut x_in_line: f32 = 0.0;

    for span in spans {
        let span_font_size = span.font_size.map(|s| s as f32).unwrap_or(base_font_size);
        let spacing = span_font_size * 0.05;

        // Split span text by newlines first
        let paragraphs: Vec<&str> = span.text.split('\n').collect();

        for (pi, paragraph) in paragraphs.iter().enumerate() {
            // A newline between paragraphs
            if pi > 0 {
                line_index += 1;
                x_in_line = 0.0;
            }

            if paragraph.is_empty() {
                continue;
            }

            // Split into words for wrapping
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

                // Wrap if needed
                if x_in_line > 0.0 && x_in_line + word_width > max_width {
                    line_index += 1;
                    x_in_line = 0.0;
                    // Re-measure without leading space
                    let word_str = word.to_string();
                    let w = font.measure_text(&word_str, span_font_size, spacing).x;
                    segments.push(TextSegment {
                        span,
                        text: word_str,
                        width: w,
                        line_index,
                    });
                    x_in_line += w;
                } else {
                    segments.push(TextSegment {
                        span,
                        text: word_with_space.clone(),
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

fn compute_segments_height(segments: &[TextSegment]) -> f32 {
    if segments.is_empty() {
        return 0.0;
    }
    let max_line = segments.iter().map(|s| s.line_index).max().unwrap_or(0);
    // Use a default line height based on the first segment
    let base_line_height = segments
        .first()
        .map(|s| {
            let fs = s.span.font_size.map(|f| f as f32).unwrap_or(28.0);
            fs * 1.2
        })
        .unwrap_or(28.0 * 1.2);
    (max_line + 1) as f32 * base_line_height
}

fn group_segments_by_line<'a>(segments: &'a [TextSegment<'a>]) -> Vec<LineGroup<'a>> {
    if segments.is_empty() {
        return vec![];
    }

    let max_line = segments.iter().map(|s| s.line_index).max().unwrap_or(0);
    let mut lines: Vec<LineGroup<'a>> = Vec::with_capacity(max_line + 1);

    // Determine line heights per line (use max font size in each line)
    let mut line_heights: Vec<f32> = vec![0.0; max_line + 1];
    for seg in segments {
        let fs = seg.span.font_size.map(|f| f as f32).unwrap_or(28.0);
        let lh = fs * 1.2;
        if lh > line_heights[seg.line_index] {
            line_heights[seg.line_index] = lh;
        }
    }

    let mut y_offset = 0.0;
    for line_idx in 0..=max_line {
        let segs: Vec<&TextSegment<'a>> = segments.iter().filter(|s| s.line_index == line_idx).collect();
        let total_width: f32 = segs.iter().map(|s| s.width).sum();
        lines.push(LineGroup {
            segments: segs,
            y_offset,
            total_width,
        });
        y_offset += line_heights[line_idx].max(28.0 * 1.2); // Ensure minimum line height
    }

    lines
}

// ── Helpers ──

fn draw_text_highlight(
    renderer: &mut RaylibRenderer,
    el: &DrawingElement,
    x: f32, y: f32, w: f32, text_height: f32,
    base_padding: f32,
) {
    let hl_color_str = el.text_highlight_color.as_deref().unwrap_or("#ffff00");
    let hl_color = parse_css_color(hl_color_str);
    let hl_padding = el.text_highlight_padding.unwrap_or(4.0) as f32;
    // text_highlight_radius is available but we use fill_rect (no rounded rect for highlight)
    renderer.set_fill_color(hl_color);
    renderer.fill_rect(
        x + base_padding - hl_padding,
        y + base_padding - hl_padding,
        w - (base_padding - hl_padding) * 2.0,
        text_height + hl_padding * 2.0,
    );
}

fn vertical_offset(v_align: &str, y: f32, h: f32, total_text_height: f32, padding: f32) -> f32 {
    match v_align {
        "middle" => y + (h - total_text_height) * 0.5,
        "bottom" => y + h - total_text_height - padding,
        _ => y + padding, // top
    }
}

fn horizontal_x(h_align: &str, x: f32, w: f32, padding: f32) -> f32 {
    match h_align {
        "center" => x + w * 0.5,
        "right" => x + w - padding,
        _ => x + padding,
    }
}

fn text_align_from_str(s: &str) -> TextAlign {
    match s {
        "center" => TextAlign::Center,
        "right" => TextAlign::Right,
        _ => TextAlign::Left,
    }
}
