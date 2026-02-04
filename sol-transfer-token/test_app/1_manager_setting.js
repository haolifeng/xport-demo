const config = require('./config');
const AppProgram = require('./AppProgram.js');

const {getAuthorityKeypairFromId} = require('./wallet');

const adminKeypar = getAuthorityKeypairFromId();

let appProgram = new AppProgram(adminKeypar);


const main = async ()=> {
    //let ret = await appProgram.initialize_settings();

   await appProgram.getSetting();

}

main();