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
