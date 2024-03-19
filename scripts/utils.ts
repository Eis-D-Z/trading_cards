import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { Secp256k1Keypair } from "@mysten/sui.js/keypairs/secp256k1";
import { Secp256r1Keypair } from "@mysten/sui.js/keypairs/secp256r1";
import {SuiClient, getFullnodeUrl} from "@mysten/sui.js/client";
import {fromB64} from "@mysten/sui.js/utils";
import {constants} from "./constants";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { TransactionBlock } from "@mysten/sui.js/transactions";
dotenv.config({path: __dirname + '/.env'});


// export const client = new SuiClient({url: getFullnodeUrl(constants.network as 'testnet' | 'mainnet' | 'devnet' | 'localnet')});
export const client = new SuiClient({url: "https://mysten-rpc.testnet.sui.io:443"});

// We're getting the key from ~/.sui/sui_confing/sui.keystore
const keyBase64 = process.env.ADMIN_KEY;
const keyWithFlag = fromB64(keyBase64);
const keyArray = Array.from(keyWithFlag);
const flag =keyArray.shift(); // remove the first byte
const keyBuffer = Uint8Array.from(keyArray);
let keypair: Ed25519Keypair | Secp256k1Keypair | Secp256r1Keypair;
if (flag === 0) {
    keypair = Ed25519Keypair.fromSecretKey(keyBuffer);
}
if (flag === 1) {
    keypair = Secp256k1Keypair.fromSecretKey(keyBuffer);
}
if (flag === 2) {
    keypair = Secp256r1Keypair.fromSecretKey(keyBuffer);
}

export const address = keypair.toSuiAddress();


export const signAndExecute = async (tx: TransactionBlock) => {
    const res = await client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: keypair,
        options: {
            showEffects: true,
        },
        requestType: "WaitForLocalExecution"
    });
    return res;
}

export const updateConstants = (newValues: any) => {
    const constantsFile = "../constants.ts";
    const data = fs.readFileSync(constantsFile, "utf8");
    const result = data.replace(/export const constants = {[^}]+}/, `export const constants = ${JSON.stringify(newValues, null, 2)}`);
    fs.writeFileSync(constantsFile, result, "utf8");
}