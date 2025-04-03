use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    mint_to, transfer_checked, Mint, MintTo, TokenAccount, TokenInterface, TransferChecked,
};

use crate::{AmmError, Pool};

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(mut)]
    pub mint_a: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub lp_mint: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub user_token_a: InterfaceAccount<'info, Mint>,
    #[account(mut)]
    pub user_token_b: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_a: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub vault_b: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub user_lp_token: InterfaceAccount<'info, TokenAccount>,
    #[account(
        seeds=[b"pool", mint_a.key().as_ref(), mint_b.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

pub fn process_add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_a: u64,
    amount_b: u64,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;
    if amount_a == 0 || amount_b == 0 {
        return Err(AmmError::InvalidAmmount.into());
    }

    let mint_amount = if pool.vault_a_reserve == 0 {
        amount_a
    } else {
        amount_a * pool.lp_supply / pool.vault_a_reserve
    };

    let cpi_accounts = TransferChecked {
        mint: ctx.accounts.mint_a.to_account_info(),
        from: ctx.accounts.user_token_a.to_account_info(),
        to: ctx.accounts.vault_a.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    let cpi_program = &ctx.accounts.token_program.to_account_info();
    let cpi_context = CpiContext::new(cpi_program.clone(), cpi_accounts);
    transfer_checked(cpi_context, amount_a, ctx.accounts.mint_a.decimals)?;

    //Token transfer B
    let cpi_accounts_b = TransferChecked {
        mint: ctx.accounts.mint_b.to_account_info(),
        from: ctx.accounts.user_token_b.to_account_info(),
        to: ctx.accounts.vault_b.to_account_info(),
        authority: ctx.accounts.signer.to_account_info(),
    };
    let cpi_context = CpiContext::new(cpi_program.clone(), cpi_accounts_b);
    transfer_checked(cpi_context, amount_b, ctx.accounts.mint_b.decimals)?;

    //Mint To User

    mint_to(
        CpiContext::new_with_signer(
            cpi_program.clone(),
            MintTo {
                mint: ctx.accounts.lp_mint.to_account_info(),
                to: ctx.accounts.user_lp_token.to_account_info(),
                authority: ctx.accounts.lp_mint.to_account_info(),
            },
            &[&[
                b"pool",
                &ctx.accounts.mint_a.key().as_ref(),
                &ctx.accounts.mint_b.key().as_ref(),
                &[ctx.bumps.pool],
            ]],
        ),
        mint_amount,
    )?;

    //Update Pool Reserves

    pool.vault_a_reserve += amount_a;
    pool.vault_b_reserve += amount_b;
    pool.lp_supply += mint_amount;

    Ok(())
}
