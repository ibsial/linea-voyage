import { Contract, solidityPacked } from "ethers";
import { izumi_abi } from "../utils/abi.js";
import { IzumiSetup } from "../config.js";
import { log } from "../utils/helpers.js";

const IZUMI_ADDRESS = "0x032b241de86a8660f1ae0691a4760b426ea246d7";
const pathType = {
    fromToken, // address
    poolFee, // uint24
    toToken, // address
};
class Izumi extends IzumiSetup {
    izumi = new Contract(IZUMI_ADDRESS, izumi_abi);

    constructor(signer) {
        this.signer = signer;
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
        let calldata = this.buildMulticall()
        let tx;
        try {
            tx = await this.izumi.multicall.estimateGas(calldata)
            log(tx)
        } catch (e) {
            log(e)
        }
    }
    buildMulticall() {
        if (this.fromToken == chains[this.network].currency) {
            let swapCall = this.izumi.interface.encodeFunctionData("swapAmount", [this.params]);
            let unwrapCall = this.izumi.interface.encodeFunctionData("");
            let refundCall = this.izumi.interface.encodeFunctionData("refundETH", []);
            return [swapCall, unwrapCall, refundCall]
        } else {
            let swapCall = this.izumi.interface.encodeFunctionData("swapAmount", [this.params]);
            let refundCall = this.izumi.interface.encodeFunctionData("refundETH", []);
            return [swapCall, refundCall]
        }
    }
    async setupSwap() {
        this.params.amount = await this.getRandomAmount(this.fromToken);
        // build path
        this.params.path = solidityPacked(
            ["address", "uint24", "address"],
            [
                swapData[this.network][this.fromToken].address,
                500,
                swapData[this.network][this.toToken].address,
            ],
        );
    }
    async swap() {}
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
    let izumi = new Izumi(signer)
    await izumi.setupSwap()
    await izumi.getAmountOut()
}