use raylib::prelude::*;

/// Word-wrap text to fit within max_width (world units).
/// Uses Raylib font measurement.
pub fn wrap_text(font: &WeakFont, text: &str, font_size: f32, max_width: f32) -> Vec<String> {
    let spacing = font_size * 0.05;
    let paragraphs: Vec<&str> = text.split('\n').collect();
    let mut lines = Vec::new();

    for paragraph in paragraphs {
        if paragraph.is_empty() {
            lines.push(String::new());
            continue;
        }

        let words: Vec<&str> = paragraph.split_whitespace().collect();
        if words.is_empty() {
            lines.push(String::new());
            continue;
        }

        let mut current_line = String::new();

        for word in &words {
            let test_line = if current_line.is_empty() {
                word.to_string()
            } else {
                format!("{} {}", current_line, word)
            };

            let size = font.measure_text(&test_line, font_size, spacing);

            if size.x > max_width && !current_line.is_empty() {
                lines.push(current_line);
                current_line = word.to_string();
            } else {
                current_line = test_line;
            }
        }

        if !current_line.is_empty() {
            lines.push(current_line);
        }
    }

    if lines.is_empty() {
        lines.push(String::new());
    }

    lines
}

/// Measure the total height of wrapped text.
#[allow(dead_code)]
pub fn measure_wrapped_height(font: &WeakFont, text: &str, font_size: f32, max_width: f32) -> f32 {
    let lines = wrap_text(font, text, font_size, max_width);
    let line_height = font_size * 1.2;
    lines.len() as f32 * line_height
}
