import { expect } from 'bun:test'
import fs from 'fs'
import ts from 'typescript'
import path from 'path'
import { codeGen, type EncoderDecoder } from '../code-gen'
import { createProgram, findTypeForTypeDeclaration, getFile } from '../type-extractor'
import { TypeParser, type TypeParserConfig } from '../type-parser'
import type { GenDecodeConfig, GenEncodeConfig } from '../nodes/node'

const projectRoot = new URL('../..', import.meta.url).pathname

let tmpFileCounter = 0
async function createTempFile(suffix: string): Promise<string> {
    const tmpDir = projectRoot + '/tmp'
    await fs.promises.mkdir(tmpDir, { recursive: true })
    const path = tmpDir + '/' + tmpFileCounter + suffix
    tmpFileCounter++
    return path
}

let program: ts.Program
let checker: ts.TypeChecker
async function setupProgram() {
    if (program) return
    ;({ program, checker } = await createProgram(projectRoot))
}

export async function setupParserAndParseNode(filePath: string, typeName: string, parserConfig?: TypeParserConfig) {
    await setupProgram()

    const file = getFile(program, filePath)
    const { type, fullPath } = findTypeForTypeDeclaration(file, checker, typeName, 4)

    const parser = new TypeParser(checker, parserConfig)
    const node = parser.parseToNode(type)
    return { node, fullPath }
}

async function encodeDecodeDataSetup<T>(
    filePath: string,
    typeName: string,
    parserConfig: TypeParserConfig,
    encodeConfig: GenEncodeConfig,
    decodeConfig: GenDecodeConfig
): Promise<EncoderDecoder<T>> {
    const { node, fullPath } = await setupParserAndParseNode(filePath, typeName, parserConfig)
    const outFile = await createTempFile('.ts')
    const code = codeGen({
        type: node,
        className: 'Gen',
        typeImportPath: fullPath,
        typeShortName: typeName,
        destPath: outFile,
        encodeConfig,
        decodeConfig,
    })
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
    parserConfig: TypeParserConfig = {},
    encodeConfig: GenEncodeConfig = {},
    decodeConfig: GenDecodeConfig = {}
) {
    encodeConfig.asserts ??= true

    const EncoderDecoder = await encodeDecodeDataSetup(filePath, typeName, parserConfig, encodeConfig, decodeConfig)
    for (const data of dataArray) {
        encodeDecodeDataTest(EncoderDecoder, data)
    }
}

export function encodeTestThrows<T>(EncoderDecoder: EncoderDecoder<T>, data: T) {
    expect(() => EncoderDecoder.encode(data)).toThrowError()
}

export async function encodeMultipleThrows<T>(
    filePath: string,
    typeName: string,
    dataArray: T[],
    parserConfig: TypeParserConfig = {},
    encodeConfig: GenEncodeConfig = {},
    decodeConfig: GenDecodeConfig = {}
) {
    encodeConfig.asserts ??= true

    const EncoderDecoder = await encodeDecodeDataSetup(filePath, typeName, parserConfig, encodeConfig, decodeConfig)
    for (const data of dataArray) {
        encodeTestThrows(EncoderDecoder, data)
    }
}
