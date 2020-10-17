import * as ts from "typescript";

import {
    keywordType,
    createQuestionToken
} from "./common";

import {
    isIdentifier,
    toIdentifier,
    toLiteral,
    toPropertyName
} from "./expression";

export function createTypeAliasDeclaration({
    decorators,
    modifiers,
    name,
    typeParameters,
    type
}: {
    decorators?: ts.Decorator[];
    modifiers?: ts.Modifier[];
    name: string | ts.Identifier;
    typeParameters?: ts.TypeParameterDeclaration[];
    type: ts.TypeNode;
}): ts.TypeAliasDeclaration {
    return ts.factory.createTypeAliasDeclaration(
        decorators,
        modifiers,
        name,
        typeParameters,
        type
    );
}

export function createFunctionDeclaration(
    name: string | ts.Identifier | undefined,
    {
        decorators,
        modifiers,
        asteriskToken,
        typeParameters,
        type
    }: {
        decorators?: ts.Decorator[];
        modifiers?: ts.Modifier[];
        asteriskToken?: ts.AsteriskToken;
        typeParameters?: ts.TypeParameterDeclaration[];
        type?: ts.TypeNode;
    },
    parameters: ts.ParameterDeclaration[],
    body?: ts.Block
): ts.FunctionDeclaration {
    return ts.factory.createFunctionDeclaration(
        decorators,
        modifiers,
        asteriskToken,
        name,
        typeParameters,
        parameters,
        type,
        body
    );
}

export function createInterfaceDeclaration({
    decorators,
    modifiers,
    name,
    typeParameters,
    heritageClauses,
    members
}: {
    decorators?: ts.Decorator[];
    modifiers?: ts.Modifier[];
    name: string | ts.Identifier;
    typeParameters?: ts.TypeParameterDeclaration[];
    heritageClauses?: ts.HeritageClause[];
    members: readonly ts.TypeElement[];
}): ts.InterfaceDeclaration {
    return ts.factory.createInterfaceDeclaration(
        decorators,
        modifiers,
        name,
        typeParameters,
        heritageClauses,
        members
    );
}

export function createClassDeclaration({
    decorators,
    modifiers,
    name,
    typeParameters,
    heritageClauses,
    members
}: {
    decorators?: ts.Decorator[];
    modifiers?: ts.Modifier[];
    name?: string | ts.Identifier;
    typeParameters?: ts.TypeParameterDeclaration[];
    heritageClauses?: ts.HeritageClause[];
    members: ts.ClassElement[];
}): ts.ClassDeclaration {
    return ts.factory.createClassDeclaration(
        decorators,
        modifiers,
        name,
        typeParameters,
        heritageClauses,
        members
    );
}

export function createConstructor({
    decorators,
    modifiers,
    parameters,
    body
}: {
    decorators?: ts.Decorator[];
    modifiers?: ts.Modifier[];
    parameters: ts.ParameterDeclaration[];
    body?: ts.Block;
}): ts.ConstructorDeclaration {
    return ts.factory.createConstructorDeclaration(decorators, modifiers, parameters, body);
}

export function createMethod(
    name:
        | string
        | ts.Identifier
        | ts.StringLiteral
        | ts.NumericLiteral
        | ts.ComputedPropertyName,
    {
        decorators,
        modifiers,
        asteriskToken,
        questionToken,
        typeParameters,
        type
    }: {
        decorators?: ts.Decorator[];
        modifiers?: ts.Modifier[];
        asteriskToken?: ts.AsteriskToken;
        questionToken?: ts.QuestionToken | boolean;
        typeParameters?: ts.TypeParameterDeclaration[];
        type?: ts.TypeNode;
    } = {},
    parameters: ts.ParameterDeclaration[] = [],
    body?: ts.Block
): ts.MethodDeclaration {
    return ts.factory.createMethodDeclaration(
        decorators,
        modifiers,
        asteriskToken,
        name,
        createQuestionToken(questionToken),
        typeParameters,
        parameters,
        type,
        body
    );
}

export function createParameter(
    name: string | ts.BindingName,
    {
        decorators,
        modifiers,
        dotDotDotToken,
        questionToken,
        type,
        initializer
    }: {
        decorators?: ts.Decorator[];
        modifiers?: ts.Modifier[];
        dotDotDotToken?: ts.DotDotDotToken;
        questionToken?: ts.QuestionToken | boolean;
        type?: ts.TypeNode;
        initializer?: ts.Expression;
    }
): ts.ParameterDeclaration {
    return ts.factory.createParameterDeclaration(
        decorators,
        modifiers,
        dotDotDotToken,
        name,
        createQuestionToken(questionToken),
        type,
        initializer
    );
}

export function createPropertySignature({
    modifiers,
    name,
    questionToken,
    type,
}: {
    modifiers?: ts.Modifier[];
    name: ts.PropertyName | string;
    questionToken?: ts.QuestionToken | boolean;
    type?: ts.TypeNode;
}): ts.PropertySignature {
    return ts.factory.createPropertySignature(
        modifiers,
        toPropertyName(name),
        createQuestionToken(questionToken),
        type
    );
}

export function createPropertyAssignment(
    name: string,
    expression: ts.Expression
): ts.PropertyAssignment | ts.ShorthandPropertyAssignment {
    if (ts.isIdentifier(expression)) {
        if (expression.text === name) {
            return ts.factory.createShorthandPropertyAssignment(name);
        }
    }

    return ts.factory.createPropertyAssignment(toPropertyName(name), expression);
}

export function createIndexSignature(
    type: ts.TypeNode,
    {
        decorators,
        modifiers,
        indexName = "key",
        indexType = keywordType.string
    }: {
        indexName?: string;
        indexType?: ts.TypeNode;
        decorators?: ts.Decorator[];
        modifiers?: ts.Modifier[];
    } = {}
): ts.IndexSignatureDeclaration {
    return ts.factory.createIndexSignature(
        decorators,
        modifiers,
        [createParameter(indexName, { type: indexType })],
        type
    );
}

export function createNamedImportDeclaration({
    decorators,
    modifiers,
    bindings,
    isTypeOnly,
    moduleSpecifier
}: {
    decorators?: ts.Decorator[];
    modifiers?: ts.Modifier[];
    bindings: Array<ts.Identifier | string | { name: ts.Identifier | string; propertyName: ts.Identifier | string }>;
    isTypeOnly?: boolean;
    moduleSpecifier: string | ts.Expression;
}): ts.ImportDeclaration {
    return ts.factory.createImportDeclaration(
        decorators,
        modifiers,
        ts.factory.createImportClause(
            isTypeOnly || false,
            undefined,
            ts.factory.createNamedImports(
                bindings.map(b => {
                    if (typeof b === "string" || isIdentifier(b)) {
                        return ts.factory.createImportSpecifier(undefined, toIdentifier(b));
                    }

                    return ts.factory.createImportSpecifier(toIdentifier(b.propertyName), toIdentifier(b.name));
                })
            )
        ),
        toLiteral(moduleSpecifier),
    );
}

export function createDefaultImportDeclaration({
    decorators,
    modifiers,
    name,
    bindings,
    isTypeOnly,
    moduleSpecifier
}: {
    decorators?: ts.Decorator[];
    modifiers?: ts.Modifier[];
    name: ts.Identifier | string;
    bindings?: Array<ts.Identifier | string | { name: ts.Identifier | string; propertyName: ts.Identifier | string }>;
    isTypeOnly?: boolean;
    moduleSpecifier: string | ts.Expression;
}): ts.ImportDeclaration {
    return ts.factory.createImportDeclaration(
        decorators,
        modifiers,
        ts.factory.createImportClause(
            isTypeOnly || false,
            toIdentifier(name),
            bindings ?
                ts.factory.createNamedImports(
                    bindings.map(b => {
                        if (typeof b === "string" || isIdentifier(b)) {
                            return ts.factory.createImportSpecifier(undefined, toIdentifier(b));
                        }

                        return ts.factory.createImportSpecifier(toIdentifier(b.propertyName), toIdentifier(b.name));
                    })
                ) :
                undefined
        ),
        toLiteral(moduleSpecifier),
    );
}

export function createNamespaceImportDeclaration({
    decorators,
    modifiers,
    name,
    isTypeOnly,
    moduleSpecifier
}: {
    decorators?: ts.Decorator[];
    modifiers?: ts.Modifier[];
    name: ts.Identifier | string;
    isTypeOnly?: boolean;
    moduleSpecifier: string | ts.Expression;
}): ts.ImportDeclaration {
    return ts.factory.createImportDeclaration(
        decorators,
        modifiers,
        ts.factory.createImportClause(
            isTypeOnly || false,
            undefined,
            ts.factory.createNamespaceImport(toIdentifier(name))
        ),
        toLiteral(moduleSpecifier),
    );
}

export function createTypeOrInterfaceDeclaration({
    modifiers,
    decorators,
    name,
    type
}: {
    modifiers?: ts.Modifier[];
    decorators?: ts.Decorator[];
    name: string | ts.Identifier;
    type: ts.TypeNode;
}): ts.InterfaceDeclaration | ts.TypeAliasDeclaration {
    if (ts.isTypeLiteralNode(type)) {
        return createInterfaceDeclaration({
            modifiers,
            decorators,
            name,
            members: type.members
        });
    }

    if (ts.isIntersectionTypeNode(type)) {
        const isExtendCompatible = type.types.every(t => ts.isTypeLiteralNode(t) || (ts.isTypeReferenceNode(t) && ts.isIdentifier(t.typeName)));
        if (isExtendCompatible) {
            const members: ts.TypeElement[] = [];
            const extend: ts.Identifier[] = [];

            type.types.forEach(t => {
                if (ts.isTypeLiteralNode(t)) {
                    members.push(...t.members);
                }

                if (ts.isTypeReferenceNode(t) && ts.isIdentifier(t.typeName)) {
                    extend.push(t.typeName);
                }
            });

            return createInterfaceDeclaration({
                modifiers,
                decorators,
                name,
                members,
                heritageClauses: [
                    ts.factory.createHeritageClause(
                        ts.SyntaxKind.ExtendsKeyword,
                        extend.map(t => ts.factory.createExpressionWithTypeArguments(t, undefined))
                    )
                ]
            });
        }
    }

    return createTypeAliasDeclaration({
        modifiers,
        decorators,
        name,
        type
    });
}
