import type { TypeParserConfig } from './type-parser'
import * as fs from 'fs'
import * as path from 'path'
import { codeGen } from './code-gen'
import { createProgram, findTypeForTypeDeclaration, getFile } from './type-extractor'
import { TypeParser } from './type-parser'

/* TODO: assertons directly in code gen */

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
    baseImportPath?: string
}

export async function generateEncodeDecodeScripts(config: Config) {
    const programs: Record<string, Awaited<ReturnType<typeof createProgram>>> = {}

    for (const singleConfig of config.configs) {
        const projectRoot = singleConfig.projectRoot ?? process.cwd()
        const {
            typeName,
            outPath,
            path: filePath,
            outClassName,
            printNode,
            parserOptions,
            baseImportPath,
        } = singleConfig

        const { program, checker } = (programs[projectRoot] ??= await createProgram(projectRoot))

        const file = getFile(program, filePath)
        const { type, fullPath } = findTypeForTypeDeclaration(file, checker, typeName)

        const parser = new TypeParser(checker, parserOptions)
        const node = parser.parseToNode(type)
        if (printNode) console.log(node.print())

        return
        const encoderPath = baseImportPath ? `${baseImportPath}/src/encoder` : undefined
        const decoderPath = baseImportPath ? `${baseImportPath}/src/decoder` : undefined

        const code = codeGen({
            type: node,
            className: outClassName,
            typeImportPath: fullPath,
            typeShortName: typeName,
            destPath: outPath,
            encoderPath,
            decoderPath,
        })
        await fs.promises.mkdir(path.dirname(outPath), { recursive: true })
        await fs.promises.writeFile(outPath, code)
    }
}
