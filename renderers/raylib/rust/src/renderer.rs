use raylib::prelude::*;
use crate::viewport::Viewport;

/// Affine 2D transform matrix [a, b, c, d, tx, ty]
/// Represents: | a  b  tx |
///             | c  d  ty |
///             | 0  0  1  |
#[derive(Debug, Clone, Copy)]
pub struct Transform2D {
    pub a: f32,
    pub b: f32,
    pub c: f32,
    pub d: f32,
    pub tx: f32,
    pub ty: f32,
}

impl Transform2D {
    pub fn identity() -> Self {
        Self {
            a: 1.0, b: 0.0,
            c: 0.0, d: 1.0,
            tx: 0.0, ty: 0.0,
        }
    }

    /// Multiply self * other (apply other first, then self).
    pub fn multiply(&self, other: &Transform2D) -> Transform2D {
        Transform2D {
            a:  self.a * other.a  + self.b * other.c,
            b:  self.a * other.b  + self.b * other.d,
            c:  self.c * other.a  + self.d * other.c,
            d:  self.c * other.b  + self.d * other.d,
            tx: self.a * other.tx + self.b * other.ty + self.tx,
            ty: self.c * other.tx + self.d * other.ty + self.ty,
        }
    }

    pub fn translated(tx: f32, ty: f32) -> Self {
        Self { a: 1.0, b: 0.0, c: 0.0, d: 1.0, tx, ty }
    }

    pub fn rotated(angle: f32) -> Self {
        let cos = angle.cos();
        let sin = angle.sin();
        Self { a: cos, b: -sin, c: sin, d: cos, tx: 0.0, ty: 0.0 }
    }

    pub fn scaled(sx: f32, sy: f32) -> Self {
        Self { a: sx, b: 0.0, c: 0.0, d: sy, tx: 0.0, ty: 0.0 }
    }

    /// Transform a point.
    pub fn apply(&self, x: f32, y: f32) -> (f32, f32) {
        (
            self.a * x + self.b * y + self.tx,
            self.c * x + self.d * y + self.ty,
        )
    }
}

/// Path command for buffered path building.
#[derive(Debug, Clone)]
enum PathCmd {
    MoveTo(f32, f32),
    LineTo(f32, f32),
    Close,
}

/// Rendering state (saved/restored).
#[derive(Debug, Clone)]
struct RenderState {
    transform: Transform2D,
    fill_color: Color,
    stroke_color: Color,
    line_width: f32,
    global_alpha: f32,
    font_size: f32,
    line_dash: Vec<f32>,
    text_align: TextAlign,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum TextAlign {
    Left,
    Center,
    Right,
}

/// The Raylib-based renderer that mirrors IRenderer's API.
pub struct RaylibRenderer<'d, 'h, 'r> {
    pub d: &'d mut RaylibDrawHandle<'h>,
    state: RenderState,
    state_stack: Vec<RenderState>,
    path: Vec<PathCmd>,
    viewport: &'r Viewport,
    default_font: &'r WeakFont,
}

impl<'d, 'h, 'r> RaylibRenderer<'d, 'h, 'r> {
    pub fn new(d: &'d mut RaylibDrawHandle<'h>, viewport: &'r Viewport, font: &'r WeakFont) -> Self {
        Self {
            d,
            state: RenderState {
                transform: viewport.to_transform(),
                fill_color: Color::WHITE,
                stroke_color: Color::BLACK,
                line_width: 2.0,
                global_alpha: 1.0,
                font_size: 28.0,
                line_dash: vec![],
                text_align: TextAlign::Left,
            },
            state_stack: vec![],
            path: vec![],
            viewport,
            default_font: font,
        }
    }

    // ── State ──

    pub fn save(&mut self) {
        self.state_stack.push(self.state.clone());
    }

    pub fn restore(&mut self) {
        if let Some(s) = self.state_stack.pop() {
            self.state = s;
        }
    }

    // ── Transform ──

    pub fn translate(&mut self, x: f32, y: f32) {
        let t = Transform2D::translated(x, y);
        self.state.transform = self.state.transform.multiply(&t);
    }

    pub fn rotate(&mut self, angle: f32) {
        let t = Transform2D::rotated(angle);
        self.state.transform = self.state.transform.multiply(&t);
    }

    pub fn scale(&mut self, sx: f32, sy: f32) {
        let t = Transform2D::scaled(sx, sy);
        self.state.transform = self.state.transform.multiply(&t);
    }

    // ── Style ──

    pub fn set_fill_color(&mut self, c: Color) {
        self.state.fill_color = c;
    }

    pub fn set_stroke_color(&mut self, c: Color) {
        self.state.stroke_color = c;
    }

    pub fn set_line_width(&mut self, w: f32) {
        self.state.line_width = w;
    }

    pub fn set_line_dash(&mut self, segments: &[f32]) {
        self.state.line_dash = segments.to_vec();
    }

    pub fn set_global_alpha(&mut self, alpha: f32) {
        self.state.global_alpha = alpha;
    }

    pub fn set_font_size(&mut self, size: f32) {
        self.state.font_size = size;
    }

    pub fn set_text_align(&mut self, align: TextAlign) {
        self.state.text_align = align;
    }

    // ── Getters ──

    pub fn font_size(&self) -> f32 {
        self.state.font_size
    }

    pub fn text_align(&self) -> TextAlign {
        self.state.text_align
    }

    pub fn global_alpha(&self) -> f32 {
        self.state.global_alpha
    }

    pub fn line_width(&self) -> f32 {
        self.state.line_width
    }

    // ── Path ──

    pub fn begin_path(&mut self) {
        self.path.clear();
    }

    pub fn move_to(&mut self, x: f32, y: f32) {
        self.path.push(PathCmd::MoveTo(x, y));
    }

    pub fn line_to(&mut self, x: f32, y: f32) {
        self.path.push(PathCmd::LineTo(x, y));
    }

    pub fn close_path(&mut self) {
        self.path.push(PathCmd::Close);
    }

    /// Add a cubic bezier curve, flattened to line segments.
    pub fn bezier_curve_to(&mut self, cp1x: f32, cp1y: f32, cp2x: f32, cp2y: f32, x: f32, y: f32) {
        // Get current position
        let (sx, sy) = self.current_pos();
        flatten_cubic(sx, sy, cp1x, cp1y, cp2x, cp2y, x, y, &mut self.path);
    }

    fn current_pos(&self) -> (f32, f32) {
        for cmd in self.path.iter().rev() {
            match cmd {
                PathCmd::MoveTo(x, y) | PathCmd::LineTo(x, y) => return (*x, *y),
                PathCmd::Close => {}
            }
        }
        (0.0, 0.0)
    }

    // ── Drawing ──

    /// Transform a point through the current transform + viewport.
    fn tp(&self, x: f32, y: f32) -> Vector2 {
        let (tx, ty) = self.state.transform.apply(x, y);
        Vector2::new(tx, ty)
    }

    fn alpha_color(&self, c: Color) -> Color {
        let a = (c.a as f32 * self.state.global_alpha) as u8;
        Color::new(c.r, c.g, c.b, a)
    }

    /// Fill the current path as a polygon.
    pub fn fill(&mut self) {
        let points = self.collect_path_points();
        if points.len() < 3 {
            return;
        }
        let color = self.alpha_color(self.state.fill_color);
        // Triangulate using fan from first vertex
        let base = points[0];
        for i in 1..points.len() - 1 {
            self.d.draw_triangle(base, points[i], points[i + 1], color);
        }
    }

    /// Stroke the current path.
    pub fn stroke(&mut self) {
        let points = self.collect_path_points();
        if points.len() < 2 {
            return;
        }
        let color = self.alpha_color(self.state.stroke_color);
        let lw = self.state.line_width * self.viewport.scale;

        if self.state.line_dash.is_empty() {
            // Solid stroke
            for i in 0..points.len() - 1 {
                self.d.draw_line_ex(points[i], points[i + 1], lw, color);
            }
        } else {
            // Dashed stroke
            self.draw_dashed_lines(&points, lw, color);
        }
    }

    fn draw_dashed_lines(&mut self, points: &[Vector2], lw: f32, color: Color) {
        let dash = if self.state.line_dash.len() >= 2 {
            (self.state.line_dash[0], self.state.line_dash[1])
        } else {
            (8.0, 8.0)
        };

        let mut drawing = true;
        let mut remaining = dash.0;

        for i in 0..points.len() - 1 {
            let mut from = points[i];
            let to = points[i + 1];
            let dx = to.x - from.x;
            let dy = to.y - from.y;
            let seg_len = (dx * dx + dy * dy).sqrt();
            if seg_len < 0.001 {
                continue;
            }
            let ux = dx / seg_len;
            let uy = dy / seg_len;
            let mut consumed = 0.0;

            while consumed < seg_len {
                let step = remaining.min(seg_len - consumed);
                let next = Vector2::new(from.x + ux * step, from.y + uy * step);
                if drawing {
                    self.d.draw_line_ex(from, next, lw, color);
                }
                consumed += step;
                remaining -= step;
                from = next;

                if remaining <= 0.0 {
                    drawing = !drawing;
                    remaining = if drawing { dash.0 } else { dash.1 };
                }
            }
        }
    }

    fn collect_path_points(&self) -> Vec<Vector2> {
        let mut points = Vec::new();
        let mut first = None;

        for cmd in &self.path {
            match cmd {
                PathCmd::MoveTo(x, y) => {
                    let p = self.tp(*x, *y);
                    first = Some(p);
                    points.push(p);
                }
                PathCmd::LineTo(x, y) => {
                    points.push(self.tp(*x, *y));
                }
                PathCmd::Close => {
                    if let Some(f) = first {
                        points.push(f);
                    }
                }
            }
        }
        points
    }

    // ── Convenience drawing ──

    pub fn fill_rect(&mut self, x: f32, y: f32, w: f32, h: f32) {
        let color = self.alpha_color(self.state.fill_color);
        let p1 = self.tp(x, y);
        let p2 = self.tp(x + w, y);
        let p3 = self.tp(x + w, y + h);
        let p4 = self.tp(x, y + h);
        // Two triangles for a quad
        self.d.draw_triangle(p1, p2, p3, color);
        self.d.draw_triangle(p1, p3, p4, color);
    }

    pub fn stroke_rect(&mut self, x: f32, y: f32, w: f32, h: f32) {
        let color = self.alpha_color(self.state.stroke_color);
        let lw = self.state.line_width * self.viewport.scale;
        let p1 = self.tp(x, y);
        let p2 = self.tp(x + w, y);
        let p3 = self.tp(x + w, y + h);
        let p4 = self.tp(x, y + h);
        self.d.draw_line_ex(p1, p2, lw, color);
        self.d.draw_line_ex(p2, p3, lw, color);
        self.d.draw_line_ex(p3, p4, lw, color);
        self.d.draw_line_ex(p4, p1, lw, color);
    }

    pub fn fill_rounded_rect(&mut self, x: f32, y: f32, w: f32, h: f32, radius: f32) {
        if radius <= 0.0 {
            self.fill_rect(x, y, w, h);
            return;
        }
        let color = self.alpha_color(self.state.fill_color);
        let p = self.tp(x, y);
        let scale = self.viewport.scale;
        let roundness = radius / (w.min(h) * 0.5);
        self.d.draw_rectangle_rounded(
            Rectangle::new(p.x, p.y, w * scale, h * scale),
            roundness,
            16,
            color,
        );
    }

    pub fn stroke_rounded_rect(&mut self, x: f32, y: f32, w: f32, h: f32, radius: f32) {
        if radius <= 0.0 {
            self.stroke_rect(x, y, w, h);
            return;
        }
        let _color = self.alpha_color(self.state.stroke_color);
        let _lw = self.state.line_width * self.viewport.scale;
        // draw_rectangle_rounded_lines in raylib-rs 5.x takes (rect, roundness, segments, color)
        // Line width must be set separately via rl_set_line_width or we stroke manually.
        // For simplicity, fall back to manual path-based stroke for rounded rects.
        self.begin_path();
        // Approximate rounded rect with lines and arcs (simplified: use 4 straight segments + offset)
        let r = radius.min(w * 0.5).min(h * 0.5);
        let sx = x;
        let sy = y;
        self.move_to(sx + r, sy);
        self.line_to(sx + w - r, sy);
        self.line_to(sx + w, sy + r);
        self.line_to(sx + w, sy + h - r);
        self.line_to(sx + w - r, sy + h);
        self.line_to(sx + r, sy + h);
        self.line_to(sx, sy + h - r);
        self.line_to(sx, sy + r);
        self.close_path();
        self.stroke();
    }

    pub fn fill_ellipse(&mut self, cx: f32, cy: f32, rx: f32, ry: f32) {
        let color = self.alpha_color(self.state.fill_color);
        let p = self.tp(cx, cy);
        let scale = self.viewport.scale;
        self.d.draw_ellipse(
            p.x as i32, p.y as i32,
            rx * scale, ry * scale,
            color,
        );
    }

    pub fn stroke_ellipse(&mut self, cx: f32, cy: f32, rx: f32, ry: f32) {
        let color = self.alpha_color(self.state.stroke_color);
        let p = self.tp(cx, cy);
        let scale = self.viewport.scale;
        self.d.draw_ellipse_lines(
            p.x as i32, p.y as i32,
            rx * scale, ry * scale,
            color,
        );
    }

    pub fn draw_line(&mut self, x1: f32, y1: f32, x2: f32, y2: f32) {
        let color = self.alpha_color(self.state.stroke_color);
        let lw = self.state.line_width * self.viewport.scale;
        let p1 = self.tp(x1, y1);
        let p2 = self.tp(x2, y2);

        if self.state.line_dash.is_empty() {
            self.d.draw_line_ex(p1, p2, lw, color);
        } else {
            self.draw_dashed_lines(&[p1, p2], lw, color);
        }
    }

    // ── Text ──

    pub fn fill_text(&mut self, text: &str, x: f32, y: f32) {
        let color = self.alpha_color(self.state.fill_color);
        let p = self.tp(x, y);
        let font_size = self.state.font_size * self.viewport.scale;
        let spacing = font_size * 0.05;

        let text_size = self.default_font.measure_text(text, font_size, spacing);

        let draw_x = match self.state.text_align {
            TextAlign::Left => p.x,
            TextAlign::Center => p.x - text_size.x * 0.5,
            TextAlign::Right => p.x - text_size.x,
        };

        self.d.draw_text_ex(
            self.default_font,
            text,
            Vector2::new(draw_x, p.y),
            font_size,
            spacing,
            color,
        );
    }

    pub fn measure_text_width(&self, text: &str) -> f32 {
        let font_size = self.state.font_size * self.viewport.scale;
        let spacing = font_size * 0.05;
        let size = self.default_font.measure_text(text, font_size, spacing);
        size.x / self.viewport.scale // Return in world units
    }

    pub fn fill_triangle(&mut self, x1: f32, y1: f32, x2: f32, y2: f32, x3: f32, y3: f32) {
        let color = self.alpha_color(self.state.fill_color);
        let p1 = self.tp(x1, y1);
        let p2 = self.tp(x2, y2);
        let p3 = self.tp(x3, y3);
        self.d.draw_triangle(p1, p2, p3, color);
    }
}

/// Flatten a cubic bezier to line segments using recursive subdivision.
fn flatten_cubic(
    x0: f32, y0: f32,
    cp1x: f32, cp1y: f32,
    cp2x: f32, cp2y: f32,
    x3: f32, y3: f32,
    path: &mut Vec<PathCmd>,
) {
    flatten_cubic_recursive(x0, y0, cp1x, cp1y, cp2x, cp2y, x3, y3, path, 0);
}

fn flatten_cubic_recursive(
    x0: f32, y0: f32,
    cp1x: f32, cp1y: f32,
    cp2x: f32, cp2y: f32,
    x3: f32, y3: f32,
    path: &mut Vec<PathCmd>,
    depth: u32,
) {
    const MAX_DEPTH: u32 = 8;
    const TOLERANCE: f32 = 1.0;

    if depth >= MAX_DEPTH {
        path.push(PathCmd::LineTo(x3, y3));
        return;
    }

    // Check flatness: distance of control points from line start→end
    let dx = x3 - x0;
    let dy = y3 - y0;
    let len_sq = dx * dx + dy * dy;

    if len_sq < 0.001 {
        path.push(PathCmd::LineTo(x3, y3));
        return;
    }

    let d1 = ((cp1x - x0) * dy - (cp1y - y0) * dx).abs() / len_sq.sqrt();
    let d2 = ((cp2x - x3) * dy - (cp2y - y3) * dx).abs() / len_sq.sqrt();

    if d1 + d2 < TOLERANCE {
        path.push(PathCmd::LineTo(x3, y3));
        return;
    }

    // Subdivide at t=0.5 using De Casteljau
    let m01x = (x0 + cp1x) * 0.5;
    let m01y = (y0 + cp1y) * 0.5;
    let m12x = (cp1x + cp2x) * 0.5;
    let m12y = (cp1y + cp2y) * 0.5;
    let m23x = (cp2x + x3) * 0.5;
    let m23y = (cp2y + y3) * 0.5;
    let m012x = (m01x + m12x) * 0.5;
    let m012y = (m01y + m12y) * 0.5;
    let m123x = (m12x + m23x) * 0.5;
    let m123y = (m12y + m23y) * 0.5;
    let mx = (m012x + m123x) * 0.5;
    let my = (m012y + m123y) * 0.5;

    flatten_cubic_recursive(x0, y0, m01x, m01y, m012x, m012y, mx, my, path, depth + 1);
    flatten_cubic_recursive(mx, my, m123x, m123y, m23x, m23y, x3, y3, path, depth + 1);
}
