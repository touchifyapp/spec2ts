import * as ts from "typescript";

import { getName, appendNodes } from "./common";
import { createPropertyAssignment } from "./declaration";

export function toExpression(ex: ts.Expression | string): ts.Expression;
export function toExpression(ex: ts.Expression | string | undefined): ts.Expression | undefined;
export function toExpression(ex: ts.Expression | string | undefined): ts.Expression | undefined {
    if (typeof ex === "string") return ts.factory.createIdentifier(ex);
    return ex;
}

export function toIdentifier(ex: ts.Identifier | string): ts.Identifier;
export function toIdentifier(ex: ts.Identifier | string | undefined): ts.Identifier | undefined;
export function toIdentifier(ex: ts.Identifier | string | undefined): ts.Identifier | undefined {
    if (typeof ex === "string") return ts.factory.createIdentifier(ex);
    return ex;
}

export function toLiteral(ex: ts.Expression | string | number | bigint): ts.Expression;
export function toLiteral(ex: ts.Expression | string | number | bigint | undefined): ts.Expression | undefined;
export function toLiteral(ex: ts.Expression | string | number | bigint | undefined): ts.Expression | undefined {
    if (ex === "true") return ts.factory.createTrue();
    if (ex === "false") return ts.factory.createFalse();
    if (typeof ex === "string") return ts.factory.createStringLiteral(ex);
    if (typeof ex === "number") return ts.factory.createNumericLiteral(ex);
    if (typeof ex === "bigint") return ts.factory.createBigIntLiteral(ex.toString());
    return ex;
}

export function toPropertyName(ex: ts.PropertyName | string): ts.PropertyName;
export function toPropertyName(ex: ts.PropertyName | string | undefined): ts.PropertyName | undefined;
export function toPropertyName(name: ts.PropertyName | string | undefined): ts.PropertyName | undefined {
    if (typeof name === "string") {
        return isValidIdentifier(name)
            ? ts.factory.createIdentifier(name)
            : ts.factory.createStringLiteral(name);
    }
    return name;
}

export function isValidIdentifier(str: string): boolean {
    if (!str.length || str.trim() !== str) return false;
    const node = ts.parseIsolatedEntityName(str, ts.ScriptTarget.Latest);
    return (
        !!node &&
        node.kind === ts.SyntaxKind.Identifier &&
        !ts.identifierToKeywordKind(node)
    );
}

export function isIdentifier(n: unknown | null | undefined): n is ts.Identifier {
    return !!n && ts.isIdentifier(n as ts.Node);
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
    return ts.factory.createCallExpression(toExpression(expression), typeArgs, args);
}

export function createMethodCall(
    method: string,
    opts: {
        typeArgs?: ts.TypeNode[];
        args?: ts.Expression[];
    }
): ts.CallExpression {
    return createCall(ts.factory.createPropertyAccessExpression(ts.factory.createThis(), method), opts);
}

export function createTemplateString(
    head: string,
    spans: Array<{ literal: string; expression: ts.Expression }>
): ts.Expression {
    if (!spans.length) {
        return ts.factory.createStringLiteral(head);
    }

    return ts.factory.createTemplateExpression(
        ts.factory.createTemplateHead(head),
        spans.map(({ expression, literal }, i) =>
            ts.factory.createTemplateSpan(
                expression,
                i === spans.length - 1
                    ? ts.factory.createTemplateTail(literal)
                    : ts.factory.createTemplateMiddle(literal)
            )
        )
    );
}

export function createObjectLiteral(props: Array<[string, string | ts.Expression]>): ts.ObjectLiteralExpression {
    return ts.factory.createObjectLiteralExpression(
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
    return ts.factory.createArrowFunction(
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
    return ts.factory.createObjectBindingPattern(
        elements.map(({ dotDotDotToken, propertyName, name, initializer }) =>
            ts.factory.createBindingElement(dotDotDotToken, propertyName, name, initializer)
        )
    );
}

export function changePropertyValue(
    o: ts.ObjectLiteralExpression,
    property: string,
    value: ts.Expression
): ts.ObjectLiteralExpression {
    const i = o.properties.findIndex(
        p => ts.isPropertyAssignment(p) && getName(p.name) === property
    );

    if (i === -1) {
        throw new Error(`No such property: ${property}`);
    }

    const p = o.properties[i];
    if (!ts.isPropertyAssignment(p)) {
        throw new Error(`Invalid node: ${property}`);
    }

    return ts.factory.updateObjectLiteralExpression(o, [
        ...o.properties.slice(0, i),
        ts.factory.updatePropertyAssignment(p, p.name, value),
        ...o.properties.slice(i + 1)
    ]);
}

export function upsertPropertyValue(
    o: ts.ObjectLiteralExpression,
    property: string,
    value: ts.Expression
): ts.ObjectLiteralExpression {
    const i = o.properties.findIndex(
        p => ts.isPropertyAssignment(p) && getName(p.name) === property
    );

    if (i === -1) {
        return ts.factory.updateObjectLiteralExpression(o, appendNodes(
            o.properties,
            ts.factory.createPropertyAssignment(property, value)
        ));
    }

    const p = o.properties[i];
    if (!ts.isPropertyAssignment(p)) {
        throw new Error(`Invalid node: ${property}`);
    }

    return ts.factory.updateObjectLiteralExpression(o, [
        ...o.properties.slice(0, i),
        ts.factory.updatePropertyAssignment(p, p.name, value),
        ...o.properties.slice(i + 1)
    ]);
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
