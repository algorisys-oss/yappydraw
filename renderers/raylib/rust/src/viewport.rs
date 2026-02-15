use raylib::prelude::*;
use crate::renderer::Transform2D;

pub struct Viewport {
    pub pan_x: f32,
    pub pan_y: f32,
    pub scale: f32,
    dragging: bool,
    last_mouse: Vector2,
}

impl Viewport {
    pub fn new() -> Self {
        Self {
            pan_x: 0.0,
            pan_y: 0.0,
            scale: 1.0,
            dragging: false,
            last_mouse: Vector2::zero(),
        }
    }

    pub fn handle_input(&mut self, rl: &RaylibHandle) {
        let mouse = rl.get_mouse_position();

        // Zoom with mouse wheel
        let wheel = rl.get_mouse_wheel_move();
        if wheel != 0.0 {
            let old_scale = self.scale;
            let factor = if wheel > 0.0 { 1.1 } else { 1.0 / 1.1 };
            self.scale = (self.scale * factor).clamp(0.05, 10.0);

            // Zoom centered on mouse position
            let scale_ratio = self.scale / old_scale;
            self.pan_x = mouse.x - (mouse.x - self.pan_x) * scale_ratio;
            self.pan_y = mouse.y - (mouse.y - self.pan_y) * scale_ratio;
        }

        // Pan with middle mouse or right mouse
        let panning = rl.is_mouse_button_down(MouseButton::MOUSE_BUTTON_MIDDLE)
            || rl.is_mouse_button_down(MouseButton::MOUSE_BUTTON_RIGHT);

        if panning {
            if self.dragging {
                let dx = mouse.x - self.last_mouse.x;
                let dy = mouse.y - self.last_mouse.y;
                self.pan_x += dx;
                self.pan_y += dy;
            }
            self.dragging = true;
        } else {
            self.dragging = false;
        }

        self.last_mouse = mouse;
    }

    /// Convert world coordinates to screen coordinates.
    pub fn world_to_screen(&self, x: f32, y: f32) -> (f32, f32) {
        (x * self.scale + self.pan_x, y * self.scale + self.pan_y)
    }

    /// Convert screen coordinates to world coordinates.
    #[allow(dead_code)]
    pub fn screen_to_world(&self, sx: f32, sy: f32) -> (f32, f32) {
        ((sx - self.pan_x) / self.scale, (sy - self.pan_y) / self.scale)
    }

    /// Get the viewport as a Transform2D.
    pub fn to_transform(&self) -> Transform2D {
        // scale then translate
        Transform2D {
            a: self.scale,
            b: 0.0,
            c: 0.0,
            d: self.scale,
            tx: self.pan_x,
            ty: self.pan_y,
        }
    }
}
