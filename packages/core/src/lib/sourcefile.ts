import type * as ts from "typescript/unstable/ast";

import path from "node:path";
import * as factory from "typescript/unstable/ast/factory";
import { API } from "typescript/unstable/sync";

export async function createSourceFileFromFile(file: string): Promise<ts.SourceFile> {
    const api = new API({ cwd: path.dirname(file) });

    try {
        const snapshot = api.updateSnapshot({ openFiles: [file] });
        const project = snapshot.getDefaultProjectForFile(file);
        if (!project) {
            throw new Error(`Unable to open a TypeScript project for file: ${file}`);
        }

        const sourceFile = project.program.getSourceFile(file);
        if (!sourceFile) {
            throw new Error(`Unable to parse source file: ${file}`);
        }

        return sourceFile;
    } finally {
        api.close();
    }
}

export function updateSourceFileStatements(file: ts.SourceFile, statements: ts.Statement[]): ts.SourceFile {
    return factory.updateSourceFile(file, statements, file.endOfFileToken);
}

export function appendSourceFileStatements(file: ts.SourceFile, ...statements: ts.Statement[]): ts.SourceFile {
    return updateSourceFileStatements(file, [...file.statements, ...statements]);
}

export function prependSourceFileStatements(file: ts.SourceFile, ...statements: ts.Statement[]): ts.SourceFile {
    return updateSourceFileStatements(file, [...statements, ...file.statements]);
}

export function replaceSourceFileStatement(file: ts.SourceFile, oldStatement: ts.Statement, newStatement: ts.Statement): ts.SourceFile {
    const i = file.statements.indexOf(oldStatement);
    if (i === -1) {
        throw new Error(`Unable to find this statement!`);
    }

    return updateSourceFileStatements(file, [...file.statements.slice(0, i), newStatement, ...file.statements.slice(i + 1)]);
}
