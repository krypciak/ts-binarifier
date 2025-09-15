import { gray } from '../colors'
import { Node } from './node'

export class UndefinedNode extends Node {
    constructor(optional: boolean | undefined) {
        super(optional)
    }

    print(noColor?: boolean) {
        return gray('undefined', noColor)
    }

    genEncode(_varName: string): string {
        return ``
    }

    genDecode(): string {
        return `undefined`
    }
}
