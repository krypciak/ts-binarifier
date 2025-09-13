import { Node } from './node'

export class ArrayConstNode extends Node {
    constructor(
        optional: boolean | undefined,
        public indexTypes: Node[]
    ) {
        super(optional)
    }

    print(indent: number = 0, ignoreOptional?: boolean) {
        return '[' + this.indexTypes.map(t => t.print(indent)).join(', ') + ']' + this.optionalSuffix(ignoreOptional)
    }

    genEncode(varName: string, indent: number = 0): string {
        return this.genEncodeWrapOptional(
            varName,
            indent =>
                `${this.indexTypes.map((t, i) => t.genEncode(`${varName}[${i}]`, indent)).join('\n' + Node.indent(indent))}`,
            indent
        )
    }

    genDecode(indent: number = 0): string {
        return `${this.genDecodeWrapOptional(`[${this.indexTypes.map(t => t.genDecode(indent)).join(', ')}]`)}`
    }
}
