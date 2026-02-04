
const anchor = require('@coral-xyz/anchor');
const {PublicKey} = require("@solana/web3.js");
const {ethers} = require('ethers');
const abi = require('./idl/abi.SolMessageGateWay.json');
const config = require('./config');

const Solchain = require('./SolChain');

const {  FunctionCallData, 
    OutboundFunctionCallData} = require('./utils');

const client = new Solchain(config.nodeUrl);

let txHash = '5PBibVD4s8PzmEfMEGfQni1MMrXCJjzYUWVF1yiKkW5eukB2crEdVRSLPu5i3zk3Vew4tM5q1wmjfEnww9w35HwA';

txHash = "2gxhPTyHRLExjZhuaEF8DWnoyFqA4xmcnRLg9FDpKvDY7Lq5ts2qE4dkFQbCP8ghStvCmxJWRU6THR1yvM3VkhAa";

let solt = 427062091;
let gateWayAddr = config.scAddrs.gateWayAddr;

let coder = new anchor.BorshCoder(abi);

const eventParser = new anchor.EventParser(new PublicKey(gateWayAddr), coder);

(async ()=> {
    let tx = await client.getTransaction(txHash);
    const events = eventParser.parseLogs(tx.meta.logMessages, false);
    for(let event of events) {
        if(event.name === "CrosschainFunctionCall") {
            console.log('event: ', event);

            console.log('event.name:', event.name);
            console.log('event.data.task_id: ', event.data.task_id.toString('hex'));
            console.log('event.data.peer_chain_id: ',event.data.peer_chain_id.toNumber());
            console.log('event.data.peer_chain_app_address:', event.data.peer_chain_app_address.toString('hex'));
           // console.log('event.data.finally_function_call_data', event.data.finally_function_call_data.toString('hex'))
            console.log('event.data.gas_limit: ', event.data.gas_limit.toNumber());

            let data = event.data.finally_function_call_data;

            let OutboundFunctionCallDataParse = new OutboundFunctionCallData();

            let outBoundFunctionData = OutboundFunctionCallDataParse.fromBorshBytes(data);

            //console.log('outBoundFunctionData: ', outBoundFunctionData);

            console.log('networkdId', Number(outBoundFunctionData.networkId));
            console.log('contractAddress: ', outBoundFunctionData.contractAddress);

            let contractScPK = new PublicKey(Buffer.from(outBoundFunctionData.contractAddress,'hex'));

            console.log('contractAddress.toString: ',contractScPK.toBase58());
            const funcDataParser = new FunctionCallData();

            let functionCallData = funcDataParser.fromBorshBytes(outBoundFunctionData.functionCallData);

            //console.log('functionCallData: ', functionCallData);
            let messageFunc = functionCallData.messageFunc;
            console.log(Buffer.from(messageFunc,'hex').toString());
            let messageData = functionCallData.messageData;

            console.log('messageData: ', Buffer.from(messageData,'hex').toString('hex'));

            let message = ethers.utils.defaultAbiCoder.decode(['string','bytes','address', 'uint256'], messageData);
            console.log('message: ',message);

            let from = message[1].slice(2);

            console.log('from: ', from);
            let fromPublicKey = new PublicKey(Buffer.from(from,'hex'));
            console.log('fromBublicKey: ', fromPublicKey.toBase58());

            let to = message[2];

            



            break;
        }

    }


})();

/*test data
*
*
event:  {
  name: 'CrosschainFunctionCall',
  data: {
    task_id: <Buffer 59 bd eb c1 e1 a8 3d 22 5c 0d bc 7a ee a6 96 02 3c 07 f5 33 af 8a 02 5e a1 33 c1 10 0e c4 34 47>,
    peer_chain_id: <BN: 8057414e>,
    peer_chain_app_address: <Buffer f5 99 0b b4 01 6f e4 0d 01 95 cb 94 bc 57 69 77 4c 5e 3b 39>,
    finally_function_call_data: <Buffer 12 01 00 00 0a 00 00 00 77 6d 62 52 65 63 65 69 76 65 00 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 ... 276 more bytes>,
    gas_limit: <BN: 12c>
  }
}
event.name: CrosschainFunctionCall
event.data.task_id:  59bdebc1e1a83d225c0dbc7aeea696023c07f533af8a025ea133c1100ec43447
event.data.peer_chain_id:  2153201998
event.data.peer_chain_app_address: f5990bb4016fe40d0195cb94bc5769774c5e3b39
event.data.gas_limit:  300
networkdId 2147484149
contractAddress:  [
  102,  21,  10,   6,  83,  74,  32, 148,
   99, 195,  38,  58,   6, 137, 211,  54,
  251,  95, 134, 192,  27, 160, 162,   0,
   61, 108, 185,   7, 156, 203, 166, 161
]
contractAddress.toString:  7sVC9w6RuxBmR3eoSsKfTBvDmxAYJyMkk4fC5mgNovQQ
wmbReceive
messageData:  000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000093a7f07e94eaf48593905735eac165fee03063750000000000000000000000000000000000000000000000000000000000000067000000000000000000000000000000000000000000000000000000000000000b63726f73735f746f6b656e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020609dabfa30ebdfb97eb54ced68750782ea740bd248a88c69aea1b82a66321f24
message:  [
  'cross_token',
  '0x609dabfa30ebdfb97eb54ced68750782ea740bd248a88c69aea1b82a66321f24',
  '0x93a7f07e94EAF48593905735EAC165fEE0306375',
  BigNumber { _hex: '0x67', _isBigNumber: true }
]
from:  609dabfa30ebdfb97eb54ced68750782ea740bd248a88c69aea1b82a66321f24
fromBublicKey:  7W9auyNhW7iAffWDTvK5a1AbS978o3dkHFqZhvGysX9m

*
*
* */