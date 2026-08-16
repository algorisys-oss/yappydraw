/**
 * "What's new" changelog shown when the user clicks the version number.
 *
 * Hand-maintained so the copy stays user-facing (what it does FOR them), not
 * commit-speak. Newest first. When you ship a release, add an entry here with the
 * headline change(s) — see CLAUDE.md "ship it".
 */

export interface WhatsNewEntry {
    version: string;
    date: string;      // YYYY-MM-DD
    items: string[];   // benefit-first, end-user language
}

export const WHATS_NEW: WhatsNewEntry[] = [
    { version: '0.8.201', date: '2026-08-16', items: [
        'Animation: you can now copy, cut, paste and duplicate whole blocks of frames, across layers. Drag across the timeline to select a block (hold Shift to start the block on a drawing), then Ctrl+Alt+C and Ctrl+Alt+V. Ctrl+C and Ctrl+V still copy drawings, as before. A pasted frame gets its own copy of the drawing, so working on it never changes the frame you copied it from.',
        'New timing tools on the right-click menu: set how long a drawing is held, split a stretch of the timeline onto twos (or threes, or every frame), and drop an in-between into the middle of a hold. There is also a "/cel" box in the timeline header — set it to 2 and every new drawing you make is held for two frames, so a sequence stays on twos without you doing anything.',
        'The timeline zooms. Use the buttons in the header, or hold Ctrl and roll the mouse wheel over it. There is a Fit button for seeing the whole thing at once, and a button that switches the ruler from frame numbers to seconds, which is what you want when timing to dialogue.',
        'You can flip drawing to drawing with Alt+, and Alt+. — the way you flip paper — instead of stepping one frame at a time. Double-click the ruler to drop a named marker on a key pose, and jump between markers with Alt+Shift+, and Alt+Shift+. Markers stay where you put them even if you retime the drawings underneath.',
        'Right-click the ruler to mark in and out, and everything outside that range greys out. Playback, looping and video/GIF export then cover just that stretch, so you can work on one piece of a long shot.',
        'Out of pegs: you can now slide, turn or resize an onion-skin ghost without moving the drawing itself — the digital version of sliding the paper under your hand to draw over it. Right-click a frame, choose Edit Out of Pegs, then drag on the canvas (Alt to rotate, Shift to resize) and press Esc when you are done. Your artwork is never touched, and playback and export never see it.',
        'Fixed: typing a new length into the timeline\'s frames box changed the length but left the ruler drawn at its old size, so clicking past the old end did nothing.',
        'Fixed: Clear Play Range did not clear the play range.',
    ] },
    { version: '0.8.200', date: '2026-08-16', items: [
        'Shift+S now turns stroke stabilization on and off, which is what the keyboard shortcuts list has always said it does. It was not working: pressing Shift+S quietly changed your stroke style instead. Stabilization itself was fine all along — the shortcut simply never reached it, so the only way to turn it on was through Settings.',
        'Stabilization is the "lazy brush": the line trails slightly behind your cursor, which smooths out the shake and makes long curves and freehand lettering much easier with a mouse.',
    ] },
    { version: '0.8.199', date: '2026-08-15', items: [
        'Strokes can now change thickness along their length. Select a line or a drawn path and pick a shape from the new Width Profile row in the Properties panel: even, fat in the middle and pointed at both ends, pinched in the middle, tapering from thick to thin (or thin to thick), holding full weight then tapering away, or nearly even with rounded ends. Each choice is drawn as a little swatch, so you can see what you are picking.',
        'Choosing a profile shapes the stroke without making it heavier — the thickest part is the stroke width you already set. Select several strokes of different weights and each one keeps its own weight while taking the same shape.',
        'You can still fine-tune by hand with the Width tool, and the row will then say Custom rather than claiming one of the presets. One click undoes a profile.',
        'One thing to know: a profile is fitted to the stroke width at the moment you pick it, so if you change the stroke width afterwards, click the profile again to re-fit it.',
    ] },
    { version: '0.8.198', date: '2026-08-15', items: [
        'The grid can now be diagonal or isometric, as well as square. Diagonal is a 45° cross-hatch; isometric is 30° lines both ways plus uprights, which is the one you want for boxes, three-quarter views and building a character on. Pick it in Settings → Canvas → Grid Style, or search "Grid Style" in the command palette.',
        'Snapping follows whichever grid you chose. On a slanted grid your points land on the crossings of the slanted lines, rather than on the square positions underneath — a slanted grid that still snapped to squares would put everything between its own lines.',
        'Zoom a long way out and a slanted grid draws fewer lines so it stays readable instead of turning into a grey haze. That only affects what you see: things still snap to the full grid, so anything you place while zoomed out is exactly on the grid when you zoom back in.',
    ] },
    { version: '0.8.197', date: '2026-08-15', items: [
        'Combining shapes no longer destroys them. When you Subtract one shape from another, the result is now a shape that remembers what it was made from — so you can change your mind and switch it to Intersect, release it back into the two original shapes, or flatten it to a plain shape, all without undoing your way back. Before this it merged everything and threw the originals away, so getting the cutting shape back meant taking the result apart.',
        'If you preferred the old behaviour, the ❖ button on the Unite / Subtract strip turns it off, and Yappy now remembers that choice between sessions. Fully flattening is also always available on right-click → Pathfinder.',
        'You can move objects between layers: select them, right-click, and choose Move to Layer. A tick shows which layer they are on now. Locked layers and group headings are not offered.',
        'Also documented, because both already worked and neither was written down anywhere: you can reorder layers by dragging a row in the Layers panel, or with Alt+[ and Alt+] to move the layer you are on.',
    ] },
    { version: '0.8.196', date: '2026-08-15', items: [
        'Fixed: pressing Undo while drawing with the Pen tool stopped the Pen working. Clicks did nothing at all afterwards, and the only way out was to press Escape and start again. The Pen was still trying to add points to the path Undo had just removed. It now notices the path is gone and your next click simply starts a new one.',
        'Fixed: cutting a line with the Knife turned it into a filled shape instead of leaving it as a line. Lines and open paths are now cut into shorter lines, and filled shapes still cut into filled pieces as before. If one knife drag crosses the same line in several places, it is cut at each of them, and the whole cut undoes in one step.',
        'Fixed: the Knife did nothing at all to a plain straight line, and the Scissors refused to cut one, saying it could not split that shape. Both work now.',
    ] },
    { version: '0.8.195', date: '2026-08-15', items: [
        'There is now a Mandala generator: it builds a whole mandala for you instead of you drawing every ring. Find it under Vector Tools → Insert → Mandala, on the right-click menu under Insert, or by searching "Mandala" in the command palette. Pick one of the five ready-made designs, drag the Size slider, and press Apply. You see an outline of it on the canvas the whole time you are adjusting, and Cancel leaves nothing behind.',
        'If you want to go further, Edit bands opens the design up ring by ring. Each ring repeats one shape — petal, lotus, teardrop, diamond, dot, arc, scallop, spike, or a plain circle divider — and you choose how many, how far out, how fat, and how far rotated against its neighbours. Add and remove rings freely.',
        'What you get is ordinary shapes, grouped: no fill and a black outline, so it is ready to print and colour, and every piece is still editable and recolourable like anything else you draw. Tick "Arm symmetry after" and Yappy lines the Kaleidoscope symmetry up with your new mandala, so you can keep drawing on it by hand straight away.',
        'Fixed something that would have bitten hard: adding many shapes at once used to fill up the undo history one shape at a time. A large mandala is over a hundred shapes, which was more than the history holds — so it could not be undone at all, and everything you had done before it was lost from the history too. Any generated mandala now undoes in a single press, with your earlier work intact.',
        'Fixed: generated mandalas appeared off-centre, with one edge tucked under the properties panel. They now land in the middle of the drawing area.',
    ] },
    { version: '0.8.194', date: '2026-08-15', items: [
        'The little Unite / Subtract / Intersect / Exclude toolbar no longer pops up on its own. Selecting two things is something you do constantly — to move them, line them up, group them, change their colour, or because you dragged a box round one more than you meant — and a panel of shape-cutting buttons was appearing over your drawing every single time. It now stays out of the way until you ask for it.',
        'When you do want it, click the new Pathfinder button in the top bar, next to Shape Builder. It then behaves exactly as before, appearing whenever two or more shapes are selected, and it stays on until you switch it off again — so if you are doing a stretch of shape-combining work you turn it on once and forget about it. It is also under View, on the right-click menu, and in Settings.',
        'Nothing got harder to reach. Ctrl+Alt+U, D, I and X still combine, cut, keep-the-overlap and drop-the-overlap whether or not the toolbar is showing, and right-click → Pathfinder still has all nine operations including Divide, Trim, Merge, Crop and Outline.',
        'If you liked the old behaviour, one click on that button brings it back permanently — Yappy remembers the choice.',
    ] },
    { version: '0.8.193', date: '2026-08-15', items: [
        'You can draw mandalas properly now. There is a new Kaleidoscope setting next to the existing Symmetry options. The old Radial setting spins whatever you draw around the centre, which gives you a pinwheel — every petal leans the same way. Kaleidoscope also flips it as it goes round, so both sides of each petal match, which is what makes a mandala look like a mandala. Draw half a petal and the whole page fills in around it while you draw.',
        'Mandalas can have up to 36 spokes, up from 24. Colouring-book designs often want 32 or 36, and those simply were not reachable before.',
        'New Ring guides: faint circles spaced evenly out from the centre, so you can keep each band of your mandala the same width instead of eyeballing it and watching the rings drift. Find them under Rings in the Canvas panel. They are only guides — they never print or export, and they stay on screen if you switch symmetry off to finish the fine detail by hand.',
        'The guide lines got easier to draw over. At high spoke counts they used to pile up into a solid purple star that hid your work, especially right in the middle where the detail is finest. They now fade as they get denser and leave the centre clear.',
        'Searching Help for "mandala", "kaleidoscope" or "colouring page" now finds the right page. It used to find nothing.',
    ] },
    { version: '0.8.192', date: '2026-08-14', items: [
        'Fixed: when a help page failed to open and asked you to reload, the Reload button did nothing — you had to leave the Help section entirely and come back. That was not a coincidence. Yappy keeps a copy of itself on your device so it works offline, and that copy is only swapped for a newer one once the app is fully closed. A refresh does not close it, so you were handed the same broken copy again. Leaving and returning did close it, which is why only that worked. The button now clears the old copy first, so it does what it says.',
        'Fixed: one help page failing used to replace the whole Help section, sidebar and all, with an error screen. Now only that one page shows the message and the list of topics keeps working, so you can just click something else.',
        'The Pen tool can be paused and picked up again. Press Esc or switch tools and your unfinished path simply stays on the canvas. When you come back to it, choose the Pen and hover over either end of the path — a blue ring appears on the point you would carry on from. Click it and you are drawing again from there. Click the far end instead and the shape closes.',
        'Fixed: the colour picker\'s pipette gave the wrong colour on gradients. Wherever you clicked, it handed back the colour at the very start of the gradient — so on a gradient between two shades of the same colour it looked like the picker was grabbing a slightly different, duller shade. It now gives you the colour at the exact spot you clicked. Flat colours are unchanged and still come back exactly.',
        'Fixed: after using the pipette, the row of recently-used colours in the picker showed the colour you had *before* the pick, not the one you just picked.',
    ] },
    { version: '0.8.191', date: '2026-08-13', items: [
        'The eyedropper now picks the exact colour of the shape you click. Before, it came back slightly different every time — a pure red would arrive a little duller. It was measuring the pixel on your screen, and on a modern wide-colour display the screen stores that red in a different way than a drawing does, so the number it read back was never quite the number it started from. It now reads the colour straight from the shape itself, so what you pick is exactly what you clicked.',
        'Hold Alt while you click to pick a shape\'s outline colour instead of its fill. Clicking a photo or a patterned fill picks the exact pixel you clicked, and clicking a gradient gives you its first colour.',
        'If you need a colour from outside the app — another window, a reference photo — there is a second button next to the pipette for that. It still works the old way, so it can be slightly off on a wide-colour screen; use the pipette for anything already on your canvas.',
        'A stroke drawn with Fill mode can now be recoloured after you draw it. Select it and use the new Background colour for the filled body, or Stroke for the outline drawn on top — they are separate. Before this there was no control for the fill at all, so it was stuck on whatever colour you drew it in, and changing the Stroke only recoloured the thin edge.',
    ] },
    { version: '0.8.190', date: '2026-08-13', items: [
        'You can now choose where a stroke sits: inside the shape, centred on its edge, or outside it. Until now it was always centred, so half of a thick border sat inside the shape and ate into it. Pick Inside and the shape never grows past the box you drew, or Outside and the border never covers the fill. It is in the Properties panel under Stroke, and it works on shapes and on closed Pen paths.',
        'Corner style — Sharp, Round or Bevel — now works on Pen paths, lines and freehand strokes. It was only offered on closed shapes before, so a hand-drawn route or map line could not use it.',
        'Lines drawn with the Pen tool can now have a flat, round or square end. Round and square ends stick out slightly past your last point; pick Butt (Flat) when a line has to stop exactly on a spot.',
        'Guides can be handled several at a time. Click one to select it, hold Shift to add more, or press Ctrl+Shift+A for all of them. Then drag them together, nudge them with the arrow keys, or delete the whole set at once. Press Esc or click the canvas to let them go.',
        'There is also a Lock Guides command, so once a layout is set you cannot knock a guide out of place by accident.',
        'Fixed: dragging one guide used to move every other guide with it, and deleting one deleted them all. Behind the scenes they had all been given the same name, so the app could not tell them apart.',
        'Fixed: a shape with the new Outside border lost the text inside it.',
        'Fixed: exporting a shape with an Outside border cut off the outer edge of the border.',
    ] },
    { version: '0.8.189', date: '2026-08-12', items: [
        'In an animation, you can now edit a shape anywhere in the middle of a tween. Before, the shape showed its blue selection outline but the resize handles did nothing, clicking the shape itself deselected it, and dragging it made it drift slowly behind your cursor instead of following it. The handles were being drawn where the shape appears but were still being looked for back at its keyframe position, so you were reaching for something that was not there.',
        'When you do edit mid-tween, a keyframe is created for you at that exact point, holding exactly the pose you were looking at. Nothing jumps, and the keyframes at either end of the tween are left alone. Just clicking to select never adds a keyframe.',
        'Hold Alt and Shift while dragging a resize handle to grow or shrink a shape from its centre, keeping its proportions, so it expands evenly on all sides instead of one corner staying put.',
        'While you drag a resize handle, the width and height now show under the shape as you go. Judging a size by eye and then checking the panel afterwards was the only way before.',
        'The side panels and the animation timeline have always been resizable by dragging their edge, but the edge was invisible, so almost nobody found it. There is now a small grip on it.',
        'In the Keyframes panel, the leftmost column of buttons could be seen but not clicked — the tool bar was sitting on top of them.',
    ] },
    { version: '0.8.188', date: '2026-08-11', items: [
        'Zooming and panning work again after you load a presentation or a design template. Every way of doing it was affected — Ctrl and +/−, Ctrl with the mouse wheel, the zoom buttons in the bottom bar, the Pan tool and holding Space and dragging — because the view was being set and then instantly snapped back to fit the slide. Ordinary whiteboard and diagram documents were never affected.',
    ] },
    { version: '0.8.187', date: '2026-08-10', items: [
        'In the Shape Builder, hold Shift and drag a box over several pieces to take them all at once — much quicker than tracing a line through each one. Hold Shift and Alt together to delete them instead. The box works even when it is smaller than the piece you are pointing at, so you can grab a small detail sitting inside a big background shape.',
    ] },
    { version: '0.8.186', date: '2026-08-10', items: [
        'The Perspective Grid now actually helps you draw. Until now it drew a horizon and two fans of lines and nothing paid any attention to them — you still had to line everything up by eye. Turn it on and your lines pull onto the perspective rays as you draw them. Hold Alt at any point to draw free-hand without switching anything off.',
        'How strongly it pulls is up to you. At full strength a wall edge lands exactly on the ray, which is what you want for buildings and interiors; turn it down and it becomes a gentle nudge you can draw straight through, which is what you want for curves and organic shapes. There is also a setting for how close you have to be before it takes hold.',
        'One-, two- and three-point perspective, with vanishing points you can drag, and it all remembers itself. Setting your grid up again every time you opened the app was the reason nobody used the old one.',
        'You can draw straight onto a wall or the floor. Pick which plane in the grid bar and a rectangle drag lands on that surface already foreshortened — windows on a building, tiles on a floor, posters on a wall.',
        'Any shape can have rounded corners now, not just rectangles. Pen paths, polygons, stars, traced artwork — select it and use the new Corners control in Vector Tools. Nothing is destroyed: the corner points stay exactly where they were, so you can move them afterwards and the rounding follows, and setting the radius back to zero gives you your sharp corner back. Round every corner, or select just the ones you want with the Nodes tool.',
        'The Shape Builder now shows you what it is about to do. A + or − sits next to the cursor and changes the instant you press or release Alt — before you start dragging, rather than after, which is when you needed to know.',
    ] },
    { version: '0.8.185', date: '2026-08-09', items: [
        'Flipping a shape now takes its anchor points with it. Flip a pen path horizontally and the outline mirrored, but the little square handles stayed where they were — so the points you could see and grab were no longer on the curve. Drawings already flipped the old way put themselves right the next time you flip them.',
        'Hold Shift while drawing with the Pen and your line snaps to clean angles — dead horizontal, vertical, or 45° — instead of relying on a steady hand. It is the same snap the Line and Arrow tools use, and the preview shows exactly where the point will land before you click.',
        'Moving an anchor point on a shape you have rotated no longer drags the rest of the shape along with it. The further round you had turned the shape, the worse it was; now the point you grabbed is the only thing that moves.',
        'Text has a Line Spacing control, next to Letter Spacing. Set it once and it follows everywhere — wrapping, the box growing to fit, editing on canvas, and every export.',
        'You can give different words in the same text box different sizes. Select the word, pick a size from the new size button in the text toolbar, and one word of a headline can be twice the height of the rest without splitting it into separate text objects.',
        'Rectangles can round each corner on its own. One corner soft and three sharp, or a rounded diagonal pair — the shapes packaging, cards and logos actually need. Corners you do not touch keep following the main Roundness slider.',
        'Groups can be renamed. Double-click a group in the Layers panel and call it "Front panel" instead of "Group (4)". The name stays with the artwork when you save, undo, duplicate or copy it into another drawing.',
        'Cutting a rounded rectangle with the Knife or Scissors keeps its rounded corners instead of squaring them off. The same is true anywhere a shape becomes an editable path.',
        'The Eyedropper has a shortcut: Shift+I. Handy when you are matching one colour across a lot of elements.',
        'The Bend slider for Arc, Wave and the other warp presets was already there, in the Properties panel — it was just impossible to find, and dragging it could not be undone. Both fixed: applying a warp now tells you where the control is, and one drag is one undo.',
    ] },
    { version: '0.8.183', date: '2026-08-07', items: [
        'The Layers panel now shows what is actually on each layer. Click the box icon on a layer row to list its objects, newest on top, with groups you can open up. It is the missing half of the panel: until now it managed layers but never the things inside them, so the only way to reach one object in a busy drawing was to hunt for it on the canvas.',
        'Each object in the list can be selected, hidden, locked, renamed, and dragged up or down to change what sits in front of what. You can pick out a single object inside a group from the list without opening the group first.',
        'Hiding an object hides it properly: it is not drawn, cannot be clicked or caught by a selection box, does not show in the minimap, and is left out of every export — PNG, SVG, PDF, PowerPoint and the HTML player. It is not deleted; it is saved with your drawing and comes back whenever you want it.',
        'Objects name themselves sensibly. A text box is listed by its words, everything else by what it is, so you only need to rename the ones you care about.',
    ] },
    { version: '0.8.182', date: '2026-08-07', items: [
        'If Yappy ever tells you your saved drawings are missing, it now tells you the truth about why. A browser that will not open local storage for the page — most often because another Yappy tab has it open — used to produce an empty "My Drawings" that looked exactly like everything had been deleted. It now says your drawings cannot be read right now, that nothing has been deleted, and to close other tabs and reload. Your work was always still on disk.',
        'A save that does not reach the disk is no longer reported as a success — and, importantly, no longer throws away the crash-recovery copy of your drawing on the way. If saving fails you will see a clear message telling you to export your work to a file.',
        'Dragging a selection box over part of a group now selects the whole group, the way clicking it already did (and the way Illustrator and Figma work). To pick out one object inside a group, double-click into the group first.',
        'A reminder worth repeating: "My Drawings" lives in your browser, and browsers can clear that storage on their own. Anything you would hate to lose is worth exporting to a file.',
    ] },
    { version: '0.8.181', date: '2026-08-07', items: [
        'The "Something went wrong" screen should stop appearing. It was never a fault in your drawing or in the app — the web host was not telling browsers to check for a new version, so a returning visitor could load yesterday\'s page pointing at files that had since been replaced. Reloading fixed it, which is why it looked random. If it ever does happen again, Yappy now quietly reloads itself into the current version instead of showing you the screen.',
        'Yappy loads lighter. It was quietly downloading its whole self in the background — including the HTML-player exporter, the PDF and PowerPoint writers and the maths typesetter, whether or not you ever used them — and doing it again after every update. That background download is now less than half the size, and the optional parts are fetched the first time you actually use one.',
        'Note for offline use: the first time you export to HTML, PDF or PowerPoint, open the Help pages, or render a LaTeX equation, Yappy now needs the internet for a moment. After that they work offline as before.',
    ] },
    { version: '0.8.180', date: '2026-08-07', items: [
        'You can work inside a group. Double-click a grouped object to step into the group — from then on clicks select individual members, so you can move, restyle, restack and align one object without pulling the whole group around. Press Esc (or click outside) to step back out. Double-click again to go deeper into a nested group.',
        'Aligning two groups no longer destroys them. Align Left used to move every member of every group onto the same edge, collapsing the artwork. A group now lines up as one object and keeps its internal arrangement. If you select only part of a group — a marquee, or shift-click — those objects still align individually, because that is plainly what you meant.',
        'Bring Forward and Send Backward have shortcuts: Ctrl+] and Ctrl+[, matching Illustrator and Figma. Bring to Front and Send to Back move to Ctrl+Shift+] and Ctrl+Shift+[. Stepping now moves a whole selection together in one undo, keeps the objects in their relative order, and clears a whole group in one press instead of nudging past one member at a time.',
        'Rasterize turns vector artwork into an image. Right-click → Rasterize, at 1×, 2× or 4× — the picture takes the artwork\'s exact place in the stack, so nothing jumps in front of or behind its neighbours. Only what you selected is drawn, so an overlapping neighbour is never baked in. "Rasterize a Copy" keeps the vectors in case you need them back.',
        'Align to key object is findable at last. The object everything lines up to is now drawn with a thicker outline — and with the mode on, you pick it by clicking any object already in the selection. The toggle also sits in the Align panel, not just in Properties.',
    ] },
    { version: '0.8.178', date: '2026-08-06', items: [
        'Pan, Commands & Tools, the Vector Tools palette and Shape Builder have moved to the top bar, next to Settings. They were sitting in the left column among the pens and shapes, which is meant to be the things you draw with. Pan lights up while it is active; click it again to go back to Select. On a narrow screen all four are in the menu.',
        'On an iPad the top bar now shows all its buttons. In portrait it was collapsing to the phone layout — just the menu button — while the tool column stayed full size, so half the app was in one layout and half in the other.',
        'The size badge on a selection is now off by default, and it lands where it should. Every selected object used to carry a "150 × 120" label that sat on top of the artwork with no way to switch it off — and it was drawn offset from the object it described. Turn it on when you want it with the new Proportions button in the top bar, next to Settings; the choice is remembered.',
        'Yappy now opens with the Select tool, and new sketches start there too. It used to open with the Ink Brush, so the first click on a drawing you had just reopened left a stray stroke on it. If you would rather start with a pen, Settings → Pen & Input → Default Tool still remembers your choice.',
        'Select everything and change the font in one go. Press Ctrl+A, pick a Font in the Properties panel, and every label and text box takes it — the drawings, images and other objects in the selection are simply skipped. The text controls used to vanish entirely as soon as the selection contained anything that was not text, which made this impossible.',
        'The Bold and Italic tick boxes now show whether your text is actually bold or italic. They were ticked on ordinary text, so the first click seemed to do nothing — it was switching them off.',
    ] },
    { version: '0.8.177', date: '2026-08-06', items: [
        'Double-clicking a shape to edit its label no longer moves the text. The editing box used to open offset from the shape — up and to the left, outside the box you clicked — so you were typing in one place and watching the result appear in another. It now sits exactly over the label, at any zoom level.',
        'Text keeps its line breaks and its alignment while you edit it. Labels in circles, diamonds and banners used to re-flow onto fewer lines the moment you started typing and then jump back on commit, and a label aligned to the top or bottom of its shape would leap to the middle. What you edit is now what you get.',
    ] },
    { version: '0.8.176', date: '2026-08-05', items: [
        'Converting italic text to shapes now keeps the italic. It used to come out upright, which quietly undid the styling. Where the font has a real italic — Inter, Poppins, Merriweather, Source Code Pro, JetBrains Mono — the shapes come from it, so you get the true italic letterforms rather than an upright one leaned over. Fonts with no italic of their own (Virgil, Marker, Caveat) are leaned by exactly the amount the screen was already showing, so the shapes match the text they replaced.',
        'Pieces cut with the Knife are curves again, not dozens of straight-line points. Slicing a circle in half used to give you a half-disc made of about twenty corner points along the arc — it looked right, but you could not edit it as the curve it plainly was. Now each half comes back as five points: two at the ends of the straight cut, three along the arc. Corners stay sharp, so a cut rectangle keeps its square corners and flat sides, and the cut edge itself stays a straight line.',
        'The app no longer downloads several megabytes of font data up front for the text-to-shapes feature. Those files are now fetched only if you actually convert some text.',
    ] },
    { version: '0.8.175', date: '2026-08-05', items: [
        'Fonts are now picked the way they are in Illustrator: one list of font families, and a second list underneath for the style — Light, Regular, SemiBold, Bold Italic and so on. Adding a family used to put every one of its files in the list as if they were unrelated fonts, so "Montserrat" appeared four times. Weights other than plain Regular and Bold now work at all, so Light and Black are finally reachable.',
        'Changing family keeps the style you were using. Going from Montserrat SemiBold to a family whose heaviest weight is Bold lands you on Bold, rather than dropping you back to Regular.',
        'Hold Alt while dragging a curve handle to break it away from its partner. A smooth point keeps its two handles in line with each other, which is what you want most of the time — but not for a teardrop, a petal tip, or the sharp join in a script letter. Now one side can curve while the other runs straight in. It works while you are drawing with the Pen and while you are editing a finished shape, and the break stays put after you let Alt go.',
        'The Scissors now cuts where you click, including halfway along a curve. It used to jump to the nearest corner point, so a circle drawn the usual way could only be cut in four places — clicking a quarter of the way round moved the cut about 76 pixels from where you aimed. The two halves still trace exactly the same curve, so nothing shifts when you cut.',
        'The Knife follows the shape properly. Cutting a shape with a hole in it — a ring, a letter O, text you have converted to outlines — used to fill the hole in or come apart completely. Curved edges also came back visibly faceted; they are now accurate to a fraction of a pixel at any size.',
        'Locked objects can be unlocked again. Once you locked something you could no longer click it, which meant you could no longer reach the Unlock command either. Right-click the object and choose Unlock, or press Ctrl+Alt+2 for Unlock All — the menu tells you how many are locked. Unlocking selects what it freed so you can get straight on with it.',
        'Convert text to shapes (Ctrl+Shift+O) now uses the font you actually chose. If you had added your own font, it quietly converted the text in a default sans-serif instead — the right letters in the wrong typeface, which is worse than failing, because it looks like it worked. Fonts you add from a .ttf or .otf file now convert properly. Fonts added by name from Google Fonts cannot be converted at all and now say so, and leave your text alone; download the family and add the file to use it.',
        'Bold now works on connector labels and BPMN shapes, where it had quietly never done anything. Light and SemiBold text also exports to SVG at the right weight instead of coming out Regular.',
    ] },
    { version: '0.8.174', date: '2026-08-03', items: [
        'Bulleted and numbered lists now keep their bullets when you export to SVG. The words were coming out indented with nothing in front of them, so a list read like oddly-spaced prose. PNG, JPG and PDF were always fine.',
    ] },
    { version: '0.8.173', date: '2026-08-03', items: [
        'Help caught up with the last two updates. The shortcuts list now shows all the point-editing gestures, the onion-skinning page says that ghost frames cannot be selected, and the Vector Paths page documents how to drive point editing from a script — which was possible all along but written down nowhere.',
    ] },
    { version: '0.8.172', date: '2026-08-03', items: [
        'While you are editing the points on a shape, you can now just click another shape to start editing that one. Before, clicking it did nothing — you had to turn the point editor off, pick the other shape, and turn it back on. Shift-click to work on two shapes at once.',
        'Clicking an empty part of the canvas now lets go in two steps: the first click unselects the points you had picked, and a second one lets go of the shape. Missing a point by a few pixels no longer loses your place.',
        'If nothing is selected yet, dragging a box in the point editor picks shapes, so you can get started without switching tools.',
    ] },
    { version: '0.8.171', date: '2026-08-03', items: [
        'Editing the points on a path now works where you click. The little square handles were being drawn about 46 pixels to the left and 52 above the shape they belonged to, and — because the same wrong position was used to decide what you had clicked — you had to click to the right of a handle to actually grab it. They sit on the shape now.',
        'While you are editing points, the shape no longer shows its resize and rotate handles on top of them. Those were drawn in the same places as the corner points, could not be clicked, and made it very hard to tell which square was which.',
        'Press N to switch to point editing (Illustrator calls this Direct Selection, Inkscape calls it the Node tool). It is also in the command palette under either name. Select a shape and press Convert to Path first if it is not a path yet — the bar now tells you so instead of showing a tip you cannot act on.',
        'Adding a keyframe with F6 now hands you the copy it just made, with the Select tool ready, so you can drag it straight away. Before, you were left holding whatever brush you had and nothing was selected. F7 (a blank keyframe) still leaves your drawing tool alone, since you are about to draw.',
        'On an iPad or tablet, touch and hold a frame in the timeline to get the menu a right-click gives on a computer — insert a keyframe, add a tween, label a frame, clear or remove it. Without a keyboard there was previously no way to do any of that.',
        'Dragging a selection box in an animation no longer picks up the faded ghosts of neighbouring frames when onion skinning is on. It also stops selecting locked shapes and shapes on hidden layers.',
        'The animation timeline no longer runs underneath the tool column, so the layer names and the start of the frame ruler are readable again. Its buttons — the + that adds a layer, and the eye, lock and delete icons on each row — are easier to see in both light and dark mode.',
        'The documentation can be opened in a new tab, so looking something up no longer replaces the drawing you had open. Searching the help for "ruler" now finds the rulers and guides page, which has been written properly.',
    ] },
    { version: '0.8.170', date: '2026-08-02', items: [
        'Bulleted and numbered lists now look the same on the canvas as they did while you were typing them. Indented sub-points used to disappear altogether when you clicked away, the point after an indented block would get stuck onto the end of the one above it, and a long point that ran onto a second line picked up a second bullet. Pasting an outline from another app brings its sub-levels across correctly now, each indented one step with its own marker.',
        'Editing the same list twice no longer adds a blank line each time you go back into it.',
        'The alignment buttons in the Properties panel now show the right pictures. The behaviour was always correct — the top row aligns left, centre and right; the bottom row aligns top, middle and bottom — but the icons were drawn for the opposite axis, so the buttons looked like they did the other thing.',
        'Note: there is no keyboard shortcut for indenting inside the text editor — Tab finishes editing — so sub-levels come from pasted content. Exported SVG and PNG still keep the indentation but leave the bullet symbols out.',
    ] },
    { version: '0.8.169', date: '2026-08-01', items: [
        'The middle of the top bar now shows options for whatever tool you have picked, instead of being empty for most of them. Pick a shape and you get stroke and fill colour, line style, opacity, corner roundness and the font for text you type inside it. Pick a line or arrow and you get its width, whether it runs straight, curved or in right angles, and the arrowhead on each end. Pick the text tool and you get font, size, bold, italic and alignment. The brushes gained colour and width next to the Fill and Symmetry buttons they already had.',
        'What you set there applies to the next thing you draw — it is the tool\'s own setting, not a change to anything already on the canvas. Each tool remembers its own, so a red brush and a black rectangle stay that way as you switch between them. To restyle something already drawn, select it and use the floating toolbar or the Properties panel.',
        'Tools that would ignore a setting do not show it: the Bezier, Elbow, Polyline and Organic Branch tools have no line-type picker, because those tools are a line type.',
    ] },
    { version: '0.8.168', date: '2026-07-31', items: [
        'Select All (Ctrl+A) now hands you the Selection tool. If you were drawing with a brush, selecting everything used to draw a box around your work that you could not do anything with — clicking a shape did not pick it up, dragging just painted another stroke, and none of the handles responded. Worse, the selection stayed on screen while you carried on drawing and quietly went out of date, because the strokes you drew afterwards were never added to it. Press your tool\'s shortcut (7 for the freehand brush) to go back to drawing.',
        'The lasso keeps its tool, since it already selects, and Select All on an empty canvas leaves your brush alone.',
    ] },
    { version: '0.8.167', date: '2026-07-31', items: [
        'Boxes are now sized correctly the very first time you open Yappy and build a diagram. The handwriting fonts had not always finished arriving at the moment Yappy measured your text to decide how big each box should be, so it measured against a stand-in font and came out a few percent off. That size is saved with the drawing, so it stayed wrong — opening the same diagram again later gave you slightly different boxes than the first time.',
        'If you drive Yappy from a script or from another page, you can now wait for the fonts before you start creating text, so automated diagrams come out the same size every run.',
    ] },
    { version: '0.8.166', date: '2026-07-31', items: [
        'Connectors now leave a shape straight out of the edge they are attached to. If the other shape was well off to one side, the line used to head sideways out of the bottom of the box instead of downwards — hugging the box and slipping past its corner, which left the arrowhead lying flat against the edge instead of standing on it. Diagrams with long connections across a hierarchy were the ones that looked wrong.',
        'Fixed: a label on a connector was being squeezed to the width of the connector, which is nothing at all for a straight up-and-down line. "one at a time" came out as four words stacked on top of each other down the line. Labels now stay on one line, centred on the connector, and only break where you put a line break yourself.',
    ] },
    { version: '0.8.165', date: '2026-07-31', items: [
        'Arrowheads on curved connectors now point the way the line actually goes. The head was being angled at the straight line between the connector\'s two corners rather than at the curve it sits on, so on anything but a perfectly straight or perfectly stacked connector it was turned the wrong way — by as much as 45° in exported SVG. Diagrams where a parent connects down to children spread left and right were the worst affected.',
        'In the clean (architectural) drawing style the problem was bigger still: arrowheads at the start of a curved connector pointed straight to the right no matter which way the line ran. Both ends now follow the curve.',
        'Fixed: exporting a connector whose midpoint you had dragged ignored the reroute and drew it straight between the two ends. The exported shape now matches what you see on the canvas.',
    ] },
    { version: '0.8.164', date: '2026-07-31', items: [
        'Yappy works on a phone again. The toolbar had turned into an invisible panel covering the whole screen — the tool icons floated in the middle of an empty page and tapping the canvas did nothing at all, because that invisible panel was catching every tap. The tools are back to a single row along the bottom, and the drawing area between the top bar and the tools is yours again.',
        'The tools no longer run off the right edge of the screen, and the buttons are finger-sized rather than the tiny mouse-sized ones you were getting.',
        'Fixed: the top bar and the bottom toolbar were being drawn on top of your drawing rather than beside it, so anything you put near the top or bottom of the canvas was covered up and untappable.',
        'Fixed: undo and redo were sitting on top of the tools, so you could not reach either one.',
        'On a narrow tablet (around 600–700px wide) the tool column was overlapping the drawing instead of sitting next to it.',
    ] },
    { version: '0.8.163', date: '2026-07-30', items: [
        'A symbol can now contain itself, and Yappy draws the nesting — a picture inside the picture inside the picture. Edit a symbol in place, drop another copy of the same symbol inside it, scale and rotate that copy, and press Done: nudge it for a receding corridor, shrink and turn it for a spiral, or put two inside for a branching tree. Use the ⟳ button on the symbol card to turn it on or off and to set how many levels deep to go.',
        'Fixed: the symmetry axis was drawn in the wrong place. Your strokes were always mirroring correctly — the dashed line was sitting about 46 pixels to the left of the line they were actually mirroring about, which made symmetry look like it was ignoring the axis. Dragging the axis to a new spot was off by the same amount. Artboard frames and the rulers and guides were all shifted the same way, and are now exact.',
        'Fixed: the ruler down the left edge was the wrong shape and mostly cut off.',
        'Fill mode now shows the fill while you are still drawing, instead of switching to it the moment you lift the pen. With symmetry on, every mirrored copy fills as you go too, so you can judge the shape you are making.',
        'The button at the top of the toolbar now moves the toolbar: click it to step through left edge, top, right edge, bottom, then floating. It used to do nothing at all.',
        'Fixed: the symmetry and Fill buttons became invisible when you pointed at whichever one was switched on.',
    ] },
    { version: '0.8.162', date: '2026-07-29', items: [
        'The Properties panel is now a proper dockable panel like Layers or History. Drag its title bar to the left or right edge to dock it there, drop it anywhere else to float it, drag the edge to resize, or collapse it to just its title — and it comes back the way you left it next time.',
        'Settings is no longer one long scroll. Pick a category on the left — General, Pen & Input, Defaults, Mindmap, Time-lapse, Cloud Storage — or just type in the new search box, which looks across all of them at once.',
        'Help searches too. Type what you want to do and it finds the shortcut, or type the keys and it tells you what they do — "duplicate" and "ctrl+d" both land on the same row.',
        'Settings, the Properties toggle and Help moved out of the bottom-left corner and up into the top bar, so they are no longer floating on top of your drawing.',
        'Fixed: the colour palette and theme buttons at the top right had become invisible — the header bar was being drawn over them.',
    ] },
    { version: '0.8.161', date: '2026-07-30', items: [
        'Fixed: when you made a node smooth, the curve handles appeared but you could not actually grab them. You can now drag a handle to bend the curve, and on a smooth node the opposite handle follows so the curve stays smooth. Hold Alt while dragging to break that and turn it into a sharp corner instead.',
    ] },
    { version: '0.8.160', date: '2026-07-30', items: [
        'Fixed: with the Node tool open, Ctrl+A and Backspace were being grabbed even while you were typing in a text box or a dialog. They now leave your typing alone, and Ctrl+A goes back to selecting all objects when you have no path selected.',
    ] },
    { version: '0.8.159', date: '2026-07-29', items: [
        'There is a proper Node tool now — Vector Tools → Path → Nodes. Every point on a path shows up so you can see and grab it: squares are corners, circles are smooth. Yappy could always edit paths, but it was hidden behind Alt-click and Ctrl-click with nothing telling you so.',
        'You can work on several points at once. Click, Shift-click, or drag a box around a few of them, then move them all together, make them all corners or all smooth, or delete them in one go. Before, everything worked on a single point at a time.',
        'Turning a rectangle into a curvy shape is now three steps: Convert to Path, Ctrl+A, Smooth. There is a Convert to Path button right on the bar when you have a plain shape selected.',
    ] },
    { version: '0.8.158', date: '2026-07-29', items: [
        'The toolbar looks tidy again when you stack it vertically or drag it narrow. The icons now sit in even columns, and each one is centred in its button — tools with a little dropdown arrow used to get pushed against the right edge.',
    ] },
    { version: '0.8.157', date: '2026-07-29', items: [
        'Yappy now loads about three times lighter. It was downloading a PDF library, a PowerPoint library and an entire icon set before you could draw a single line — none of which are needed until you actually export something. Cold-load code is down 62%, so the app is usable much sooner, especially on a slow connection or a first visit.',
        'Holding Shift while you drag now draws a perfect square or circle. The hint in the status bar had been promising this for shape tools for a while, but only lines and arrows were actually listening.',
    ] },
    { version: '0.8.156', date: '2026-07-29', items: [
        'Symmetry drawing is here. Turn it on and whatever you draw is mirrored live — left/right, up/down, a 4-way quadrant, or a mandala of up to 24 spokes. The copies appear as you drag, not when you let go, and every tool is covered: brushes, pen, shapes, connectors, all of it.',
        'Drag the purple handle to put the mirror line or mandala centre wherever you want, and tilt the axes off-vertical if you need to. Buttons live in the footer, or press Alt+Y (Alt+Shift+Y to move the axis).',
        'Fill mode: the paint-bucket button in the footer makes brush strokes come out as solid filled shapes instead of lines. Scribble a rough outline, get a filled mass — the fast way to block in a silhouette. Combine it with symmetry for filled mandalas in one gesture.',
        'Your symmetry setup is saved with the drawing, so reopening a mandala puts the axis back where you left it.',
        'Fixed: shapes animated with Draw In used to trace a clean, precise line and then visibly snap to their hand-drawn look on the very last frame. The reveal now draws the real sketchy strokes the whole way, so a whiteboard-style animation no longer flickers as each shape lands.',
    ] },
    { version: '0.8.155', date: '2026-07-29', items: [
        'Fixed: the combine toolbar only appeared for a handful of shape types. Pentagons, cylinders, speech bubbles, right triangles and many others were silently left out, so selecting two of them showed nothing at all. It now works with every shape that has a fill.',
    ] },
    { version: '0.8.154', date: '2026-07-29', items: [
        'Combining shapes is now a single click. Select two or more and a small toolbar appears right above them with Unite, Subtract, Intersect and Exclude — plus Divide, Trim, Merge, Crop and Outline underneath. No more hunting through the right-click menu.',
        'Keyboard shortcuts for the four main operations (Ctrl+Alt+U / D / I / X), and Shape Builder now has its own button and Shift+M shortcut — for logo work it is often the fastest way to carve a shape out of overlapping circles and rectangles.',
        'A "keep editable" toggle combines shapes without destroying the originals, so you can change or undo the operation later instead of starting over.',
        'Fixed an important one: any shape you had already run a path operation on could stop responding to clicks (you had to drag a box around it) and would refuse to combine with anything else. Both came from the same maths bug in how paths were read back, and both are fixed.',
    ] },
    { version: '0.8.153', date: '2026-07-28', items: [
        'Equations can now morph into one another. Write two versions of a formula and the symbols they share glide into their new places while the rest fades — so a derivation reads as one continuous idea instead of a series of separate slides.',
        'Fixed a long-standing annoyance: dragging the playhead on the Scene Timeline while paused did not actually update the canvas. Animations played correctly but scrubbing showed a stale frame, which made fades in particular look like they were not working at all.',
    ] },
    { version: '0.8.152', date: '2026-07-28', items: [
        'Charts can now use logarithmic scales — on either axis or both. Handy when your data spans orders of magnitude: exponential growth and power laws show up as clean straight lines instead of a curve pinned against the edge of the chart.',
    ] },
    { version: '0.8.151', date: '2026-07-28', items: [
        'Proper mathematical equations at last. You can now typeset LaTeX — fractions stacked over a bar, integrals with limits, matrices, square-root signs — and it arrives as real vector artwork you can resize, recolour and animate like any other shape.',
        'Every symbol in an equation is individually selectable, so you can highlight just the pi, or fade in one term at a time while you explain it.',
        'New plotting tools for vector fields (arrow grids for gradient flow or phase portraits) and polar grids for curves like the cardioid.',
        'Properties can now follow a formula rather than fixed keyframes — say "bob up and down forever" or "keep spinning" in one line instead of keyframing every cycle.',
        'Fixed: SVG files that reuse a shape internally (very common in icon sets and Illustrator exports) used to import as an empty canvas. They now come in correctly.',
    ] },
    { version: '0.8.150', date: '2026-07-28', items: [
        'You can now build maths and science animations by script. A new scene API lets you write an animation as a list of steps — "move this, wait a second, fade that in" — and each step simply starts where the previous one ended, so you never work out timings yourself.',
        'New plotting tools draw proper graphs: pick a coordinate system, then plot any function or parametric curve in one line. Tick marks and number labels are drawn for you, and awkward spots like the gap in 1/x are handled properly instead of drawing a stray line across the chart.',
        'Fixed: a scripted animation longer than four seconds used to stop dead at four seconds, and pressing Play sometimes left the playhead sitting still. Both now behave.',
        'Fixed: the welcome tour could reappear after you had already dismissed it. Skip it once and it stays gone — you can always replay it from Help (?).',
    ] },
    { version: '0.8.149', date: '2026-07-28', items: [
        'Security housekeeping: every known vulnerability in the libraries YappyDraw is built on is now patched, including a critical one that shipped in the app itself. Nothing changes in how the app works — it is just built on safer foundations.',
    ] },
    { version: '0.8.148', date: '2026-07-28', items: [
        'The BETA badge next to the logo was genuinely hard to read — white text on a gradient that only reached 3.5:1 contrast where it should be 4.5:1. The gradient is now a shade deeper, so the label is legible without changing its look.',
    ] },
    { version: '0.8.147', date: '2026-07-28', items: [
        'Fixed the occasional hang on the loading screen. If the editor ever failed to start you would just sit and watch the bicycle bounce forever — now anything that goes wrong at startup gives you a clear message and a Reload button instead.',
        'The usual culprit turned out to be one bad saved preference: a single corrupted setting could stop the whole app from opening. Bad settings are now thrown away automatically rather than blocking startup, so it cannot happen twice.',
        'Help and Examples pages that failed to load after an update used to say "Loading..." forever. They now offer Reload and Try again.',
    ] },
    { version: '0.8.146', date: '2026-07-28', items: [
        'Big flat areas of colour no longer look dead: Vector Tools → Insert → Noise Texture (or Grunge) lays a fine grain over your whole picture, already set to the subtle multiply-at-low-opacity look artists use. Dial it up or down in Properties, or press Randomize for a different grain.',
        'Scribble a hill with the pencil, press Ctrl+L, and it becomes a clean editable curve that keeps the hand-drawn wobble. Simplify (and Smooth) now work straight off a freehand stroke or any shape — no "convert to path" step first, and one undo takes it all back.',
        'An asset library that follows you between drawings: draw a good tree, rock or cloud once, save it from the Symbols panel, and it is one click away in every future document. Inserted copies are fully editable and independent, so you can recolour and resize them freely.',
        'Nine shapes — cloud, database, lightbulb, magnet, magnifying glass, pin, puzzle piece, storage blob and the UML required-interface — could never be converted into editable paths. Now they can, which also unlocks Simplify, Smooth, Offset Path and text-on-path for them.',
        'The size/position badge under a selection is see-through now, so the handles and artwork it sits on top of stay visible.',
    ] },
    { version: '0.8.145', date: '2026-07-22', items: [
        'Your animations are now INTERACTIVE. Right-click a keyframe → Frame Action: Stop holds a pose, Loop to Frame 1 makes sections repeat, Next Scene chains your acts into a film — just like Flash\'s stop() and gotoAndPlay(), little "a" marker and all.',
        'Export HTML gives you a living animation, not a video: a single self-contained web page that plays the real thing — full quality at any size, looping, frame actions running, sound playing — with tap-to-pause controls. Share the file anywhere.',
        'A camera! Frame a shot by zooming the canvas, press 📷, move to a later frame, frame another shot, 📷 again — playback and exports glide between your shots. Documentary-style pans and dramatic zoom-ins in two clicks.',
        'That completes the Animation Studio roadmap: timeline, tweens, morphing, ease curves, motion guides, character posing, sound, scenes, interactivity, and a camera — all in your browser, all free.',
    ] },
    { version: '0.8.144', date: '2026-07-22', items: [
        'Animation Studio grew five big features in one release. Shape tweens: right-click a span → Create Shape Tween and a square MORPHS into a circle, a star into a heart — outlines flow between your keyframes.',
        'A real ease-curve editor: presets like Overshoot and Anticipate, plus two draggable bezier handles for any curve you can imagine. Drag above the box for overshoot, below for a wind-up.',
        'Motion guides: draw a path, select it, click "guide: use selection" — the tween now rides your curve instead of a straight line, with an optional orient that banks into turns.',
        'Pose your stick figures frame by frame: pick a motion clip and the exact cycle instant per keyframe. Same clip on both ends and the walk unfolds between them (feet planted by IK); different clips and the skeleton blends from one pose to the other.',
        'Sound! An ♪ Audio row on the timeline: nine built-in retro sound effects or your own imported audio, placed on exact frames. It plays back in the editor and is mixed into MP4/WebM exports.',
        'Scenes: split a film into acts — each scene has its own stage and timeline, with a picker in the timeline header.',
        'Plus: the timeline sits above the status bar and resizes by dragging its top edge, and the settings buttons stay out of its way.',
    ] },
    { version: '0.8.143', date: '2026-07-22', items: [
        'NEW: Animation Studio — a whole new document type in the spirit of Flash / Adobe Animate. Menu → New → New Animation gives you a fixed stage and a frame timeline: draw on a frame, press F6 to make the next keyframe, and you are animating.',
        'Motion tweens with easing: make two keyframes, right-click the span, Create Motion Tween — position, size, rotation, opacity and colours glide between them.',
        'Onion skinning: ghost the neighbouring frames in red (before) and green (after) while you draw the next pose — the classic animator\'s tool.',
        'Movie clips: turn a selection into a symbol with its OWN looping timeline (F8). One frame on your main timeline can hold a flame that flickers forever. Double-click an instance to edit the clip in place.',
        'Play with Enter, step frames with , and . — and Export defaults to a GIF of exactly one loop, sized for sharing.',
        'Three ready-made samples in Templates → Animations: Bouncing Ball, Rocket Launch, and a 1080×1080 YappyDraw intro card made for social media. Load one, press play, pull it apart.',
        'The in-app help has a full step-by-step tutorial: your first bouncing ball in five minutes.',
    ] },
    { version: '0.8.142', date: '2026-07-22', items: [
        'YappyDraw is in beta, and now it says so — a small Beta badge sits next to the logo. Expect things to keep changing quickly, and please keep the feedback coming.',
        'The footer credit now points to Algorisys Technologies at www.algorisys.com.',
    ] },
    { version: '0.8.141', date: '2026-07-21', items: [
        'Fixed: cropping a rotated image made it jump to the wrong place — about 76 pixels off for a picture turned 45°. Rotated images now stay exactly where they were.',
    ] },
    { version: '0.8.140', date: '2026-07-21', items: [
        'Fixed: after cropping, clicking the image again re-opened crop and showed the whole original picture — which looked like your crop had been thrown away. Finishing a crop now hands you the Select tool with the image selected.',
    ] },
    { version: '0.8.139', date: '2026-07-21', items: [
        'Cropping the same image twice now works properly. Re-entering crop shows the whole picture again, so you can widen a crop back out or remove it entirely — previously you could only ever cut further in.',
        'Crop now has Apply and Cancel buttons on screen. On a tablet there was no way to cancel at all (it needed the Esc key) and applying meant tapping somewhere unmarked.',
    ] },
    { version: '0.8.138', date: '2026-07-21', items: [
        'Fixed: floating panels — Swatches, History, Symbols, Stick Figures, Brand Kit and others — were drawn WHITE in dark and focus mode, with pale grey text on them. They are properly dark now.',
        'The cause was 24 colour names the styles referenced that were never actually defined, so they quietly fell back to light-mode values everywhere.',
        'Small text in those panels, the stick-figure chips, the History counts and the States panel all meet the accessibility contrast standard now too.',
    ] },
    { version: '0.8.137', date: '2026-07-21', items: [
        'Cropping in the editor really is fixed now. The previous release fixed the same bug in a code path the editor doesn\'t use, so pressing Enter to apply a crop still stretched the picture.',
    ] },
    { version: '0.8.136', date: '2026-07-21', items: [
        'Fixed: cropping an image stretched it — the picture kept the old frame\'s shape instead of the shape you cropped. Crops were also landing on the wrong part of the picture.',
        'Colours you save from the OKLCH picker now appear right there in the palette under SAVED, with an × to remove ones you were only trying out.',
        'After inserting an image you get the Select tool, so you can move and resize it straight away instead of the file picker opening again.',
        'The Layers panel title was almost unreadable in dark mode, and the selected layer\'s name and drag handle were too faint. All fixed.',
    ] },
    { version: '0.8.135', date: '2026-07-21', items: [
        'Focus theme now does something Dark doesn\'t: it darkens the page you\'re drawing on, not just the app around it. Exports, thumbnails and presentations stay exactly as authored.',
        'Focus is offered only on presentations and design pages — on an infinite canvas it was identical to Dark, so the theme button now skips it there.',
        'The OKLCH colour picker gained a "+ Swatch" button, so a colour you mix can be saved without painting a shape first and adding it from the Swatches panel.',
    ] },
    { version: '0.8.134', date: '2026-07-21', items: [
        'Small text throughout the app is now properly legible: keyboard-shortcut badges, status-bar hints, menu shortcuts, the version number and footer links were all too faint to meet accessibility standards, in every theme.',
        'Nothing moved or changed shape — only colours and transparency. Light, dark and focus themes now pass WCAG AA contrast everywhere we can measure it.',
    ] },
    { version: '0.8.133', date: '2026-07-21', items: [
        'Buttons like Done, Save and Export are now properly legible in both light and dark themes. Their text was below the accessibility standard for contrast, and hovering made it worse rather than better.',
        'The colour palette now starts on P3 Wide-Gamut, so colours are richer on modern displays. Browsers that can\'t show P3 keep the standard palette automatically.',
    ] },
    { version: '0.8.132', date: '2026-07-21', items: [
        'Fixed: pop-up messages sat on top of the presentation toolbar — hiding the buttons underneath and swallowing clicks meant for them. They now float above the toolbar, and clicks pass straight through.',
    ] },
    { version: '0.8.130', date: '2026-07-21', items: [
        'Capture a looping GIF straight from the presentation toolbar — press the film button to start, press it again to stop. Ideal for a README, a wiki page or a chat message, where a GIF plays inline with no player.',
        'It shows the elapsed time and file size while it runs, so you can see what a long capture costs before you download it.',
        'Stop it the moment your animation returns to where it started and the loop joins invisibly — something a fixed-length timer can never get right.',
        'GIF exports now let you choose the frame rate instead of always using 12.',
    ] },
    { version: '0.8.129', date: '2026-07-21', items: [
        'Record your presentation as a video without leaving it. Press F5 to present, then hit the camera button in the toolbar at the bottom — it turns red, and pressing it again saves an MP4. Slides, animations, laser pointer and your ink annotations are all captured; the toolbars never are.',
        'This is the only way to capture a whole deck — the page export can only render one page at a time, and on an infinite canvas it can\'t run at all.',
        'Fixed: Ctrl+Shift+E seemed to do nothing while presenting, then sprang the Export dialog on you when you pressed Esc.',
        'The Animation help page now explains video and GIF export properly — it previously described settings that don\'t exist and didn\'t mention MP4 at all.',
    ] },
    { version: '0.8.128', date: '2026-07-21', items: [
        'Fixed: My Drawings only kept your most recent drawing. Saving, starting a new drawing and saving again quietly replaced the first one — each drawing now gets its own entry. (Drawings already lost to this can\'t be recovered, sorry.)',
        'Fixed: saving and then choosing New still asked whether to save or discard, for work you had just saved.',
        'Ctrl+S on a new drawing now asks you to name it, instead of filing everything away as "Untitled". After that it saves silently over that name.',
        'Two new options under Settings → Pen & Input: which tool Yappy opens with (now the Ink Brush), and what the cursor looks like over the canvas (now a crosshair — a concentric circle and the old arrow are also available).',
    ] },
    { version: '0.8.127', date: '2026-07-21', items: [
        'Smart Shapes now recognises your stroke almost every time, instead of working on one attempt and quietly ignoring the next. It copes with a mouse or trackpad: wobbly edges, a corner you didn\'t quite close, or running past where you started are all fine.',
        'A stroke you left open — an arc, or half a box — stays as freehand ink rather than being closed up into a shape you didn\'t draw.',
        'After a shape snaps, nothing is left selected — no selection handles sitting on top of the drawing you\'re still working on. Press V and click the shape when you want to edit it.',
    ] },
    { version: '0.8.126', date: '2026-07-21', items: [
        'Hold a freehand stroke still to snap it to a clean shape — and keep drawing. Smart Shapes no longer switches you to the Select tool, so your pen stays in your hand through a whole sketch. Press V when you actually want to move or resize something.',
    ] },
    { version: '0.8.125', date: '2026-07-21', items: [
        'Text you type into a shape is now centred by default, so boxes look right without reaching for the alignment buttons. Your existing drawings are unchanged, and you can still set left or right per shape.',
        'The Properties panel no longer slides open every time you pick a tool. Open it when you want it (Alt+Enter, the sliders button, or right-click a tool group) and it stays where you put it — handy during a long brainstorming session.',
    ] },
    { version: '0.8.124', date: '2026-07-20', items: [
        'Templates you save yourself now show a preview instead of a blank icon — including ones you saved before this update.',
    ] },
    { version: '0.8.123', date: '2026-07-20', items: [
        'Template cards now show what\'s actually inside them. Diagrams show the diagram, designs show the page, and a presentation shows its first few slides — so you can pick by looking instead of by reading the name.',
        'Fixed: rounding the corners of a square or diamond left its fill spilling outside the outline. Gradients, patterns and hatch fills now stay inside the rounded shape.',
        'Fixed: cards on the Designs tab were squashed into thin strips with their names cut off.',
    ] },
    { version: '0.8.122', date: '2026-07-20', items: [
        'Fixed: a stick figure with folded arms wearing a jacket looked like it had a giant bow across its chest. Sleeves now tuck under the top, so folded arms read properly — and every top looks a little cleaner at the shoulder.',
    ] },
    { version: '0.8.121', date: '2026-07-20', items: [
        'Stick figures can wear tops and ties — T-shirt, long sleeve, vest, jacket or hoodie, plus a tie, bow tie or scarf.',
        'Sleeves follow the arms and the tie follows the torso, so clothing moves with the pose just like trousers do.',
        'Front-facing shoes redrawn so they read as shoes head-on, and joggers lost the stray cuff line.',
    ] },
    { version: '0.8.120', date: '2026-07-20', items: [
        'Stick figures can wear trousers and shoes — 8 trouser styles and 6 shoe styles, each with its own colour.',
        'The clothing follows the pose: a seated figure\'s trousers bend at the knee, a cyclist\'s follow the pedalling leg, and animated figures keep theirs through a walk cycle.',
        'Find it under Appearance in the Properties panel, alongside expression and hair.',
        'Existing figures are unchanged — trousers are opt-in, and the Woman and Girl variants keep their skirt.',
    ] },
    { version: '0.8.119', date: '2026-07-20', items: [
        'Comic characters now each have their own hair, so you can tell them apart at a glance — and it stays the same in every panel.',
        'Eight new hair styles for every figure: Swoosh, Mohawk, Afro, Bob, Braids, Top knot, Balding and Cap (18 in all).',
    ] },
    { version: '0.8.118', date: '2026-07-20', items: [
        'Comic emotions now show on the face — write "Ann (angry): ..." and Ann actually looks angry, not just tense.',
        'Comic characters are normal stick figures: select one and change its expression or hair from the Properties panel.',
        'Fixed: changing a comic figure\'s expression used to wipe its hair, and monochrome comics kept coloured hair.',
    ] },
    { version: '0.8.117', date: '2026-07-20', items: [
        'Animated figures have a Speed slider — speed them up or slow them down, including while they walk a path.',
        'Walking a route? "Lap time" sets how long one trip takes, so you can pace a scene exactly.',
        'Ten new motions for everyday scenes: Sit, Type, Squat, Lift weights, Stretch, Kick, Cook, Sweep, Drink and Think — twenty in all.',
        'Fixed: "Walk this path" did nothing when your route was a plain line — the figure now sets off properly.',
    ] },
    { version: '0.8.116', date: '2026-07-20', items: [
        'Stick figures have faces — pick from 12 expressions (happy, sad, angry, surprised, tired, excited, confused, wink…) and 10 hair styles, with a hair colour of your choice.',
        'Change a figure\'s mood any time: select it and use Face & hair in the Properties panel. It still works after you\'ve moved, scaled or ungrouped the figure.',
        'Animated figures get faces too, and keep them when you bake a frame to editable paths.',
        'Turn on "Solid head" to fill the head white so eyes and mouth stay readable over busy artwork.',
    ] },
    { version: '0.8.115', date: '2026-07-19', items: [
        'Set a mood per line in comics — write "Ann (angry): ..." and that line only is angry, so a character can be cheerful in one panel and furious in the next.',
        'Cues combine: "Ann (angry, whispers): ..." gives an angry whisper.',
    ] },
    { version: '0.8.114', date: '2026-07-19', items: [
        'Comic captions — start a line with * (or wrap it in brackets) for a "MEANWHILE..." box that sets the scene without putting anyone in the panel.',
    ] },
    { version: '0.8.113', date: '2026-07-19', items: [
        'Comics can think and whisper — write "Ben (thinks): ..." for a thought cloud, or "Ann (whispers): ..." for a dashed aside.',
    ] },
    { version: '0.8.112', date: '2026-07-19', items: [
        'New Comic Studio panel — write a few lines of dialogue and draw a comic without touching code. Open it from the Window/Panels menu or the command palette.',
        'As you type, it tells you who it found, the pose each character will strike and how many panels your script becomes.',
        'Longer conversations turn into a multi-panel strip automatically, laid out left-to-right.',
        'Set the mood yourself — pick an emotion (happy, angry, shouting, thinking…) or a figure for any character to override what the words suggested.',
    ] },
    { version: '0.8.111', date: '2026-07-19', items: [
        'Turn a script into a comic panel — type a few lines of dialogue and YappyDraw draws it: stick figures posed from what they say, facing each other, with speech balloons above them in the right reading order.',
        'The pose comes from the words: a greeting waves, ALL CAPS shouts, ":-(" looks sad, "lol" laughs, "maybe" thinks, "you" points.',
        'Everything stays editable — the panel is one group you can move, and you can drag any figure or balloon afterwards.',
    ] },
    { version: '0.8.110', date: '2026-07-19', items: [
        'Connectors space themselves out — when several arrows meet the same side of a shape they now fan into evenly spaced points instead of piling onto one spot, arranged so the lines don\'t cross.',
        'Two arrows between the same pair of shapes (or one each way) get their own lanes, so both arrowheads stay visible.',
        'Elbow connectors steer around each other instead of running along the top of another connector — lines still cross where your diagram needs them to.',
        'Endpoints follow your shapes: move a shape to the other side and the arrow hops to the edge facing it, landing on the real outline of circles and diamonds.',
    ] },
    { version: '0.8.109', date: '2026-07-18', items: [
        'Fixed Google Drive sign-in — after signing in, the popup no longer gets stuck on "Connecting…"; it now finishes and connects your Drive.',
        'Tidied the Load/Save panel — the old "Workspace" options are gone; use "My Drawings" (or Ctrl/Cmd+S) to keep and reopen drawings in your browser.',
    ] },
    { version: '0.8.108', date: '2026-07-17', items: [
        'New "My Drawings" gallery — save drawings right in your browser and reopen, rename, duplicate or delete them anytime, no account needed. Open it from the menu, the command palette, or "Jump back in" on the welcome screen.',
        'Press Ctrl/Cmd+S to save the current canvas straight to My Drawings (the full Export/Save dialog is still on Ctrl+Alt+S).',
        'Your saved drawings are kept durably on your device, so they survive browser cleanups — install the app or export a .yappy file for extra-safe backups.',
    ] },
    { version: '0.8.107', date: '2026-07-16', items: [
        'Cleaner construction guides: inserting a Rectangular Grid (or scripting plain lines) no longer adds stray arrowheads — lines are plain, the arrow tool is what adds a head.',
    ] },
    { version: '0.8.106', date: '2026-07-16', items: [
        'Import & export Excalidraw — open a .excalidraw file to bring its shapes in, or Save/Export → Export to Excalidraw to open your work there.',
        'Text boxes: the Auto Resize toggle now shows for text — hug the text (auto width) or drag a side handle to lock the width and let it wrap.',
        'Mind maps: press Tab or Enter and the new node inherits the parent’s font, size, colour and fill — no more re-styling every node.',
        'The Slingshot game got a real slingshot: a Y-fork with stretchy elastic bands, a wall of smashable blocks, and an easier-to-grab bird.',
        'Fixed: on Linux, an accidental middle-click no longer pastes random highlighted text into your labels.',
    ] },
    { version: '0.8.105', date: '2026-07-14', items: [
        'Exported HTML presentations now respond to the keyboard — → / Space to advance, ← to go back, Home/End to jump.',
        'Infinite-canvas HTML exports open perfectly framed to your content (no more hunting for your drawing).',
    ] },
    { version: '0.8.104', date: '2026-07-14', items: [
        'Export your animated page as a looping GIF — Export → Animated GIF. Same page-perfect framing as the MP4 export, plays anywhere, loops forever.',
    ] },
    { version: '0.8.103', date: '2026-07-14', items: [
        'Export your animated page as a real MP4 — Export → MP4 Video renders the page itself (exact bounds, animations playing) for the duration you pick. Plays everywhere.',
        'The Font dropdown is now searchable, keyboard-friendly (↑↓ + Enter) and always stays on screen — and arrow keys no longer move your element while picking a font.',
        'Try the new “Stick-Figure Animation Demo” template — search “animation” in Templates or Elements.',
    ] },
    { version: '0.8.102', date: '2026-07-14', items: [
        "Click the version number (bottom-right) to see “What's new” — a running list of recent updates.",
    ] },
    { version: '0.8.101', date: '2026-07-14', items: [
        'Elements no longer disappear when you drag them to the edge of a page — they stay visible as long as any part is still on the page.',
    ] },
    { version: '0.8.100', date: '2026-07-14', items: [
        'New here? A quick guided tour highlights the essentials on your first visit — replay it anytime from Help (?).',
    ] },
    { version: '0.8.99', date: '2026-07-14', items: [
        'Alignment & spacing guides always clear once you finish dragging (no more stuck guides).',
    ] },
    { version: '0.8.98', date: '2026-07-14', items: [
        'Make text much bigger — font size now goes all the way to 800.',
        'A text box grows to fit when you increase its font size, so big text is still easy to select.',
        'Smoother font-size dragging from the floating toolbar (no flicker).',
    ] },
    { version: '0.8.97', date: '2026-07-14', items: [
        'Hold Shift while dragging to move in a straight line — horizontal, vertical, or 45°.',
        'Click inside an unfilled combined/boolean shape to select it.',
    ] },
    { version: '0.8.96', date: '2026-07-14', items: [
        'Include dimension annotations in your exports — PNG, JPG, PDF and true-vector SVG.',
    ] },
    { version: '0.8.95', date: '2026-07-13', items: [
        'Measure in px, mm or inches, with angle, radius and diameter dimensions — and it follows rotated shapes.',
    ] },
    { version: '0.8.94', date: '2026-07-13', items: [
        'Snap precisely to points where two outlines cross.',
    ] },
    { version: '0.8.93', date: '2026-07-13', items: [
        'Precision boost: measure the gap to a neighbour (Alt-hover), a richer measure readout, and snap-to-point while dragging.',
    ] },
    { version: '0.8.92', date: '2026-07-13', items: [
        'The native colour picker drags smoothly again in the Appearance fill/stroke rows.',
    ] },
    { version: '0.8.91', date: '2026-07-13', items: [
        'Two ways to place text: click to auto-size as you type, or drag a box for fixed-width wrapping.',
    ] },
    { version: '0.8.90', date: '2026-07-13', items: [
        'Templates and greeting cards now show up right in the unified element search.',
    ] },
    { version: '0.8.89', date: '2026-07-13', items: [
        'Tidier main menu with collapsible groups.',
    ] },
    { version: '0.8.88', date: '2026-07-13', items: [
        'Search icons, illustrations and photos together in one box — press Alt+E.',
    ] },
    { version: '0.8.87', date: '2026-07-13', items: [
        'Unified element search: one “Search elements” box across icons, shapes and photos.',
    ] },
    { version: '0.8.86', date: '2026-07-13', items: [
        'Replace an image background in one click with AI.',
    ] },
    { version: '0.8.85', date: '2026-07-13', items: [
        'Stick figures drop in at a friendlier default size, and baked figures are fully reshapeable.',
    ] },
    { version: '0.8.84', date: '2026-07-13', items: [
        'Control which sites are allowed to embed Yappy.',
    ] },
    { version: '0.8.83', date: '2026-07-13', items: [
        'Embed and drive the full editor from another project via a cross-origin API bridge.',
    ] },
    { version: '0.8.82', date: '2026-07-13', items: [
        'Custom stroke dash patterns.',
    ] },
];
