import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import * as stream from "stream";
import { once } from "events";
import { ethers } from "ethers";
import { RandomHelpers, defaultSleep, sleep } from "./helpers.js";
import { shuffleWallets } from "../config.js";

const __dirname = path.resolve();

export const importETHWallets = async (pathToFile = "./privates.txt") => {
    let accs = [];
    let instream = fs.createReadStream(path.join(__dirname, pathToFile));
    let outstream = new stream.Stream();
    let rl = readline.createInterface(instream, outstream);
    rl.on("line", (line) => {
        accs.push(line);
    });
    await once(rl, "close");
    return accs;
};
export const getWallets = async () => {
    let initialData = await importETHWallets("./privates.txt");
    let privates = [];
    for (let [index, data] of initialData.entries()) {
        try {
            let signer = new ethers.Wallet(data);
        } catch (e) {
            console.log("INVALID PRIVATE KEY!");
            return;
        }
        privates.push(data);
    }
    return privates;
};
export const getProxies = async () => {
    let initialData = await importETHWallets("./proxies.txt");
    let proxies = [];
    for (let [index, data] of initialData.entries()) {
        proxies.push(data);
    }
    return proxies;
};
export async function shuffleAndOverwriteKeys() {
    let privates = await getWallets();
    if (shuffleWallets) {
        let newPrivates = RandomHelpers.shuffleArray(privates);
        await writeToFile("privates.txt", newPrivates.join("\n"));
        console.log(`shuffled ${privates.length} private keys successfully!`);
        await defaultSleep(3);
        return newPrivates;
    }
    return privates;
}
export const appendResultsToFile = async (file, data) => {
    fs.appendFile(`./${file}`, data + "\n", (err) => {
        if (err) throw err;
    });
};
export const writeToFile = async (file, data) => {
    fs.writeFile(`./${file}`, data + "\n", (err) => {
        if (err) throw err;
    });
};
