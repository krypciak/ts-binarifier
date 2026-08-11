import { createHash } from 'crypto'

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
