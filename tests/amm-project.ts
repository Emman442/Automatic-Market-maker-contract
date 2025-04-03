import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AmmProject} from "../target/types/amm_project";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { PublicKey, Keypair } from "@solana/web3.js";

describe("amm-project", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.AmmProject as Program<AmmProject>;
  
  // Generate fresh keypairs for each test
  let mintAKeypair: Keypair;
  let mintBKeypair: Keypair;
  let lpMintKeypair: Keypair;

 

  beforeEach(() => {
    // Reset keypairs before each test to ensure unique addresses
    mintAKeypair = Keypair.generate();
    mintBKeypair = Keypair.generate();
    lpMintKeypair = Keypair.generate();
  });

  it("Initialize config", async () => {
    const [configPDA, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("config"), wallet.publicKey.toBuffer()],
      program.programId
    );
    await program.methods
      .processInitializeConfig(new anchor.BN(42), new anchor.BN(4)) // Adjust if this instruction takes args
      .accounts({
                tokenProgram: TOKEN_PROGRAM_ID,
                signer: wallet.publicKey,
                //@ts-ignore
                configAccount: configPDA,
                systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    console.log("Initialize config", configPDA.toBase58());
  });

  it("Initialize pool", async () => {
    // Create mints with fresh keypairs

    const mintA = mintAKeypair.publicKey;
    const mintB = mintBKeypair.publicKey;
    const lpMint = lpMintKeypair.publicKey;

    // Derive PDAs
    const [configPDA, configBump] = await PublicKey.findProgramAddress(
      [Buffer.from("config"), wallet.publicKey.toBuffer()],
      program.programId
    );
    const [poolPDA, poolBump] = await PublicKey.findProgramAddress(
      [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer()],
      program.programId
    );
  

    const vaultA = await getAssociatedTokenAddress(mintA, poolPDA, true);
    const vaultB = await getAssociatedTokenAddress(mintB, poolPDA, true);

    console.log("Mint A", mintA.toBase58());
    console.log("Mint B", mintB.toBase58());
    console.log("LP Mint Keypair", lpMint.toBase58());
    console.log("Vault A", vaultA.toBase58());
    console.log("Vault B", vaultB.toBase58());
    console.log("Config PDA",configPDA )

    await program.methods
      .initializePool()
      .accounts({
        signer: wallet.publicKey,
        mintA: mintA,
        mintB: mintB,
        //@ts-ignore
        vaultA: vaultA,
        vaultB: vaultB,
        pool: poolPDA,
        configAccount: configPDA,
        lpMint: lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([mintAKeypair, mintBKeypair, lpMintKeypair])
      .rpc();
  });

  it("deposit liquidity",async ()=>{
    const mintA = mintAKeypair.publicKey;
    const mintB = mintBKeypair.publicKey;
    const lpMint = lpMintKeypair.publicKey;

    const [poolPDA, poolBump] = await PublicKey.findProgramAddress(
      [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer()],
      program.programId
    );


    const vaultA = await getAssociatedTokenAddress(mintA, poolPDA, true);
    const vaultB = await getAssociatedTokenAddress(mintB, poolPDA, true);

    const tx = await program.methods.addLiquidity(new anchor.BN(1000), new anchor.BN(4000)).accounts({
      signer: wallet.publicKey,
      mintA: mintA,
      mintB: mintB,
      lpMint: lpMint,
      vaultA: vaultA,
      vaultB: vaultB,
      tokenProgram: TOKEN_PROGRAM_ID,
      //@ts-ignore
      systemProgram: anchor.web3.SystemProgram.programId,
      pool: poolPDA,
    }).rpc
  })
});