import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AmmProject } from "../target/types/amm_project";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createAssociatedTokenAccount,
  createMint,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

describe("amm-project", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.ammProject as Program<AmmProject>;

  const [configAccount, configBump] =
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("config"), wallet.publicKey.toBuffer()],
      program.programId
    );

  const mintA = Keypair.generate();
  console.log("Mint A Keypair created:", mintA.publicKey.toString());
  const mintB = Keypair.generate();
  console.log("Mint B Keypair created:", mintB.publicKey.toString());
  const lpMint = Keypair.generate();
  console.log("LP Mint Keypair created:", lpMint.publicKey.toString());
  let poolAccount: PublicKey;
  let poolBump: number;

  before(async () => {
    await createMint(
      provider.connection,
      wallet.payer, // Payer of the transaction
      wallet.publicKey, // Mint authority
      null, // Freeze authority (optional)
      6, // Decimals
      mintA // Mint Keypair
    );
    console.log("Mint A created:", mintA.publicKey.toString());

    // Create mintB
    await createMint(
      provider.connection,
      wallet.payer,
      wallet.publicKey,
      null,
      6,
      mintB
    );
    console.log("Mint B created:", mintB.publicKey.toString());
  });

  [poolAccount, poolBump] = anchor.web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      mintA.publicKey.toBuffer(),
      mintB.publicKey.toBuffer(),
    ],
    program.programId
  );
  const vaultA = getAssociatedTokenAddressSync(
    mintA.publicKey,
    poolAccount, // Use poolAccount as the owner
    true // Allow owner to be a PDA
  );

  const vaultB = getAssociatedTokenAddressSync(
    mintB.publicKey,
    poolAccount, // Use poolAccount as the owner
    true // Allow owner to be a PDA
  );

  it("Initialize config", async () => {
    const tx = await program.methods
      .processInitializeConfig(new anchor.BN(42), new anchor.BN(4))
      .accountsStrict({
        tokenProgram: TOKEN_PROGRAM_ID,
        mintA: mintA.publicKey,
        signer: wallet.publicKey,
        mintB: mintB.publicKey,
        configAccount: configAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet.payer, mintA, mintB])
      .rpc()
      .catch((e) => console.log("Error", e));

    console.log("Initialize config", tx);
  });

  it("Initialize pool", async () => {
    const tx = await program.methods
      .initializePool()
      .accountsStrict({
        tokenProgram: TOKEN_PROGRAM_ID,
        mintA: mintA.publicKey,
        signer: wallet.publicKey,
        mintB: mintB.publicKey,
        vaultA,
        vaultB,
        lpMint: lpMint.publicKey,
        //@ts-ignore
        configAccount: configAccount,
        poolAccount: poolAccount,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([wallet.payer, lpMint])
      .rpc({ skipPreflight: true })
      .catch((e) => console.log("Error2", e));

    console.log("Initialize pool", tx);
  });
});
