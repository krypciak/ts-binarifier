import { expect } from 'bun:test'
import fs from 'fs'
import ts from 'typescript'
import path from 'path'
import { codeGen, type EncoderDecoder } from './code-gen'
import { createProgram, getType } from './type-extractor'
import { TypeParser } from './type-parser'

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

async function encodeDecodeDataSetup<T>(filePath: string, typeName: string): Promise<EncoderDecoder<T>> {
    await setupProgram()

    const outFile = await createTempFile('.ts')

    const { type, fullPath } = getType(program, checker, filePath, typeName)

    const parser = new TypeParser(checker, {})
    const node = parser.parseToNode(type)

    const code = codeGen(node, 'Gen', fullPath, typeName, outFile)
    await fs.promises.writeFile(outFile, code)

    const genModule = await import(path.relative(new URL('.', import.meta.url).pathname, outFile))
    return genModule.Gen as EncoderDecoder<T>
}

function encodeDecodeDataTest<T>(EncoderDecoder: EncoderDecoder<T>, data: T) {
    const buf = EncoderDecoder.encode(data)

    const decoded = EncoderDecoder.decode(buf)

    expect(decoded).toEqual(data)
}

export async function encodeDecodeDataTestMultiple<T>(filePath: string, typeName: string, dataArray: T[]) {
    const EncoderDecoder = await encodeDecodeDataSetup(filePath, typeName)
    for (const data of dataArray) {
        encodeDecodeDataTest(EncoderDecoder, data)
    }
}
