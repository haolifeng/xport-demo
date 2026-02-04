const borsh = require('borsh');

class OutboundFunctionCallData {
    constructor(functionCallData, networkId, contractAddress) {
        this.schema = {
            struct:{
                functionCallData:{array:{type:'u8'}},
                networkId:'u128',
                contractAddress:{array:{type:'u8',len:32}},
            }
        }
        this.data = {
            functionCallData: functionCallData,
            networkId: networkId,
            contractAddress: contractAddress
        }
    }
    toBorshBytes() {
        return borsh.serialize(this.schema, this.data);
    }
    fromBorshBytes(encoded) {
        return borsh.deserialize(this.schema, encoded);
    }
}

module.exports = {
    OutboundFunctionCallData,
}