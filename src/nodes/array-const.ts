import { Node } from './node'

export class ArrayConstNode extends Node {
    constructor(
        optional: boolean | undefined,
        public indexTypes: Node[]
    ) {
        super(optional)
    }

    print(noColor?: boolean, indent: number = 0, ignoreOptional?: boolean) {
        return (
            '[' +
            this.indexTypes.map(t => t.print(noColor, indent)).join(', ') +
            ']' +
            this.optionalSuffix(ignoreOptional, noColor)
        )
    }

    genEncode(data: GenEncodeData): string {
        return this.genEncodeWrapOptional(data, data =>
            this.indexTypes
                .map((t, i) => t.genEncode({ ...data, varName: `${data.varName}[${i}]` }))
                .join('\n' + Node.indent(data.indent))
        )
    }

    genDecode(data: GenDecodeData): string {
        return this.genDecodeWrapOptional(`[${this.indexTypes.map(t => t.genDecode(data)).join(', ')}]`)
    }
}
