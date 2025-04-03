use anchor_lang::prelude::*;

pub mod constant;
pub use constant::*;

pub mod state;
pub use state::*;

pub mod initialize_config;
pub use initialize_config::*;

pub mod add_liquidity;
pub use add_liquidity::*;

pub mod error;
pub use error::*;

pub mod initialize;
pub use initialize::*;
declare_id!("G3MkxkWxuWpZdQGFRdZRRWGaZ6PndDjEsdF6E1citqgG");

#[program]
pub mod amm_project {
 
    use super::*;

    pub fn process_initialize_config(ctx: Context<InitializeConfig>, seed: u64, fee: u64)->Result<()>{
        initialize_config(ctx, seed, fee)
    }
    pub fn initialize_pool(ctx: Context<InitializePool>)->Result<()>{
        process_initialize_pool(ctx)
    }
    pub fn add_liquidity(ctx: Context<AddLiquidity>, amount_a: u64, amount_b: u64)-> Result<()>{
        process_add_liquidity(ctx, amount_a, amount_b)
    }
}

