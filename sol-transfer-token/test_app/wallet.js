const anchor = require('@coral-xyz/anchor');
const config = require('./config');
const getAuthorityKeypairFromId=   ()=> {
    let myKeypair =  anchor.web3.Keypair.fromSecretKey(new Buffer.from(config.aythority_id));
    return myKeypair;
}

const getKeypairRanom = ()=>{
    let keypar = anchor.web3.Keypair.generate();
    console.log('Keypair: ',keypar);

    console.log('Keypair.publicKey: ', keypar.publicKey.toBase58())

}
const getOperatorKeypairFromId = ()=> {
    let keypair = anchor.web3.Keypair.fromSecretKey(new Uint8Array(config.operator_id));
    return keypair;
}

const getAgentKeypairFromId = ()=> {
    return anchor.web3.Keypair.fromSecretKey(new Uint8Array(config.agent_id));
}



module.exports = {
    getAuthorityKeypairFromId , getOperatorKeypairFromId, getAgentKeypairFromId
}