import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AmmProject } from "../target/types/amm_project";
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
});
// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { AmmProject } from "../target/types/amm_project";
// import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
// import { Keypair, PublicKey } from "@solana/web3.js";
// import {
//   createAssociatedTokenAccount,
//   createMint,
//   getAssociatedTokenAddressSync,
//   ASSOCIATED_TOKEN_PROGRAM_ID
// } from "@solana/spl-token"

// describe("amm-project", () => {
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);
//   const wallet = provider.wallet as anchor.Wallet;
//   const program = anchor.workspace.ammProject as Program<AmmProject>;

//   const [configAccount, configBump] = anchor.web3.PublicKey.findProgramAddressSync(
//     [
//       Buffer.from("config"),
//       wallet.publicKey.toBuffer()
//     ],
//     program.programId
//   );

//   const mintA = Keypair.generate();
//   const mintB = Keypair.generate();
//   const lpMint = Keypair.generate();

//   let poolAccount: PublicKey;
//   let poolBump: number;
//   let vaultA: PublicKey;
//   let vaultB: PublicKey;

//   before(async () => {
//     // Create Mints
//     await createMint(
//       provider.connection,
//       wallet.payer,
//       wallet.publicKey,
//       null,
//       6,
//       mintA
//     );

//     await createMint(
//       provider.connection,
//       wallet.payer,
//       wallet.publicKey,
//       null,
//       6,
//       mintB
//     );

//   });
//   // Calculate Pool and Vault Addresses
//   [poolAccount, poolBump] = anchor.web3.PublicKey.findProgramAddressSync(
//     [
//       Buffer.from("pool"),
//       mintA.publicKey.toBuffer(),
//       mintB.publicKey.toBuffer()
//     ],
//     program.programId
//   );

//   vaultA = getAssociatedTokenAddressSync(
//     mintA.publicKey,
//     poolAccount,
//     true
//   );

//   vaultB = getAssociatedTokenAddressSync(
//     mintB.publicKey,
//     poolAccount,
//     true
//   );

//   it("Initialize config", async () => {
//     const tx = await program.methods
//       .processInitializeConfig(new anchor.BN(42), new anchor.BN(4))
//       .accounts({
//         tokenProgram: TOKEN_PROGRAM_ID,
//         signer: wallet.publicKey,
//         //@ts-ignore
//         configAccount: configAccount,
//         systemProgram: anchor.web3.SystemProgram.programId,
//       })
//       .signers([wallet.payer])
//       .rpc().catch(e=>console.log("Error: ", e));

//     console.log("Initialize config", tx);
//   });

//   console.log("Mint A", mintA.publicKey.toString())
//   console.log("Mint B", mintB.publicKey.toString())
//   console.log("LP Mint", lpMint)
//   console.log("Vault A", vaultA)
//   console.log("Vault B", vaultB)

//   it("Initialize pool", async () => {
//     const tx = await program.methods
//       .initializePool()
//       .accounts({
//         tokenProgram: TOKEN_PROGRAM_ID,
//         mintA: mintA.publicKey,
//         signer: wallet.publicKey,
//         mintB: mintB.publicKey,
//         //@ts-ignore
//         vaultA,
//         vaultB,
//         lpMint: lpMint.publicKey,
//         configAccount: configAccount,
//         pool: poolAccount,
//         systemProgram: anchor.web3.SystemProgram.programId,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
//       })
//       .signers([wallet.payer, mintA, mintB, lpMint])
//       .rpc();

//     console.log("Initialize pool", tx);
//   });
// });