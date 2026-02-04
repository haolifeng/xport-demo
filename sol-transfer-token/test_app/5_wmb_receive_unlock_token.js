const config = require('./config');
const AppProgram = require('./AppProgram.js');
const {getAgentKeypairFromId } = require('./wallet');
let keypair = getAgentKeypairFromId();

let appProgram =  new AppProgram(keypair);

let {ethers } = require('ethers');
const {
     InboundFunctionCallData, EncodeInfo, FunctionCallData, EncodeProof
} = require('./inboundCallFunctionCallData');
const main = async ()=> {
    let message_data ={
        messageType:'unlockToken',
        from:config.WanUserAddr,
        to:config.operator_user,
        amount:100,
    }
    let wmbReceive = [40, 21, 26, 196, 182, 1, 131, 237];

    let taskId='1111111';

    let abiEncodedData = ethers.utils.defaultAbiCoder.encode(['string', 'address', 'bytes', 'uint256'],[
        message_data.messageType, message_data.from, ethers.utils.toUtf8Bytes(message_data.to), message_data.amount
    ]);

    console.log('data: ', data);

    const rawEvmDataBytes = Buffer.from(abiEncodedData.slice(2), 'hex');
    console.log('Raw EVM data bytes length:', rawEvmDataBytes.length);

    // Create FunctionCallData with wmb_receive discriminator and the raw ABI-encoded MessageData
    let funcationCallData = new FunctionCallData(wmbReceive, rawEvmDataBytes);
    let funcationCallDataByte = funcationCallData.toBorshBytes();

    // Create proper structure: FunctionCallData -> InboundFunctionCallData -> EncodeInfo
    let inbouCallData = new InboundFunctionCallData(funcationCallDataByte, config.WanChainId, config.WanAppScAddr);
    let inboundCallDataBytes = inbouCallData.toBorshBytes();

    let contractAddr = appProgram.appProgram.programId.toBuffer();

    console.log('contractAddr: ', contractAddr.toString('hex'));

    let encodeInfo = new EncodeInfo(inboundCallDataBytes, Buffer.from(taskId, 'hex'), config.SolanaChainId, contractAddr);
    let encodeInfoBytes = encodeInfo.toBorshBytes();

    console.log('encodeInfoBytes length: ', encodeInfoBytes.length);

    await appProgram.wmbReceiveAccounts()






}

main();