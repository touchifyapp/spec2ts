import * as ts from "typescript";

import { getName } from "./common";
import { createPropertyAssignment } from "./declaration";

export function toExpression(ex: ts.Expression | string): ts.Expression;
export function toExpression(ex: ts.Expression | string | undefined): ts.Expression | undefined;
export function toExpression(ex: ts.Expression | string | undefined): ts.Expression | undefined {
    if (typeof ex === "string") return ts.createIdentifier(ex);
    return ex;
}

export function toIdentifier(ex: ts.Identifier | string): ts.Identifier;
export function toIdentifier(ex: ts.Identifier | string | undefined): ts.Identifier | undefined;
export function toIdentifier(ex: ts.Identifier | string | undefined): ts.Identifier | undefined {
    if (typeof ex === "string") return ts.createIdentifier(ex);
    return ex;
}

export function toLiteral(ex: ts.Expression | string): ts.Expression;
export function toLiteral(ex: ts.Expression | string | undefined): ts.Expression | undefined;
export function toLiteral(ex: ts.Expression | string | undefined): ts.Expression | undefined {
    if (typeof ex === "string") return ts.createLiteral(ex);
    return ex;
}

export function toPropertyName(ex: ts.PropertyName | string): ts.PropertyName;
export function toPropertyName(ex: ts.PropertyName | string | undefined): ts.PropertyName | undefined;
export function toPropertyName(name: ts.PropertyName | string | undefined): ts.PropertyName | undefined {
    if (typeof name === "string") {
        return isValidIdentifier(name)
            ? ts.createIdentifier(name)
            : ts.createStringLiteral(name);
    }
    return name;
}

export function isValidIdentifier(str: string): boolean {
    if (!str.length || str.trim() !== str) return false;
    const node = ts.parseIsolatedEntityName(str, ts.ScriptTarget.Latest);
    return (
        !!node &&
        node.kind === ts.SyntaxKind.Identifier &&
        !("originalKeywordKind" in node)
    );
}

export function isIdentifier(n: object): n is ts.Identifier {
    return ts.isIdentifier(n as any);
}

export function createCall(
    expression: ts.Expression | string,
    {
        typeArgs,
        args
    }: {
        typeArgs?: ts.TypeNode[];
        args?: ts.Expression[];
    } = {}
): ts.CallExpression {
    return ts.createCall(toExpression(expression), typeArgs, args);
}

export function createMethodCall(
    method: string,
    opts: {
        typeArgs?: ts.TypeNode[];
        args?: ts.Expression[];
    }
): ts.CallExpression {
    return createCall(ts.createPropertyAccess(ts.createThis(), method), opts);
}

export function createTemplateString(
    head: string,
    spans: Array<{ literal: string; expression: ts.Expression }>
): ts.Expression {
    if (!spans.length) {
        return ts.createStringLiteral(head);
    }

    return ts.createTemplateExpression(
        ts.createTemplateHead(head),
        spans.map(({ expression, literal }, i) =>
            ts.createTemplateSpan(
                expression,
                i === spans.length - 1
                    ? ts.createTemplateTail(literal)
                    : ts.createTemplateMiddle(literal)
            )
        )
    );
}

export function createObjectLiteral(props: Array<[string, string | ts.Expression]>): ts.ObjectLiteralExpression {
    return ts.createObjectLiteral(
        props.map(([name, identifier]) =>
            createPropertyAssignment(name, toExpression(identifier))
        ),
        true
    );
}

export function createArrowFunction(
    parameters: ts.ParameterDeclaration[],
    body: ts.ConciseBody,
    {
        modifiers,
        typeParameters,
        type,
        equalsGreaterThanToken
    }: {
        modifiers?: ts.Modifier[];
        typeParameters?: ts.TypeParameterDeclaration[];
        type?: ts.TypeNode;
        equalsGreaterThanToken?: ts.EqualsGreaterThanToken;
    } = {}
): ts.ArrowFunction {
    return ts.createArrowFunction(
        modifiers,
        typeParameters,
        parameters,
        type,
        equalsGreaterThanToken,
        body
    );
}

export function createObjectBinding(
    elements: Array<{
        name: string | ts.BindingName;
        dotDotDotToken?: ts.DotDotDotToken;
        propertyName?: string | ts.PropertyName;
        initializer?: ts.Expression;
    }>
): ts.ObjectBindingPattern {
    return ts.createObjectBindingPattern(
        elements.map(({ dotDotDotToken, propertyName, name, initializer }) =>
            ts.createBindingElement(dotDotDotToken, propertyName, name, initializer)
        )
    );
}

export function changePropertyValue(
    o: ts.ObjectLiteralExpression,
    property: string,
    value: ts.Expression
): void {
    const p = o.properties.find(
        p => ts.isPropertyAssignment(p) && getName(p.name) === property
    );

    if (p && ts.isPropertyAssignment(p)) {
        p.initializer = value;
    } else {
        throw new Error(`No such property: ${property}`);
    }
}

export function addComment<T extends ts.Node>(node: T, comment?: string): T {
    if (!comment) return node;
    return ts.addSyntheticLeadingComment(
        node,
        ts.SyntaxKind.MultiLineCommentTrivia,
        `*\n * ${comment.replace(/\n/g, "\n * ")}\n `,
        true
    );
}
