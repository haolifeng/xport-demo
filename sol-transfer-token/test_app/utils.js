const anchor = require("@coral-xyz/anchor");
const findProgramAddress = (
    label,
    programId,
    extraSeeds
) => {
    const seeds = [Buffer.from(anchor.utils.bytes.utf8.encode(label))];
    if (extraSeeds) {
        for (const extraSeed of extraSeeds) {
            if (typeof extraSeed === "string") {
                seeds.push(Buffer.from(anchor.utils.bytes.utf8.encode(extraSeed)));
            } else if (Array.isArray(extraSeed)) {
                seeds.push(Buffer.from(extraSeed));
            } else if (Buffer.isBuffer(extraSeed)) {
                seeds.push(extraSeed);
            } else {
                seeds.push(extraSeed.toBuffer());
            }
        }
    }
    const res = anchor.web3.PublicKey.findProgramAddressSync(seeds, programId);
    return { publicKey: res[0], bump: res[1] };
};

const findProgramAddressByNumSeed = (label, id, programId, id_bytes) => {
    let bNID =id;
    if(!anchor.BN.isBN(bNID)){
        bNID = new anchor.BN(id);
    }
    const res = anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from(label),
            bNID.toArrayLike(Buffer, "le", id_bytes),
        ],
        programId
    );

    return { publicKey: res[0], bump: res[1] };
}

const findProgramAddressByNumSeedTwo = (label, programId, id1,id1_bytes, id2,id2_bytes) => {
    let bNID =id1;
    if(!anchor.BN.isBN(bNID)){
        bNID = new anchor.BN(id1);
    }
    let bNID2 = id2;
    if(!anchor.BN.isBN(bNID2)){
        bNID2 = new anchor.BN(id2);
    }
    const res = anchor.web3.PublicKey.findProgramAddressSync(
        [
            Buffer.from(label),
            bNID.toArrayLike(Buffer, "le", id1_bytes),
            bNID2.toArrayLike(Buffer, "le", id2_bytes),
        ],
        programId
    );

    return { publicKey: res[0], bump: res[1] };
}


function sleep(time) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve();
        }, time);
    })
}


module.exports ={
    findProgramAddress,sleep,findProgramAddressByNumSeed,findProgramAddressByNumSeedTwo
}
