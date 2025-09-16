import fs from 'fs'
import { codeGen } from './code-gen'
import { createProgram, findTypeForTypeDeclaration, getFile } from './type-extractor'
import './colors'
import { TypeParser } from './type-parser'
import { customStuffNode } from './custom-handler'


async function run() {
    const projectRoot = '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery'
    const filePath = 'src/server/physics/physics-server-sender.ts'
    const typeName = 'GenerateType'
    const outFile =
        '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery/src/server/physics/bin.ts'

    // const projectRoot = '/home/krypek/home/Programming/repos/binarifier'
    // const filePath = '/src/index.test.ts'
    // const typeName = 'Type4'
    // const outFile = ''

    const { program, checker } = await createProgram(projectRoot)

    const file = getFile(program, filePath)
    const { type, fullPath } = findTypeForTypeDeclaration(file, checker, typeName)

    const parser = new TypeParser(checker, { customNodes: { customUnionRecord: customStuffNode } })
    const node = parser.parseToNode(type)
    console.log(node.print())

    const code = codeGen(node, 'Gen', fullPath, typeName, outFile)
    await fs.promises.writeFile(outFile, code)
}

await run()
