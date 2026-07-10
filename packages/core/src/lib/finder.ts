import type * as ts from "typescript/unstable/ast";

import { SyntaxKind } from "typescript/unstable/ast";

import { getName } from "./common";

export function findNode<T extends ts.Node>(
    nodes: ts.NodeArray<ts.Node>,
    kind: T extends { kind: infer K } ? K : never,
    test?: (node: T) => boolean | undefined,
): T | undefined {
    const node = nodes.find((s) => s.kind === kind && (!test || test(s as T))) as T;
    return node;
}

export function filterNodes<T extends ts.Node>(
    nodes: ts.NodeArray<ts.Node>,
    kind: T extends { kind: infer K } ? K : never,
    test?: (node: T) => boolean | undefined,
): T[] {
    return nodes.filter((s) => s.kind === kind && (!test || test(s as T))) as T[];
}

export function findFirstVariableDeclaration(nodes: ts.NodeArray<ts.Node>, name: string): ts.VariableDeclaration | undefined {
    const statement = findNode<ts.VariableStatement>(
        nodes,
        SyntaxKind.VariableStatement,
        (n) => findFirstVariableDeclarationName(n) === name,
    );
    if (!statement) return;
    const [first] = statement.declarationList.declarations;
    return first;
}

export function findFirstVariableDeclarationName(n: ts.VariableStatement): string | ts.__String | undefined {
    const name = n.declarationList.declarations[0]?.name;
    return name && getName(name);
}

export function findVariableDeclarationName(variable: ts.VariableStatement, name: string): ts.VariableDeclaration | null {
    for (const decla of variable.declarationList.declarations) {
        if (getName(decla.name) === name) {
            return decla;
        }
    }

    return null;
}
