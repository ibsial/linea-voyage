import {
    AbiCoder,
    Contract,
    JsonRpcProvider,
    ZeroAddress,
    ethers,
    formatEther,
    solidityPacked,
} from "ethers";
import { izumi_abi, polyhedra_abi } from "../utils/abi.js";
import { PolyhedraSetup, maxRetries } from "../config.js";
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
import { polyhedraAddresses, returnStatuses } from "../utils/constants.js";

class Polyhedra extends PolyhedraSetup {
    polyhedra = new Contract(polyhedraAddresses[this.fromNetwork], polyhedra_abi);
    NATIVE_POOL_ID = 1;
    constructor(signer) {
        super();
        this.signer = signer;
        let provider = new JsonRpcProvider(chains[this.fromNetwork].rpc);
        this.signer = this.signer.connect(provider);
        this.web3wrapper = new WEb3Wrapper(this.signer, this.fromNetwork);
        this.polyhedra = this.polyhedra.connect(this.signer);
    }

    async estimateSendFee() {
        try {
            // let lzFee = await this.polyhedra.getFee(
            //     this.NATIVE_POOL_ID,
            //     chains[this.toNetwork].zkbridgeId,
            //     this.randomAmount,
            // );
            let polyhedraFee = await this.polyhedra.estimateFee(
                this.NATIVE_POOL_ID,
                chains[this.toNetwork].zkbridgeId,
                this.randomAmount,
            );
            log(
                `polyhedra fee: ~${formatEther(
                    // lzFee +
                    polyhedraFee,
                ).slice(0, 8)} ${chains[this.fromNetwork].currency}`,
            );
            this.estimatedFee =
                // lzFee +
                polyhedraFee;
            return this.estimatedFee;
        } catch (e) {
            log(c.red("could not estimate polyhedra or layerzero fees"));
            log(e);
            await defaultSleep(5);
            return this.estimateSendFee();
        }
    }
    async bridge(retryCount = 0) {
        if (retryCount >= maxRetries) {
            return returnStatuses.fiasco;
        }
        retryCount++;
        try {
            let bridgeFee = ((await this.estimateSendFee()) * 105n) / 100n;
            let gas = await this.polyhedra.transferETH.estimateGas(
                chains[this.toNetwork].zkbridgeId,
                this.randomAmount,
                this.signer.address,
                {
                    value: bridgeFee + this.randomAmount,
                },
            );
            // log(bridgeFee, gas);
            let tx = await this.polyhedra.transferETH(
                chains[this.toNetwork].zkbridgeId,
                this.randomAmount,
                this.signer.address,
                {
                    value: bridgeFee + this.randomAmount,
                    gasLimit: (gas * 130n) / 100n,
                    ...(await getGasPrice(this.fromNetwork)),
                },
            );
            log(
                randomChalk(
                    `Minting 0xScore with ${c.underline(this.score)} points for ${
                        this.signer.address
                    }`,
                ),
            );
            log(c.green(chains[this.network].explorer + tx.hash));
            return transactionPassed(tx.hash, this.network);
        } catch (e) {
            log(c.red(`could not bridge. Reason: ${e.message}`));
            await defaultSleep(5);
            return this.bridge(retryCount);
        }
    }
    async getRandomAmount(tokenName = this.fromToken) {
        if (this.amountFromTo[0].includes("%") && this.amountFromTo[1].includes("%")) {
            let percentageFrom = BigInt(this.amountFromTo[0].split("%")[0]);
            let percentageTo = BigInt(this.amountFromTo[1].split("%")[0]);
            let randomPercentage = RandomHelpers.getRandomBnFromTo(percentageFrom, percentageTo);
            if (tokenName == chains[this.fromNetwork].currency) {
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
                swapData[this.fromNetwork][tokenName].decimals,
            );
            let max = ethers.parseUnits(
                this.amountFromTo[1],
                swapData[this.fromNetwork][tokenName].decimals,
            );
            this.randomAmount = RandomHelpers.getRandomBnFromTo(min, max);
            return this.randomAmount;
        } else {
            log(c.red("Invalid amountFromTo config, do you want to use % or values?"));
            throw Error("Invalid amountFromTo config");
        }
    }
}

export async function makePolyhedraBridge(signer) {
    const polyhedra = new Polyhedra(signer);
    const tokenName = chains[polyhedra.fromNetwork].currency;
    await polyhedra.getRandomAmount(tokenName);
    return await polyhedra.bridge();
}
