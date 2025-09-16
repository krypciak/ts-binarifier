import { expect } from 'bun:test'
import fs from 'fs'
import ts from 'typescript'
import path from 'path'
import { codeGen, type EncoderDecoder } from '../code-gen'
import { createProgram, findTypeForTypeDeclaration, getFile } from '../type-extractor'
import { TypeParser, type TypeParserConfig } from '../type-parser'

let tmpFileCounter = 0
async function createTempFile(suffix: string): Promise<string> {
    await fs.promises.mkdir('tmp', { recursive: true })
    const path = 'tmp/' + tmpFileCounter + suffix
    tmpFileCounter++
    return path
}

let program: ts.Program
let checker: ts.TypeChecker
async function setupProgram() {
    if (program) return
    const projectRoot = process.cwd()
    ;({ program, checker } = await createProgram(projectRoot))
}

export async function setupParserAndParseNode(filePath: string, typeName: string, parserConfig?: TypeParserConfig) {
    await setupProgram()

    const file = getFile(program, filePath)
    const { type, fullPath } = findTypeForTypeDeclaration(file, checker, typeName)

    const parser = new TypeParser(checker, parserConfig)
    const node = parser.parseToNode(type)
    return { node, fullPath }
}

async function encodeDecodeDataSetup<T>(
    filePath: string,
    typeName: string,
    parserConfig?: TypeParserConfig
): Promise<EncoderDecoder<T>> {
    const { node, fullPath } = await setupParserAndParseNode(filePath, typeName, parserConfig)
    const outFile = await createTempFile('.ts')
    const code = codeGen(node, 'Gen', fullPath, typeName, outFile)
    await fs.promises.writeFile(outFile, code)

    const genModule = await import(path.relative(new URL('.', import.meta.url).pathname, outFile))
    return genModule.Gen as EncoderDecoder<T>
}

function encodeDecodeDataTest<T>(EncoderDecoder: EncoderDecoder<T>, data: T) {
    const buf = EncoderDecoder.encode(data)
    // console.log(buf)
    // for (let i = 0; i < buf.length; i++) {
    //     let str = ''
    //     for (let j = 8; j >= 0; j--) {
    //         str += (buf[i] & (1<<j)) ? '1' : '0'
    //     }
    //     console.log(str)
    // }

    const decoded = EncoderDecoder.decode(buf)

    expect(decoded).toEqual(data)
}

export async function encodeDecodeDataTestMultiple<T>(
    filePath: string,
    typeName: string,
    dataArray: T[],
    parserConfig?: TypeParserConfig
) {
    const EncoderDecoder = await encodeDecodeDataSetup(filePath, typeName, parserConfig)
    for (const data of dataArray) {
        encodeDecodeDataTest(EncoderDecoder, data)
    }
}
