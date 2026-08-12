import { Node } from './node'
import { green, yellow } from '../colors'
import type { GenEncodeData, GenDecodeData } from '../types'

export class LiteralNode<T extends string | number | boolean> extends Node {
    constructor(
        optional: boolean | undefined,
        public value: T
    ) {
        super(optional)
    }

    print(noColor?: boolean, _indent: number = 0, _ignoreOptional?: boolean) {
        const v = this.value
        return typeof v === 'string' ? green(`'${v}'`, noColor) : yellow(`${v}`, noColor)
    }

    genEncode(data: GenEncodeData) {
        return this.genEncodeWrapOptional(data, _data => '// literal: ' + this.print(true))
    }

    genDecode(_data: GenDecodeData): string {
        return this.genDecodeWrapOptional(this.print(true))
    }
}
