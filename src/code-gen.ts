import { Node } from './nodes/node'
import * as path from 'path'

export function codeGen(
    type: Node,
    className: string,
    typeImportPath: string,
    typeShortName: string,
    destPath: string
) {
    const destDir = path.dirname(destPath)
    const encoderPath = new URL('./encoder', import.meta.url).pathname
    const decoderPath = new URL('./decoder', import.meta.url).pathname
    const code = genParsingClass(
        type,
        className,
        './' + path.relative(destDir, encoderPath),
        './' + path.relative(destDir, decoderPath),
        typeShortName,
        './' + path.relative(destDir, typeImportPath),
        typeShortName
    )
    return code
}

function genParsingClass(
    type: Node,
    className: string,
    encoderImportPath: string,
    decoderImportPath: string,
    typeShortName: string,
    typeImportPath?: string,
    typeImportName?: string
): string {
    return (
        `import { Encoder } from '${encoderImportPath}'\n` +
        `import { Decoder } from '${decoderImportPath}'\n` +
        (typeImportPath ? `import type { ${typeImportName} } from '${typeImportPath}'\n` : '') +
        '\n' +
        `export class ${className} {\n` +
        Node.indent(1) +
        `static encode(data: ${typeShortName}): Uint8Array {\n` +
        Node.indent(2) +
        `const encoder = new Encoder()\n` +
        Node.indent(2) +
        type.genEncode('data', 2) +
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
        type.genDecode(2) +
        '\n' +
        Node.indent(1) +
        '}\n' +
        '}\n'
    )
}
