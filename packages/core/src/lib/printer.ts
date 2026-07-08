import * as ts from "typescript";

const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed
});

export function printNode(node: ts.Node): string {
    const file = ts.createSourceFile(
        "someFileName.ts",
        "",
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS
    );

    return printer.printNode(ts.EmitHint.Unspecified, node, file);
}

export function printNodes(nodes: ts.Node[]): string {
    const file = ts.createSourceFile(
        "someFileName.ts",
        "",
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS
    );

    return nodes
        .map(node => printer.printNode(ts.EmitHint.Unspecified, node, file))
        .join("\n\n");
}

export function printFile(sourceFile: ts.SourceFile): string {
    return printer.printFile(sourceFile);
}
