import { createHash } from 'crypto'
import type { FunctionConfig, GenDataBase } from './types'
import { Node } from './nodes/node'

export function sha256(str: string) {
    return createHash('sha256').update(str).digest('base64')
}

function hashFunctionConfig(config: FunctionConfig) {
    return sha256(`${config.public}` + config.arguments.join(',') + config.body)
}

export function getOrDefineFunction(data: GenDataBase, config: FunctionConfig): FunctionConfig {
    const hash = hashFunctionConfig(config)
    const hashedConfig = data.functionHashToName[hash]
    if (hashedConfig) return data.functions[hashedConfig]
    data.functionHashToName[hash] = config.name
    data.functions[config.name] = config
    return config
}

export function resetVarCounterForFunction(varCounter: GenDataBase['varCounter']): GenDataBase['varCounter'] {
    return { ...varCounter, vars: { v: 0 }, type: { v: 0 } }
}

export function functionConfigToString(config: FunctionConfig, indent: number): string {
    return (
        Node.indent(indent) +
        (config.public ? '' : 'private ') +
        `static ` +
        config.name +
        `(` +
        config.arguments.join(', ') +
        `)` +
        (config.returnType ? `: ` + config.returnType : '') +
        ` {\n` +
        config.body
            .split('\n')
            .map(l => l.trimEnd())
            .filter(Boolean)
            .map(l => Node.indent(indent + 1) + l)
            .join('\n') +
        '\n' +
        Node.indent(indent) +
        `}\n`
    )
}
