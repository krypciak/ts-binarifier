import type { TypeParserConfig } from './type-parser'
import fs from 'fs'
import { codeGen } from './code-gen'
import { createProgram, findTypeForTypeDeclaration, getFile } from './type-extractor'
import { TypeParser } from './type-parser'

export interface Config {
    configs: SingleConfig[]
}

export interface SingleConfig {
    projectRoot?: string
    path: string
    typeType: 'variable' | 'type'
    typeName: string
    outPath: string
    outClassName: string
    parserOptions?: TypeParserConfig
    printNode?: boolean
}

export async function generateEncodeDecodeScripts(config: Config) {
    const programs: Record<string, Awaited<ReturnType<typeof createProgram>>> = {}

    for (const singleConfig of config.configs) {
        const projectRoot = singleConfig.projectRoot ?? process.cwd()
        const { typeName, outPath, path: filePath, outClassName, printNode, parserOptions } = singleConfig

        const { program, checker } = (programs[projectRoot] ??= await createProgram(projectRoot))

        const file = getFile(program, filePath)
        const { type, fullPath } = findTypeForTypeDeclaration(file, checker, typeName)

        const parser = new TypeParser(checker, parserOptions)
        const node = parser.parseToNode(type)
        if (printNode) console.log(node.print())

        const code = codeGen(node, outClassName, fullPath, typeName, outPath)
        await fs.promises.writeFile(outPath, code)
    }
}
