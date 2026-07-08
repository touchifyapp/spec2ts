import * as ts from "typescript";
import { replaceNode } from "./common";

import { updateVariableDeclarationInitializer } from "./declaration";
import { upsertPropertyValue } from "./expression";
import { findNode, findVariableDeclarationName } from "./finder";

export function findFirstVariableStatement(nodes: ts.NodeArray<ts.Node>, variableName: string): ts.VariableStatement | undefined {
    return findNode<ts.VariableStatement>(
        nodes,
        ts.SyntaxKind.VariableStatement,
        n => !!findVariableDeclarationName(n, variableName)
    );
}

export function updateVariableStatementValue(statement: ts.VariableStatement, variableName: string, value: ts.Expression): ts.VariableStatement {
    const decla = findVariableDeclarationName(statement, variableName);
    if (!decla) {
        throw new Error(`Could not find variable declaration in given statement: ${variableName}`);
    }

    return ts.factory.updateVariableStatement(
        statement,
        statement.modifiers,
        ts.factory.updateVariableDeclarationList(
            statement.declarationList,
            replaceNode(
                statement.declarationList.declarations,
                decla,
                updateVariableDeclarationInitializer(decla, value)
            )
        )
    );
}

export function updateVariableStatementPropertyValue(statement: ts.VariableStatement, variableName: string, propertyName: string, value: ts.Expression): ts.VariableStatement {
    const decla = findVariableDeclarationName(statement, variableName);
    if (!decla) {
        throw new Error(`Could not find variable declaration in given statement: ${variableName}`);
    }

    if (!decla.initializer || !ts.isObjectLiteralExpression(decla.initializer)) {
        return ts.factory.updateVariableStatement(
            statement,
            statement.modifiers,
            ts.factory.updateVariableDeclarationList(
                statement.declarationList,
                replaceNode(
                    statement.declarationList.declarations,
                    decla,
                    updateVariableDeclarationInitializer(
                        decla,
                        ts.factory.createObjectLiteralExpression([
                            ts.factory.createPropertyAssignment(propertyName, value)
                        ])
                    )
                )
            )
        );
    }

    return ts.factory.updateVariableStatement(
        statement,
        statement.modifiers,
        ts.factory.updateVariableDeclarationList(
            statement.declarationList,
            replaceNode(
                statement.declarationList.declarations,
                decla,
                updateVariableDeclarationInitializer(
                    decla,
                    upsertPropertyValue(decla.initializer, propertyName, value)
                )
            )
        )
    );
}
