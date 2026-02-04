
const {PublicKey}  = require("@solana/web3.js");

const config = require('./config');
const Solchain = require('./SolChain');
let users = [
    config.authority_user, config.operator_user,config.agent_user
]
let USDC = config.USDC;
const main = async ()=>{
    let chain = new Solchain(config.nodeUrl);

    for(let i = 0; i < users.length; i++ ) {
        let balance = await  chain.getBalance(new PublicKey(users[i]));
        console.log('balance: ', balance);

        let usdcBalance = await  chain.getTokenBalance(users[i], USDC);
        console.log('usdcBalance: ', usdcBalance);
    }



}

main();