const config = require('./config');
const AppProgram = require('./AppProgram.js');
const {getOperatorKeypairFromId } = require('./wallet');
let operatorKeypair = getOperatorKeypairFromId();

let appProgram =  new AppProgram(operatorKeypair);

const main = async ()=> {
    await appProgram.crossTokenToEvm()
}

main();