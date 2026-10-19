

use std::str::FromStr;
use {
    anchor_lang::prelude::*,
    anchor_spl::{
        associated_token::{AssociatedToken, spl_associated_token_account},
        token::{transfer, Mint, Token, TokenAccount, Transfer, },

    },
};

use anchor_lang::solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction},
    program::{ invoke,invoke_signed },
    pubkey::Pubkey,
};
use anchor_lang::{AnchorDeserialize, AnchorSerialize};


mod utils;
mod events;
mod constants;

use constants::*;

use utils::*;

use crate::errors::Errors;

pub mod message_data;

use message_data::*;
mod errors;

declare_id!("7sVC9w6RuxBmR3eoSsKfTBvDmxAYJyMkk4fC5mgNovQQ");

#[program]
pub mod sol_transfer_token {
    use crate::errors::Errors;
    use super::*;

    const USDC:&str  = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";




    pub fn initialize_settings(ctx: Context<InitializeSettings>, gateway_program: Pubkey, peer_chain_id: u128, peer_app_address: Vec<u8>) -> Result<()> {
        require!(!peer_app_address.is_empty() && peer_app_address.len() <= 32, Errors::InvalidPeerAddress);
        let settings = &mut ctx.accounts.settings;
        settings.gateway_program = gateway_program;
        settings.authority = ctx.accounts.authority.key();
        settings.peer_chain_id = peer_chain_id;
        settings.peer_app_address = to_fixed32(&peer_app_address);
        settings.peer_app_address_len = peer_app_address.len() as u8;
        msg!("Settings initialized with gateway_program: {}", gateway_program);
        Ok(())
    }

    /// Update the trusted peer (chain id + peer app address). Authority only.
    pub fn update_peer(ctx: Context<UpdateSettings>, peer_chain_id: u128, peer_app_address: Vec<u8>) -> Result<()> {
        require!(!peer_app_address.is_empty() && peer_app_address.len() <= 32, Errors::InvalidPeerAddress);
        let settings = &mut ctx.accounts.settings;
        settings.peer_chain_id = peer_chain_id;
        settings.peer_app_address = to_fixed32(&peer_app_address);
        settings.peer_app_address_len = peer_app_address.len() as u8;
        msg!("Updated peer chain_id: {}, peer_app_address len: {}", peer_chain_id, peer_app_address.len());
        Ok(())
    }

    pub fn update_gateway_program(ctx: Context<UpdateSettings>, new_gateway_program: Pubkey) -> Result<()> {
        let settings = &mut ctx.accounts.settings;
        settings.gateway_program = new_gateway_program;
        msg!("Updated gateway progress ID to: {}", new_gateway_program);
        Ok(())
    }

    pub fn update_authority(ctx: Context<UpdateSettings>, new_authority: Pubkey) -> Result<()> {
        let settings = &mut ctx.accounts.settings;
        settings.authority = new_authority;
        msg!("Updated authority to: {}", new_authority);
        Ok(())
    }

    pub fn wmb_receive(ctx: Context<WmbReceiveAccount>, data: Vec<u8>) -> Result<()> {
        msg!("WmbReceive called with {} bytes", data.len());
        msg!("wmb_receive(2) of program: {:?}, data: {:?}", ctx.program_id, data);

        // Only the configured Gate-Way program may deliver inbound messages
        let expected_gateway_program = ctx.accounts.settings.gateway_program;
        msg!("wmb_receive() expected_delegate_program is: {:?}", expected_gateway_program);

        verify_cpi_caller(&ctx.accounts.cpi_authority, expected_gateway_program, Errors::NotMatchWithCpiSigner)?;

        // First decode inbound payload as InBoundFunctionCallData (borsh)
        let inbound = InBoundFunctionCallData::try_from_slice(&data)?;

        // Verify the source chain and source app against the configured peer (whitelist)
        require!(inbound.network_id == ctx.accounts.settings.peer_chain_id, Errors::UntrustedPeer);
        let peer_len = ctx.accounts.settings.peer_app_address_len as usize;
        require!(
            inbound.contract_address.len() == peer_len
                && inbound.contract_address.as_slice() == &ctx.accounts.settings.peer_app_address[..peer_len],
            Errors::UntrustedPeer
        );

        msg!("Inbound payload -> network_id: {:?}", inbound.network_id);
        msg!("Inbound payload -> contract_address len: {:?}", inbound.contract_address.len());

        let function_call_data = FunctionCallData::try_from_slice(&inbound.func_call_data)?;

        // Then decode the inner func_call_data as ABI-encoded MessageData
        // Expected format: abi.encode((string, bytes, uint256))
        match decode_message_data(&function_call_data.message_data) {
            Ok(message_data) => {
                msg!("Successfully decoded message data:");

                match message_data.message_type.as_str() {
                    // "unlockToken" is the only type emitted by the peer app (EVM send())
                    "unlockToken" => {
                        msg!("Processing Message from {:?}", message_data.from);
                        msg!("Processing Message amount {:?}", message_data.amount);

                        require!(message_data.amount > 0, Errors::AmountShouldGreatThanZero);
                        // NOTE: when the unlock transfer is implemented, message_data.to must be
                        // validated against the owner of the destination token account.
                    },
                    _=> {
                        msg!("Unknown message type: {}", message_data.message_type);
                        return Err(Errors::NotMatchMessageType.into());
                    }
                }

            },
            Err(e) => {
                msg!("Failed to decode message data: {:?}", e);
                return Err(e);
            }
        }



        Ok(())
    }

    pub fn wmb_receive_accounts(ctx: Context<WmbReceiveAccountsContext>, data: Vec<u8>) -> Result<WmbReceiveAccountsResponse> {
        msg!("wmb_receive_accounts called with {} bytes", data.len());

        // Use hardcoded addresses from test_view_dynamic_accounts.js
        match decode_message_data(&data) {
            Ok(message_data) => {
                msg!("Successfully decoded message data:");
                let mut accounts = Vec::new();
                match message_data.message_type.as_str() {
                    "unlockToken" => {
                        msg!("Processing Message from {:?}", message_data.from);
                        msg!("Processing Message to {:?}", message_data.to);
                        msg!("Processing Message amount {:?}", message_data.amount);

                        let TOKEN_PROGRAM_ID = Pubkey::from_str("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA").map_err(|_| CustomError::InvalidAccountData)?;

                        let ASSOCIATED_TOKEN_PROGRAM_ID = Pubkey::from_str("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL").map_err(|_| CustomError::InvalidAccountData)?;

                       let SYSTEM_PROGRAM_ID = Pubkey::from_str("11111111111111111111111111111111").map_err(|_| CustomError::InvalidAccountData)?;


                        let tokenProgramID = AccountMetadata {
                            pubkey: TOKEN_PROGRAM_ID,
                            is_writable:false,
                            is_signer:false,
                        };

                        let associateTokenProgramID = AccountMetadata {
                            pubkey:ASSOCIATED_TOKEN_PROGRAM_ID,
                            is_writable:false,
                            is_signer:false,
                        };
                    
                        let systemProgramID = AccountMetadata {
                            pubkey: SYSTEM_PROGRAM_ID,
                            is_writable:false,
                            is_signer:false
                        };

                        accounts.push(tokenProgramID);
                        accounts.push(associateTokenProgramID);
                        accounts.push(systemProgramID);


                        msg!("Returning {} hardcoded account metadata entries", accounts.len());

                        Ok(WmbReceiveAccountsResponse { accounts })


                    },
                    _=> {
                        msg!("Unknown message type: {}", message_data.message_type);
                        Ok(WmbReceiveAccountsResponse { accounts })

                    }
                }

            },
            Err(e) => {
                msg!("Failed to decode message data: {:?}", e);
                return Err(e);
            }
        }






    }



    pub fn out_bound_call<'info>(ctx: Context<'_, '_, '_, 'info, CrossTokenToEvmAccounts<'info>>, peer_chain_id:u128, peer_app_address:Vec<u8>, function_call_data:Vec<u8>, gas_limit: u64) -> Result<()> {
        msg!("out_bound_call of program: {:?}", ctx.program_id);

        // Outbound messages may only be sent to the configured peer app
        let settings = &ctx.accounts.settings;
        require!(peer_chain_id == settings.peer_chain_id, Errors::UntrustedPeer);
        let peer_len = settings.peer_app_address_len as usize;
        require!(
            peer_app_address.len() == peer_len
                && peer_app_address.as_slice() == &settings.peer_app_address[..peer_len],
            Errors::UntrustedPeer
        );

        let curr_app_address = ctx.program_id.to_bytes();

        let params = OutBoundParams{
            network_id: peer_chain_id,
            contract_address: peer_app_address.clone(),
            function_call_data,
            source_contract_address: curr_app_address,
            gas_fee: gas_limit
        };

        let mut ix_data = Vec::new();
        let r1 = constants::GATEWAY_OUTBOUND_CALL_IX_ID; // Gate-Way program outbound_call discriminator
        let r2 = params.try_to_vec()?;

        ix_data.extend_from_slice(&r1);
        ix_data.extend_from_slice(&r2);

        // Provide the required accounts for gate-way's outbound_call
        // Order must match gate-way's OutboundCall context struct: nonce_account, signer, cpi_signer, config_account, system_program
        let accounts_meta = vec![
            AccountMeta::new(ctx.accounts.nonce_account.key(), false),     // nonce_account
            AccountMeta::new(ctx.accounts.signer.key(), true),             // signer (user who pays fees)
            AccountMeta::new_readonly(ctx.accounts.cpi_signer.key(), true), // cpi_signer (PDA signer, read-only)
            AccountMeta::new_readonly(ctx.accounts.config_account.key(), false), // config_account
            AccountMeta::new_readonly(ctx.accounts.system_program.key(), false), // system_program
        ];

        let ix = &Instruction::new_with_bytes(
            ctx.accounts.gateway_program.key(),
            &ix_data,
            accounts_meta,
        );

        let account_infos = vec![
            ctx.accounts.nonce_account.to_account_info(),
            ctx.accounts.signer.to_account_info(),
            ctx.accounts.cpi_signer.to_account_info(),
            ctx.accounts.config_account.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ];

        // Use invoke_signed with PDA signer
        let bump = ctx.bumps.cpi_signer;
        let signer_seeds: &[&[&[u8]]] = &[&[SEEDS::CPI_SIGNER.as_bytes(), &[bump]]];
        invoke_signed(ix, &account_infos, signer_seeds)?;
        Ok(())
    }


    pub fn cross_token_to_evm<'info>(ctx: Context<'_,'_,'_,'info, CrossTokenToEvmAccounts<'info>>, peer_chain_id:u128, peer_app_address:Vec<u8>,to:Vec<u8>, amount:u64, gas_limit: u64)-> Result<()> {

        require!(amount > 0, Errors::AmountShouldGreatThanZero);
        // `to` is the EVM receiver; encode_message_data() encodes it as an ethabi Address
        // and would panic on a non-20-byte value
        require!(to.len() == 20, Errors::InvalidReceiverAddress);

        let cross_message_data = message_data::MessageData {
            message_type:"cross_token".to_string(),
            from:ctx.accounts.signer.to_account_info().key().try_to_vec()?,
            to:to,
            amount:amount
        };

        let encoded_data =  message_data::encode_message_data(&cross_message_data);

        let func_call_data_obj = FunctionCallData {
            message_func: "wmbReceive".as_bytes().to_vec(),
            message_data: encoded_data,
        };

        let function_call_data = func_call_data_obj.try_to_vec()?;

        out_bound_call(ctx, peer_chain_id, peer_app_address, function_call_data, gas_limit)?;

        Ok(())
    }





}



#[derive(Accounts)]
#[instruction(peer_chain_id: u128)]
pub struct CrossTokenToEvmAccounts<'info> {
    #[account(
        seeds = [b"settings"],
        bump
    )]
    pub settings: Account<'info, Settings>,

    /// Transaction signer (the actual user/authority), who pay for the fee (including create new nonce PDA account)
    #[account(mut)]
    pub signer: Signer<'info>,

    /// PDA signer for CPI calls
    #[account(
        seeds = [ SEEDS::CPI_SIGNER.as_bytes() ],
        bump
    )]
    /// CHECK: gate-way program will check this
    pub cpi_signer: UncheckedAccount<'info>,

    /// CHECK: Gate-Way program that will be called via CPI. Must match the configured gateway.
    #[account(
        constraint = gateway_program.key() == settings.gateway_program @ Errors::NotMatchWithGateway
    )]
    pub gateway_program: UncheckedAccount<'info>,

    /// Nonce account for the gate-way program (will be derived)
    /// CHECK: This account is passed to gate-way program which will validate the PDA derivation
    #[account(mut)]
    pub nonce_account: UncheckedAccount<'info>,

    #[account(
        seeds=[ b"ConfigData"],
        seeds::program = "7jYCM8k5Nvwg5vyPpLk2yjivQhexPDMXuK8CSbUKqL6B".parse::<Pubkey>().unwrap(),
        bump
    )]
    /// CHECK: gw-app program will check this
    pub config_account: UncheckedAccount<'info>,


    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeSettings<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 32 + 32 + 16 + 32 + 1, // discriminator + 2 Pubkeys + peer_chain_id(u128) + peer_app_address([u8;32]) + len
        seeds = [b"settings"],
        bump
    )]
    pub settings: Account<'info, Settings>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateSettings<'info> {
    #[account(
        mut,
        seeds = [b"settings"],
        bump,
        has_one = authority  // Anchor reads settings.authority from the Settings account and Compares it with the authority account's public key in the context
    )]
    pub settings: Account<'info, Settings>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WmbReceiveAccount<'info> {
    #[account(
        seeds = [b"settings"],
        bump
    )]
    pub settings: Account<'info, Settings>,

    /// CHECK: CPI Authority
    pub cpi_authority: Signer<'info>,  // parent program/ caller

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,

}

#[repr(C)]
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct OutBoundParams {
    pub network_id:u128,
    pub contract_address: Vec<u8>,
    pub function_call_data: Vec<u8>,
    pub source_contract_address: [u8;32],
    pub gas_fee: u64
}


#[derive(Accounts)]
pub struct WmbReceiveAccountsContext<'info> {
    #[account(
        seeds = [ SEEDS::AUXILIARY.as_bytes() ],
        bump
    )]
    /// CHECK: gw-app program will check this
    pub auxiliary_pda: UncheckedAccount<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct AccountMetadata {
    pub pubkey: Pubkey,
    pub is_writable: bool,
    pub is_signer: bool,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct WmbReceiveAccountsResponse {
    pub accounts: Vec<AccountMetadata>,
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone)]
pub struct InBoundFunctionCallData {
    func_call_data: Vec<u8>,
    network_id: u128,  // peer chain id
    contract_address: Vec<u8>, // peer chain contract address, such as evm
}

#[derive(AnchorDeserialize, AnchorSerialize, Debug, Clone)]
pub struct FunctionCallData {
    pub message_func:Vec<u8>,  // Solana instruction discriminator (For anchor-based contract, it is 8 bytes); For evm, it is a string of dynamic length.
    pub message_data:Vec<u8>,
}


#[account]
pub struct Settings {
    pub gateway_program: Pubkey,
    pub authority: Pubkey,
    pub peer_chain_id: u128,
    pub peer_app_address: [u8; 32],
    pub peer_app_address_len: u8,
}

/// Copy a variable-length address (e.g. 20-byte EVM address) into a fixed [u8; 32]
fn to_fixed32(addr: &[u8]) -> [u8; 32] {
    let mut fixed = [0u8; 32];
    fixed[..addr.len()].copy_from_slice(addr);
    fixed
}
// Define MessageData struct equivalent to Solidity's struct
// Used for both inbound and outbound operations


    // pub account5: UncheckedAccount<'info>,
