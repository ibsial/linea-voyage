import { ethers } from "ethers";
import { ThirdPartyBridgeSetup, maxRetries } from "../config.js";
import { RandomHelpers, c, getGasPrice, getNativeBalance, log } from "../utils/helpers.js";
import { chains } from "../utils/chainData.js";

const ORBITER_ADDRESS = "0x80C67432656d59144cEFf962E8fAF8926599bCF8";
const LINEA_ENDING = 9023n;

export async function bridgeOrbiter(signer, tryCount = 0) {
    const networkName = ThirdPartyBridgeSetup.fromNetwork;
    if (tryCount >= maxRetries) {
        return { code: -1, data: "", log: "retry limit exceeded" };
    }
    tryCount++;

    const provider = new ethers.JsonRpcProvider(chains[networkName].rpc);
    let runner = signer.connect(provider);
    let toBridge = await getBridgeValue(signer, networkName);
    if (!toBridge) return { code: -1, data: "", log: `bridge value is below 0` };
    let correctAmount = (toBridge / 10000n) * 10000n + LINEA_ENDING;
    if (correctAmount < ethers.parseEther("0.005")) {
        log(c.red(`bridge value for ${signer.address} < 0.005 ETH`));
        return { code: -1, data: "", log: `bridge value for ${signer.address} < 0.005 ETH` };
    }
    let tx = {
        to: ORBITER_ADDRESS,
        value: correctAmount,
    };
    let gasPrice = await getGasPrice(networkName);
    tx = { ...tx, ...gasPrice };
    try {
        let txReceipt = await runner.sendTransaction(tx);
        log(c.green(chains[networkName].explorer + txReceipt.hash));
        return await transactionPassed(txReceipt.hash, networkName);
    } catch (e) {
        log(e.message);
        log(c.red(`orbiter bridge failed...`));
        await defaultSleep(10);
        return await bridgeOrbiter(signer, networkName, tryCount);
    }
}
async function getBridgeValue(signer, networkName) {
    const balance = await getNativeBalance(signer, networkName);
    const toBridge = RandomHelpers.getRandomBnFromTo(
        ethers.parseEther(ThirdPartyBridgeSetup.amountFromTo[0]),
        ethers.parseEther(ThirdPartyBridgeSetup.amountFromTo[1]),
    );
    if (balance - toBridge < 0n) {
        log(c.red(`insufficient balance on ${signer.address}`));
        return;
    }
    return toBridge;
}
