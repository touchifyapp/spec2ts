import * as ts from "typescript";

export type KeywordTypeName = "any" | "number" | "object" | "string" | "boolean" | "bigint" | "symbol" | "this" | "void" | "unknown" | "undefined" | "null" | "never";

export const questionToken = ts.factory.createToken(ts.SyntaxKind.QuestionToken);
export const questionDotToken = ts.factory.createToken(ts.SyntaxKind.QuestionDotToken);

export const keywordType: Record<KeywordTypeName, ts.TypeNode> = {
    any: ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
    number: ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
    object: ts.factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword),
    string: ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    boolean: ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
    bigint: ts.factory.createKeywordTypeNode(ts.SyntaxKind.BigIntKeyword),
    symbol: ts.factory.createKeywordTypeNode(ts.SyntaxKind.SymbolKeyword),
    this: ts.factory.createThisTypeNode(),
    void: ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
    unknown: ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
    undefined: ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
    null: ts.factory.createLiteralTypeNode(ts.factory.createNull()),
    never: ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword)
};

export const modifier: Record<string, ts.Modifier> = {
    async: ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword),
    export: ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)
};

export function getName(name: ts.Node): string | ts.__String {
    if (ts.isIdentifier(name)) {
        return name.escapedText;
    }
    if (ts.isLiteralExpression(name)) {
        return name.text;
    }
    return "";
}

export function getString(expr: ts.Expression): string {
    if (ts.isIdentifier(expr)) {
        return expr.escapedText.toString();
    }
    if (ts.isLiteralExpression(expr)) {
        return expr.text;
    }
    return "";
}

export function createQuestionToken(token?: boolean | ts.QuestionToken): ts.QuestionToken | undefined {
    if (!token) return undefined;
    if (token === true) return questionToken;
    return token;
}

export function createKeywordType(type: KeywordTypeName): ts.TypeNode {
    return keywordType[type];
}

export function appendNodes<T extends ts.Node>(
    array: ts.NodeArray<T>,
    ...nodes: T[]
): ts.NodeArray<T> {
    return ts.factory.createNodeArray([...array, ...nodes]);
}

export function replaceNode<T extends ts.Node>(array: ts.NodeArray<T>, oldNode: T, newNode: T): ts.NodeArray<T> {
    const i = array.indexOf(oldNode);
    if (i === -1) return array;

    return ts.factory.createNodeArray([
        ...array.slice(0, i),
        newNode,
        ...array.slice(i + 1)
    ]);
}

export function block(...statements: ts.Statement[]): ts.Block {
    return ts.factory.createBlock(statements, true);
}

export function isKeywordTypeName(type: string): type is KeywordTypeName {
    return type in keywordType;
}

export function isKeywordTypeNode(node?: ts.Node): node is ts.KeywordTypeNode {
    if (!node) return false;

    return node.kind === ts.SyntaxKind.AnyKeyword ||
        node.kind === ts.SyntaxKind.UnknownKeyword ||
        node.kind === ts.SyntaxKind.NumberKeyword ||
        node.kind === ts.SyntaxKind.BigIntKeyword ||
        node.kind === ts.SyntaxKind.ObjectKeyword ||
        node.kind === ts.SyntaxKind.BooleanKeyword ||
        node.kind === ts.SyntaxKind.StringKeyword ||
        node.kind === ts.SyntaxKind.SymbolKeyword ||
        node.kind === ts.SyntaxKind.ThisKeyword ||
        node.kind === ts.SyntaxKind.VoidKeyword ||
        node.kind === ts.SyntaxKind.UndefinedKeyword ||
        node.kind === ts.SyntaxKind.NullKeyword ||
        node.kind === ts.SyntaxKind.NeverKeyword;
}
