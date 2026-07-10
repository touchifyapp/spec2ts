import type * as ts from "typescript/unstable/ast";

import { SyntaxKind } from "typescript/unstable/ast";
import * as factory from "typescript/unstable/ast/factory";
import * as astIs from "typescript/unstable/ast/is";

export type KeywordTypeName =
    | "any"
    | "number"
    | "object"
    | "string"
    | "boolean"
    | "bigint"
    | "symbol"
    | "this"
    | "void"
    | "unknown"
    | "undefined"
    | "null"
    | "never";

export const questionToken = factory.createToken(SyntaxKind.QuestionToken);
export const questionDotToken = factory.createToken(SyntaxKind.QuestionDotToken);

export const keywordType: Record<KeywordTypeName, ts.TypeNode> = {
    any: factory.createKeywordTypeNode(SyntaxKind.AnyKeyword),
    number: factory.createKeywordTypeNode(SyntaxKind.NumberKeyword),
    object: factory.createKeywordTypeNode(SyntaxKind.ObjectKeyword),
    string: factory.createKeywordTypeNode(SyntaxKind.StringKeyword),
    boolean: factory.createKeywordTypeNode(SyntaxKind.BooleanKeyword),
    bigint: factory.createKeywordTypeNode(SyntaxKind.BigIntKeyword),
    symbol: factory.createKeywordTypeNode(SyntaxKind.SymbolKeyword),
    this: factory.createThisTypeNode(),
    void: factory.createKeywordTypeNode(SyntaxKind.VoidKeyword),
    unknown: factory.createKeywordTypeNode(SyntaxKind.UnknownKeyword),
    undefined: factory.createKeywordTypeNode(SyntaxKind.UndefinedKeyword),
    null: factory.createLiteralTypeNode(factory.createKeywordExpression(SyntaxKind.NullKeyword)),
    never: factory.createKeywordTypeNode(SyntaxKind.NeverKeyword),
};

export const modifier: Record<string, ts.Modifier> = {
    async: factory.createToken(SyntaxKind.AsyncKeyword),
    export: factory.createToken(SyntaxKind.ExportKeyword),
};

export function getName(name: ts.Node): string | ts.__String {
    if (astIs.isIdentifier(name)) {
        return name.text;
    }
    if (astIs.isLiteralExpression(name)) {
        return name.text;
    }
    return "";
}

export function getString(expr: ts.Expression): string {
    if (astIs.isIdentifier(expr)) {
        return expr.text;
    }
    if (astIs.isLiteralExpression(expr)) {
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

export function appendNodes<T extends ts.Node>(array: ts.NodeArray<T>, ...nodes: T[]): ts.NodeArray<T> {
    return factory.createNodeArray([...array, ...nodes]);
}

export function replaceNode<T extends ts.Node>(array: ts.NodeArray<T>, oldNode: T, newNode: T): ts.NodeArray<T> {
    const i = array.indexOf(oldNode);
    if (i === -1) return array;

    return factory.createNodeArray([...array.slice(0, i), newNode, ...array.slice(i + 1)]);
}

export function block(...statements: ts.Statement[]): ts.Block {
    return factory.createBlock(statements, true);
}

export function isKeywordTypeName(type: string): type is KeywordTypeName {
    return type in keywordType;
}

export function isKeywordTypeNode(node?: ts.Node): node is ts.KeywordTypeNode {
    if (!node) return false;

    return astIs.isKeywordTypeNode(node);
}
