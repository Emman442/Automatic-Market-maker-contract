use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    pub token_a: Pubkey,
    pub token_b: Pubkey,
    pub token_a_reserve: u64,
    pub token_b_reserve: u64,
    pub lp_supply: u64
}


#[account]
#[derive(InitSpace)]
pub struct Config{
    pub seed: u64,
    pub fee: u64,
    pub locked: bool,
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub authority: Option<Pubkey>,
}