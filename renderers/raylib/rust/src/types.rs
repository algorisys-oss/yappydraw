use serde::Deserialize;

/// A span of rich text with per-span formatting.
#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct RichTextSpan {
    pub text: String,
    #[serde(default)]
    pub bold: bool,
    #[serde(default)]
    pub italic: bool,
    #[serde(default)]
    pub underline: bool,
    #[serde(default)]
    pub strikethrough: bool,
    pub color: Option<String>,
    pub font_size: Option<f64>,
    pub font_family: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct DrawingElement {
    pub id: String,
    #[serde(rename = "type")]
    pub element_type: String,
    #[serde(default)]
    pub x: f64,
    #[serde(default)]
    pub y: f64,
    #[serde(default = "default_size")]
    pub width: f64,
    #[serde(default = "default_size")]
    pub height: f64,

    // Style
    pub stroke_color: Option<String>,
    pub background_color: Option<String>,
    pub fill_style: Option<String>,
    pub stroke_width: Option<f64>,
    pub stroke_style: Option<String>,
    #[serde(default = "default_opacity")]
    pub opacity: f64,
    #[serde(default)]
    pub angle: f64,
    pub render_style: Option<String>,
    #[serde(default)]
    pub locked: bool,
    pub layer_id: Option<String>,

    // Border
    pub border_radius: Option<f64>,
    pub stroke_line_join: Option<String>,

    // Text
    pub text: Option<String>,
    pub container_text: Option<String>,
    pub font_size: Option<f64>,
    pub font_family: Option<String>,
    pub text_align: Option<String>,
    pub vertical_align: Option<String>,
    pub text_color: Option<String>,
    pub font_weight: Option<serde_json::Value>,
    pub font_style: Option<serde_json::Value>,

    // Rich text
    pub rich_text: Option<Vec<RichTextSpan>>,
    pub rich_container_text: Option<Vec<RichTextSpan>>,

    // Text highlight
    #[serde(default)]
    pub text_highlight_enabled: bool,
    pub text_highlight_color: Option<String>,
    pub text_highlight_padding: Option<f64>,
    pub text_highlight_radius: Option<f64>,

    // Linear elements (lines, arrows, connectors)
    pub points: Option<serde_json::Value>,
    pub control_points: Option<Vec<PointData>>,
    pub start_arrowhead: Option<String>,
    pub end_arrowhead: Option<String>,
    pub curve_type: Option<String>,

    // Flip
    pub flip_x: Option<bool>,
    pub flip_y: Option<bool>,

    // Polygon
    pub polygon_sides: Option<u32>,
    pub star_points: Option<u32>,

    // Catch-all for unknown fields
    #[serde(flatten)]
    pub extra: serde_json::Map<String, serde_json::Value>,
}

fn default_size() -> f64 {
    100.0
}
fn default_opacity() -> f64 {
    100.0
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PointData {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct Layer {
    pub id: String,
    pub name: String,
    #[serde(default = "default_true")]
    pub visible: bool,
    #[serde(default)]
    pub locked: bool,
    #[serde(default = "default_one")]
    pub opacity: f64,
    #[serde(default)]
    pub order: i32,
    pub background_color: Option<String>,
}

fn default_true() -> bool {
    true
}
fn default_one() -> f64 {
    1.0
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
#[allow(dead_code)]
pub struct SlideDocument {
    pub version: Option<u32>,
    pub metadata: Option<serde_json::Value>,
    pub elements: Vec<DrawingElement>,
    pub layers: Vec<Layer>,
    pub slides: Option<Vec<serde_json::Value>>,
    pub global_settings: Option<serde_json::Value>,
    pub grid_settings: Option<serde_json::Value>,
}
