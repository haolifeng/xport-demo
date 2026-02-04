
const TransTokenApp = require('./TransTokenApp');

const config = require('./config');

const { tokenAgent, tokenLocker, tokenOperater } = require('./test_wallets');

const adminKey = tokenLocker();


let app = new TransTokenApp(adminKey);

const init_setting = async () => {
    await app.initialize_setting();
}

const get_setting = async () => {
    await app.showSetting();
}

const main = async ()=>{
   await init_setting();

}

main();