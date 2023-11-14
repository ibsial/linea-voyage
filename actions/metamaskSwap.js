import { maxRetries, MetamaskSwapSetup } from "../config.js";
import {
    RandomHelpers,
    NumbersHelpers,
    log,
    randomChalk,
    c,
    getGasPrice,
    transactionPassed,
    defaultSleep,
} from "../utils/helpers.js";
import axios from "axios";
import { JsonRpcProvider, Wallet, ethers } from "ethers";
import { chains } from "../utils/chainData.js";
import { metamaskAddresses, returnStatuses } from "../utils/constants.js";
import { swapData } from "../utils/swapData.js";
import { WEb3Wrapper } from "../base/web3Wrapper.js";

export class MetamaskSwap extends MetamaskSwapSetup {
    baseUrl;
    signer;
    constructor(signer) {
        super();
        this.axiosInstance = axios.create();
        this.signer = signer;
        let provider = new JsonRpcProvider(chains[this.network].rpc);
        this.signer = this.signer.connect(provider);
        this.web3wrapper = new WEb3Wrapper(this.signer, this.network);
        this.baseUrl = `https://swap.metaswap.codefi.network/networks/${chains[this.network].id}`;
    }
    async swap(bestRoute, failedDexes = [], tryCount = 0) {
        let txData = bestRoute.trade;
        if (tryCount >= maxRetries) {
            return returnStatuses.fail;
        }
        tryCount++;
        let gasPriceData = await getGasPrice(this.network);
        txData = { ...txData, ...gasPriceData };
        try {
            let tx = await this.signer.sendTransaction(txData);
            log(c.green(chains[this.network].explorer + tx.hash));
            return await transactionPassed(tx.hash, this.network);
        } catch (e) {
            log(e);
            log(c.red(`swap failed...`));
            await defaultSleep(10);
            failedDexes.push(bestRoute.aggregator);
            return this.executeRoute(tryCount, failedDexes);
        }
    }
    async executeRoute(tryCount = 0, failedDexes = []) {
        if (tryCount >= maxRetries) {
            return { code: 0, data: "", log: `retry count exceeded` };
        }
        tryCount++;
        if (this.fromToken != chains[this.network].currency) {
            try {
                let balanceToSwap = await this.getRandomAmount();
                if (balanceToSwap <= 0n) {
                    return { code: -1, data: "", log: `low balance on ${this.signer.address}` };
                }
                let approve = await this.web3wrapper.approveToken(
                    this.fromToken,
                    metamaskAddresses[this.network],
                    balanceToSwap,
                );
                await defaultSleep(10);
            } catch (e) {
                log(e);
                return { code: 0, data: "", log: `approve failed` };
            }
        }
        let resp;
        /* get routes */
        try {
            resp = await axios.get(this.baseUrl + "/trades", {
                params: {
                    walletAddress: this.signer.address,
                    sourceToken: swapData[this.network][this.fromToken].address,
                    destinationToken: swapData[this.network][this.toToken].address,
                    sourceAmount: await this.getRandomAmount(),
                    slippage: "1",
                    timeout: 10000,
                    enableDirectWrapping: true,
                    includeRoute: true,
                },
                headers: {
                    authority: "swap.metaswap.codefi.network",
                },
            });
        } catch (e) {
            log(e);
            log(c.red(`error on getSwapQoute`));
            return await this.executeRoute(tryCount, failedDexes);
        }
        if (!resp?.data) return { code: 0, data: "", log: `bad response` };
        if (resp.data.length == 0) {
            log(
                randomChalk(
                    `no available routes for swap: ${this.fromToken} --> ${this.toToken} | ${this.network}`,
                ),
            );
            return { code: -1, data: "", log: `no routes available` };
        }
        let bestRoute = this.filterAvailableRoutes(resp.data, failedDexes);
        if (bestRoute.length == 0) {
            log(
                randomChalk(
                    `no routes left for swap: ${this.fromToken} --> ${this.toToken} | ${this.network}`,
                ),
            );
            return { code: -1, data: "", log: `no routes available` };
        }
        log(
            c.green(
                `selected DEX: ${bestRoute.aggregator} | volume: ${bestRoute.priceSlippage.sourceAmountInUSD} USD`,
            ),
        );
        return await this.swap(bestRoute, failedDexes);
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
    filterAvailableRoutes(quotes, failedDexes = []) {
        let validRoutes = [];
        for (let i = 0; i < quotes.length; i++) {
            let initialAmount = quotes[i].priceSlippage.sourceAmountInUSD;
            let receiveAmount = quotes[i].priceSlippage.destinationAmountInUSD;
            let loss = initialAmount - receiveAmount;
            // Metamask sometimes returns invalid transactions, which we need to filter out...
            if (failedDexes.includes(quotes[i].aggregator)) continue;
            if (quotes[i].error == null && quotes[i].trade != null) {
                validRoutes.push(quotes[i]);
                log(
                    `DEX ${i + 1}/${quotes.length}`,
                    randomChalk(
                        `slippage: ${loss.toString().slice(0, 7)} USD | DEX: ${
                            quotes[i].aggregator
                        }`,
                    ),
                );
            }
        }
        // log("previously failed dexes:", failedDexes);
        // log("valid dexes", validRoutes.map((val) => val.aggregator));
        return validRoutes[0];
    }
}
