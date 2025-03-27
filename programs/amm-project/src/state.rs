use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub vault_a: Pubkey,
    pub vault_b: Pubkey,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub lp_supply: u64,
    pub lp_mint: Pubkey,
    pub bump: u8
}


#[account]
#[derive(InitSpace)]
pub struct Config{
    pub seed: u64,
    pub fee: u64,
    pub locked: bool,
    pub authority: Option<Pubkey>,
}