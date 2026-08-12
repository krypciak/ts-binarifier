import { Node } from './nodes/node'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { functionConfigToString, sha256 } from './code-gen-functions'
import type {
    GenEncodeConfig,
    FunctionConfig,
    GenEncodeDecodeShared,
    GenDecodeConfig,
    ImportsRecord as ImportsRecord,
    GenDataBase,
} from './types'
import { addImport, importsToString } from './code-gen-imports'

export interface CodeGenConfig {
    type: Node
    className: string
    typeImportPath: string
    typeShortName: string
    destPath: string
    encoderPath?: string
    decoderPath?: string
    encodeConfig: GenEncodeConfig
    decodeConfig: GenDecodeConfig
}

export function codeGen(config: CodeGenConfig) {
    const destDir = path.dirname(config.destPath)
    config.encoderPath ??=
        './' + path.relative(destDir, fileURLToPath(new URL('./encoder', import.meta.url))).replace(/\\/g, '/')
    config.decoderPath ??=
        './' + path.relative(destDir, fileURLToPath(new URL('./decoder', import.meta.url))).replace(/\\/g, '/')
    config.typeImportPath ??= './' + path.relative(destDir, config.typeImportPath)
    const code = genParsingClass(config)
    return code
}

export interface EncoderDecoder<T = unknown> {
    encode(data: T): Uint8Array
    decode(buf: Uint8Array): T
}

function genParsingClass({
    type,
    className,
    typeImportPath,
    typeShortName,
    encoderPath,
    decoderPath,
    encodeConfig,
    decodeConfig,
}: CodeGenConfig): string {
    const constants: string[] = []
    const imports: ImportsRecord = {}
    addImport(imports, encoderPath!, 'Encoder')
    addImport(imports, decoderPath!, 'Decoder')
    if (typeImportPath) addImport(imports, typeImportPath, typeShortName, true)

    const typeAliasesPath = encoderPath!.replace(/src\/encoder$/, 'src/type-aliases')
    const shared: GenEncodeDecodeShared = {}
    const encodeFunctions: Record<string, FunctionConfig> = {}
    const varCounter: GenDataBase['varCounter'] = { v: 0, func: 0, union: 0, type: 0 }
    const encodeCode = type.genEncode({
        config: encodeConfig,
        varName: 'data',
        indent: 0,
        functions: encodeFunctions,
        functionHashToName: {},
        varCounter,
        constants,
        imports,
        shared: shared,
        typeAliasesImportPath: typeAliasesPath,
    })
    const decodeFunctions: Record<string, FunctionConfig> = {}
    const decodeCode = type.genDecode({
        config: decodeConfig,
        varCounter: { ...varCounter, v: 0, func: 0 },
        indent: 0,
        functions: decodeFunctions,
        functionHashToName: {},
        shared,
        imports,
        typeAliasesImportPath: typeAliasesPath,
    })
    const codeHash = sha256(encodeCode + decodeCode)

    const mainEncodeFunction: FunctionConfig = {
        public: true,
        name: 'encode',
        arguments: [`data: ${typeShortName}`],
        returnType: 'Uint8Array<ArrayBuffer>',
        body: `const encoder = new Encoder()\n` + `${encodeCode}\n` + `return encoder.getBuffer()`,
    }
    encodeFunctions[mainEncodeFunction.name] = mainEncodeFunction

    const mainDecodeFunction: FunctionConfig = {
        public: true,
        name: 'decode',
        arguments: [`buf: Uint8Array`],
        returnType: typeShortName,
        body: `const decoder = new Decoder(buf)\n` + 'return ' + decodeCode,
    }
    decodeFunctions[mainDecodeFunction.name] = mainDecodeFunction

    return (
        importsToString(imports) +
        '\n' +
        '\n' +
        `export class ${className} {\n` +
        Node.indent(1) +
        `static codeHash = '${codeHash}'\n` +
        constants.map(str => Node.indent(1) + 'private static ' + str).join('\n') +
        (constants.length > 0 ? '\n\n' : '') +
        Object.values(encodeFunctions)
            .map(config => functionConfigToString(config, 1))
            .join('\n') +
        '\n' +
        Object.values(decodeFunctions)
            .map(config => functionConfigToString(config, 1))
            .join('\n') +
        '}\n'
    )
}
