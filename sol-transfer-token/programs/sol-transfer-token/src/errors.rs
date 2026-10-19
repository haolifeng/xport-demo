use anchor_lang::prelude::*;

#[error_code]
pub enum Errors {  //WARNING: Add new errors at the end, DON'T insert it. Otherwise you will corrupt the test-case!
    NotAnAdmin,
    NotAnOperator,
    HasInitialized,

    #[msg("Amount should > 0 .")]
    AmountShouldGreatThanZero,

    #[msg("Only specified program can call me.")]
    NotOwner,

    #[msg("Not match with the CPI signer")]
    NotMatchWithCpiSigner,

    #[msg("Not match with the messate type")]
    NotMatchMessageType,

    #[msg("Gateway program does not match the configured one")]
    NotMatchWithGateway,

    #[msg("Peer chain id or peer app address is not the configured one")]
    UntrustedPeer,

    #[msg("Invalid peer address")]
    InvalidPeerAddress,

    #[msg("Invalid receiver address: expect a 20-byte EVM address")]
    InvalidReceiverAddress
}

