import type * as ts from "typescript/unstable/ast";

import { createVirtualFileSystem } from "typescript/unstable/fs";
import { API } from "typescript/unstable/sync";

const syntheticCommentKey = Symbol.for("spec2ts.comment");

const printerApi = new API({
    cwd: "/",
    fs: createVirtualFileSystem({
        "/tsconfig.json": JSON.stringify({
            compilerOptions: {
                target: "ESNext",
                module: "ESNext",
            },
            files: ["/printer.ts"],
        }),
        "/printer.ts": "export {};\n",
    }),
});

const printerSnapshot = printerApi.updateSnapshot({
    openProjects: ["/tsconfig.json"],
    openFiles: ["/printer.ts"],
});

const printerProject = printerSnapshot.getProject("/tsconfig.json");
if (!printerProject) {
    throw new Error("Unable to initialize the TypeScript emitter project");
}

const printOptions = {
    preserveSourceNewlines: true,
};

function formatComment(comment: string): string {
    return `/**\n * ${comment.replace(/\n/g, "\n * ")}\n */\n`;
}

function printNodeWithComment(node: ts.Node): string {
    const content = printerProject!.emitter.printNode(node, printOptions);
    const comment = (node as ts.Node & { [syntheticCommentKey]?: string })[syntheticCommentKey];

    return comment ? formatComment(comment) + content : content;
}

export function printNode(node: ts.Node): string {
    return printNodeWithComment(node);
}

export function printNodes(nodes: ts.Node[]): string {
    return nodes.map(printNodeWithComment).join("\n\n");
}

export function printFile(sourceFile: ts.SourceFile): string {
    return printNodes([...sourceFile.statements]);
}
