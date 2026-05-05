#!/usr/bin/env bun
import { generateEncodeDecodeScripts, type Config, type SingleConfig } from './index'
import { parseArgs } from 'node:util'

async function main() {
    const { values } = parseArgs({
        options: {
            path: { type: 'string' },
            typeType: { type: 'string', default: 'type' },
            typeName: { type: 'string' },
            outPath: { type: 'string' },
            outClassName: { type: 'string', default: 'Gen' },
            projectRoot: { type: 'string' },
            baseImportPath: { type: 'string' },
            parserOptions: { type: 'string' },
            encodeConfig: { type: 'string' },
            decodeConfig: { type: 'string' },
            printNode: { type: 'boolean' },
            insertTsIgnore: { type: 'boolean' },
        },
        args: Bun.argv.slice(2),
        strict: true,
    })
    const singleConfig: Partial<SingleConfig> = {}

    for (const [key, value] of Object.entries(values)) {
        if (value == undefined) continue
        if (key == 'printNode' || key == 'insertTsIgnore') {
            ;(singleConfig as any)[key] = true
        } else if (key == 'parserOptions' || key == 'encodeConfig' || key == 'decodeConfig') {
            try {
                ;(singleConfig as any)[key] = JSON.parse(value as string)
            } catch (e) {
                console.error(`Invalid JSON for --${key}: ${e instanceof Error ? e.message : e}`)
                process.exit(1)
            }
        } else {
            ;(singleConfig as any)[key] = value
        }
    }

    const required: (keyof SingleConfig)[] = ['path', 'typeType', 'typeName', 'outPath', 'outClassName']
    for (const field of required) {
        if (!singleConfig[field]) {
            console.error(`Missing required argument: --${String(field)}`)
            process.exit(1)
        }
    }

    if (singleConfig.typeType !== 'type') {
        console.error(`--typeType must be "variable" or "type"`)
        process.exit(1)
    }

    const config: Config = {
        configs: [singleConfig as SingleConfig],
    }

    try {
        await generateEncodeDecodeScripts(config)
    } catch (err) {
        console.error('Error:', err instanceof Error ? err.message : err)
        process.exit(1)
    }
}

main()
