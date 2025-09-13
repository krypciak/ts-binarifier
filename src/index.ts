import fs from 'fs'
import ts from 'typescript'
import { assert } from './assert'
import { parseToNode } from './type-parser'
import './colors'
import { codeGen } from './code-gen'

async function createProgram(projectDir: string) {
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

function printNode(node: ts.Node | undefined) {
    if (!node) {
        console.log('node undefined')
        return
    }
    console.log(node.kind, node.getText().slice(0, 100).replaceAll(/\n/g, ' '))
}

function getType(program: ts.Program, checker: ts.TypeChecker, typesForFile: string, typeName: string) {
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

async function run() {
    const { program, checker } = await createProgram(
        '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery'
    )
    const filePath = 'src/state/states.ts'
    const typeName = 'GenerateTypeStateUpdatePacket'

    const { type, fullPath } = getType(program, checker, filePath, typeName)
    // printType(type, checker)

    const node = parseToNode(type, checker)
    console.log(node.print())
    // console.dir(node, { depth: null })

    const outFile = '/home/krypek/a.ts'
    const code = codeGen(node, fullPath, typeName, outFile)
    await fs.promises.writeFile(outFile, code)
}

await run()
