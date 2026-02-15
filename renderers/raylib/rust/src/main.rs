mod color;
mod render_pipeline;
mod renderer;
mod scene;
mod shapes;
mod text;
mod types;
mod viewport;

use raylib::prelude::*;
use viewport::Viewport;

fn main() {
    let path = std::env::args().nth(1).unwrap_or_else(|| {
        eprintln!("Usage: yappy-raylib <file.yappy>");
        std::process::exit(1);
    });

    println!("Loading {}...", path);
    let scene = scene::load(&path);
    println!(
        "Loaded {} elements, {} layers",
        scene.elements.len(),
        scene.layers.len()
    );

    let (mut rl, thread) = raylib::init()
        .size(1280, 720)
        .title(&format!("Yappy Raylib Viewer — {}", path))
        .resizable()
        .msaa_4x()
        .build();

    rl.set_target_fps(60);

    let mut viewport = Viewport::new();
    let font = rl.get_font_default();
    let element_count = scene.elements.len();

    while !rl.window_should_close() {
        viewport.handle_input(&rl);

        let mut d = rl.begin_drawing(&thread);
        d.clear_background(Color::new(245, 245, 245, 255));

        // Draw grid
        draw_grid(&mut d, &viewport);

        // Render all elements using our renderer
        let mut r = renderer::RaylibRenderer::new(&mut d, &viewport, &font);

        for layer in scene.sorted_layers() {
            if !layer.visible {
                continue;
            }
            let layer_opacity = layer.opacity;
            for el in scene.elements_in_layer(&layer.id) {
                shapes::render_element(&mut r, el, &font, layer_opacity);
            }
        }

        // HUD overlay — draw through the renderer's draw handle
        let fps = r.d.get_fps();
        r.d.draw_text(
            &format!(
                "FPS: {} | Elements: {} | Zoom: {:.0}% | Pan: ({:.0}, {:.0})",
                fps,
                element_count,
                viewport.scale * 100.0,
                viewport.pan_x,
                viewport.pan_y
            ),
            10,
            10,
            16,
            Color::DARKGRAY,
        );
        r.d.draw_text(
            "Mouse wheel: zoom | Right-click drag: pan | ESC: quit",
            10,
            30,
            14,
            Color::GRAY,
        );
    }
}

fn draw_grid(d: &mut RaylibDrawHandle, viewport: &Viewport) {
    let grid_size = 20.0;
    let color = Color::new(220, 220, 220, 100);

    let screen_w = d.get_screen_width() as f32;
    let screen_h = d.get_screen_height() as f32;

    let scaled_grid = grid_size * viewport.scale;
    if scaled_grid < 4.0 {
        return;
    }

    let start_x = viewport.pan_x % scaled_grid;
    let start_y = viewport.pan_y % scaled_grid;

    let mut x = start_x;
    while x < screen_w {
        d.draw_line(x as i32, 0, x as i32, screen_h as i32, color);
        x += scaled_grid;
    }

    let mut y = start_y;
    while y < screen_h {
        d.draw_line(0, y as i32, screen_w as i32, y as i32, color);
        y += scaled_grid;
    }
}
