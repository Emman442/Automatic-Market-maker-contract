use anchor_lang::prelude::*;
use anchor_spl::token_interface::{TokenInterface, Mint, TokenAccount, TransferChecked, transfer_checked};

use crate::{AmmError, Pool, Config}; 

#[derive(Accounts)]
pub struct Swap<'info>{
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub user_token_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_b: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_b: InterfaceAccount<'info, TokenAccount>,
    #[account(
        seeds=[b"pool", mint_a.key().as_ref(), mint_b.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    #[account(
        seeds=[b"config", signer.key().as_ref()],
        bump
    )]
    pub config_account: Account<'info, Config>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>
}

pub fn process_swap(ctx: Context<Swap>, amount_in : u64)->Result<()>{
    let pool = &mut ctx.accounts.pool;

    let reserve_a = ctx.accounts.vault_a.amount;
    let reserve_b =  ctx.accounts.vault_b.amount;

    if amount_in ==0 || reserve_b == 0 || reserve_a ==0{
        return Err(AmmError::InvalidAmmount.into())
    }
    //Calculate the quotes based on constant product formulaa
    let fee = ctx.accounts.config_account.fee;
    let amount_in_after_fee = amount_in * (1000-fee)/1000;

    let amount_out = (amount_in_after_fee as u128 * reserve_b as u128)/(reserve_a as u128+ amount_in_after_fee as u128);
    let amount_out = amount_out as u64; //This is because SPL tokens amount are stored in u64
    if amount_out==0 {
        return Err(AmmError::InsufficientOutput.into())
    }

    let cpi_accounts_a = TransferChecked{
        mint: ctx.accounts.mint_a.to_account_info(),
        from: ctx.accounts.user_token_a.to_account_info(),
        to: ctx.accounts.vault_a.to_account_info(),
        authority: ctx.accounts.signer.to_account_info()
    };

    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_context_a = CpiContext::new(cpi_program.clone(), cpi_accounts_a);
    transfer_checked(cpi_context_a, amount_in, ctx.accounts.mint_a.decimals)?;

     let cpi_accounts_b = TransferChecked{
        mint: ctx.accounts.mint_b.to_account_info(),
        from: ctx.accounts.vault_b.to_account_info(),
        to: ctx.accounts.user_token_b.to_account_info(),
        authority: pool.to_account_info()
    };
    let cpi_context_b = CpiContext::new(cpi_program.clone(),cpi_accounts_b);
    transfer_checked(cpi_context_b, amount_out, ctx.accounts.mint_b.decimals)?;

    pool.vault_a_reserve = ctx.accounts.vault_a.amount;
    pool.vault_b_reserve = ctx.accounts.vault_b.amount;
    Ok(())
}