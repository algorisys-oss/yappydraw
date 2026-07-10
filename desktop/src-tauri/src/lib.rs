// Yappy desktop wrapper.
//
// The app lives in the SolidJS web frontend, loaded in the system webview. This Rust shell adds
// the native desktop shell:
//   * a menu bar (File/Edit/View/Help) with a dynamic "Open Recent" submenu,
//   * native file Open/Save of `.yappy`/`.json` documents (frontend (de)serializes; Rust picks
//     files + reads/writes bytes),
//   * single-instance + file-association handling (double-click a `.yappy` → opens in the running
//     instance),
//   * auto-update (Check for Updates… → download + install + relaunch).
// Menu clicks are emitted to the webview as a `menu-action` event; a `.yappy` passed on launch or
// via a second instance is delivered as an `open-path` event / `get_launch_file` command.

use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Emitter, Manager, Runtime, State};
use tauri_plugin_dialog::DialogExt;

/// The document path passed on launch (double-click / CLI arg), consumed once by the frontend.
#[derive(Default)]
struct LaunchFile(Mutex<Option<String>>);

/// First CLI argument that looks like a Yappy document.
fn first_doc_arg<I: IntoIterator<Item = String>>(args: I) -> Option<String> {
    args.into_iter().find(|a| {
        let l = a.to_lowercase();
        (l.ends_with(".yappy") || l.ends_with(".json")) && std::path::Path::new(a).exists()
    })
}

/// Write `data` to disk. With `existing_path` (a prior Save) it writes there; otherwise it shows a
/// native Save dialog. Returns the saved path, or None if cancelled.
#[tauri::command]
fn save_file(
    app: AppHandle,
    default_name: String,
    data: Vec<u8>,
    existing_path: Option<String>,
) -> Result<Option<String>, String> {
    let path = match existing_path {
        Some(p) if !p.is_empty() => Some(std::path::PathBuf::from(p)),
        _ => app
            .dialog()
            .file()
            .set_file_name(&default_name)
            .add_filter("Yappy", &["yappy"])
            .add_filter("JSON", &["json"])
            .blocking_save_file()
            .and_then(|fp| fp.into_path().ok()),
    };
    match path {
        Some(p) => {
            std::fs::write(&p, &data).map_err(|e| e.to_string())?;
            Ok(Some(p.to_string_lossy().to_string()))
        }
        None => Ok(None),
    }
}

/// Show a native Open dialog and return `(path, bytes)` for the chosen file, or None.
#[tauri::command]
fn open_file(app: AppHandle) -> Result<Option<(String, Vec<u8>)>, String> {
    let path = app
        .dialog()
        .file()
        .add_filter("Yappy", &["yappy", "json"])
        .blocking_pick_file()
        .and_then(|fp| fp.into_path().ok());
    match path {
        Some(p) => {
            let data = std::fs::read(&p).map_err(|e| e.to_string())?;
            Ok(Some((p.to_string_lossy().to_string(), data)))
        }
        None => Ok(None),
    }
}

/// Read a known path (recent file / launch file) without a dialog.
#[tauri::command]
fn read_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

/// Return (and clear) the document path passed on launch, so the frontend can open it once ready.
#[tauri::command]
fn get_launch_file(state: State<'_, LaunchFile>) -> Option<String> {
    state.0.lock().ok().and_then(|mut g| g.take())
}

#[derive(serde::Deserialize)]
struct RecentItem {
    path: String,
    name: String,
}

/// Rebuild the native menu with the given recent files under File ▸ Open Recent.
#[tauri::command]
fn set_recent_files(app: AppHandle, items: Vec<RecentItem>) -> Result<(), String> {
    let menu = build_menu(&app, &items).map_err(|e| e.to_string())?;
    app.set_menu(menu).map_err(|e| e.to_string())?;
    Ok(())
}

/// Check for an update; returns the new version string if one is available (does not install).
#[tauri::command]
async fn check_update(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_updater::UpdaterExt;
    let updater = app.updater().map_err(|e| e.to_string())?;
    match updater.check().await {
        Ok(Some(update)) => Ok(Some(update.version.clone())),
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

/// Download + install the available update, then relaunch.
#[tauri::command]
async fn install_update(app: AppHandle) -> Result<(), String> {
    use tauri_plugin_updater::UpdaterExt;
    let updater = app.updater().map_err(|e| e.to_string())?;
    if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
        update
            .download_and_install(|_, _| {}, || {})
            .await
            .map_err(|e| e.to_string())?;
        app.restart();
    }
    Ok(())
}

/// Native menu bar. File ops carry accelerators (the webview has no equivalents); Edit/View items
/// are accelerator-free so they don't double-fire with the webview's own keyboard shortcuts.
/// Recent files (if any) populate a File ▸ Open Recent submenu with `recent::<path>` item ids.
fn build_menu<R: Runtime>(handle: &AppHandle<R>, recents: &[RecentItem]) -> tauri::Result<Menu<R>> {
    let open_recent: Submenu<R> = {
        let sub = Submenu::new(handle, "Open Recent", !recents.is_empty())?;
        for r in recents.iter().take(10) {
            sub.append(&MenuItem::with_id(
                handle,
                format!("recent::{}", r.path),
                &r.name,
                true,
                None::<&str>,
            )?)?;
        }
        sub
    };
    let file = Submenu::with_items(
        handle,
        "File",
        true,
        &[
            &MenuItem::with_id(handle, "new", "New", true, Some("CmdOrCtrl+N"))?,
            &MenuItem::with_id(handle, "open", "Open…", true, Some("CmdOrCtrl+O"))?,
            &open_recent,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(handle, "save", "Save", true, Some("CmdOrCtrl+S"))?,
            &MenuItem::with_id(handle, "saveAs", "Save As…", true, Some("CmdOrCtrl+Shift+S"))?,
            &PredefinedMenuItem::separator(handle)?,
            &MenuItem::with_id(handle, "exportPng", "Export PNG", true, Some("CmdOrCtrl+E"))?,
            &MenuItem::with_id(handle, "exportSvg", "Export SVG", true, None::<&str>)?,
            &PredefinedMenuItem::separator(handle)?,
            &PredefinedMenuItem::quit(handle, None)?,
        ],
    )?;
    let edit = Submenu::with_items(
        handle,
        "Edit",
        true,
        &[
            &MenuItem::with_id(handle, "undo", "Undo", true, None::<&str>)?,
            &MenuItem::with_id(handle, "redo", "Redo", true, None::<&str>)?,
        ],
    )?;
    let view = Submenu::with_items(
        handle,
        "View",
        true,
        &[
            &MenuItem::with_id(handle, "resetView", "Reset View / Fit", true, None::<&str>)?,
            &MenuItem::with_id(handle, "togglePanel", "Toggle Properties Panel", true, None::<&str>)?,
        ],
    )?;
    let help = Submenu::with_items(
        handle,
        "Help",
        true,
        &[&MenuItem::with_id(handle, "checkUpdate", "Check for Updates…", true, None::<&str>)?],
    )?;
    Menu::with_items(handle, &[&file, &edit, &view, &help])
}

/// Bring the main window to the front (used when a second instance is launched).
fn focus_main<R: Runtime>(app: &AppHandle<R>) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let launch = first_doc_arg(std::env::args().skip(1));

    tauri::Builder::default()
        // single-instance MUST be the first plugin registered.
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            focus_main(app);
            if let Some(path) = first_doc_arg(argv.into_iter().skip(1)) {
                let _ = app.emit("open-path", path);
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(LaunchFile(Mutex::new(launch)))
        .menu(|handle| build_menu(handle, &[]))
        .on_menu_event(|app, event| {
            let id = event.id().0.as_str();
            if let Some(path) = id.strip_prefix("recent::") {
                let _ = app.emit("open-path", path.to_string());
            } else {
                let _ = app.emit("menu-action", id);
            }
        })
        .invoke_handler(tauri::generate_handler![
            save_file,
            open_file,
            read_file,
            get_launch_file,
            set_recent_files,
            check_update,
            install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running Yappy");
}
