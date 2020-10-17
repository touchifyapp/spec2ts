import * as ts from "typescript";
import { promises as fs } from "fs";

export async function createSourceFileFromFile(file: string): Promise<ts.SourceFile> {
    const content = await fs.readFile(file, "utf8");

    return ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS
    );
}

export function updateSourceFileStatements(file: ts.SourceFile, statements: ts.Statement[]): ts.SourceFile {
    return ts.factory.updateSourceFile(
        file,
        ts.factory.createNodeArray(statements),
        file.isDeclarationFile,
        file.referencedFiles,
        file.typeReferenceDirectives,
        file.hasNoDefaultLib,
        file.libReferenceDirectives
    );
}

export function appendSourceFileStatements(file: ts.SourceFile, ...statements: ts.Statement[]): ts.SourceFile {
    return updateSourceFileStatements(
        file,
        [...file.statements, ...statements]
    );
}

export function prependSourceFileStatements(file: ts.SourceFile, ...statements: ts.Statement[]): ts.SourceFile {
    return updateSourceFileStatements(
        file,
        [...statements, ...file.statements]
    );
}

export function replaceSourceFileStatement(file: ts.SourceFile, oldStatement: ts.Statement, newStatement: ts.Statement): ts.SourceFile {
    const i = file.statements.indexOf(oldStatement);
    if (i === -1) {
        throw new Error(`Unable to find this statement!`);
    }

    return updateSourceFileStatements(
        file,
        [
            ...file.statements.slice(0, i),
            newStatement,
            ...file.statements.slice(i + 1)
        ]
    );
}
