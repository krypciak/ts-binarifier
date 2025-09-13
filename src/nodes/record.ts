import { Node } from './node'

export class RecordNode extends Node {
    constructor(
        optional: boolean | undefined,
        public key: Node,
        public value: Node
    ) {
        super(optional)
    }

    print(indent: number = 0, ignoreOptional?: boolean) {
        return 'Record<' + this.key.print(indent) + ', ' + this.value.print(indent) + '>' + this.optionalSuffix(ignoreOptional)
    }
}
