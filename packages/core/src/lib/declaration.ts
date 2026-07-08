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
    modifiers,
    name,
    typeParameters,
    type
}: {
    modifiers?: ts.Modifier[];
    name: string | ts.Identifier;
    typeParameters?: ts.TypeParameterDeclaration[];
    type: ts.TypeNode;
}): ts.TypeAliasDeclaration {
    return ts.factory.createTypeAliasDeclaration(
        modifiers,
        name,
        typeParameters,
        type
    );
}

export function createFunctionDeclaration(
    name: string | ts.Identifier | undefined,
    {
        modifiers,
        asteriskToken,
        typeParameters,
        type
    }: {
        modifiers?: ts.Modifier[];
        asteriskToken?: ts.AsteriskToken;
        typeParameters?: ts.TypeParameterDeclaration[];
        type?: ts.TypeNode;
    },
    parameters: ts.ParameterDeclaration[],
    body?: ts.Block
): ts.FunctionDeclaration {
    return ts.factory.createFunctionDeclaration(
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
    modifiers,
    name,
    typeParameters,
    heritageClauses,
    members
}: {
    modifiers?: ts.Modifier[];
    name: string | ts.Identifier;
    typeParameters?: ts.TypeParameterDeclaration[];
    heritageClauses?: ts.HeritageClause[];
    members: readonly ts.TypeElement[];
}): ts.InterfaceDeclaration {
    return ts.factory.createInterfaceDeclaration(
        modifiers,
        name,
        typeParameters,
        heritageClauses,
        members
    );
}

export function createClassDeclaration({
    modifiers,
    name,
    typeParameters,
    heritageClauses,
    members
}: {
    modifiers?: ts.Modifier[];
    name?: string | ts.Identifier;
    typeParameters?: ts.TypeParameterDeclaration[];
    heritageClauses?: ts.HeritageClause[];
    members: ts.ClassElement[];
}): ts.ClassDeclaration {
    return ts.factory.createClassDeclaration(
        modifiers,
        name,
        typeParameters,
        heritageClauses,
        members
    );
}

export function createConstructor({
    modifiers,
    parameters,
    body
}: {
    modifiers?: ts.Modifier[];
    parameters: ts.ParameterDeclaration[];
    body?: ts.Block;
}): ts.ConstructorDeclaration {
    return ts.factory.createConstructorDeclaration(modifiers, parameters, body);
}

export function createMethod(
    name:
        | string
        | ts.Identifier
        | ts.StringLiteral
        | ts.NumericLiteral
        | ts.ComputedPropertyName,
    {
        modifiers,
        asteriskToken,
        questionToken,
        typeParameters,
        type
    }: {
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
        modifiers,
        dotDotDotToken,
        questionToken,
        type,
        initializer
    }: {
        modifiers?: ts.Modifier[];
        dotDotDotToken?: ts.DotDotDotToken;
        questionToken?: ts.QuestionToken | boolean;
        type?: ts.TypeNode;
        initializer?: ts.Expression;
    }
): ts.ParameterDeclaration {
    return ts.factory.createParameterDeclaration(
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
        modifiers,
        indexName = "key",
        indexType = keywordType.string
    }: {
        indexName?: string;
        indexType?: ts.TypeNode;
        modifiers?: ts.Modifier[];
    } = {}
): ts.IndexSignatureDeclaration {
    return ts.factory.createIndexSignature(
        modifiers,
        [createParameter(indexName, { type: indexType })],
        type
    );
}

export function createNamedImportDeclaration({
    modifiers,
    bindings,
    isTypeOnly,
    moduleSpecifier
}: {
    modifiers?: ts.Modifier[];
    bindings: Array<ts.Identifier | string | ImportSpecifier>;
    isTypeOnly?: boolean;
    moduleSpecifier: string | ts.Expression;
}): ts.ImportDeclaration {
    return ts.factory.createImportDeclaration(
        modifiers,
        ts.factory.createImportClause(
            isTypeOnly || false,
            undefined,
            ts.factory.createNamedImports(
                bindings.map(createImportSpecifier)
            )
        ),
        toLiteral(moduleSpecifier),
    );
}

export function createDefaultImportDeclaration({
    modifiers,
    name,
    bindings,
    isTypeOnly,
    moduleSpecifier
}: {
    modifiers?: ts.Modifier[];
    name: ts.Identifier | string;
    bindings?: Array<ts.Identifier | string | ImportSpecifier>;
    isTypeOnly?: boolean;
    moduleSpecifier: string | ts.Expression;
}): ts.ImportDeclaration {
    return ts.factory.createImportDeclaration(
        modifiers,
        ts.factory.createImportClause(
            isTypeOnly || false,
            toIdentifier(name),
            bindings ?
                ts.factory.createNamedImports(
                    bindings.map(createImportSpecifier)
                ) :
                undefined
        ),
        toLiteral(moduleSpecifier),
    );
}

export function createNamespaceImportDeclaration({
    modifiers,
    name,
    isTypeOnly,
    moduleSpecifier
}: {
    modifiers?: ts.Modifier[];
    name: ts.Identifier | string;
    isTypeOnly?: boolean;
    moduleSpecifier: string | ts.Expression;
}): ts.ImportDeclaration {
    return ts.factory.createImportDeclaration(
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
    name,
    type
}: {
    modifiers?: ts.Modifier[];
    name: string | ts.Identifier;
    type: ts.TypeNode;
}): ts.InterfaceDeclaration | ts.TypeAliasDeclaration {
    if (ts.isTypeLiteralNode(type)) {
        return createInterfaceDeclaration({
            modifiers,
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
        name,
        type
    });
}

export function updateVariableDeclarationInitializer(declaration: ts.VariableDeclaration, initializer: ts.Expression): ts.VariableDeclaration {
    return ts.factory.updateVariableDeclaration(
        declaration,
        declaration.name,
        declaration.exclamationToken,
        declaration.type,
        initializer
    );
}

export type ImportSpecifier = { name: ts.Identifier | string; propertyName: ts.Identifier | string, type?: boolean; };
export function createImportSpecifier(binding: ts.Identifier | string | ImportSpecifier): ts.ImportSpecifier {
    if (typeof binding === "string" || isIdentifier(binding)) {
        if (ts.factory.createImportSpecifier.length === 2) {
            return (ts.factory.createImportSpecifier as any)(undefined, toIdentifier(binding));
        } else {
            return ts.factory.createImportSpecifier(false, undefined, toIdentifier(binding));
        }
    }

    if (ts.factory.createImportSpecifier.length === 2) {
        return (ts.factory.createImportSpecifier as any)(toIdentifier(binding.propertyName), toIdentifier(binding.name));
    } else {
        return ts.factory.createImportSpecifier(binding.type || false, toIdentifier(binding.propertyName), toIdentifier(binding.name));
    }
}
