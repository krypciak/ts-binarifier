import fs from 'fs'
import ts, { type FunctionDeclaration } from 'typescript'
import { assert } from './assert'
import { parseToNode } from './type-parser'
import './colors'

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

function getFunctionType(program: ts.Program, checker: ts.TypeChecker, typesForFile: string, typesForFunc: string) {
    const file = program.getSourceFiles().find(file => file.fileName.endsWith(typesForFile))
    assert(file, 'file not found')

    const funcNode = file.statements.find(
        st => ts.isFunctionDeclaration(st) && st.name?.getText() == typesForFunc
    ) as FunctionDeclaration
    assert(funcNode, 'func not found')
    assert(funcNode.name, 'func has no name')
    // printNode(funcNode)

    const symbol = checker.getSymbolAtLocation(funcNode.name)
    assert(symbol, 'symbol undefined')
    const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)
    const signatures = type.getCallSignatures()
    assert(signatures.length == 1, 'func has multiple signatures')
    const signature = signatures[0]
    const returnType: ts.Type = checker.getReturnTypeOfSignature(signature)
    return returnType
}

async function run() {
    const { program, checker } = await createProgram(
        '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery'
    )
    // const filePath = 'src/state/entity/ig_ENTITY_PushPullBlock.ts'
    // const filePath = 'sc_ItemDropEntity.ts'
    // const funcName = 'getState'
    const filePath = 'src/state/states.ts'
    const funcName = 'das'

    const type = getFunctionType(program, checker, filePath, funcName)
    // printType(type, checker)

    const node = parseToNode(type, checker)
    console.log(node.print())
    // console.dir(node, { depth: null })
}

await run()
