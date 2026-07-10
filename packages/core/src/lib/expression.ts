import type * as ts from "typescript/unstable/ast";

import { NodeFlags, ScriptTarget, SyntaxKind, TokenFlags } from "typescript/unstable/ast";
import * as factory from "typescript/unstable/ast/factory";
import * as astIs from "typescript/unstable/ast/is";
import { isIdentifierText, stringToToken } from "typescript/unstable/ast/scanner";

import { getName, appendNodes } from "./common";
import { createPropertyAssignment } from "./declaration";

const missingTypeNode = undefined as unknown as ts.TypeNode;
const syntheticCommentKey = Symbol.for("spec2ts.comment");

export function toExpression(ex: ts.Expression | string): ts.Expression;
export function toExpression(ex: ts.Expression | string | undefined): ts.Expression | undefined;
export function toExpression(ex: ts.Expression | string | undefined): ts.Expression | undefined {
    if (typeof ex === "string") return factory.createIdentifier(ex);
    return ex;
}

export function toIdentifier(ex: ts.Identifier | string): ts.Identifier;
export function toIdentifier(ex: ts.Identifier | string | undefined): ts.Identifier | undefined;
export function toIdentifier(ex: ts.Identifier | string | undefined): ts.Identifier | undefined {
    if (typeof ex === "string") return factory.createIdentifier(ex);
    return ex;
}

export function toLiteral(ex: ts.Expression | string | number | bigint): ts.Expression;
export function toLiteral(ex: ts.Expression | string | number | bigint | undefined): ts.Expression | undefined;
export function toLiteral(ex: ts.Expression | string | number | bigint | undefined): ts.Expression | undefined {
    if (ex === "true") return factory.createKeywordExpression(SyntaxKind.TrueKeyword);
    if (ex === "false") return factory.createKeywordExpression(SyntaxKind.FalseKeyword);
    if (typeof ex === "string") return factory.createStringLiteral(ex, TokenFlags.None);
    if (typeof ex === "number") return factory.createNumericLiteral(ex.toString(), TokenFlags.None);
    if (typeof ex === "bigint") return factory.createBigIntLiteral(ex.toString(), TokenFlags.None);
    return ex;
}

export function toPropertyName(ex: ts.PropertyName | string): ts.PropertyName;
export function toPropertyName(ex: ts.PropertyName | string | undefined): ts.PropertyName | undefined;
export function toPropertyName(name: ts.PropertyName | string | undefined): ts.PropertyName | undefined {
    if (typeof name === "string") {
        return isValidIdentifier(name) ? factory.createIdentifier(name) : factory.createStringLiteral(name, TokenFlags.None);
    }
    return name;
}

export function isValidIdentifier(str: string): boolean {
    if (!str.length || str.trim() !== str) return false;

    const token = stringToToken(str);
    return isIdentifierText(str, ScriptTarget.Latest) && (!token || !astIs.isKeywordKind(token));
}

export function isIdentifier(n: unknown): n is ts.Identifier {
    return !!n && typeof n === "object" && "kind" in n && astIs.isIdentifier(n as ts.Node);
}

export function createCall(
    expression: ts.Expression | string,
    {
        typeArgs,
        args,
    }: {
        typeArgs?: ts.TypeNode[];
        args?: ts.Expression[];
    } = {},
): ts.CallExpression {
    return factory.createCallExpression(toExpression(expression), undefined, typeArgs, args ?? [], NodeFlags.None);
}

export function createMethodCall(
    method: string,
    opts: {
        typeArgs?: ts.TypeNode[];
        args?: ts.Expression[];
    },
): ts.CallExpression {
    return createCall(
        factory.createPropertyAccessExpression(
            factory.createKeywordExpression(SyntaxKind.ThisKeyword),
            undefined,
            factory.createIdentifier(method),
            NodeFlags.None,
        ),
        opts,
    );
}

export function createTemplateString(head: string, spans: Array<{ literal: string; expression: ts.Expression }>): ts.Expression {
    if (!spans.length) {
        return factory.createStringLiteral(head, TokenFlags.None);
    }

    return factory.createTemplateExpression(
        factory.createTemplateHead(head, head, TokenFlags.None),
        spans.map(({ expression, literal }, i) =>
            factory.createTemplateSpan(
                expression,
                i === spans.length - 1
                    ? factory.createTemplateTail(literal, literal, TokenFlags.None)
                    : factory.createTemplateMiddle(literal, literal, TokenFlags.None),
            ),
        ),
    );
}

export function createObjectLiteral(props: Array<[string, string | ts.Expression]>): ts.ObjectLiteralExpression {
    return factory.createObjectLiteralExpression(
        props.map(([name, identifier]) => createPropertyAssignment(name, toExpression(identifier))),
        true,
    );
}

export function createArrowFunction(
    parameters: ts.ParameterDeclaration[],
    body: ts.ConciseBody,
    {
        modifiers,
        typeParameters,
        type,
        equalsGreaterThanToken,
    }: {
        modifiers?: ts.Modifier[];
        typeParameters?: ts.TypeParameterDeclaration[];
        type?: ts.TypeNode;
        equalsGreaterThanToken?: ts.EqualsGreaterThanToken;
    } = {},
): ts.ArrowFunction {
    return factory.createArrowFunction(
        modifiers,
        typeParameters,
        parameters,
        type,
        equalsGreaterThanToken ?? factory.createToken(SyntaxKind.EqualsGreaterThanToken),
        body,
    );
}

export function createObjectBinding(
    elements: Array<{
        name: string | ts.BindingName;
        dotDotDotToken?: ts.DotDotDotToken;
        propertyName?: string | ts.PropertyName;
        initializer?: ts.Expression;
    }>,
): ts.ObjectBindingPattern {
    return factory.createObjectBindingPattern(
        elements.map(({ dotDotDotToken, propertyName, name, initializer }) =>
            factory.createBindingElement(
                dotDotDotToken,
                typeof propertyName === "string" ? toPropertyName(propertyName) : propertyName,
                typeof name === "string" ? factory.createIdentifier(name) : name,
                initializer,
            ),
        ),
    );
}

export function changePropertyValue(o: ts.ObjectLiteralExpression, property: string, value: ts.Expression): ts.ObjectLiteralExpression {
    const i = o.properties.findIndex((p) => astIs.isPropertyAssignment(p) && getName(p.name) === property);

    if (i === -1) {
        throw new Error(`No such property: ${property}`);
    }

    const p = o.properties[i];
    if (!astIs.isPropertyAssignment(p)) {
        throw new Error(`Invalid node: ${property}`);
    }

    return factory.updateObjectLiteralExpression(o, [
        ...o.properties.slice(0, i),
        factory.updatePropertyAssignment(p, p.modifiers, p.name, p.postfixToken, p.type ?? missingTypeNode, value),
        ...o.properties.slice(i + 1),
    ]);
}

export function upsertPropertyValue(o: ts.ObjectLiteralExpression, property: string, value: ts.Expression): ts.ObjectLiteralExpression {
    const i = o.properties.findIndex((p) => astIs.isPropertyAssignment(p) && getName(p.name) === property);

    if (i === -1) {
        return factory.updateObjectLiteralExpression(o, appendNodes(o.properties, createPropertyAssignment(property, value)));
    }

    const p = o.properties[i];
    if (!astIs.isPropertyAssignment(p)) {
        throw new Error(`Invalid node: ${property}`);
    }

    return factory.updateObjectLiteralExpression(o, [
        ...o.properties.slice(0, i),
        factory.updatePropertyAssignment(p, p.modifiers, p.name, p.postfixToken, p.type ?? missingTypeNode, value),
        ...o.properties.slice(i + 1),
    ]);
}

export function addComment<T extends ts.Node>(node: T, comment?: string): T {
    if (!comment) return node;

    (node as T & { [syntheticCommentKey]?: string })[syntheticCommentKey] = comment;
    return node;
}
