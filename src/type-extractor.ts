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

export function getType(program: ts.Program, checker: ts.TypeChecker, typesForFile: string, typeName: string) {
    const file = program.getSourceFiles().find(file => file.fileName.endsWith(typesForFile))
    assert(file, 'file not found')

    const typeNode = file.statements.find(
        st => ts.isTypeAliasDeclaration(st) && st.name?.getText() == typeName
    ) as ts.TypeAliasDeclaration
    assert(typeNode, 'type node not found')
    assert(typeNode.name, 'type node has no name')

    const type = checker.getTypeAtLocation(typeNode)
    return { type, fullPath: file.fileName }
}
