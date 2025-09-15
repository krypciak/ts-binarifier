import { assert } from './assert'
import ts from 'typescript'
import fs from 'fs'

export async function createProgram(projectDir: string) {
    const configPath = projectDir + '/tsconfig.json'
    const configFileText = await fs.promises.readFile(configPath, 'utf-8')
    const result = ts.parseConfigFileTextToJson(configPath, configFileText)
    assert(!result.error, 'Error parsing tsconfig.json:' + result.error)

    const configParseResult = ts.parseJsonConfigFileContent(result.config, ts.sys, projectDir)
    assert(configParseResult.errors.length == 0, 'Error in tsconfig options:' + configParseResult.errors)

    const program = ts.createProgram({
        rootNames: configParseResult.fileNames,
        options: configParseResult.options,
    })
    const checker = program.getTypeChecker()
    return { program, checker }
}

export function getFile(program: ts.Program, typesForFile: string) {
    const file = program.getSourceFiles().find(file => file.fileName.endsWith(typesForFile))
    assert(file, 'file not found')
    return file
}

function findNode<T extends ts.Node>(
    file: ts.SourceFile | ts.Node,
    eqFunc: (node: ts.Node) => boolean,
    depth: number = 1
): T | undefined {
    return file.forEachChild(node => {
        if (eqFunc(node)) return node
        if (depth >= 1) return findNode(node, eqFunc, depth - 1)
    }) as T | undefined
}

export function findTypeForTypeDeclaration(
    file: ts.SourceFile,
    checker: ts.TypeChecker,
    typeName: string,
    depth?: number
) {
    const typeNode = findNode<ts.TypeAliasDeclaration>(
        file,
        st => ts.isTypeAliasDeclaration(st) && st.name?.getText() == typeName,
        depth
    )
    assert(typeNode, 'type node not found')
    assert(typeNode.name, 'type node has no name')

    const type = checker.getTypeAtLocation(typeNode)
    assert(type, 'type node has no type')
    return { type, fullPath: file.fileName }
}

export function findVariableDeclaration(
    file: ts.SourceFile,
    variableName: string,
    depth?: number
): ts.VariableDeclaration {
    const varNode = findNode<ts.VariableDeclaration>(
        file,
        st => ts.isVariableDeclaration(st) && st.name?.getText() == variableName,
        depth
    )
    assert(varNode, 'variable node not found')
    return varNode
}

export function findTypeForVariableDeclaration(
    file: ts.SourceFile,
    checker: ts.TypeChecker,
    variableName: string,
    depth?: number
) {
    const varNode = findVariableDeclaration(file, variableName, depth)

    const type = checker.getTypeAtLocation(varNode)
    assert(type, 'variable node has no type')
    return { type, fullPath: file.fileName }
}
