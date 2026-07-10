// Yappy desktop wrapper.
//
// Intentionally minimal: the whole app lives in the SolidJS web frontend
// (`frontend/`), which Tauri loads in the system webview. It runs fully
// client-side (no backend), so no custom commands are needed yet — pointer/
// pen/touch events flow through the standard webview untouched. Native file
// open/save, menus and auto-update are planned follow-ups (see
// docs/tauri-desktop-plan.md).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Yappy");
}
