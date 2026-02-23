use raylib::color::Color;

/// Parse a CSS color string into a Raylib Color.
/// Supports: #rgb, #rrggbb, #rrggbbaa, rgb(), rgba(), transparent, named colors.
pub fn parse_css_color(s: &str) -> Color {
    let s = s.trim();
    if s.is_empty() || s == "transparent" || s == "none" {
        return Color::new(0, 0, 0, 0);
    }

    // #hex formats
    if let Some(hex) = s.strip_prefix('#') {
        return parse_hex(hex);
    }

    // rgba(r, g, b, a)
    if let Some(inner) = s.strip_prefix("rgba(").and_then(|s| s.strip_suffix(')')) {
        let parts: Vec<&str> = inner.split(',').collect();
        if parts.len() == 4 {
            let r = parts[0].trim().parse::<f64>().unwrap_or(0.0) as u8;
            let g = parts[1].trim().parse::<f64>().unwrap_or(0.0) as u8;
            let b = parts[2].trim().parse::<f64>().unwrap_or(0.0) as u8;
            let a = (parts[3].trim().parse::<f64>().unwrap_or(1.0) * 255.0) as u8;
            return Color::new(r, g, b, a);
        }
    }

    // rgb(r, g, b)
    if let Some(inner) = s.strip_prefix("rgb(").and_then(|s| s.strip_suffix(')')) {
        let parts: Vec<&str> = inner.split(',').collect();
        if parts.len() == 3 {
            let r = parts[0].trim().parse::<f64>().unwrap_or(0.0) as u8;
            let g = parts[1].trim().parse::<f64>().unwrap_or(0.0) as u8;
            let b = parts[2].trim().parse::<f64>().unwrap_or(0.0) as u8;
            return Color::new(r, g, b, 255);
        }
    }

    // Named colors (common subset)
    match s.to_lowercase().as_str() {
        "white" => Color::WHITE,
        "black" => Color::BLACK,
        "red" => Color::RED,
        "green" => Color::GREEN,
        "blue" => Color::BLUE,
        "yellow" => Color::YELLOW,
        "orange" => Color::ORANGE,
        "purple" => Color::PURPLE,
        "pink" => Color::PINK,
        "gray" | "grey" => Color::GRAY,
        "darkgray" | "darkgrey" => Color::DARKGRAY,
        "lightgray" | "lightgrey" => Color::LIGHTGRAY,
        "brown" => Color::BROWN,
        "magenta" => Color::MAGENTA,
        "lime" => Color::LIME,
        "gold" => Color::GOLD,
        "skyblue" => Color::SKYBLUE,
        "beige" => Color::BEIGE,
        "maroon" => Color::MAROON,
        _ => Color::BLACK,
    }
}

fn parse_hex(hex: &str) -> Color {
    let chars: Vec<char> = hex.chars().collect();
    match chars.len() {
        // #rgb
        3 => {
            let r = hex_char(chars[0]) * 17;
            let g = hex_char(chars[1]) * 17;
            let b = hex_char(chars[2]) * 17;
            Color::new(r, g, b, 255)
        }
        // #rrggbb
        6 => {
            let r = hex_byte(chars[0], chars[1]);
            let g = hex_byte(chars[2], chars[3]);
            let b = hex_byte(chars[4], chars[5]);
            Color::new(r, g, b, 255)
        }
        // #rrggbbaa
        8 => {
            let r = hex_byte(chars[0], chars[1]);
            let g = hex_byte(chars[2], chars[3]);
            let b = hex_byte(chars[4], chars[5]);
            let a = hex_byte(chars[6], chars[7]);
            Color::new(r, g, b, a)
        }
        _ => Color::BLACK,
    }
}

fn hex_char(c: char) -> u8 {
    match c {
        '0'..='9' => c as u8 - b'0',
        'a'..='f' => c as u8 - b'a' + 10,
        'A'..='F' => c as u8 - b'A' + 10,
        _ => 0,
    }
}

fn hex_byte(hi: char, lo: char) -> u8 {
    hex_char(hi) * 16 + hex_char(lo)
}

/// Apply alpha (0-255) to a color, multiplying its existing alpha.
pub fn with_alpha(color: Color, alpha: u8) -> Color {
    let a = (color.a as u16 * alpha as u16 / 255) as u8;
    Color::new(color.r, color.g, color.b, a)
}
