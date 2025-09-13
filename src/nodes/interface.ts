import { Node } from './node'

export class InterfaceNode extends Node {
    constructor(
        optional: boolean | undefined,
        public nodes: Record<string, Node>
    ) {
        super(optional)
    }

    print(indent: number = 0, ignoreOptional?: boolean) {
        return (
            '{\n' +
            Object.entries(this.nodes)
                .map(
                    ([k, v]) =>
                        ' '.repeat(indent + Node.indentMulti) + k + ': ' + v.print(indent + Node.indentMulti)
                )
                .join(`,\n`) +
            '\n' +
            ' '.repeat(indent) +
            '}' +
            this.optionalSuffix(ignoreOptional)
        )
    }
}
