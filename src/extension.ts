import * as vscode from 'vscode';
import { convertText, getConversionPairs } from './conversion';

export function activate(context: vscode.ExtensionContext) {
	console.log('Kyujify extension activating...');

	const toKyujitai = vscode.commands.registerCommand('kyujify.toKyujitai', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}
		const settings = vscode.workspace.getConfiguration('kyujify');
		const defaultPairs = await getConversionPairs(settings, context);
		const symbol = settings.get<string>('lineStartSymbol', '');
		      const exclusions = settings.get<string[]>('exclusions', []);

		const selection = editor.selection;
		const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

		const convertedText = convertText(text, 'kyujitai', defaultPairs, exclusions, symbol);

		editor.edit(editBuilder => {
			if (selection.isEmpty) {
				editBuilder.replace(new vscode.Range(0, 0, editor.document.lineCount, 0), convertedText);
			} else {
				editBuilder.replace(selection, convertedText);
			}
		});
	});

	const toShinjitai = vscode.commands.registerCommand('kyujify.toShinjitai', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}
		const settings = vscode.workspace.getConfiguration('kyujify');
		const defaultPairs = await getConversionPairs(settings, context);
		const symbol = settings.get<string>('lineStartSymbol', '');
		      const exclusions = settings.get<string[]>('exclusions', []);

		const selection = editor.selection;
		const text = selection.isEmpty ? editor.document.getText() : editor.document.getText(selection);

		const convertedText = convertText(text, 'shinjitai', defaultPairs, exclusions, symbol);

		editor.edit(editBuilder => {
			if (selection.isEmpty) {
				editBuilder.replace(new vscode.Range(0, 0, editor.document.lineCount, 0), convertedText);
			} else {
				editBuilder.replace(selection, convertedText);
			}
		});
	});

	context.subscriptions.push(toKyujitai, toShinjitai);
}

// This method is called when your extension is deactivated
export function deactivate() {}
