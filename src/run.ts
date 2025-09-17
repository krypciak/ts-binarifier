import { customStuffNode } from './custom-handler'
import { generateEncodeDecodeScripts } from './index'

/* TODO: asserts in encoder */

await generateEncodeDecodeScripts({
    configs: [
        {
            projectRoot: '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery',
            path: 'src/server/physics/physics-server-sender.ts',
            typeType: 'type',
            typeName: 'GenerateType',
            outPath:
                '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery/src/server/physics/bin.ts',
            outClassName: 'PhysicsStatePacketEncoderDecoder',
            printNode: true,
            parserOptions: { customNodes: { customUnionRecord: customStuffNode } },
        },
    ],
})
