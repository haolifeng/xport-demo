const borsh = require('borsh');


class FunctionCallData {
    constructor(messageFunc, messageData) {
        this.schema = {
            struct: {
                messageFunc: {array: {type: 'u8'}}, // Instruction discriminator bytes (8 bytes)
                messageData: {array: {type: 'u8'}}
            }
        };
        this.data = {
            messageFunc:messageFunc,
            messageData:messageData,
        }
    }
    toBorshBytes() {
        return borsh.serialize(this.schema, this.data);
    }
    fromBorshBytes(encoded) {
        return borsh.deserialize(this.schema, encoded);
    }

}

class InboundFunctionCallData {
    constructor(functionCallData, sourceChainId, sourceContract) {
        this.data ={
            functionCallData:functionCallData,
            sourceChainId:sourceChainId,
            sourceContract:sourceContract,

        }
        this.schema = {
            struct:{
                functionCallData:{array:{type:'u8'}},
                sourceChainId:'u128',
                sourceContract:"string",

            }

        }
    }
    toBorshBytes() {
        return borsh.serialize(this.schema, this.data);
    }
    fromBorshBytes(encoded) {
        return borsh.deserialize(this.schema, encoded);
    }
}

class EncodeInfo{
    constructor(_inboundFunctionCallData, _taskId, _networkId, _contractAddr) {
        this.schema = {
            struct:{
                taskId: {array: {type: 'u8'}},
                networkId: 'u128',
                contractAddr: {array: {type: 'u8',len:32}},
                inboundFunctionCallData: {array: {type: 'u8'}}
            }

        }
        this.data = {
            taskId: _taskId,
            networkId: _networkId,
            contractAddr: _contractAddr,
            inboundFunctionCallData: _inboundFunctionCallData
        }
    }

    toBorshBytes() {
            return borsh.serialize(this.schema, this.data);
        }
    fromBorshBytes(encoded) {
            return borsh.deserialize(this.schema, encoded);
        }
}

class EncodeProof {
    constructor(secp256k1_signagures) {
        this.schema = {
            struct:{
                signatures:{
                    array:{
                        type:{
                            struct:{
                                recid:'u8',
                                signature:{array:{type:'u8',len:64}}
                            }
                        }
                    }
                }
            }

        };
        this.data = {
            signatures: secp256k1_signagures
        };
    }
    toBorshBytes() {
        return borsh.serialize(this.schema, this.data);
    }
    fromBorshBytes(encoded) {
        return borsh.deserialize(this.schema, encoded);
    }
}

module.exports = {
     InboundFunctionCallData, EncodeInfo, FunctionCallData, EncodeProof
};