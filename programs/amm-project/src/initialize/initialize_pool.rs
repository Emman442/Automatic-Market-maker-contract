use anchor_lang::prelude::*;


pub struct InitializePool<'info>{
    pub system_program: Program<'info, System>
}