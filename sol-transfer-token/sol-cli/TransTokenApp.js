

const anchor = require('@coral-xyz/anchor');

const {getAssociatedTokenAddressSync} = require('@solana/spl-token');

const config = require('./config');
const {    ComputeBudgetProgram, PublicKey} = require("@solana/web3.js");
const {
    findProgramAddress,sleep,findProgramAddressByNumSeed,findProgramAddressByNumSeedTwo
} = require('./utils');
const {Buffer} = require("buffer");

class TransTokenApp {
    constructor(keypair) {
        this.keypair = keypair;
        this.wallet = new anchor.Wallet(this.keypair);
        this.connection = new anchor.web3.Connection(config.nodeUrl);
        this.provider = new anchor.AnchorProvider(this.connection, this.wallet, 'recent');

        this.program = new anchor.Program(config.idl.transfer_token, this.provider);

    }

    async initialize_setting( ) {
        let gateWayPublickKey = new PublicKey(config.scAddrs.gateWayAddr);

        let settingAccount = findProgramAddress('settings', this.program.programId);
        let instructioin = await this.program.methods.initializeSettings(gateWayPublickKey)
            .accounts({
                    settings:settingAccount.publicKey,
                    authority:this.keypair.publicKey,
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
    async showSetting() {
        let settingAccount = findProgramAddress('settings',this.program.programId);

        let setting = await this.program.account.settings.fetch(settingAccount.publicKey);

        console.log('gateway: ', setting.gatewayProgram.toString());
        console.log('authority: ', setting.authority.toString());
    }
    async crossTokenToWan(amount, gaslimit) {


        let settingAccount = findProgramAddress('settings',this.program.programId);
        let cpi_signerAccount = findProgramAddress('CpiSigner', this.program.programId);
        let gateway_programPublicKey = new PublicKey(config.scAddrs.gateWayAddr);


        const peer_chain_id = new anchor.BN(config.peer.WanChainId);  // Eth chain ID
        const peer_app_address = Buffer.from(config.peer.WanAppScAddr.slice(2), "hex");

        const SOLANA_CHAIN_ID = config.SolanaChainId; // From gate-way constants
        const source_contract_address = this.program.programId.toBytes(); // gw-app program ID
        console.log('source_contract_address: ', this.program.programId.toBase58());
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

        const adminBoardPublicKey = new PublicKey(config.scAddrs.adminBoardAddr);
        console.log('adminBoardPublicKey: ', adminBoardPublicKey.toBase58())

        const configAccont = findProgramAddress('ConfigData', adminBoardPublicKey);

        console.log('configAccount: ', configAccont.publicKey.toBase58());
          //peer_chain_id:u128, peer_app_address:Vec<u8>,to:Vec<u8>, amount:u64, gas_limit: u64

        let peerUserAddr = config.peer.WanUserAddr;


        let instruction = await this.program.methods.crossTokenToEvm(
            peer_chain_id,
            peer_app_address,
            Buffer.from(peerUserAddr.slice(2),'hex'),
            new anchor.BN(amount), new anchor.BN(gaslimit))
            .accounts({
                settings:settingAccount.publicKey,
                signer:this.wallet.publicKey,
                cpiSigner:cpi_signerAccount.publicKey,
                gatewayProgram:gateway_programPublicKey,
                nonceAccount:nonceAccount.publicKey,
                configAccount:configAccont.publicKey,
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

        let auxiliaryPda = findProgramAddress('Auxiliary', this.program.programId);

        let result = await this.program.methods.wmbReceiveAccounts(Buffer.from(data.slice(2), 'hex'))
            .accounts({
                auxiliaryPda:auxiliaryPda.publicKey
            }).view();

        console.log('result: ', result);

    }
}

module.exports = TransTokenApp