import { expect } from 'bun:test'
import fs from 'fs'
import ts from 'typescript'
import path from 'path'
import { parseToNode } from './type-parser'
import { codeGen } from './code-gen'
import { createProgram, getType } from './type-extractor'

let tmpFileCounter = 0
async function createTempFile(suffix: string): Promise<string> {
    await fs.promises.mkdir('tmp', { recursive: true })
    const path = 'tmp/' + tmpFileCounter + suffix
    tmpFileCounter++
    return path
}

type Gen = any

let program: ts.Program
let checker: ts.TypeChecker
async function setupProgram() {
    if (program) return
    const projectRoot = process.cwd()
    ;({ program, checker } = await createProgram(projectRoot))
}

async function encodeDecodeDataSetup(filePath: string, typeName: string): Promise<Gen> {
    await setupProgram()

    const outFile = await createTempFile('.ts')

    const { type, fullPath } = getType(program, checker, filePath, typeName)

    const node = parseToNode(type, checker)

    const code = codeGen(node, 'Gen', fullPath, typeName, outFile)
    await fs.promises.writeFile(outFile, code)

    const genModule = await import(path.relative(new URL('.', import.meta.url).pathname, outFile))
    const Gen: Gen = genModule.Gen
    return Gen
}

function encodeDecodeDataTest(Gen: Gen, data: any) {
    const buf = Gen.encode(data)

    const decoded = Gen.decode(buf)

    expect(decoded).toEqual(data)
}

export async function encodeDecodeDataTestMultiple<T>(filePath: string, typeName: string, dataArray: T[]) {
    const Gen = await encodeDecodeDataSetup(filePath, typeName)
    for (const data of dataArray) {
        encodeDecodeDataTest(Gen, data)
    }
}
