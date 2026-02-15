use crate::render_pipeline::*;
use crate::renderer::RaylibRenderer;
use crate::types::DrawingElement;

pub fn render(renderer: &mut RaylibRenderer, el: &DrawingElement) {
    let points = parse_points(el);
    if points.len() < 2 {
        return;
    }

    let base_x = el.x as f32;
    let base_y = el.y as f32;

    let start = (base_x + points[0].0, base_y + points[0].1);
    let end = (
        base_x + points[points.len() - 1].0,
        base_y + points[points.len() - 1].1,
    );

    apply_stroke_style(renderer, el);

    let curve_type = el.curve_type.as_deref().unwrap_or("straight");

    match curve_type {
        "bezier" => render_bezier(renderer, el, start, end),
        "elbow" => render_elbow(renderer, &points, base_x, base_y),
        _ => render_straight(renderer, start, end),
    }

    // Arrowheads
    if let Some(ref ah) = el.start_arrowhead {
        if ah != "null" && !ah.is_empty() {
            let (angle, tip) = if curve_type == "bezier" {
                // Tangent at start
                let cp = get_control_points(el, start, end);
                let angle = f32::atan2(cp.0 .1 - start.1, cp.0 .0 - start.0);
                (angle + std::f32::consts::PI, start)
            } else {
                let next = if points.len() > 1 {
                    (base_x + points[1].0, base_y + points[1].1)
                } else {
                    end
                };
                let angle = f32::atan2(next.1 - start.1, next.0 - start.0);
                (angle + std::f32::consts::PI, start)
            };
            render_arrowhead(renderer, el, tip, angle, ah);
        }
    }

    if let Some(ref ah) = el.end_arrowhead {
        if ah != "null" && !ah.is_empty() {
            let (angle, tip) = if curve_type == "bezier" {
                let cp = get_control_points(el, start, end);
                let angle = f32::atan2(end.1 - cp.1 .1, end.0 - cp.1 .0);
                (angle, end)
            } else {
                let prev = if points.len() > 1 {
                    (
                        base_x + points[points.len() - 2].0,
                        base_y + points[points.len() - 2].1,
                    )
                } else {
                    start
                };
                let angle = f32::atan2(end.1 - prev.1, end.0 - prev.0);
                (angle, end)
            };
            render_arrowhead(renderer, el, tip, angle, ah);
        }
    }
}

fn render_straight(renderer: &mut RaylibRenderer, start: (f32, f32), end: (f32, f32)) {
    renderer.draw_line(start.0, start.1, end.0, end.1);
}

fn render_bezier(
    renderer: &mut RaylibRenderer,
    el: &DrawingElement,
    start: (f32, f32),
    end: (f32, f32),
) {
    let (cp1, cp2) = get_control_points(el, start, end);

    renderer.begin_path();
    renderer.move_to(start.0, start.1);
    renderer.bezier_curve_to(cp1.0, cp1.1, cp2.0, cp2.1, end.0, end.1);
    renderer.stroke();
}

fn render_elbow(
    renderer: &mut RaylibRenderer,
    points: &[(f32, f32)],
    base_x: f32,
    base_y: f32,
) {
    if points.len() < 2 {
        return;
    }
    for i in 0..points.len() - 1 {
        let x1 = base_x + points[i].0;
        let y1 = base_y + points[i].1;
        let x2 = base_x + points[i + 1].0;
        let y2 = base_y + points[i + 1].1;
        renderer.draw_line(x1, y1, x2, y2);
    }
}

fn get_control_points(
    el: &DrawingElement,
    start: (f32, f32),
    end: (f32, f32),
) -> ((f32, f32), (f32, f32)) {
    if let Some(ref cps) = el.control_points {
        if cps.len() >= 2 {
            return (
                (cps[0].x as f32, cps[0].y as f32),
                (cps[1].x as f32, cps[1].y as f32),
            );
        } else if cps.len() == 1 {
            let cp = (cps[0].x as f32, cps[0].y as f32);
            return (cp, cp);
        }
    }

    // Auto-calculate control points
    let dx = end.0 - start.0;
    let dy = end.1 - start.1;

    if dx.abs() > dy.abs() {
        (
            (start.0 + dx * 0.5, start.1),
            (end.0 - dx * 0.5, end.1),
        )
    } else {
        (
            (start.0, start.1 + dy * 0.5),
            (end.0, end.1 - dy * 0.5),
        )
    }
}

fn render_arrowhead(
    renderer: &mut RaylibRenderer,
    el: &DrawingElement,
    tip: (f32, f32),
    angle: f32,
    arrowhead_type: &str,
) {
    let size = el
        .extra
        .get("endArrowheadSize")
        .and_then(|v| v.as_f64())
        .unwrap_or(12.0) as f32;

    let stroke_color = get_stroke_color(el);

    match arrowhead_type {
        "arrow" | "triangle" => {
            let left_angle = angle + 2.6; // ~150 degrees
            let right_angle = angle - 2.6;
            let lx = tip.0 + size * left_angle.cos();
            let ly = tip.1 + size * left_angle.sin();
            let rx = tip.0 + size * right_angle.cos();
            let ry = tip.1 + size * right_angle.sin();

            if arrowhead_type == "triangle" {
                renderer.set_fill_color(stroke_color);
                renderer.fill_triangle(tip.0, tip.1, lx, ly, rx, ry);
            } else {
                renderer.draw_line(tip.0, tip.1, lx, ly);
                renderer.draw_line(tip.0, tip.1, rx, ry);
            }
        }
        "dot" | "circle" => {
            renderer.set_fill_color(stroke_color);
            let r = size * 0.4;
            renderer.fill_ellipse(tip.0, tip.1, r, r);
        }
        "diamond" | "diamondFilled" => {
            let front = (tip.0 + size * angle.cos(), tip.1 + size * angle.sin());
            let back = (tip.0 - size * angle.cos(), tip.1 - size * angle.sin());
            let left = (
                tip.0 + size * 0.5 * (angle + std::f32::consts::FRAC_PI_2).cos(),
                tip.1 + size * 0.5 * (angle + std::f32::consts::FRAC_PI_2).sin(),
            );
            let right = (
                tip.0 + size * 0.5 * (angle - std::f32::consts::FRAC_PI_2).cos(),
                tip.1 + size * 0.5 * (angle - std::f32::consts::FRAC_PI_2).sin(),
            );
            renderer.set_fill_color(stroke_color);
            renderer.fill_triangle(front.0, front.1, left.0, left.1, back.0, back.1);
            renderer.fill_triangle(front.0, front.1, back.0, back.1, right.0, right.1);
        }
        "bar" => {
            let perp = angle + std::f32::consts::FRAC_PI_2;
            let p1 = (tip.0 + size * 0.5 * perp.cos(), tip.1 + size * 0.5 * perp.sin());
            let p2 = (tip.0 - size * 0.5 * perp.cos(), tip.1 - size * 0.5 * perp.sin());
            renderer.draw_line(p1.0, p1.1, p2.0, p2.1);
        }
        _ => {}
    }
}

/// Parse points from the flexible format (Point[] or packed number[]).
fn parse_points(el: &DrawingElement) -> Vec<(f32, f32)> {
    match &el.points {
        Some(serde_json::Value::Array(arr)) => {
            if arr.is_empty() {
                return vec![(0.0, 0.0)];
            }
            // Check if it's an array of objects or packed numbers
            if arr[0].is_object() {
                arr.iter()
                    .filter_map(|v| {
                        let x = v.get("x")?.as_f64()? as f32;
                        let y = v.get("y")?.as_f64()? as f32;
                        Some((x, y))
                    })
                    .collect()
            } else {
                // Packed number array: [x0, y0, x1, y1, ...]
                let nums: Vec<f32> = arr.iter().filter_map(|v| v.as_f64().map(|n| n as f32)).collect();
                nums.chunks(2)
                    .filter_map(|chunk| {
                        if chunk.len() == 2 {
                            Some((chunk[0], chunk[1]))
                        } else {
                            None
                        }
                    })
                    .collect()
            }
        }
        _ => vec![(0.0, 0.0), (el.width as f32, el.height as f32)],
    }
}
