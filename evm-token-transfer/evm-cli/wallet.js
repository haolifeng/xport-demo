const { ethers } = require('ethers');

let words = "";

let wallet = ethers.Wallet.fromMnemonic(words)

module.exports = wallet;