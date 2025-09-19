import { Node, type GenDecodeConfig, type GenDecodeData, type GenEncodeConfig, type GenEncodeData } from './node'

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

    genEncode(data: GenEncodeData, config: GenEncodeConfig): string {
        return this.genEncodeWrapOptional(
            data,
            config,
            ({ varName, indent }) =>
                `${this.indexTypes.map((t, i) => t.genEncode({ varName: `${varName}[${i}]`, indent }, config)).join('\n' + Node.indent(indent))}`
        )
    }

    genDecode(data: GenDecodeData, config: GenDecodeConfig): string {
        return this.genDecodeWrapOptional(`[${this.indexTypes.map(t => t.genDecode(data, config)).join(', ')}]`)
    }
}
