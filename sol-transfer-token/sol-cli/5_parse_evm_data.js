let to = "0x3669476b313177457a5357445758514c4e763848774e35354c385a4c6f396d35334a6b7933425a7554365768";

let toAddr = Buffer.from(to.slice(2), 'hex').toString();
console.log('toAddr: ', toAddr);