import type * as ts from "typescript/unstable/ast";

import { SyntaxKind, TokenFlags } from "typescript/unstable/ast";
import * as factory from "typescript/unstable/ast/factory";
import * as astIs from "typescript/unstable/ast/is";

import { keywordType, createQuestionToken } from "./common";
import { toIdentifier, toLiteral, toPropertyName } from "./expression";

const missingTypeNode = undefined as unknown as ts.TypeNode;
const missingExpression = undefined as unknown as ts.Expression;

function toImportPhaseModifier(isTypeOnly?: boolean): ts.ImportPhaseModifierSyntaxKind | undefined {
    return isTypeOnly ? SyntaxKind.TypeKeyword : undefined;
}

export function createIdentifier(name: string | ts.Identifier): ts.Identifier;
export function createIdentifier(name: string | ts.Identifier | undefined): ts.Identifier | undefined;
export function createIdentifier(name: string | ts.Identifier | undefined): ts.Identifier | undefined {
    if (!name) return undefined;
    if (typeof name === "string") return factory.createIdentifier(name);
    return name;
}

export function createTypeReferenceNode(name: string, typeArguments?: readonly ts.TypeNode[]): ts.TypeReferenceNode {
    return factory.createTypeReferenceNode(createIdentifier(name), typeArguments);
}

export function createStringLiteral(value: string): ts.StringLiteral {
    return factory.createStringLiteral(value, TokenFlags.None);
}

export function createNumericLiteral(value: number | string): ts.NumericLiteral {
    return factory.createNumericLiteral(String(value), TokenFlags.None);
}

export function createBooleanLiteral(value: boolean): ts.BooleanLiteral {
    return factory.createKeywordExpression(value ? SyntaxKind.TrueKeyword : SyntaxKind.FalseKeyword);
}

export function createTypeAliasDeclaration({
    modifiers,
    name,
    typeParameters,
    type,
}: {
    modifiers?: ts.Modifier[];
    name: string | ts.Identifier;
    typeParameters?: ts.TypeParameterDeclaration[];
    type: ts.TypeNode;
}): ts.TypeAliasDeclaration {
    return factory.createTypeAliasDeclaration(modifiers, createIdentifier(name), typeParameters, type);
}

export function createFunctionDeclaration(
    name: string | ts.Identifier | undefined,
    {
        modifiers,
        asteriskToken,
        typeParameters,
        type,
    }: {
        modifiers?: ts.Modifier[];
        asteriskToken?: ts.AsteriskToken;
        typeParameters?: ts.TypeParameterDeclaration[];
        type?: ts.TypeNode;
    },
    parameters: ts.ParameterDeclaration[],
    body?: ts.Block,
): ts.FunctionDeclaration {
    return factory.createFunctionDeclaration(modifiers, asteriskToken, createIdentifier(name), typeParameters, parameters, type, body);
}

export function createInterfaceDeclaration({
    modifiers,
    name,
    typeParameters,
    heritageClauses,
    members,
}: {
    modifiers?: ts.Modifier[];
    name: string | ts.Identifier;
    typeParameters?: ts.TypeParameterDeclaration[];
    heritageClauses?: ts.HeritageClause[];
    members: readonly ts.TypeElement[];
}): ts.InterfaceDeclaration {
    return factory.createInterfaceDeclaration(modifiers, createIdentifier(name), typeParameters, heritageClauses, members);
}

export function createClassDeclaration({
    modifiers,
    name,
    typeParameters,
    heritageClauses,
    members,
}: {
    modifiers?: ts.Modifier[];
    name?: string | ts.Identifier;
    typeParameters?: ts.TypeParameterDeclaration[];
    heritageClauses?: ts.HeritageClause[];
    members: ts.ClassElement[];
}): ts.ClassDeclaration {
    return factory.createClassDeclaration(modifiers, createIdentifier(name), typeParameters, heritageClauses, members);
}

export function createConstructor({
    modifiers,
    parameters,
    body,
}: {
    modifiers?: ts.Modifier[];
    parameters: ts.ParameterDeclaration[];
    body?: ts.Block;
}): ts.ConstructorDeclaration {
    return factory.createConstructorDeclaration(modifiers, undefined, parameters, undefined, body);
}

export function createMethod(
    name:
        | string
        | ts.Identifier
        | ts.StringLiteral
        | ts.NoSubstitutionTemplateLiteral
        | ts.NumericLiteral
        | ts.ComputedPropertyName
        | ts.PrivateIdentifier
        | ts.BigIntLiteral,
    {
        modifiers,
        asteriskToken,
        questionToken,
        typeParameters,
        type,
    }: {
        modifiers?: ts.Modifier[];
        asteriskToken?: ts.AsteriskToken;
        questionToken?: ts.QuestionToken | boolean;
        typeParameters?: ts.TypeParameterDeclaration[];
        type?: ts.TypeNode;
    } = {},
    parameters: ts.ParameterDeclaration[] = [],
    body?: ts.Block,
): ts.MethodDeclaration {
    if (typeof name === "string") name = factory.createIdentifier(name);

    return factory.createMethodDeclaration(
        modifiers,
        asteriskToken,
        name,
        createQuestionToken(questionToken),
        typeParameters,
        parameters,
        type,
        body,
    );
}

export function createParameter(
    name: string | ts.Identifier | ts.BindingName,
    {
        modifiers,
        dotDotDotToken,
        questionToken,
        type,
        initializer,
    }: {
        modifiers?: ts.Modifier[];
        dotDotDotToken?: ts.DotDotDotToken;
        questionToken?: ts.QuestionToken | boolean;
        type?: ts.TypeNode;
        initializer?: ts.Expression;
    },
): ts.ParameterDeclaration {
    if (typeof name === "string") name = factory.createIdentifier(name);
    return factory.createParameterDeclaration(modifiers, dotDotDotToken, name, createQuestionToken(questionToken), type, initializer);
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
}): ts.PropertySignatureDeclaration {
    return factory.createPropertySignatureDeclaration(
        modifiers,
        toPropertyName(name),
        createQuestionToken(questionToken),
        type ?? missingTypeNode,
        missingExpression,
    );
}

export function createPropertyAssignment(
    name: string,
    expression: ts.Expression,
    { modifiers, postfixToken }: { modifiers?: ts.Modifier[]; postfixToken?: ts.QuestionToken | ts.ExclamationToken | undefined } = {},
): ts.PropertyAssignment | ts.ShorthandPropertyAssignment {
    if (astIs.isIdentifier(expression)) {
        if (expression.text === name) {
            return factory.createShorthandPropertyAssignment(modifiers, expression, postfixToken, missingTypeNode);
        }
    }

    return factory.createPropertyAssignment(modifiers, toPropertyName(name), postfixToken, missingTypeNode, expression);
}

export function createIndexSignature(
    type: ts.TypeNode,
    {
        modifiers,
        indexName = "key",
        indexType = keywordType.string,
    }: {
        indexName?: string;
        indexType?: ts.TypeNode;
        modifiers?: ts.Modifier[];
    } = {},
): ts.IndexSignatureDeclaration {
    return factory.createIndexSignatureDeclaration(modifiers, [createParameter(indexName, { type: indexType })], type);
}

export function createNamedImportDeclaration({
    modifiers,
    bindings,
    isTypeOnly,
    moduleSpecifier,
}: {
    modifiers?: ts.Modifier[];
    bindings: Array<ts.Identifier | string | ImportSpecifier>;
    isTypeOnly?: boolean;
    moduleSpecifier: string | ts.Expression;
}): ts.ImportDeclaration {
    return factory.createImportDeclaration(
        modifiers,
        factory.createImportClause(
            toImportPhaseModifier(isTypeOnly),
            undefined,
            factory.createNamedImports(bindings.map(createImportSpecifier)),
        ),
        toLiteral(moduleSpecifier),
    );
}

export function createDefaultImportDeclaration({
    modifiers,
    name,
    bindings,
    isTypeOnly,
    moduleSpecifier,
}: {
    modifiers?: ts.Modifier[];
    name: ts.Identifier | string;
    bindings?: Array<ts.Identifier | string | ImportSpecifier>;
    isTypeOnly?: boolean;
    moduleSpecifier: string | ts.Expression;
}): ts.ImportDeclaration {
    return factory.createImportDeclaration(
        modifiers,
        factory.createImportClause(
            toImportPhaseModifier(isTypeOnly),
            toIdentifier(name),
            bindings ? factory.createNamedImports(bindings.map(createImportSpecifier)) : undefined,
        ),
        toLiteral(moduleSpecifier),
    );
}

export function createNamespaceImportDeclaration({
    modifiers,
    name,
    isTypeOnly,
    moduleSpecifier,
}: {
    modifiers?: ts.Modifier[];
    name: ts.Identifier | string;
    isTypeOnly?: boolean;
    moduleSpecifier: string | ts.Expression;
}): ts.ImportDeclaration {
    return factory.createImportDeclaration(
        modifiers,
        factory.createImportClause(toImportPhaseModifier(isTypeOnly), undefined, factory.createNamespaceImport(toIdentifier(name))),
        toLiteral(moduleSpecifier),
    );
}

export function createTypeOrInterfaceDeclaration({
    modifiers,
    name,
    type,
}: {
    modifiers?: ts.Modifier[];
    name: string | ts.Identifier;
    type: ts.TypeNode;
}): ts.InterfaceDeclaration | ts.TypeAliasDeclaration {
    if (astIs.isTypeLiteralNode(type)) {
        return createInterfaceDeclaration({
            modifiers,
            name,
            members: type.members,
        });
    }

    if (astIs.isIntersectionTypeNode(type)) {
        const isExtendCompatible = type.types.every(
            (t) => astIs.isTypeLiteralNode(t) || (astIs.isTypeReferenceNode(t) && astIs.isIdentifier(t.typeName)),
        );
        if (isExtendCompatible) {
            const members: ts.TypeElement[] = [];
            const extend: ts.Identifier[] = [];

            type.types.forEach((t) => {
                if (astIs.isTypeLiteralNode(t)) {
                    members.push(...t.members);
                }

                if (astIs.isTypeReferenceNode(t) && astIs.isIdentifier(t.typeName)) {
                    extend.push(t.typeName);
                }
            });

            return createInterfaceDeclaration({
                modifiers,
                name,
                members,
                heritageClauses: [
                    factory.createHeritageClause(
                        SyntaxKind.ExtendsKeyword,
                        extend.map((t) => factory.createExpressionWithTypeArguments(t, undefined)),
                    ),
                ],
            });
        }
    }

    return createTypeAliasDeclaration({
        modifiers,
        name,
        type,
    });
}

export function updateVariableDeclarationInitializer(
    declaration: ts.VariableDeclaration,
    initializer: ts.Expression,
): ts.VariableDeclaration {
    return factory.updateVariableDeclaration(declaration, declaration.name, declaration.exclamationToken, declaration.type, initializer);
}

export type ImportSpecifier = { name: ts.Identifier | string; propertyName: ts.Identifier | string; type?: boolean };
export function createImportSpecifier(binding: ts.Identifier | string | ImportSpecifier): ts.ImportSpecifier {
    if (typeof binding === "string") {
        return factory.createImportSpecifier(false, undefined, toIdentifier(binding));
    }

    if ("kind" in binding) {
        return factory.createImportSpecifier(false, undefined, binding);
    }

    return factory.createImportSpecifier(binding.type || false, toIdentifier(binding.propertyName), toIdentifier(binding.name));
}
