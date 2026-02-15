use std::fs;
use std::io::Read;
use flate2::read::GzDecoder;

use crate::types::{DrawingElement, Layer, SlideDocument};

pub struct Scene {
    pub elements: Vec<DrawingElement>,
    pub layers: Vec<Layer>,
}

impl Scene {
    pub fn elements_in_layer<'a>(&'a self, layer_id: &str) -> Vec<&'a DrawingElement> {
        self.elements
            .iter()
            .filter(|el| {
                el.layer_id.as_deref().unwrap_or("default-layer") == layer_id
            })
            .collect()
    }

    /// Get all layers sorted by order.
    pub fn sorted_layers(&self) -> Vec<&Layer> {
        let mut layers: Vec<&Layer> = self.layers.iter().collect();
        layers.sort_by_key(|l| l.order);
        layers
    }
}

/// Load a .yappy file (gzipped or plain JSON).
pub fn load(path: &str) -> Scene {
    let data = fs::read(path).unwrap_or_else(|e| {
        eprintln!("Failed to read file '{}': {}", path, e);
        std::process::exit(1);
    });

    let json_str = if is_gzip(&data) {
        let mut decoder = GzDecoder::new(&data[..]);
        let mut s = String::new();
        decoder.read_to_string(&mut s).unwrap_or_else(|e| {
            eprintln!("Failed to decompress '{}': {}", path, e);
            std::process::exit(1);
        });
        s
    } else {
        String::from_utf8(data).unwrap_or_else(|e| {
            eprintln!("File '{}' is not valid UTF-8: {}", path, e);
            std::process::exit(1);
        })
    };

    let doc: SlideDocument = serde_json::from_str(&json_str).unwrap_or_else(|e| {
        eprintln!("Failed to parse JSON from '{}': {}", path, e);
        std::process::exit(1);
    });

    let layers = if doc.layers.is_empty() {
        vec![Layer {
            id: "default-layer".to_string(),
            name: "Layer 1".to_string(),
            visible: true,
            locked: false,
            opacity: 1.0,
            order: 0,
            background_color: None,
        }]
    } else {
        doc.layers
    };

    Scene {
        elements: doc.elements,
        layers,
    }
}

fn is_gzip(data: &[u8]) -> bool {
    data.len() >= 2 && data[0] == 0x1f && data[1] == 0x8b
}
