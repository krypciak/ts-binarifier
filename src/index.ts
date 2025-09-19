import type { TypeParserConfig } from './type-parser'
import ts from 'typescript'
import * as fs from 'fs'
import * as path from 'path'
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
    baseImportPath?: string
    encodeConfig?: GenEncodeConfig
    decodeConfig?: GenDecodeConfig
    insertTsIgnore?: boolean
}

export async function generateEncodeDecodeScripts(config: Config) {
    const programs: Record<string, Awaited<ReturnType<typeof createProgram>>> = {}

    for (const singleConfig of config.configs) {
        const projectRoot = singleConfig.projectRoot ?? process.cwd()
        const outPath = path.normalize(singleConfig.outPath)
        const {
            typeName,
            path: filePath,
            outClassName,
            printNode,
            parserOptions,
            baseImportPath,
            encodeConfig = {},
            decodeConfig = {},
            insertTsIgnore,
        } = singleConfig

        const { program, checker } = (programs[projectRoot] ??= await createProgram(projectRoot))

        const file = getFile(program, filePath)
        const { type, fullPath } = findTypeForTypeDeclaration(file, checker, typeName)

        const parser = new TypeParser(checker, parserOptions)
        const node = parser.parseToNode(type)
        if (printNode) console.log(node.print())

        const encoderPath = baseImportPath ? `${baseImportPath}/src/encoder` : undefined
        const decoderPath = baseImportPath ? `${baseImportPath}/src/decoder` : undefined

        let code = codeGen({
            type: node,
            className: outClassName,
            typeImportPath: fullPath,
            typeShortName: typeName,
            destPath: outPath,
            encoderPath,
            decoderPath,
            encodeConfig,
            decodeConfig,
        })

        await fs.promises.mkdir(path.dirname(outPath), { recursive: true })
        await fs.promises.writeFile(outPath, code)

        if (insertTsIgnore) {
            const { program: newProgram } = await createProgram(projectRoot)
            const allDiag = newProgram.getSemanticDiagnostics()
            const fileDiag = allDiag.filter(diag => diag.file?.fileName?.startsWith(outPath))
            if (fileDiag.length > 0) {
                const codeLines = code.split('\n')
                const linesToInsert = new Set(
                    fileDiag
                        .map(diag => ts.getLineAndCharacterOfPosition(diag.file!, diag.start!).line)
                        .toSorted((a, b) => b - a)
                )

                for (const line of linesToInsert) {
                    const origLine = codeLines[line]
                    let indent = 0
                    for (; origLine[indent] == ' '; indent++);

                    codeLines.splice(line, 0, ' '.repeat(indent) + '// @ts-ignore')
                }
                code = codeLines.join('\n')

                await fs.promises.writeFile(outPath, code)
            }
        }
    }
}
