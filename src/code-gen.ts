import { Node } from './nodes/node'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
import { decode, encode } from 'punycode'

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

function sha256(str: string) {
    return createHash('sha256').update(str).digest('base64')
}

function functionConfigToString(config: FunctionConfig, indent: number): string {
    return (
        Node.indent(indent) +
        (config.public ? '' : 'private ') +
        `static ` +
        config.name +
        `(` +
        config.arguments.join(', ') +
        `)` +
        (config.returnType ? `: ` + config.returnType : '') +
        ` {\n` +
        config.body
            .split('\n')
            .map(l => l.trimEnd())
            .filter(Boolean)
            .map(l => Node.indent(indent + 1) + l)
            .join('\n') +
        '\n' +
        Node.indent(indent) +
        `}\n`
    )
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
    const imports: string[] = []
    const shared: GenEncodeDecodeShared = {}
    const encodeFunctions: FunctionConfig[] = []
    const encodeCode = type.genEncode({
        config: encodeConfig,
        varName: 'data',
        indent: 0,
        functions: encodeFunctions,
        varCounter: { v: 0 },
        constants,
        imports,
        shared: shared,
    })
    const decodeFunctions: FunctionConfig[] = []
    const decodeCode = type.genDecode({
        config: decodeConfig,
        varCounter: { v: 0 },
        indent: 0,
        functions: decodeFunctions,
        shared,
    })
    const codeHash = sha256(encodeCode + decodeCode)

    const mainEncodeFunction: FunctionConfig = {
        public: true,
        name: 'encode',
        arguments: [`data: ${typeShortName}`],
        returnType: 'Uint8Array<ArrayBuffer>',
        body: `const encoder = new Encoder()\n` + `${encodeCode}\n` + `return encoder.getBuffer()`,
    }
    encodeFunctions.push(mainEncodeFunction)

    const mainDecodeFunction: FunctionConfig = {
        public: true,
        name: 'decode',
        arguments: [`buf: Uint8Array`],
        returnType: typeShortName,
        body: `const decoder = new Decoder(buf)\n` + 'return ' + decodeCode,
    }
    decodeFunctions.push(mainDecodeFunction)

    return (
        `import { Encoder } from '${encoderPath}'\n` +
        `import { Decoder } from '${decoderPath}'\n` +
        (typeImportPath ? `import type { ${typeShortName} } from '${typeImportPath}'\n` : '') +
        imports.join('\n') +
        '\n' +
        '\n' +
        `export class ${className} {\n` +
        Node.indent(1) +
        `static codeHash = '${codeHash}'\n` +
        constants.map(str => Node.indent(1) + 'private static ' + str).join('\n') +
        (constants.length > 0 ? '\n\n' : '') +
        encodeFunctions.map(config => functionConfigToString(config, 1)).join('\n') +
        '\n' +
        decodeFunctions.map(config => functionConfigToString(config, 1)).join('\n') +
        '}\n'
    )
}
