import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { web3 } from "@coral-xyz/anchor";
import * as dotenv from "dotenv";
import path from "path";
import { customGetKeypairFromEnvironment } from "./utils";
import { W3SwapClient } from "./w3SwapClient";

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const PROGRAM_ID = new PublicKey("9qPx5xbqg4xZp3BWbtCNGy3GVfZ4WeaeraMUvLBSdcKh");
const connection = new Connection(web3.clusterApiUrl("devnet"), "confirmed");

// Use projectAdmin keypair
const projectAdminKeyPair: Keypair = customGetKeypairFromEnvironment('projectAdmin');
const client: W3SwapClient = new W3SwapClient(connection, projectAdminKeyPair, PROGRAM_ID);

async function main() {
    try {
        console.log("Fetching projects...");
        const projects = await client.fetchProjects();
        console.log(`Found ${projects.length} projects.`);

        if (projects.length > 0) {
            console.log("First project status:", JSON.stringify(projects[0].account.status, null, 2));
            console.log("First project full account:", JSON.stringify(projects[0].account, null, 2));

            // Check all statuses
            projects.forEach((p, i) => {
                console.log(`Project ${i} status:`, JSON.stringify(p.account.status));
            });
        } else {
            console.log("No projects found.");
        }
    } catch (error) {
        console.error("Error fetching projects:", error);
    }
}

main();
