import type * as ts from "typescript/unstable/ast";

import { SyntaxKind } from "typescript/unstable/ast";
import * as factory from "typescript/unstable/ast/factory";
import * as astIs from "typescript/unstable/ast/is";

import { replaceNode } from "./common";
import { createPropertyAssignment, updateVariableDeclarationInitializer } from "./declaration";
import { upsertPropertyValue } from "./expression";
import { findNode, findVariableDeclarationName } from "./finder";

export function findFirstVariableStatement(nodes: ts.NodeArray<ts.Node>, variableName: string): ts.VariableStatement | undefined {
    return findNode<ts.VariableStatement>(nodes, SyntaxKind.VariableStatement, (n) => !!findVariableDeclarationName(n, variableName));
}

export function updateVariableStatementValue(
    statement: ts.VariableStatement,
    variableName: string,
    value: ts.Expression,
): ts.VariableStatement {
    const decla = findVariableDeclarationName(statement, variableName);
    if (!decla) {
        throw new Error(`Could not find variable declaration in given statement: ${variableName}`);
    }

    return factory.updateVariableStatement(
        statement,
        statement.modifiers,
        factory.updateVariableDeclarationList(
            statement.declarationList,
            replaceNode(statement.declarationList.declarations, decla, updateVariableDeclarationInitializer(decla, value)),
        ),
    );
}

export function updateVariableStatementPropertyValue(
    statement: ts.VariableStatement,
    variableName: string,
    propertyName: string,
    value: ts.Expression,
): ts.VariableStatement {
    const decla = findVariableDeclarationName(statement, variableName);
    if (!decla) {
        throw new Error(`Could not find variable declaration in given statement: ${variableName}`);
    }

    if (!decla.initializer || !astIs.isObjectLiteralExpression(decla.initializer)) {
        return factory.updateVariableStatement(
            statement,
            statement.modifiers,
            factory.updateVariableDeclarationList(
                statement.declarationList,
                replaceNode(
                    statement.declarationList.declarations,
                    decla,
                    updateVariableDeclarationInitializer(
                        decla,
                        factory.createObjectLiteralExpression([createPropertyAssignment(propertyName, value)]),
                    ),
                ),
            ),
        );
    }

    return factory.updateVariableStatement(
        statement,
        statement.modifiers,
        factory.updateVariableDeclarationList(
            statement.declarationList,
            replaceNode(
                statement.declarationList.declarations,
                decla,
                updateVariableDeclarationInitializer(decla, upsertPropertyValue(decla.initializer, propertyName, value)),
            ),
        ),
    );
}
