import { gray } from '../colors'
import { Node } from './node'

export class NullNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(noColor?: boolean, _indent: number = 0, ignoreOptional?: boolean) {
        return gray('null', noColor) + this.optionalSuffix(ignoreOptional, noColor)
    }

    genEncode(_varName: string): string {
        return ``
    }

    genDecode(): string {
        return `null`
    }
}
