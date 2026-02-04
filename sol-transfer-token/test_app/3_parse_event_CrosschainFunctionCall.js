
const anchor = require('@coral-xyz/anchor');
const {PublicKey} = require("@solana/web3.js");
const abi = require('./idl/abi.SolMessageGateWay.json');
const config = require('./config');

const Solchain = require('./SolChain');
const client = new Solchain(config.nodeUrl);
let txHash = "afMLPYmhWvnwNfwy6A4GQAa5V9W79xZLRZHeRHao4RurQ6BnxW9ugnrQSKYuYmJQFaCpjsXBU5SLYZjMvzKzxiL";

let gateWayScAddr = config.gateWayAddr
let coder = new anchor.BorshCoder(abi);

const eventParser = new anchor.EventParser(new PublicKey(gateWayScAddr), coder);

const main = async ()=> {
    let tx = await client.getTransaction(txHash);
    const events = eventParser.parseLogs(tx.meta.logMessages, false);
    for(let event of events) {
        if(event.name === "CrosschainFunctionCall") {
            console.log('event: ', event);

            console.log('event.name:', event.name);
            console.log('event.data.task_id: ', event.data.task_id.toString('hex'));
            console.log('event.data.peer_chain_id: ',event.data.peer_chain_id.toNumber());
            console.log('event.data.peer_chain_app_address:', event.data.peer_chain_app_address.toString('hex'));
            console.log('event.data.finally_function_call_data', event.data.finally_function_call_data.toString('hex'))
            console.log('event.data.gas_limit: ', event.data.gas_limit.toNumber());
            break;
        }

    }


}

main();