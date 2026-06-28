/**
 * Table Shape Documentation
 */

import type { Component } from 'solid-js';

export const TableDoc: Component = () => {
    return (
        <div class="doc-container">
            <header class="doc-header">
                <h1 class="doc-title">
                    <span>📊</span> Table
                </h1>
                <p class="doc-description">
                    Create interactive tables with customizable rows, columns, headers, and styling.
                    Perfect for organizing data, creating comparison charts, and building structured content.
                </p>
            </header>

            {/* Overview */}
            <section class="doc-section">
                <h2>Overview</h2>
                <p>
                    Tables in Yappy provide a powerful way to display structured data on your canvas.
                    They support features like sortable columns, resizable columns and rows, text alignment,
                    custom styling, and clipboard integration with spreadsheet applications.
                </p>

                <div class="feature-grid">
                    <div class="feature-card">
                        <h4>📝 Editable Cells</h4>
                        <p>Double-click any cell to edit its content. Text automatically wraps within cells.</p>
                    </div>
                    <div class="feature-card">
                        <h4>📐 Resizable</h4>
                        <p>Drag column and row edges to resize. Double-click edges to auto-fit content.</p>
                    </div>
                    <div class="feature-card">
                        <h4>🔢 Sortable</h4>
                        <p>Click column headers to sort data ascending or descending (numeric-aware).</p>
                    </div>
                    <div class="feature-card">
                        <h4>📋 Clipboard</h4>
                        <p>Copy/paste data to and from Excel, Google Sheets, or other spreadsheets.</p>
                    </div>
                    <div class="feature-card">
                        <h4>🔗 Merge Cells</h4>
                        <p>Combine multiple cells into one. Select cells with Shift+click, then merge via context menu.</p>
                    </div>
                    <div class="feature-card">
                        <h4>💲 Cell Formatting</h4>
                        <p>Format cells as numbers, currency, percentages, or dates with customizable patterns.</p>
                    </div>
                    <div class="feature-card">
                        <h4>🔲 Custom Borders</h4>
                        <p>Apply custom border styles and colors to individual cells or ranges.</p>
                    </div>
                </div>
            </section>

            {/* Creating Tables */}
            <section class="doc-section">
                <h2>Creating a Table</h2>

                <h3>Using the Toolbar</h3>
                <ol>
                    <li>Select the <strong>Table</strong> tool from the shapes menu in the toolbar</li>
                    <li>Click and drag on the canvas to define the table size</li>
                    <li>Release to create the table with default 3×3 dimensions</li>
                </ol>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Create a basic 3x3 table
const tableId = Yappy.createTable(100, 100, 400, 200);

// Create a 5x4 table with custom styling
const tableId = Yappy.createTable(100, 100, 500, 300, 5, 4, {
    tableHeaderColor: '#3b82f6',
    tableHeaderTextColor: '#ffffff',
    tableRowColor: '#f0f9ff',
    tableAltRowColor: '#e0f2fe'
});`}
                </div>
            </section>

            {/* Editing Cells */}
            <section class="doc-section">
                <h2>Editing Cells</h2>

                <h3>Interactive Editing</h3>
                <ul>
                    <li><strong>Double-click</strong> a cell or press <kbd class="kbd">Enter</kbd>/<kbd class="kbd">F2</kbd> to start editing</li>
                    <li>Type your content - text will wrap automatically</li>
                    <li>Press <kbd class="kbd">Tab</kbd> to save and move to the next cell, <kbd class="kbd">Shift+Tab</kbd> to go back</li>
                    <li>Press <kbd class="kbd">Enter</kbd> to save and move down, <kbd class="kbd">Shift+Enter</kbd> for newline</li>
                    <li>Use <kbd class="kbd">Arrow keys</kbd> to navigate between cells when not editing</li>
                    <li>Just start typing to replace cell content</li>
                    <li>Press <kbd class="kbd">Delete</kbd> to clear cell(s), <kbd class="kbd">Escape</kbd> to cancel editing</li>
                </ul>

                <h3>Moving Tables</h3>
                <p>
                    When a table is selected, a <strong>move handle</strong> (blue circle with arrows) appears
                    at the top-left corner. Drag this handle to reposition the table. You can also click and drag
                    from any cell area to move the table — a short click selects the cell, while a longer drag moves the table.
                </p>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Set cell value (row 0 is header when headers enabled)
Yappy.setTableCell(tableId, 0, 0, 'Name');    // Header row
Yappy.setTableCell(tableId, 1, 0, 'Alice');   // First data row
Yappy.setTableCell(tableId, 1, 1, '30');

// Get cell value
const value = Yappy.getTableCell(tableId, 1, 0);  // Returns 'Alice'

// Set all data at once
Yappy.setTableData(tableId, [
    ['Product', 'Price', 'Stock'],
    ['Apple', '$1.00', '150'],
    ['Banana', '$0.50', '200'],
    ['Orange', '$0.75', '100']
]);`}
                </div>
            </section>

            {/* Row and Column Operations */}
            <section class="doc-section">
                <h2>Row & Column Operations</h2>

                <h3>Context Menu</h3>
                <p>Right-click on a table cell to access these operations:</p>
                <ul>
                    <li><strong>Insert Row Above/Below</strong> - Add a new row at the clicked position</li>
                    <li><strong>Delete Row</strong> - Remove the current row (minimum 1 row required)</li>
                    <li><strong>Insert Column Left/Right</strong> - Add a new column</li>
                    <li><strong>Delete Column</strong> - Remove the current column (minimum 1 column required)</li>
                </ul>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Insert row at index (0-based, includes header)
Yappy.insertTableRow(tableId, 2);    // Insert at position 2

// Delete row at index
Yappy.deleteTableRow(tableId, 2);

// Insert column at index
Yappy.insertTableColumn(tableId, 1); // Insert at position 1

// Delete column
Yappy.deleteTableColumn(tableId, 1);`}
                </div>
            </section>

            {/* Resizing */}
            <section class="doc-section">
                <h2>Resizing Columns & Rows</h2>

                <h3>Manual Resize</h3>
                <ul>
                    <li>Hover over a column edge (between headers) - cursor changes to resize indicator</li>
                    <li>Click and drag to resize the column</li>
                    <li>Row edges can be resized the same way</li>
                </ul>

                <h3>Auto-fit Column Width</h3>
                <p>
                    <strong>Double-click</strong> on a column edge to automatically fit the column width
                    to its content. This measures all cell content and sets the optimal width.
                </p>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Set column width as fraction (0-1, all columns must sum to 1)
Yappy.setTableColumnWidth(tableId, 0, 0.5);  // First column = 50%

// Widths are automatically redistributed to maintain total = 1`}
                </div>
            </section>

            {/* Sorting */}
            <section class="doc-section">
                <h2>Sorting Data</h2>

                <h3>Interactive Sorting</h3>
                <ul>
                    <li>Click on any header cell to sort by that column</li>
                    <li>Click again to toggle between ascending and descending</li>
                    <li>Sort indicator (▲/▼) appears in the active column header</li>
                    <li>Sorting is <strong>numeric-aware</strong> - numbers sort correctly (3, 20, 100 not 100, 20, 3)</li>
                </ul>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Sort by column index
Yappy.sortTableColumn(tableId, 0, 'asc');   // Sort by first column, ascending
Yappy.sortTableColumn(tableId, 1, 'desc');  // Sort by second column, descending`}
                </div>
            </section>

            {/* Column Alignment */}
            <section class="doc-section">
                <h2>Column Alignment</h2>

                <h3>Context Menu</h3>
                <p>Right-click on a table cell → <strong>Align Column</strong> submenu:</p>
                <ul>
                    <li><strong>Left</strong> - Align text to the left</li>
                    <li><strong>Center</strong> - Center text (default)</li>
                    <li><strong>Right</strong> - Align text to the right (useful for numbers)</li>
                </ul>
                <p>A checkmark (✓) indicates the current alignment.</p>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Set column alignment
Yappy.setTableColumnAlignment(tableId, 0, 'left');
Yappy.setTableColumnAlignment(tableId, 1, 'center');
Yappy.setTableColumnAlignment(tableId, 2, 'right');`}
                </div>
            </section>

            {/* Styling */}
            <section class="doc-section">
                <h2>Table Styling</h2>

                <h3>Available Style Options</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Property</th>
                            <th>Description</th>
                            <th>Default</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code class="code-inline">headerColor</code></td>
                            <td>Background color of header row</td>
                            <td>#e2e8f0</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">headerTextColor</code></td>
                            <td>Text color in header row</td>
                            <td>Inherited from stroke</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">rowColor</code></td>
                            <td>Background color of even rows</td>
                            <td>Transparent</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">altRowColor</code></td>
                            <td>Background color of odd rows (alternating)</td>
                            <td>Transparent</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Apply custom styling
Yappy.setTableStyle(tableId, {
    headerColor: '#3b82f6',
    headerTextColor: '#ffffff',
    rowColor: '#f0f9ff',
    altRowColor: '#e0f2fe'
});`}
                </div>
            </section>

            {/* Clipboard Operations */}
            <section class="doc-section">
                <h2>Clipboard Operations</h2>

                <h3>Paste from Spreadsheet</h3>
                <ol>
                    <li>Copy data from Excel, Google Sheets, or any spreadsheet</li>
                    <li>Select a table in Yappy</li>
                    <li>Press <kbd class="kbd">Ctrl</kbd>+<kbd class="kbd">V</kbd> to paste</li>
                    <li>Or right-click → Table → <strong>Paste Table Data</strong></li>
                </ol>

                <div class="tip-box">
                    <h5>💡 Tip</h5>
                    <p>
                        Pasting replaces all table data. The table dimensions adjust automatically
                        to match the pasted data.
                    </p>
                </div>

                <h3>Copy to Clipboard</h3>
                <p>Right-click on a table cell → Table → <strong>Copy Table Data</strong></p>
                <p>Data is copied as TSV (tab-separated values), compatible with all spreadsheet applications.</p>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Copy table data to clipboard
await Yappy.copyTableToClipboard(tableId);

// Paste clipboard data into table
await Yappy.pasteIntoTable(tableId);

// Export as CSV string
const csv = Yappy.exportTableAsCSV(tableId);

// Import from CSV/TSV string
Yappy.importTableFromCSV(tableId, csvString);`}
                </div>
            </section>

            {/* Column Reordering */}
            <section class="doc-section">
                <h2>Column Reordering</h2>
                <p>Drag and drop columns to reorder them:</p>
                <ol>
                    <li>Click and hold on a column header</li>
                    <li>Drag sideways — the target column highlights and a blue
                        insertion line shows exactly where the column will land</li>
                    <li>Release to drop the column in its new position</li>
                </ol>

                <div class="tip-box warning">
                    <h5>⚠️ Note</h5>
                    <p>
                        Reordering columns resets any active sort. The data is permanently
                        rearranged in the new column order.
                    </p>
                </div>
            </section>

            {/* Merging Cells */}
            <section class="doc-section">
                <h2>Merging Cells</h2>
                <p>Combine multiple cells into a single larger cell:</p>

                <h3>Interactive Merge</h3>
                <ol>
                    <li>Hold <kbd class="kbd">Shift</kbd> or <kbd class="kbd">Ctrl</kbd> and click on the first cell</li>
                    <li>While still holding the modifier key, click on the last cell of the range (or drag to select)</li>
                    <li>Right-click to open the context menu</li>
                    <li>Select <strong>Table → Merge Cells</strong></li>
                </ol>

                <h3>Unmerge Cells</h3>
                <p>To split a merged cell back into individual cells:</p>
                <ol>
                    <li>Right-click on any merged cell</li>
                    <li>Select <strong>Table → Unmerge Cells</strong></li>
                </ol>

                <div class="tip-box">
                    <h5>💡 Tip</h5>
                    <p>
                        When cells are merged, all cell contents are combined with line breaks
                        and placed in the merged cell. When unmerging, the combined content
                        stays in the top-left cell position.
                    </p>
                </div>

                <h3>Using the API</h3>
                <div class="code-block">
{`// Merge cells from (row 1, col 0) to (row 2, col 1)
Yappy.mergeCells(tableId, 1, 0, 2, 1);

// Unmerge a merged cell at position (row 1, col 0)
Yappy.unmergeCells(tableId, 1, 0);

// Get all merged regions in a table
const merges = Yappy.getMergedCells(tableId);
// Returns: [{ startRow: 1, startCol: 0, endRow: 2, endCol: 1 }, ...]`}
                </div>
            </section>

            {/* Cell Formatting */}
            <section class="doc-section">
                <h2>Cell Formatting</h2>
                <p>Format cell values as numbers, currencies, percentages, or dates:</p>

                <h3>Format Types</h3>
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Description</th>
                            <th>Example</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Text</strong></td>
                            <td>Plain text (default)</td>
                            <td>Hello World</td>
                        </tr>
                        <tr>
                            <td><strong>Number</strong></td>
                            <td>Numeric with optional decimals and thousands separator</td>
                            <td>1,234.56</td>
                        </tr>
                        <tr>
                            <td><strong>Currency</strong></td>
                            <td>Number with currency symbol ($, €, £, ¥, etc.)</td>
                            <td>$1,234.56</td>
                        </tr>
                        <tr>
                            <td><strong>Percentage</strong></td>
                            <td>Number displayed as percentage</td>
                            <td>75%</td>
                        </tr>
                        <tr>
                            <td><strong>Date</strong></td>
                            <td>Date with customizable pattern</td>
                            <td>Jan 31, 2025</td>
                        </tr>
                    </tbody>
                </table>

                <h3>Applying Formats</h3>
                <p>You can format an entire column or specific cells:</p>

                <h4>Format Entire Column</h4>
                <ol>
                    <li>Right-click on any cell in the column</li>
                    <li>Navigate to <strong>Table → Format Cells</strong></li>
                    <li>Choose a format type with <strong>(Column)</strong> suffix (e.g., "Currency (Column)")</li>
                    <li>This applies the format to all body cells in that column (excluding headers)</li>
                </ol>

                <h4>Format Specific Cells</h4>
                <ol>
                    <li>Select a cell or range of cells (using Shift+Click)</li>
                    <li>Right-click to open the context menu</li>
                    <li>Navigate to <strong>Table → Format Cells</strong></li>
                    <li>Choose a format type with <strong>(Cell)</strong> suffix (e.g., "Currency (Cell)")</li>
                </ol>

                <div class="tip-box">
                    <h5>💡 Tip</h5>
                    <p>
                        For percentage formatting, enter the decimal value (e.g., 0.75 for 75%).
                        The value will be automatically multiplied by 100 for display.
                    </p>
                </div>
            </section>

            {/* Cell Borders */}
            <section class="doc-section">
                <h2>Custom Cell Borders</h2>
                <p>Apply custom border styles and colors to cells:</p>

                <h3>Border Positions</h3>
                <ul>
                    <li><strong>All Borders</strong> - Border on all four sides</li>
                    <li><strong>Outside Borders</strong> - Border only on the outer edges of selected range</li>
                    <li><strong>Inside Borders</strong> - Border only on internal grid lines</li>
                    <li><strong>Top/Bottom/Left/Right</strong> - Single edge borders</li>
                    <li><strong>No Borders</strong> - Remove all borders</li>
                </ul>

                <h3>Border Styles</h3>
                <ul>
                    <li><strong>Thin</strong> - 1px line width</li>
                    <li><strong>Medium</strong> - 2px line width</li>
                    <li><strong>Thick</strong> - 3px line width</li>
                </ul>

                <h3>Applying Borders</h3>
                <ol>
                    <li>Select a cell or range of cells</li>
                    <li>Right-click to open the context menu</li>
                    <li>Navigate to <strong>Table → Cell Borders</strong></li>
                    <li>Choose border position, then optionally select style or color</li>
                </ol>

                <div class="tip-box">
                    <h5>💡 Tip</h5>
                    <p>
                        Custom borders are drawn on top of the default table grid, allowing you
                        to create visual emphasis on specific cells or sections.
                    </p>
                </div>
            </section>

            {/* API Reference */}
            <section class="doc-section">
                <h2>API Reference</h2>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Method</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code class="code-inline">createTable(x, y, w, h, rows?, cols?, options?)</code></td>
                            <td>Create a new table element</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">setTableCell(id, row, col, value)</code></td>
                            <td>Set a cell's value</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">getTableCell(id, row, col)</code></td>
                            <td>Get a cell's value</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">getTableData(id)</code></td>
                            <td>Get all table data as 2D array</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">setTableData(id, data)</code></td>
                            <td>Set all table data at once</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">insertTableRow(id, index)</code></td>
                            <td>Insert a row at index</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">deleteTableRow(id, index)</code></td>
                            <td>Delete a row at index</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">insertTableColumn(id, index)</code></td>
                            <td>Insert a column at index</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">deleteTableColumn(id, index)</code></td>
                            <td>Delete a column at index</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">sortTableColumn(id, colIndex, direction)</code></td>
                            <td>Sort by column ('asc' or 'desc')</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">setTableColumnAlignment(id, col, align)</code></td>
                            <td>Set column alignment ('left', 'center', 'right')</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">setTableColumnWidth(id, col, width)</code></td>
                            <td>Set column width (0-1 fraction)</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">setTableStyle(id, options)</code></td>
                            <td>Set table colors and styling</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">copyTableToClipboard(id)</code></td>
                            <td>Copy table data to clipboard as TSV</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">pasteIntoTable(id)</code></td>
                            <td>Paste clipboard data into table</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">exportTableAsCSV(id)</code></td>
                            <td>Export table data as CSV string</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">importTableFromCSV(id, csv)</code></td>
                            <td>Import CSV/TSV string into table</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">mergeCells(id, startRow, startCol, endRow, endCol)</code></td>
                            <td>Merge a range of cells</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">unmergeCells(id, row, col)</code></td>
                            <td>Unmerge cells at position</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">getMergedCells(id)</code></td>
                            <td>Get all merged cell regions</td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* Keyboard Shortcuts */}
            <section class="doc-section">
                <h2>Keyboard Shortcuts</h2>

                <div class="shortcut-list">
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Double-click</span>
                        </div>
                        <span class="shortcut-desc">Edit cell content</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Enter</span>
                        </div>
                        <span class="shortcut-desc">Confirm edit and move down / Start editing cell</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Shift</span>+<span class="kbd">Enter</span>
                        </div>
                        <span class="shortcut-desc">Insert newline within cell</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Tab</span> / <span class="kbd">Shift</span>+<span class="kbd">Tab</span>
                        </div>
                        <span class="shortcut-desc">Move to next/previous cell (wraps at row boundary)</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Arrow Keys</span>
                        </div>
                        <span class="shortcut-desc">Navigate between cells (when not editing)</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">F2</span>
                        </div>
                        <span class="shortcut-desc">Start editing selected cell</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Delete</span> / <span class="kbd">Backspace</span>
                        </div>
                        <span class="shortcut-desc">Clear selected cell(s) content</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Escape</span>
                        </div>
                        <span class="shortcut-desc">Cancel cell edit</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Type any character</span>
                        </div>
                        <span class="shortcut-desc">Start editing cell with that character</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Ctrl</span>+<span class="kbd">V</span>
                        </div>
                        <span class="shortcut-desc">Paste data from clipboard</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Double-click</span>
                            <span style={{ color: '#64748b', margin: '0 0.25rem' }}>column edge</span>
                        </div>
                        <span class="shortcut-desc">Auto-fit column width</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Shift</span>+<span class="kbd">Click</span>
                        </div>
                        <span class="shortcut-desc">Select cell range for merging</span>
                    </div>
                    <div class="shortcut-item">
                        <div class="shortcut-keys">
                            <span class="kbd">Ctrl</span>+<span class="kbd">Click</span>
                        </div>
                        <span class="shortcut-desc">Start cell selection for merging</span>
                    </div>
                </div>
            </section>

            {/* Table Animations */}
            <section class="doc-section">
                <h2>Table Animations</h2>
                <p>
                    Tables have 12 dedicated animation presets that leverage their internal structure.
                    These are available in the Animation Panel when a table is selected.
                </p>

                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Animation</th>
                            <th>Effect</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><code class="code-inline">tableRowReveal</code></td>
                            <td>Rows appear top-to-bottom</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableColReveal</code></td>
                            <td>Columns appear left-to-right</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableCellFill</code></td>
                            <td>Cells fill one at a time</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableHeatmapFadeIn</code></td>
                            <td>Cells fade in with random stagger</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableRowHighlight</code></td>
                            <td>Highlight sweeps through rows</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableColPulse</code></td>
                            <td>Highlight pulses through columns</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableGridDraw</code></td>
                            <td>Border, grid, then content draws in</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableHeaderSlam</code></td>
                            <td>Header bounces in, body fades</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableCountUp</code></td>
                            <td>Numeric cells count from 0</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableAccordion</code></td>
                            <td>Rows expand one at a time</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableCellsAssemble</code></td>
                            <td>Cells fly in and assemble into the table</td>
                        </tr>
                        <tr>
                            <td><code class="code-inline">tableLightningSplit</code></td>
                            <td>Lightning splits table, halves slam together</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </div>
    );
};

export default TableDoc;
