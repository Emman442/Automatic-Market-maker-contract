import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AmmProject} from "../target/types/amm_project";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddress,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PublicKey, Keypair } from "@solana/web3.js";

describe("amm-project", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.AmmProject as Program<AmmProject>;
  
  // Generate fresh keypairs for each test
  let mintAKp: Keypair;
  let mintBKp: Keypair;
  let lpMintKp: Keypair;
  let mintA: PublicKey;
  let mintB: PublicKey;
  let lpMint: PublicKey;

  before(async () => {
    mintAKp = Keypair.generate();
    mintBKp = Keypair.generate();
    lpMintKp = Keypair.generate();


    mintA = await createTokenMintWithKeypair(provider, mintAKp, provider.wallet.publicKey);
    mintB = await createTokenMintWithKeypair(provider, mintBKp, provider.wallet.publicKey);
    lpMint = await createTokenMintWithKeypair(provider, lpMintKp, provider.wallet.publicKey);
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
    const [configPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("config"), wallet.publicKey.toBuffer()],
      program.programId
    );
    const [poolPDA, poolBump] = await PublicKey.findProgramAddress(
      [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer()],
      program.programId
    );

    const vaultA = await getAssociatedTokenAddress(mintA, poolPDA, true);
    const vaultB = await getAssociatedTokenAddress(mintB, poolPDA, true);

    // // Ensure vaults are created before pool initialization
    // const tx = new anchor.web3.Transaction();
    // tx.add(
    //   createAssociatedTokenAccountInstruction(
    //     wallet.publicKey,
    //     vaultA,
    //     poolPDA,
    //     mintA
    //   ),
    //   createAssociatedTokenAccountInstruction(
    //     wallet.publicKey,
    //     vaultB,
    //     poolPDA,
    //     mintB
    //   )
    // );
    // await provider.sendAndConfirm(tx);

    await program.methods
      .initializePool()
      .accounts({
        signer: wallet.publicKey,
        mintA,
        mintB,
        //@ts-ignore
        vaultA,
        vaultB,
        pool: poolPDA,
        configAccount: configPDA,
        lpMint: lpMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([mintAKp, mintBKp, lpMintKp])
      .rpc({ skipPreflight: true });
  });


  it("deposit liquidity",async ()=>{
    const userLpToken = await getAssociatedTokenAddress(lpMint, wallet.publicKey);
    const [poolPDA, poolBump] = await PublicKey.findProgramAddress(
      [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer()],
      program.programId
    );

    const vaultA = await getAssociatedTokenAddress(mintA, poolPDA, true);
    const vaultB = await getAssociatedTokenAddress(mintB, poolPDA, true);
    const userTokenA = await mintToUser(provider, mintA, wallet.publicKey, 10000);
    const userTokenB = await mintToUser(provider, mintB,wallet.publicKey, 10000);
    const tx = await program.methods.addLiquidity(new anchor.BN(1000), new anchor.BN(4000)).accounts({
      signer: wallet.publicKey,
      mintA,
      mintB,
      lpMint,
      vaultA: vaultA,
      vaultB: vaultB,
      tokenProgram: TOKEN_PROGRAM_ID,
      userLpToken,
      userTokenA,
      userTokenB,
      //@ts-ignore
      systemProgram: anchor.web3.SystemProgram.programId,
      pool: poolPDA,
    }).rpc({skipPreflight: true})
  })

  it("swap", async()=>{

    console.log("Mint A swap", mintA.toBase58())
    const userTokenA = await mintToUser(provider, mintA, wallet.publicKey, 10000);
    const userTokenB = await mintToUser(provider, mintB, wallet.publicKey, 10000);
    
    const [configPDA, configBump] =  await PublicKey.findProgramAddress(
      [Buffer.from("config"), wallet.publicKey.toBuffer()],
      program.programId
    );
    const [poolPDA, poolBump] =  await PublicKey.findProgramAddress(
      [Buffer.from("pool"), mintA.toBuffer(), mintB.toBuffer()],
      program.programId
    );

    const vaultA = await getAssociatedTokenAddress(mintA, poolPDA, true);
    const vaultB = await getAssociatedTokenAddress(mintB, poolPDA, true);

    // const vaultABalance = await provider.connection.getTokenAccountBalance(vaultA);
    // const vaultBBalance = await provider.connection.getTokenAccountBalance(vaultB);
    // console.log("Vault A Balance:", vaultABalance.value.amount);
    // console.log("Vault B Balance:", vaultBBalance.value.amount);


    const tx = new anchor.web3.Transaction();
    tx.add(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey, // Payer
        vaultA, // New token account
        poolPDA, // Owner (PDA of the AMM)
        mintA
      ),
      createAssociatedTokenAccountInstruction(
        wallet.publicKey, // Payer
        vaultB, // New token account
        poolPDA, // Owner (PDA of the AMM)
        mintB // Mint
      )
    );

    await provider.sendAndConfirm(tx);
    console.log("Vaults created ✅");

    const swapTx = await program.methods.swap(new anchor.BN(500)).accounts({
      signer: wallet.publicKey,
      mintA,
      mintB,
      vaultA,
      vaultB,
      userTokenA,
      userTokenB,
      tokenProgram: TOKEN_PROGRAM_ID,
      //@ts-ignore
      systemProgram: anchor.web3.SystemProgram.programId,
      configAccount: configPDA,
      pool: poolPDA,
    }).rpc()

    console.log("Swap Tx", swapTx)
  })
});


async function createTokenMint(provider: anchor.AnchorProvider, authority: PublicKey) {
  return await createMint(
    provider.connection,
    provider.wallet.payer, // Payer of fees
    authority, // Mint authority (wallet)
    null, // Freeze authority (optional)
    9 // Decimals
  );
}

async function mintToUser(
  provider: anchor.AnchorProvider,
  mint: PublicKey,
  user: PublicKey,
  amount: number
) {
  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    provider.wallet.payer,
    mint,
    user
  );

  await mintTo(
    provider.connection,
    provider.wallet.payer,
    mint,
    userTokenAccount.address,
    provider.wallet.publicKey, // Authority
    amount
  );

  return userTokenAccount.address;
}

async function createTokenMintWithKeypair(
  provider: anchor.AnchorProvider,
  keypair: Keypair,
  authority: PublicKey
): Promise<PublicKey> {
  await createMint(
    provider.connection,
    provider.wallet.payer,
    authority,
    null,
    9,
    keypair
  );
  return keypair.publicKey;
}
