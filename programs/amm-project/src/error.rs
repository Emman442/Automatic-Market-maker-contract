use anchor_lang::prelude::*;

#[error_code]
pub enum AmmError{
    #[msg("Invalid Amount")]
    InvalidAmmount,

    #[msg("Insufficient Liquidity")]
    InsufficientLiquidity
}