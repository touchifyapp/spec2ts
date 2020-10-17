import * as ts from "typescript";
import { promises as fs } from "fs";
import { appendNodes } from "./common";

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
    return ts.factory.updateSourceFile(
        file,
        appendNodes(file.statements, ...statements),
        file.isDeclarationFile,
        file.referencedFiles,
        file.typeReferenceDirectives,
        file.hasNoDefaultLib,
        file.libReferenceDirectives
    );
}

export function prependSourceFileStatements(file: ts.SourceFile, ...statements: ts.Statement[]): ts.SourceFile {
    return ts.factory.updateSourceFile(
        file,
        ts.factory.createNodeArray([
            ...statements,
            ...file.statements
        ]),
        file.isDeclarationFile,
        file.referencedFiles,
        file.typeReferenceDirectives,
        file.hasNoDefaultLib,
        file.libReferenceDirectives
    );
}
