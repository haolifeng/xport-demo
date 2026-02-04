
const TransTokenApp = require('./TransTokenApp');

const config = require('./config');

const { tokenAgent, tokenLocker, tokenOperater } = require('./test_wallets');

let operator = tokenOperater();

let app = new TransTokenApp(operator);

const crossTokenToEvm = async () => {
    let amount = 103;
    let gasLimt = 80000;
    await app.crossTokenToWan(amount,gasLimt);
}


const main = async ()=> {
    await crossTokenToEvm();

}
main();