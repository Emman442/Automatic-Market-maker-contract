use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

use crate::{Config, ANCHOR_DISCRIMINATOR};


#[derive(Accounts)]
pub struct InitializeConfig<'info>{
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        init,
        payer=signer,
        space= ANCHOR_DISCRIMINATOR + Config::INIT_SPACE,
        seeds=[b"config", signer.key().as_ref()],
        bump
    )]
      pub config_account: Account<'info, Config>,
    #[account(
        init,
        payer=signer,
        mint::decimals=6,
        mint::authority=signer.key(),
        mint::freeze_authority=signer.key()
    )]
    pub mint_a: InterfaceAccount<'info, Mint>,
       #[account(
        init,
        payer=signer,
        mint::decimals=6,
        mint::authority=signer.key(),
        mint::freeze_authority=signer.key()
    )]
    pub mint_b: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>
}

pub fn initialize_config(ctx: Context<InitializeConfig>,seed: u64,fee: u64 )->Result<()>{
    let config_account = &mut ctx.accounts.config_account;
    config_account.fee = fee;
    config_account.locked = false;
    config_account.mint_a = ctx.accounts.mint_a.key();
    config_account.mint_b = ctx.accounts.mint_b.key();
    config_account.seed = seed;
    Ok(())
}