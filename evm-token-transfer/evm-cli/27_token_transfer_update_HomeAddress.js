const { ethers,  } = require('ethers');
const config = require('./config.js');
const  {
    hexAdd0x, hexTrip0x
} = require('./libs.js');
const Erc20TokenRemote = require('./Erc20TokenRemote');

const web3_1 = require('web3_1.2');

let tokenRomte = new Erc20TokenRemote(config.nodeUrl, config.tokenTransferScAddr);


const get_homeAddress = async () => {
    let ret = await tokenRomte.getHomeAddress();
    console.log('homeAddress: ', ret);
    console.log('homeAddress', Buffer.from(ret.slice(2),'hex').toString());
    let chainId = await tokenRomte.getHomeChainId();
    console.log('chainId: ', chainId.toNumber());
}
const update_homeAddress = async ()=> {
    let words = config.words;

    let wallet = ethers.Wallet.fromMnemonic(words);

    let newScAppAddr = config.SolScAddr;
    let newHomeChainId = config.solChainID;

    let decodeScAppAddr = web3_1.utils.asciiToHex(newScAppAddr);

    console.log('decodeScAppAddr: ', decodeScAppAddr);

    let ret = await tokenRomte.updateHomeAddress(wallet, decodeScAppAddr, newHomeChainId);
}

const main = async ()=> {
   //await update_homeAddress();

   await get_homeAddress();

}
main();