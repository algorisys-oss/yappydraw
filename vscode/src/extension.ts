import * as vscode from 'vscode';
import { VIEW_TYPE, YappyEditorProvider } from './yappy-editor-provider';

let untitledCount = 0;

const FORMATS = [
    { label: 'Drawing', description: '.yappy', ext: '.yappy' },
    { label: 'Editable SVG', description: '.yappy.svg: an image that shows on GitHub and in Markdown, and reopens here', ext: '.yappy.svg' },
    { label: 'Editable PNG', description: '.yappy.png: the same, as a PNG', ext: '.yappy.png' },
];

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        YappyEditorProvider.register(context),

        // A new, unsaved drawing. VS Code asks where to put it on the first save.
        vscode.commands.registerCommand('yappy.newDrawing', async () => {
            const pick = await vscode.window.showQuickPick(FORMATS, { placeHolder: 'New YappyDraw file as…' });
            if (!pick) return;
            untitledCount += 1;
            const uri = vscode.Uri.from({ scheme: 'untitled', path: `drawing-${untitledCount}${pick.ext}` });
            await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE);
        }),
    );
}

export function deactivate(): void { /* nothing held outside context.subscriptions */ }
