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


    let abiEncodedData = ethers.utils.defaultAbiCoder.encode(['string', 'address', 'bytes', 'uint256'],[
        message_data.messageType, message_data.from, ethers.utils.toUtf8Bytes(message_data.to), message_data.amount
    ]);





    await appProgram.wmbReceiveAccounts(abiEncodedData)

}

main();