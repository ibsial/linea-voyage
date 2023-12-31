import { chalkColors, returnStatuses } from "./constants.js";
import { formatUnits, parseUnits, ethers, Wallet, JsonRpcProvider } from "ethers";
import chalk from "chalk";
import { SingleBar, Presets } from "cli-progress";
import { chains } from "./chainData.js";
import { gasPricePreset, maxRetries } from "../config.js";
import axios from "axios";
export const c = chalk;
export const randomChalk = (line) => {
    return c[chalkColors[Math.floor(Math.random() * chalkColors.length)]](line);
};
export const log = console.log;
export const timeout = 10;

class Numbers {
    bigIntToFloatStr(amount, decimals) {
        return formatUnits(amount, decimals);
    }
    bigIntToPrettyFloatStr(amount, decimals) {
        return parseFloat(formatUnits(amount, decimals)).toFixed(5);
    }
    floatStringToBigInt(floatString, decimals) {
        return parseUnits(floatString, decimals);
    }
    sortArrayIncreasing(array) {
        if (array.length <= 1) return array;
        /* any sorting should be applied here.. */
        return array;
    }
}
export const NumbersHelpers = new Numbers();

class Random {
    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }
    getRandomIntFromTo(min, max) {
        const delta = max - min;
        return Math.round(min + Math.random() * delta);
    }
    getRandomBnFromTo(min, max) {
        const delta = BigInt(max) - BigInt(min);
        const random = BigInt(Math.round(Math.random() * 100));
        return min + (delta * random) / 100n;
    }
    getRandomValue(min, max) {
        const from = NumbersHelpers.floatStringToBigInt(min, 18n);
        const to = NumbersHelpers.floatStringToBigInt(max, 18n);
        return this.getRandomBnFromTo(from, to);
    }
    getRandomDeadline() {
        let hour = 3600;
        let tsNow = Date.now() / 1000; // timestamp in sec
        // deadline from +1 day to +6 days
        let tsRandom = Math.round(tsNow + hour * (Math.random() * this.getRandomInt(3) + 1));
        return tsRandom;
    }
    shuffleArray(oldArray) {
        let array = oldArray.slice();
        let buf;
        for (let i = 0; i < array.length; i++) {
            buf = array[i];
            let randNum = Math.floor(Math.random() * array.length);
            array[i] = array[randNum];
            array[randNum] = buf;
        }
        return array;
    }
    chooseKeyFromStruct(struct, notKey = "") {
        const keys = Object.keys(struct);
        let res = keys[Math.floor(Math.random() * keys.length)];
        while (res == notKey) {
            res = keys[Math.floor(Math.random() * keys.length)];
        }
        return res;
    }
    chooseElementFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    getRandomSentence() {
        const len = Math.round(Math.random() * 4 + 2);
        const words = [
            "great",
            "good",
            "awesome",
            "project",
            "job",
            "devs",
            "strong",
            "cool",
            "webiste",
            "platform",
        ];
        let sentence = "";
        for (let i = 0; i < len; i++) {
            sentence += words[Math.round(Math.random() * words.length)] + " ";
        }
        return sentence;
    }
}
export const RandomHelpers = new Random();

export async function transactionPassed(hash, networkName, beenSleeping = 0) {
    let maxSleep = 150;
    let provider = new ethers.JsonRpcProvider(chains[networkName].rpc);
    if (beenSleeping > maxSleep)
        return { code: 0, data: "", log: `tx verificaion lasts > 150 sec` };
    let txReceipt;
    try {
        txReceipt = await provider.getTransactionReceipt(hash);
        if (txReceipt) {
            return {
                code: txReceipt.status,
                data: "",
                log: `tx receipt received with status: ${
                    txReceipt.status == 1 ? "success" : "fail"
                }`,
            };
        } else {
            await defaultSleep(timeout);
            return await transactionPassed(hash, networkName, beenSleeping + timeout);
        }
    } catch (e) {
        await defaultSleep(timeout);
        return await transactionPassed(hash, networkName, beenSleeping + timeout);
    }
}
export async function getGasPrice(networkName, multiplier = 13n) {
    if (networkName == "Base") {
        return {
            maxFeePerGas: ethers.parseUnits("0.0003", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("0.0003", "gwei"),
        };
    }
    let axiosInstance = axios.create();
    try {
        /**
            this api provides great gasPrice data depending on chain selected
            It is used due to ethers instability with fetching gasPrice on optimistic chains
            Source: Metamask portfolio
         */
        let resp = await axiosInstance.get(
            `https://gas.metaswap.codefi.network/networks/${chains[networkName].id}/suggestedGasFees`,
        );
        // this api returns data with more than 9 decimals, thus need to convert
        const floatToFixed = (float) => {
            let [int, floating] = float.split(".");
            floating = floating.slice(0, 8);
            return int + "." + floating;
        };
        let gasPrice = {
            maxFeePerGas: ethers.parseUnits(
                floatToFixed(resp.data[gasPricePreset].suggestedMaxFeePerGas),
                "gwei",
            ),
            maxPriorityFeePerGas: ethers.parseUnits(
                floatToFixed(resp.data[gasPricePreset].suggestedMaxPriorityFeePerGas),
                "gwei",
            ),
        };
        return gasPrice;
    } catch (e) {
        // log(e);
        let provider = new JsonRpcProvider(chains[networkName].rpc);
        return { gasPrice: ((await provider.getFeeData()).gasPrice * multiplier) / 10n };
    }
}
export async function getCurrentGasPrice(networkName) {
    try {
        let provider = new JsonRpcProvider(chains[networkName].rpc);
        return { gasPrice: (await provider.getFeeData()).gasPrice };
    } catch (e) {
        await defaultSleep(5);
        return await getCurrentGasPrice(networkName);
    }
}
export async function getNativeBalance(signer, networkName) {
    const provider = new JsonRpcProvider(chains[networkName].rpc);
    const nativeBalanceGetter = async () => {
        try {
            return await provider.getBalance(signer.address);
        } catch (e) {
            log(e.message);
            await defaultSleep(5);
            return await nativeBalanceGetter();
        }
    };
    return await nativeBalanceGetter();
}
export async function checkGwei(goodGwei) {
    let ts = new Date();
    ts =
        "Time: " +
        ts.getDate() +
        "_" +
        (ts.getMonth() + 1) +
        "_" +
        ts.getFullYear() +
        " " +
        (ts.getHours() < 10 ? "0" + ts.getHours() : ts.getHours()) +
        ":" +
        (ts.getMinutes() < 10 ? "0" + ts.getMinutes() : ts.getMinutes()) +
        ":" +
        (ts.getSeconds() < 10 ? "0" + ts.getSeconds() : ts.getSeconds());
    try {
        let treshold = parseUnits(goodGwei, "gwei");
        let gweiData = await getCurrentGasPrice("Ethereum");
        let totalFee = gweiData.gasPrice ? gweiData.gasPrice : gweiData.maxFeePerGas;
        if (!totalFee) throw "Can't fetch gwei";
        if (totalFee > treshold) {
            process.stdout.write(
                `High gas price. Want: ${goodGwei} Have: ${formatUnits(
                    totalFee,
                    "gwei",
                )} sleeping.. ${ts}`,
            );
            await defaultSleep(20, false);
        }
        while (true) {
            gweiData = await getCurrentGasPrice("Ethereum");
            totalFee = gweiData.gasPrice ? gweiData.gasPrice : gweiData.maxFeePerGas;
            if (!totalFee) throw "Can't fetch gwei";
            if (totalFee > treshold) {
                process.stdout.clearLine(0); // clear current text
                process.stdout.cursorTo(0);
                process.stdout.write(
                    `High gas price. Want: ${goodGwei} Have: ${formatUnits(
                        totalFee,
                        "gwei",
                    )} sleeping.. ${ts}`,
                );
                await defaultSleep(20, false);
            } else {
                console.log("");
                return true;
            }
        }
    } catch (e) {
        console.log("");
        return await checkGwei(goodGwei);
    }
}
export async function sleep(sec, reason = "Sleep") {
    if (sec > 1) {
        sec = Math.round(sec);
    }
    let bar = new SingleBar(
        { format: `${reason} | ${c.blueBright("{bar}")} | {percentage}% | {value}/{total} sec` },
        Presets.rect,
    );
    bar.start(sec, 0);
    for (let i = 0; i < sec; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1 * 1000));
        bar.increment();
    }
    bar.stop();
    process.stdout.clearLine(0);
}
export async function defaultSleep(sec, needProgress = true) {
    if (needProgress) {
        let newpaste = ["-", `\\`, `|`, `/`];
        for (let i = 0; i < sec * 3; i++) {
            process.stdout.clearLine(0); // clear current text
            process.stdout.cursorTo(0);
            process.stdout.write(`${newpaste[i % 4]}`);
            await await new Promise((resolve) => setTimeout(resolve, 333));
        }
        process.stdout.clearLine(0); // clear current text
        process.stdout.cursorTo(0);
        return;
    }
    return await new Promise((resolve) => setTimeout(resolve, sec * 1000));
}
export async function delayedPrint(paste, delay = 0.033) {
    for (let i = 0; i < paste.length; i++) {
        process.stdout.write(paste[i]);
        await defaultSleep(delay, false);
    }
}
export async function retry(fn, { retries = 0, retryInterval = 20 }, ...args) {
    if (retries >= maxRetries) {
        console.log("retry limit exceeded, marking action as false");
        return false;
    }
    let tries = retries + 1;
    // call function and work on error
    try {
        let result = await fn(...args);
        if (result) {
            return result;
        }
        console.log(`action failed for some reason, retrying... [${tries}]`);
        console.log(c.bold("module", fn.name));
        await sleep(retryInterval, "Sleep before retry");
        return await retry(fn, { retries: tries, retryInterval }, ...args);
    } catch (e) {
        console.log(e);
        console.log(`catched error, retrying... [${tries}]`);
        console.log(c.bold("module", fn.name));
        console.log(
            chalk.magenta("if you see this, please contact the author and tell about error above"),
        );
        await sleep(retryInterval * 2);
    }
    return await retry(fn, { retries: tries, retryInterval }, ...args);
}
