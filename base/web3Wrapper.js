import { Contract, JsonRpcProvider, Wallet, ethers, formatEther } from "ethers";
import {
    log,
    c,
    sleep,
    defaultSleep,
    timeout,
    retry,
    getGasPrice,
    transactionPassed,
} from "../utils/helpers.js";
import { erc20_abi } from "../utils/abi.js";
import { swapData } from "../utils/swapData.js";
import { chains } from "../utils/chainData.js";

class WEb3Wrapper {
    signer;
    networkName;
    constructor(signer, networkName) {
        this.signer = signer;
        this.networkName = networkName;
    }
    async getNativeBalace() {
        let balance;
        try {
            balance = await this.signer.provider.getBalance(this.signer.address);
            return balance;
        } catch (e) {
            console.log("error on fetching native balance, will retry again");
            console.log(e.reason);
            await sleep(timeout);
            return await this.getNativeBalace(this.signer);
        }
    }
    /**
     * unadapted and untested
     * @param {*} amount
     */
    async waitNativeBalance(amount) {
        let ts = new Date();
        ts =
            "Time: " +
            (ts.getDate() + 1) +
            "_" +
            (ts.getMonth() + 1) +
            "_" +
            ts.getFullYear() +
            " " +
            ts.getHours() +
            ":" +
            ts.getMinutes() +
            ":" +
            ts.getSeconds();
        log(`wait native balance ${this.signer.address} ${ts}`);
        let balanceBefore = await retry(this.getNativeBalace.bind(this), {}, this.signer);
        balanceBefore = balanceBefore + amount;
        let balanceAfter = balanceBefore;
        while (balanceBefore >= balanceAfter) {
            balanceAfter = await retry(this.getNativeBalace.bind(this), {}, this.signer);
            await defaultSleep(90);
        }
        log(
            `received ${formatEther(balanceAfter - balanceBefore + amount)} ${
                this.native
            }, continuing`,
        );
    }
    /**
     * unadapted and untested
     * @param {*} amount
     */
    async transferNative(signer, toAddress, value) {
        try {
            let tx = {
                to: toAddress,
                value: value,
            };
            let signerWithProvider = signer.connect(this.signer.provider);
            const transaction = await signerWithProvider.sendTransaction(tx);
            log(
                `transferred ${formatEther(value).slice(0, 8)} ${this.native} from ${
                    signerWithProvider.address
                } to ${toAddress}`,
            );
            console.log(c.green(this.scan + transaction.hash));
            return true;
        } catch (e) {
            log(e);
            log(c.red(`error on native transfer`));
            return false;
        }
    }
    /**
     * unadapted and untested
     * @param {*} amount
     */
    async getTokenBalance(tokenName) {
        let token = new Contract(swapData[this.networkName][tokenName].address, erc20_abi);
        let balance;
        let tokenWithProvider = token.connect(this.signer.provider);
        try {
            balance = await tokenWithProvider.balanceOf(this.signer.address);
            return balance;
        } catch (e) {
            console.log(c.red("error on token balance fetching occured"));
            console.log(c.red(e.reason));
            await sleep(timeout);
            return await this.getTokenBalance(token);
        }
    }
    async needApprove(tokenWithSigner, toAddress, threshold) {
        let amount;
        try {
            amount = await tokenWithSigner.allowance(this.signer.address, toAddress);
        } catch (e) {
            console.log(e);
            console.log(c.red("could not check allowance, probably something wrong with your rpc"));
            console.log("retrying in", timeout, "sec");
            await defaultSleep(timeout);
            return await this.needApprove(token, toAddress, threshold);
        }
        if (amount >= threshold) {
            return false;
        }
        return true;
    }
    async approveToken(tokenName, toAddress, amount) {
        let token = new Contract(swapData[this.networkName][tokenName].address, erc20_abi);
        let tokenWithSigner = token.connect(this.signer);
        let tx;
        if (await this.needApprove(tokenWithSigner, toAddress, amount)) {
            console.log("approving first");
            try {
                let gasPriceData = await getGasPrice(this.networkName);
                tx = await tokenWithSigner.approve(toAddress, amount, gasPriceData);
                // let ts = new Date();
                // ts =
                //     "Time: " +
                //     (ts.getDate() + 1) +
                //     "_" +
                //     (ts.getMonth() + 1) +
                //     "_" +
                //     ts.getFullYear() +
                //     " " +
                //     ts.getHours() +
                //     ":" +
                //     ts.getMinutes() +
                //     ":" +
                //     ts.getSeconds();
                console.log(
                    // ts,
                    c.green(chains[this.networkName].explorer + tx.hash),
                );
            } catch (e) {
                console.log(c.red("approve failed due to:"));
                console.log(e);
                return false;
            }
            return transactionPassed(tx.hash, this.networkName);
        }
        console.log(c.yellow("don't need approve"));
        return true;
    }
}
export { WEb3Wrapper };
