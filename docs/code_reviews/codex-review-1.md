# Codex Review 1

## Findings

### 1. High: backend path traversal guard is bypassable for sibling paths sharing the `data` prefix

In [backend/server/index.ts](/home/rajesh/work/yappy/backend/server/index.ts#L59) and [backend/server/index.ts](/home/rajesh/work/yappy/backend/server/index.ts#L83), file paths are validated with `startsWith(DATA_DIR)` after `path.join()`.

A request like `../data2/secrets` resolves to a sibling path such as `/.../data2/...`, which still starts with the string `/.../data` and therefore passes the check even though it is outside the intended data directory.

This affects read, write, and delete endpoints.

### 2. High: deleting a slide does not delete the elements that belong to that slide

[frontend/src/store/app-store.ts](/home/rajesh/work/yappy/frontend/src/store/app-store.ts#L1217) removes the slide entry only; it does not remove elements whose centers fall inside that slide's bounds.

That is inconsistent with the slide duplication logic in [frontend/src/store/app-store.ts](/home/rajesh/work/yappy/frontend/src/store/app-store.ts#L1134), which clearly infers slide membership geometrically by checking whether an element's center lies inside the slide frame.

As a result, deleting a slide can leave orphaned content in the document, and that content may reappear later through other operations.

### 3. High: undo/redo snapshots exclude important document state

The history snapshot in [frontend/src/store/app-store.ts](/home/rajesh/work/yappy/frontend/src/store/app-store.ts#L252) stores only `elements` and `layers`.

However, slide and state operations still call `pushToHistory()`, for example:

- [frontend/src/store/app-store.ts](/home/rajesh/work/yappy/frontend/src/store/app-store.ts#L1068)
- [frontend/src/store/app-store.ts](/home/rajesh/work/yappy/frontend/src/store/app-store.ts#L1223)

This means undo/redo does not truly restore `slides`, `states`, `gridSettings`, `docType`, `canvasBackgroundColor`, and related document-level metadata. Users can perform an operation that claims to be undoable, then land in a partially restored state.

### 4. Medium: autosave misses several real document edits

In [frontend/src/storage/auto-save.ts](/home/rajesh/work/yappy/frontend/src/storage/auto-save.ts#L35), autosave dirty detection only watches:

- `undoStackLength`
- `elements.length`
- `slides.length`
- `layers.length`
- `docType`

Edits that do not change those values are invisible unless they also push history. Several important mutations do not push history, including:

- [frontend/src/store/app-store.ts](/home/rajesh/work/yappy/frontend/src/store/app-store.ts#L1288)
- [frontend/src/store/app-store.ts](/home/rajesh/work/yappy/frontend/src/store/app-store.ts#L1302)
- [frontend/src/store/app-store.ts](/home/rajesh/work/yappy/frontend/src/store/app-store.ts#L1464)
- [frontend/src/store/app-store.ts](/home/rajesh/work/yappy/frontend/src/store/app-store.ts#L1512)

So a user can change slide transitions, slide backgrounds, or display states, refresh the page, and lose those edits.

### 5. Medium: duplicating a layer does not remap internal bindings

In [frontend/src/store/app-store.ts](/home/rajesh/work/yappy/frontend/src/store/app-store.ts#L1922), duplicated elements get new IDs, but internal references such as `startBinding`, `endBinding`, and `boundElements` are not remapped to those new IDs.

That means duplicated connectors and bound content can still point back to the original layer's elements, so the copy is not structurally independent.

## Assumptions

- This review assumes slide ownership is intended to be spatial, because slide duplication identifies a slide's contents geometrically.
- If cross-slide shared elements are intentional, the slide deletion finding should be re-evaluated.

## Testing Gaps

Existing tests cover happy-path APIs for slide background/transition updates and layer duplication, but I did not find targeted coverage for these failure modes:

- Undo/autosave behavior for slide metadata and display states
- Binding integrity after duplicating connected layers
- Element cleanup when deleting slides
- Path traversal protection around `/api/drawings`

Relevant existing tests:

- [tests/slides.spec.ts](/home/rajesh/work/yappy/tests/slides.spec.ts#L143)
- [tests/layers.spec.ts](/home/rajesh/work/yappy/tests/layers.spec.ts#L59)

## Notes

I also started a production build during the review, but it did not finish within the review window, so this document does not claim a clean build result.
