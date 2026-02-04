
const anchor = require('@coral-xyz/anchor');
const {PublicKey} = require("@solana/web3.js");
const {ethers} = require('ethers');
const abi = require('./idl/abi.SolMessageGateWay.json');
const config = require('./config');

const Solchain = require('./SolChain');

const {  FunctionCallData,
    OutboundFunctionCallData} = require('./utils');

const client = new Solchain(config.nodeUrl);

let txHash = '36LZY76fKsUG6VkSNjkjprMXNm4vUvWF1mDxH1FuHtcguBjwHgu7azB9JeK2UzZr77fYCP3qv8tMd5zkLwAoGXJT';


let solt = 429277011;
let gateWayAddr = config.scAddrs.gateWayAddr;

let coder = new anchor.BorshCoder(abi);

const eventParser = new anchor.EventParser(new PublicKey(gateWayAddr), coder);

(async ()=> {
    let tx = await client.getTransaction(txHash);
    const events = eventParser.parseLogs(tx.meta.logMessages, false);
    for(let event of events) {
        if(event.name === "InboundTaskExecuted") {
            console.log('event: ', event);

            let messageId = event.data.task_id.toString('hex');
            let localChainId = event.data.local_chain_id.toNumber();
            let local_chain_app_address = event.data.local_chain_app_address.toString('hex');

            let data = Buffer.from(event.data.finally_function_call_data,'hex').toString('hex');

            console.log('messageId: ', messageId);
            console.log('localChainId: ', localChainId);
            console.log('localChainAppAddress: ', local_chain_app_address);
            console.log('data: ', data);



        }

    }


})();

/*
*
  data: {
    task_id: <Buffer 50 34 b9 a9 ca d7 2e 6b 1d 10 9c 88 f6 ca 39 a1 97 42 ec 0b 39 4b 02 b5 5e 41 da 63 70 77 33 6b>,
    local_chain_id: <BN: 800001f5>,
    local_chain_app_address: <Buffer 66 15 0a 06 53 4a 20 94 63 c3 26 3a 06 89 d3 36 fb 5f 86 c0 1b a0 a2 00 3d 6c b9 07 9c cb a6 a1>,
    finally_function_call_data: <Buffer 30 01 00 00 08 00 00 00 28 15 1a c4 b6 01 83 ed 20 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... 318 more bytes>
  }
* */