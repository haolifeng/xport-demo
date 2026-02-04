const { ethers,  } = require('ethers');
const config = require('./config.js');
const  {
    hexAdd0x, hexTrip0x
} = require('./libs.js');
const Erc20TokenRemote = require('./Erc20TokenRemote');

let tokenRomte = new Erc20TokenRemote(config.nodeUrl, config.tokenTransferScAddr);

const getGateWayAddress = async ()=> {
    let ret = await tokenRomte.getWmbGateWay();
    console.log(ret);
}


const setTrustedRemotes = async ()=> {
    let chainID = 2147484149;
    let scAddr = "6iGk11wEzSWDWXQLNv8HwN55L8ZLo9m53Jky3BZuT6Wh";
    let words = "";

    let wallet = ethers.Wallet.fromMnemonic(words)
    await tokenRomte.setTrustedRemote(wallet, chainID, scAddr);
}
const getTrustedRemotes = async ()=> {
    let chainID = config.solChainID;
    let scAddr = config.SolScAddr;

    let ret = await tokenRomte.getTrustedRemote(chainID, scAddr);
    console.log(ret);
}

const wmbReceiveNonEvm = async ()=> {
    let words = config.words;

    let wallet = ethers.Wallet.fromMnemonic(words);

    let data =  "000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000093a7f07e94eaf48593905735eac165fee03063750000000000000000000000000000000000000000000000000000000000000067000000000000000000000000000000000000000000000000000000000000000b63726f73735f746f6b656e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020609dabfa30ebdfb97eb54ced68750782ea740bd248a88c69aea1b82a66321f24";
    let messageId = "84d8f4c7608a8eb7bd5ff0e370ffc0f41e9a5ec5cf58cd06952a43d5f34d0980";
    let fromChainId = 2147484149;
    let from = "6iGk11wEzSWDWXQLNv8HwN55L8ZLo9m53Jky3BZuT6Wh";

    let ret = await tokenRomte.wmbReceiveNonEvm(wallet, hexAdd0x(data) , hexAdd0x(messageId), fromChainId, Buffer.from(from));

    //0x40f1cf5fdb04b2db3331742f5120b9360cd670d0d64320bbc1562b613f0d2db3

}

const getBalance = async ()=> {

    let user = config.receiptUserAddr;
    let ret = await tokenRomte.getTokenBalance(user);
    console.log('ret: ', ethers.utils.formatUnits(ret,6));

}

const send = async ()=> {
    let words = config.words;

    let wallet = ethers.Wallet.fromMnemonic(words);

    let receiptTo = config.solUserAddr;
    let ret = await tokenRomte.send(wallet, Buffer.from(receiptTo),10);

    //0xe651563b87cc492999995d4d2e909550bfc209a1e325c6ffabf5d43ff82569c1
}

const main = async ()=> {
    //await getGateWayAddress();
    //await getTrustedRemotes();
    //await setTrustedRemotes();

    //await wmbReceiveNonEvm();
    await getBalance();
    //await send();

}
main();