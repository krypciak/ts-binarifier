import { generateEncodeDecodeScripts } from './index'

await generateEncodeDecodeScripts({
    configs: [
        // {
        //     projectRoot: '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery',
        //     path: 'src/server/physics/physics-server-sender.ts',
        //     typeType: 'type',
        //     typeName: 'GenerateType',
        //     outPath:
        //         '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery/src/server/physics/bin.ts',
        //     outClassName: 'PhysicsStatePacketEncoderDecoder',
        //     printNode: true,
        //     parserOptions: { customNodes: { customUnionRecord: customStuffNode } },
        // },
        {
            projectRoot: '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery',
            path: 'src/server/remote/remote-server-sender.ts',
            typeType: 'type',
            typeName: 'GenerateType',
            outPath:
                '/home/krypek/home/Programming/crosscode/instances/cc-server/assets/mods/cc-multibakery/src/net/binary/remote-update-packet-encoder-decoder.generated.ts',
            outClassName: 'PhysicsStatePacketEncoderDecoder',
            printNode: true,
            insertTsIgnore: true,
        },
    ],
})
