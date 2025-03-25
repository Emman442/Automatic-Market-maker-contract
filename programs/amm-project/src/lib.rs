use anchor_lang::prelude::*;

pub mod constant;
pub use constant::*;

pub mod state;
pub use state::*;

pub mod initialize_config;
pub use initialize_config::*;

pub mod error;
pub use error::*;

pub mod initialize;
pub use initialize::*;
declare_id!("7ju63y6keziS4z5tTMW19NDcbMF4a5DDybw2qdbpfZhC");

#[program]
pub mod amm_project {
    use super::*;

    pub fn process_initialize_config(ctx: Context<InitializeConfig>, seed: u64, fee: u64)->Result<()>{
        initialize_config(ctx, seed, fee)
    }
}

