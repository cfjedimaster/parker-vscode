/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';

import * as vscode from 'vscode';

var Parker = require('parker/lib/Parker');
var metrics = require('parker/metrics/All');

export function activate(context: vscode.ExtensionContext) {

    let previewUri = vscode.Uri.parse('parker-analysis://raymondcamden/parker-analysis');

    class TextDocumentContentProvider implements vscode.TextDocumentContentProvider {
        private _onDidChange = new vscode.EventEmitter<vscode.Uri>();

        public provideTextDocumentContent(uri: vscode.Uri): Thenable<string> {
            return this.getReport();
        }

        public getReport() {
            return new Promise(function(resolve,reject) {

                let editor = vscode.window.activeTextEditor;
                if (!(editor.document.languageId === 'css')) {
                    return this.errorSnippet("Active editor isn't a CSS TextDocumentContentProvider.")
                }
                let text = editor.document.getText();

                let parker = new Parker(metrics);                
                let results:any = parker.run(text);
                console.log(JSON.stringify(results));
                //render out just the main results
                let result = `
                    Total Stylesheet: ${results['total-stylesheets']}<br/>
                    Total Stylesheet Size: ${results['total-stylesheet-size']}<br/>
                    Total Rules: ${results['total-rules']}<br/>
                    Selectors per Rule: ${results['total-stylesheets']}<br/>
                    Total Selectors: ${results['total-selectors']}<br/>
                    Identifiers per Selector: ${results['identifiers-per-selector']}<br/>
                    Specificity per Selector: ${results['specificity-per-selector']}<br/>
                    Top Selector Specificity: ${results['top-selector-specificity']}<br/>
                    Top Selector Specificity Selector: ${results['top-selector-specificity-selector']}<br/>
                    Total ID Selectors: ${results['total-id-selectors']}<br/>
                    Total Identifiers: ${results['total-identifiers']}<br/>
                    Total Declarations: ${results['total-declarations']}<br/>
                    Total Unique Colours: ${results['total-unique-colours']}<br/>
                    Unique Colours: ${results['unique-colours']}<br/>
                    Total Important Keywords: ${results['total-important-keywords']}<br/>
                    Total Media Queries: ${results['total-media-queries']}<br/>
                    Media Queries: ${results['media-queries']}<br/>
                `;

                resolve(`
                <body>
                    <h2>Parker Analysis Rules</h2>
                    ${result}
                </body>
                `);
            });
        }

        get onDidChange(): vscode.Event<vscode.Uri> {
            return this._onDidChange.event;
        }

        public update(uri: vscode.Uri) {
            this._onDidChange.fire(uri);
        }

        private errorSnippet(error: string): string {
            return `
                <body>
                    ${error}
                </body>`;
        }

    }

    let provider = new TextDocumentContentProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider('parker-analysis', provider);

    vscode.workspace.onDidChangeTextDocument((e: vscode.TextDocumentChangeEvent) => {
        if (e.document === vscode.window.activeTextEditor.document) {
            provider.update(previewUri);
        }
    });

    vscode.window.onDidChangeTextEditorSelection((e: vscode.TextEditorSelectionChangeEvent) => {
        if (e.textEditor === vscode.window.activeTextEditor) {
            provider.update(previewUri);
        }
    })

    let disposable = vscode.commands.registerCommand('extension.showParkerAnalysis', () => {
        return vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two).then((success) => {
        }, (reason) => {
            vscode.window.showErrorMessage(reason);
        });
    });

    context.subscriptions.push(disposable, registration);
}

export function deactivate() {
}