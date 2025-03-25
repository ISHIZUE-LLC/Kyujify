import * as vscode from 'vscode';
import * as path from 'path';
import { getSettings } from './settings';

export function convertText(text: string, to: 'kyujitai' | 'shinjitai', defaultPairs: [string, string][], exclusions: string[] = [], symbol: string = ''): string {
    if (symbol) {
        const lines = text.split('\n');
        const convertedLines = lines.map(line => {
            if (line.startsWith(symbol)) {
                const trimmedLine = line.slice(symbol.length);
                return symbol + convertLine(trimmedLine, to, defaultPairs, exclusions, symbol);
            }
            return line;
        });
        return convertedLines.join('\n');
    } else {
        return convertLine(text, to, defaultPairs, exclusions, symbol);
    }
}

function convertLine(text: string, to: 'kyujitai' | 'shinjitai', defaultPairs: [string, string][], exclusions: string[], symbol: string): string {
    let convertedText = text;
    const exclusionPlaceholders: { [key: string]: string } = {};

    // Replace excluded words with placeholders
    exclusions.forEach((exclusion, index) => {
        if (convertedText.includes(exclusion)) {
            const placeholder = `__EXCLUSION_${index}__`;
            exclusionPlaceholders[placeholder] = exclusion;
            convertedText = convertedText.replace(exclusion, placeholder);
        }
    });

    // Apply default conversions
    for (const [shinjitai, kyujitai] of defaultPairs) {
        const from = to === 'kyujitai' ? shinjitai : kyujitai;
        const toChar = to === 'kyujitai' ? kyujitai : shinjitai;
        convertedText = convertedText.split(from).join(toChar);
    }

    // Restore excluded words
    Object.entries(exclusionPlaceholders).forEach(([placeholder, original]) => {
        convertedText = convertedText.replace(placeholder, original);
    });

    return convertedText;
}

async function loadConversionPairsFromFile(filePath: string, context: vscode.ExtensionContext): Promise<any> {
    try {
        const fileUri = vscode.Uri.joinPath(context.extensionUri, filePath);
        const fileContent = await vscode.workspace.fs.readFile(fileUri);
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(fileContent);
        return JSON.parse(jsonString);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to load conversion pairs from ${filePath}: ${error.message}`);
        return null;
    }
}

export async function getConversionPairs(settings: vscode.WorkspaceConfiguration, context: vscode.ExtensionContext): Promise<[string, string][]> {
    const settingsObj = getSettings(settings);

    const defaultPairsFile = settingsObj.conversionPairsFile;

    let defaultPairs: [string, string][] = [];

    // Load default pairs
    try {
        const pairs = await loadConversionPairsFromFile(defaultPairsFile, context) as [string, string][];
        if (pairs && Array.isArray(pairs)) {
            defaultPairs = pairs;
        } else {
            throw new Error('Invalid default conversion pairs format. Must be an array.');
        }
    } catch (error: any) {
        vscode.window.showWarningMessage(`Failed to load default conversion pairs from ${defaultPairsFile}: ${error.message}. Using built-in defaults.`);
        // Load built-in default pairs as fallback
        const defaultPairsUri = vscode.Uri.joinPath(context.extensionUri, 'data', 'default_pairs.json');
        const defaultPairsContent = await vscode.workspace.fs.readFile(defaultPairsUri);
        const decoder = new TextDecoder();
        const jsonString = decoder.decode(defaultPairsContent);
        defaultPairs = JSON.parse(jsonString) as [string, string][];
    }

    return defaultPairs;
}