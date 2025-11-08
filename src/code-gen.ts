import { Node } from './nodes/node'
import * as path from 'path'

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
    config.encoderPath ??= './' + path.relative(destDir, new URL('./encoder', import.meta.url).pathname)
    config.decoderPath ??= './' + path.relative(destDir, new URL('./decoder', import.meta.url).pathname)
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
    const imports: string[] = []
    const shared: GenEncodeDecodeShared = {}
    const encodeCode = type.genEncode({
        config: encodeConfig,
        varName: 'data',
        indent: 2,
        varCounter: { v: 0 },
        constants,
        imports,
        shared: shared,
    })
    const decodeCode = type.genDecode({ config: decodeConfig, varCounter: { v: 0 }, indent: 2, shared })

    return (
        `import { Encoder } from '${encoderPath}'\n` +
        `import { Decoder } from '${decoderPath}'\n` +
        (typeImportPath ? `import type { ${typeShortName} } from '${typeImportPath}'\n` : '') +
        imports.join('\n') +
        '\n' +
        '\n' +
        `export class ${className} {\n` +
        constants.map(str => Node.indent(1) + 'private static ' + str).join('\n') +
        (constants.length > 0 ? '\n\n' : '') +
        Node.indent(1) +
        `static encode(data: ${typeShortName}): Uint8Array {\n` +
        Node.indent(2) +
        `const encoder = new Encoder()\n` +
        Node.indent(2) +
        encodeCode +
        '\n' +
        Node.indent(2) +
        `return encoder.getBuffer()\n` +
        Node.indent(1) +
        '}\n\n' +
        Node.indent(1) +
        `static decode(buf: Uint8Array): ${typeShortName} {\n` +
        Node.indent(2) +
        `const decoder = new Decoder(buf)\n` +
        Node.indent(2) +
        'return ' +
        decodeCode +
        '\n' +
        Node.indent(1) +
        '}\n' +
        '}\n'
    )
}
