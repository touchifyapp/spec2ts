import * as ts from "typescript";

export type KeywordTypeName = "any" | "number" | "object" | "string" | "boolean" | "unknown" | "undefined" | "null";

export const questionToken = ts.createToken(ts.SyntaxKind.QuestionToken);

export const keywordType: Record<string, ts.KeywordTypeNode> = {
    any: ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
    number: ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
    object: ts.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword),
    string: ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
    boolean: ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
    undefined: ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword),
    null: ts.createKeywordTypeNode(ts.SyntaxKind.NullKeyword)
};

export const modifier: Record<string, ts.Modifier> = {
    async: ts.createModifier(ts.SyntaxKind.AsyncKeyword),
    export: ts.createModifier(ts.SyntaxKind.ExportKeyword)
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

export function createQuestionToken(token?: boolean | ts.QuestionToken): ts.QuestionToken | undefined {
    if (!token) return undefined;
    if (token === true) return questionToken;
    return token;
}

export function createKeywordType(type: KeywordTypeName): ts.KeywordTypeNode {
    switch (type) {
        case "any":
            return ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

        case "number":
            return ts.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);

        case "object":
            return ts.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword);

        case "string":
            return ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);

        case "boolean":
            return ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);

        case "unknown":
            return ts.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);

        case "undefined":
            return ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);

        case "null":
            return ts.createKeywordTypeNode(ts.SyntaxKind.NullKeyword);
    }
}

export function appendNodes<T extends ts.Node>(
    array: ts.NodeArray<T>,
    ...nodes: T[]
): ts.NodeArray<T> {
    return ts.createNodeArray([...array, ...nodes]);
}

export function block(...statements: ts.Statement[]): ts.Block {
    return ts.createBlock(statements, true);
}
