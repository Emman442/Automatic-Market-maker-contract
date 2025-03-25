import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AmmProject } from "../target/types/amm_project";

describe("amm-project", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.ammProject as Program<AmmProject>;

  it("Initialize config", async () => {
    // Add your test here.
    const tx = await program.methods.processInitializeConfig(new anchor.BN(42),new anchor.BN( 0.4)).rpc();
    console.log("Initialize config", tx);
  });
});
