import { AbiCoder, Contract, JsonRpcProvider, ethers, solidityPacked } from "ethers";
import { izumi_abi } from "../utils/abi.js";
import { IzumiSetup, maxRetries } from "../config.js";
import {
    NumbersHelpers,
    RandomHelpers,
    c,
    defaultSleep,
    getGasPrice,
    log,
    randomChalk,
    retry,
    transactionPassed,
} from "../utils/helpers.js";
import { WEb3Wrapper } from "../base/web3Wrapper.js";
import { chains } from "../utils/chainData.js";
import { swapData } from "../utils/swapData.js";
import { returnStatuses } from "../utils/constants.js";

class Izumi extends IzumiSetup {
    IZUMI_ADDRESS = "0x032b241de86a8660f1ae0691a4760b426ea246d7";
    izumi = new Contract(this.IZUMI_ADDRESS, izumi_abi);

    constructor(signer) {
        super();
        this.signer = signer;
        let provider = new JsonRpcProvider(chains[this.network].rpc);
        this.signer = this.signer.connect(provider);
        this.web3wrapper = new WEb3Wrapper(this.signer, this.network);
        this.izumi = this.izumi.connect(this.signer);
        this.params = {
            path: "0x",
            recipient: this.signer.address,
            amount: 0n,
            minAcquired: 1n,
            deadline: this.getDeadline(),
        };
    }

    async getAmountOut() {
        let calldata = this.buildMulticall();
        let tx;
        try {
            tx = await this.izumi.multicall.staticCall(calldata, {
                value: this.fromToken == chains[this.network].currency ? this.params.amount : 0n,
            });
            // multicall returns 2 calls return values, we need the first one
            let decoded = AbiCoder.defaultAbiCoder().decode(["uint256", "uint256"], tx[0]);
            return decoded[1];
        } catch (e) {
            throw `Error getting amountOut: ${e}`;
        }
    }
    buildMulticall() {
        if (this.toToken == chains[this.network].currency) {
            let swapCall = this.izumi.interface.encodeFunctionData("swapAmount", [this.params]);
            let unwrapCall = this.izumi.interface.encodeFunctionData("unwrapWETH9", [
                0,
                this.signer.address,
            ]);
            return [swapCall, unwrapCall];
        } else {
            let swapCall = this.izumi.interface.encodeFunctionData("swapAmount", [this.params]);
            let refundCall = this.izumi.interface.encodeFunctionData("refundETH", []);
            return [swapCall, refundCall];
        }
    }
    async setupSwap() {
        this.params.amount = await this.getRandomAmount(this.fromToken);
        // if native use WNATIVE
        let tokenInAddress =
            this.fromToken == chains[this.network].currency
                ? swapData[this.network]["W" + this.fromToken].address
                : swapData[this.network][this.fromToken].address;
        let tokenOutAddress =
            this.toToken == chains[this.network].currency
                ? swapData[this.network]["W" + this.toToken].address
                : swapData[this.network][this.toToken].address;

        // build path
        this.params.path = solidityPacked(
            ["address", "uint24", "address"],
            [tokenInAddress, 500, tokenOutAddress],
        );
        this.params.minAcquired = (BigInt(await this.getAmountOut()) * 99n) / 100n;
    }
    async swap(count = 0) {
        if (count >= maxRetries) {
            return returnStatuses.fiasco;
        }
        count++;
        let calldata;
        let tx;
        try {
            await this.setupSwap();
            calldata = this.buildMulticall();
            if (this.fromToken != chains[this.network].currency) {
                let approve = await this.web3wrapper.approveToken(
                    this.fromToken,
                    this.IZUMI_ADDRESS,
                    this.params.amount,
                );
                await defaultSleep(10);
            }
        } catch (e) {
            log(`error on setup occured: ${e.message}`)
            return returnStatuses.fiasco
        }
        let gasPriceData = await getGasPrice(this.network);
        try {
            tx = await this.izumi.multicall(calldata, {
                value: this.fromToken == chains[this.network].currency ? this.params.amount : 0n,
                ...gasPriceData,
            });
            log(
                randomChalk(
                    `swapped ${NumbersHelpers.bigIntToPrettyFloatStr(
                        this.params.amount,
                        BigInt(swapData[this.network][this.fromToken].decimals),
                    )} ${this.fromToken} --> ~${NumbersHelpers.bigIntToPrettyFloatStr(
                        this.params.minAcquired,
                        BigInt(swapData[this.network][this.toToken].decimals),
                    )} ${this.toToken} | ${this.network}`,
                ),
            );
            log(c.green(chains[this.network].explorer + tx.hash));
            return await transactionPassed(tx.hash, this.network);
        } catch (e) {
            log(
                `error swapping ${NumbersHelpers.bigIntToPrettyFloatStr(
                    this.params.amount,
                    BigInt(swapData[this.network][this.fromToken].decimals),
                )} ${this.fromToken} --> ~${NumbersHelpers.bigIntToPrettyFloatStr(
                    this.params.minAcquired,
                    BigInt(swapData[this.network][this.toToken].decimals),
                )} ${this.toToken} | ${this.network}`,
            );
            log(e.message);
            return await this.swap(count);
        }
    }
    async getRandomAmount(tokenName = this.fromToken) {
        if (this.amountFromTo[0].includes("%") && this.amountFromTo[1].includes("%")) {
            let percentageFrom = BigInt(this.amountFromTo[0].split("%")[0]);
            let percentageTo = BigInt(this.amountFromTo[0].split("%")[0]);
            let randomPercentage = RandomHelpers.getRandomBnFromTo(percentageFrom, percentageTo);
            if (tokenName == chains[this.network].currency) {
                let balance = await this.web3wrapper.getNativeBalace();
                this.randomAmount = (BigInt(balance) * BigInt(randomPercentage)) / 100n;
                return (BigInt(balance) * BigInt(randomPercentage)) / 100n;
            } else {
                let balance = await this.web3wrapper.getTokenBalance(tokenName);
                this.randomAmount = (BigInt(balance) * BigInt(randomPercentage)) / 100n;
                return (BigInt(balance) * BigInt(randomPercentage)) / 100n;
            }
        } else if (!this.amountFromTo[0].includes("%") && !this.amountFromTo[1].includes("%")) {
            let min = ethers.parseUnits(
                this.amountFromTo[0],
                swapData[this.network][tokenName].decimals,
            );
            let max = ethers.parseUnits(
                this.amountFromTo[1],
                swapData[this.network][tokenName].decimals,
            );
            this.randomAmount = RandomHelpers.getRandomBnFromTo(min, max);
            return this.randomAmount;
        } else {
            log(c.red("Invalid amountFromTo config, do you want to use % or values?"));
            throw Error("Invalid amountFromTo config");
        }
    }
    getDeadline() {
        let timeNow = Math.round(new Date().getTime() / 1000);
        const oneHour = 3600;
        return timeNow + oneHour;
    }
}

export async function makeIzumiSwap(signer) {
    let izumi = new Izumi(signer);
    return await izumi.swap(izumi);
}
