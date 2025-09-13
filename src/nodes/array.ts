import { Node } from './node'

export class ArrayNode extends Node {
    constructor(
        optional: boolean | undefined,
        public indexType: Node
    ) {
        super(optional)
    }

    print(indent: number = 0, ignoreOptional?: boolean) {
        return this.indexType.print(indent) + '[]' + this.optionalSuffix(ignoreOptional)
    }
}
