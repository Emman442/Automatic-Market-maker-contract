use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface}};

use crate::{Config, Pool, ANCHOR_DISCRIMINATOR};


#[derive(Accounts)]
pub struct InitializePool<'info>{
    #[account(mut)]
    pub signer: Signer<'info>,
      #[account(
        init,
        payer=signer,
        mint::decimals=6,
        mint::authority=config_account.key(),
        mint::freeze_authority=config_account.key()
    )]
    pub mint_a: InterfaceAccount<'info, Mint>,
       #[account(
        init,
        payer=signer,
        mint::decimals=6,
        mint::authority=config_account.key(),
        mint::freeze_authority=config_account.key()
    )]
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer=signer,
        associated_token::mint=mint_a,
        associated_token::authority=pool,
        associated_token::token_program=token_program
    )]
     pub vault_a: InterfaceAccount<'info, TokenAccount>,
     #[account(
        init,
        payer=signer,
        associated_token::mint=mint_b,
        associated_token::authority=pool,
        associated_token::token_program=token_program
    )]
    pub vault_b: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init, 
        payer=signer,
        space=ANCHOR_DISCRIMINATOR + Pool::INIT_SPACE,
        seeds=[b"pool", mint_a.key().as_ref(), mint_b.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        seeds= [b"config", signer.key().as_ref()], 
        bump
    )]
    pub config_account: Account<'info, Config>,
    #[account(
        init,
        payer = signer,
        mint::decimals = 6,
        mint::authority = pool.key()
    )]
    pub lp_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info,AssociatedToken>
}

pub fn process_initialize_pool(ctx: Context<InitializePool>)->Result<()>{
    let pool = &mut ctx.accounts.pool;
    pool.vault_a = ctx.accounts.vault_a.key();
    pool.vault_b = ctx.accounts.vault_b.key();
    pool.mint_a = ctx.accounts.mint_a.key();
    pool.mint_b = ctx.accounts.mint_b.key();
    pool.lp_supply=0;
    pool.lp_mint=ctx.accounts.lp_mint.key();
    pool.bump=ctx.bumps.pool;
    Ok(())
}