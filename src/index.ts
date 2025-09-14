import fs from 'fs'
import { parseToNode } from './type-parser'
import { codeGen } from './code-gen'
import { createProgram, getType } from './type-extractor'
import './colors'

async function run() {
    const projectRoot = '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery'
    const filePath = 'src/server/physics/physics-server-sender.ts'
    const typeName = 'GenerateType'
    const outFile =
        '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery/src/server/physics/bin.ts'

    const { program, checker } = await createProgram(projectRoot)

    const { type, fullPath } = getType(program, checker, filePath, typeName)

    const node = parseToNode(type, checker)
    console.log(node.print())

    const code = codeGen(node, 'Gen', fullPath, typeName, outFile)
    await fs.promises.writeFile(outFile, code)
}

await run()
