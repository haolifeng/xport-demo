const anchor = require('@coral-xyz/anchor');

const {getAssociatedTokenAddressSync} = require('@solana/spl-token');

const { getAuthorityKeypairFromId, getOperatorKeypairFromId } = require('./wallet');
const config = require('./config');
const {    ComputeBudgetProgram, PublicKey} = require("@solana/web3.js");
const {
    findProgramAddress,sleep,findProgramAddressByNumSeed,findProgramAddressByNumSeedTwo
} = require('./utils');
const {Buffer} = require("buffer");


class AppProgram {
    constructor(keypair) {
        this.keypair = keypair;
        this.wallet = new anchor.Wallet(this.keypair);
        this.connection = new anchor.web3.Connection(config.nodeUrl);
        this.provider = new anchor.AnchorProvider(this.connection, this.wallet, 'recent');

        this.appProgram =new anchor.Program(config.idl, this.provider);
    }

    async initialize_settings() {

        let gateWayPublicKey = new PublicKey(config.gateWayAddr);

        let settingAccount = findProgramAddress('settings',this.appProgram.programId);

        // Peer (WAN) chain id + app address are stored in settings and enforced
        // as a whitelist on both inbound and outbound messages.
        let peerChainId = new anchor.BN(config.WanChainId);
        let peerAppAddr = Buffer.from(config.WanAppScAddr.slice(2), 'hex');

        let instructioin = await this.appProgram.methods.initializeSettings(gateWayPublicKey, peerChainId, peerAppAddr)
            .accounts({
                settings:settingAccount.publicKey,
                authority:this.wallet.publicKey,
                }

            )
            .instruction();
        let tx = new anchor.web3.Transaction();
        tx.add(instructioin);

        let txHash = null;
        try {
            txHash = await this.connection.sendTransaction(tx,[this.keypair]);
            console.log('txHash: ', txHash);
        }catch (e) {
            console.log('error: ', e);
        }
    }
    async getSetting() {
        let settingAccount = findProgramAddress('settings',this.appProgram.programId);

        let setting = await this.appProgram.account.settings.fetch(settingAccount.publicKey);

        console.log('gateway: ', setting.gatewayProgram.toString());
        console.log('authority: ', setting.authority.toString());
        console.log('peer chain id: ', setting.peerChainId.toString());
        console.log('peer app address: ', Buffer.from(setting.peerAppAddress.slice(0, setting.peerAppAddressLen)).toString('hex'));
    }
    async crossTokenToEvm() {


        let settingAccount = findProgramAddress('settings',this.appProgram.programId);
        let cpi_signerAccount = findProgramAddress('CpiSigner', this.appProgram.programId);
        let gateway_programPublicKey = new PublicKey(config.gateWayAddr);


        const peer_chain_id = new anchor.BN(config.WanChainId);  // Eth chain ID
        const peer_app_address = Buffer.from(config.WanAppScAddr.slice(2), "hex");

        const SOLANA_CHAIN_ID = config.SolanaChainId; // From gate-way constants
        const source_contract_address = this.appProgram.programId.toBytes(); // gw-app program ID
        console.log('source_contract_address: ', this.appProgram.programId.toBase58());
        // Convert numbers to little-endian bytes
        const solanaChainIdBytes = new ArrayBuffer(16);
        const solanaChainIdView = new DataView(solanaChainIdBytes);
        solanaChainIdView.setBigUint64(0, BigInt(SOLANA_CHAIN_ID), true); // little-endian

        const peerChainIdBytes = new ArrayBuffer(16);
        const peerChainIdView = new DataView(peerChainIdBytes);
        peerChainIdView.setBigUint64(0, BigInt(peer_chain_id), true); // little-endian

        const nonceAccount = findProgramAddress('nonce', gateway_programPublicKey,
            [
                Buffer.from(new Uint8Array(solanaChainIdBytes)),
                Buffer.from(new Uint8Array(peerChainIdBytes)),
                Buffer.from(source_contract_address),
                Buffer.from(peer_app_address) // normalized_address (20 bytes, used as-is)
            ])

        const adminBoardPublicKey = new PublicKey(config.adminBoardAddr);
        console.log('adminBoardPublicKey: ', adminBoardPublicKey.toBase58())

        const configAccont = findProgramAddress('ConfigData', adminBoardPublicKey);

        console.log('configAccount: ', configAccont.publicKey.toBase58());
        const lockAccount = new PublicKey(config.authority_user);
        const mintAccount = new PublicKey(config.USDC);

        const senderTokenAddress = getAssociatedTokenAddressSync(
            mintAccount,
            this.wallet.publicKey,
        );

        const recepientTokenAddress = getAssociatedTokenAddressSync(
            mintAccount,
            lockAccount,
        );
        //peer_chain_id:u128, peer_app_address:Vec<u8>,to:Vec<u8>, amount:u64, gas_limit: u64

        let peerUserAddr = config.WanUserAddr;


        let instruction = await this.appProgram.methods.crossTokenToEvm(
            peer_chain_id,
            peer_app_address,
            Buffer.from(peerUserAddr.slice(2), 'hex'),
             new anchor.BN(10), new anchor.BN(300))
            .accounts({
                settings:settingAccount.publicKey,
                signer:this.wallet.publicKey,
                cpiSigner:cpi_signerAccount.publicKey,
                gatewayProgram:gateway_programPublicKey,
                nonceAccount:nonceAccount.publicKey,
                configAccount:configAccont.publicKey,
                lockAccount:lockAccount,
                mintAccount:mintAccount,
                senderTokenAccount:senderTokenAddress,
                recipientTokenAccount:recepientTokenAddress,
        }).instruction();

        const computeBudgetInstruction = ComputeBudgetProgram.setComputeUnitLimit({
            units: 400_000, // Increase from default 200k to 400k
        });

        let instructions = [
            computeBudgetInstruction,
            instruction
        ];

        let tx = new anchor.web3.Transaction();
        tx.add(...instructions);

        let txHash = null;
        try {
            txHash = await this.connection.sendTransaction(tx,[this.keypair]);
            console.log('txHash: ', txHash);
        }catch (e) {
            console.log('error: ', e);
        }
    }

    async wmbReceiveAccounts(data) {
        console.log('data: ', data);

        let auxiliaryPda = findProgramAddress('Auxiliary', this.appProgram.programId);

        let result = await this.appProgram.methods.wmbReceiveAccounts(Buffer.from(data.slice(2), 'hex'))
            .accounts({
                auxiliaryPda:auxiliaryPda.publicKey
            }).view();

        console.log('result: ', result);

    }
}





module.exports = AppProgram;