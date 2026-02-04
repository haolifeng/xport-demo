let config = {
    aythority_id:[180,69,30,80,27,41,181,186,110,153,92,223,189,65,215,167,121,120,142,215,136,74,157,117,186,160,64,118,249,164,133,239,34,24,115,120,84,52,196,104,34,166,11,183,236,73,36,203,231,112,41,31,138,83,239,230,242,70,177,184,45,168,2,250],
    authority_user:'3J6VD7p9S7t7QNSXBod9mbwWCZtzpwwkvrpcitWgB7tu',
    idl:require('./idl/sol_transfer_token.json'),
    nodeUrl:'https://api.devnet.solana.com',
    gateWayAddr:"9J17hVJXCcMsD1E7Kv5yNKEgQAhwcu4NvtPQvXkgesiV",
    adminBoardAddr:'7jYCM8k5Nvwg5vyPpLk2yjivQhexPDMXuK8CSbUKqL6B',

    operator_user:'7W9auyNhW7iAffWDTvK5a1AbS978o3dkHFqZhvGysX9m',
    operator_id: [
        67,  17, 255,  58,  98,  50, 186,  82,  82, 214, 198,
        16,  11, 234, 138, 170, 118, 156, 115, 241,  30, 103,
        19,  56, 122,  87,  59,   9, 247,  43,  92,  89,  96,
        157, 171, 250,  48, 235, 223, 185, 126, 181,  76, 237,
        104, 117,   7, 130, 234, 116,  11, 210,  72, 168, 140,
        105, 174, 161, 184,  42, 102,  50,  31,  36
    ],

    agent_id: [
        250, 127, 188, 165, 103, 154, 253, 223, 114,  79,
        198, 138, 116,  49,   6,  79, 103, 158,  30, 139,
        159,  12, 190, 185, 245, 167, 241,  37,  55, 246,
        191, 208, 216,  16, 153, 255, 212,  24, 196, 149,
        83, 107, 177,  95, 112, 118, 209, 181, 163, 168,
        163, 206, 125,  11,  91, 170, 207, 188, 225, 139,
        70, 201, 164,  93
    ],
    agent_user:'FYRkDvPr3Ak9GqkF5CC8jnH7vVa5iAetyefwLiJrc8Zz',

    EthChainId:2147483708,
    WanChainId:2153201998,
    WanAppScAddr:'0x742d35Cc6634C0532925a3b8D4C9db96C4C4C4C4',
    WanUserAddr:'0x8e7fbb49f436d0e8a50c02f631e729a57a9a0aca', // 暂时性的，以后根据世纪情况再更新
    SolanaChainId:2147484149,

    USDC:'4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
}

module.exports = config;