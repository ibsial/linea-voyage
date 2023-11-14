import { maxRetries, MetamaskBridgeSetup } from "../config.js";
import {
    RandomHelpers,
    NumbersHelpers,
    log,
    randomChalk,
    c,
    getGasPrice,
    transactionPassed,
} from "../utils/helpers.js";
import axios from "axios";
import { JsonRpcProvider, Wallet, ethers } from "ethers";
import { chains } from "../utils/chainData.js";
import { returnStatuses } from "../utils/constants.js";

export class MetamaskBridge extends MetamaskBridgeSetup {
    baseUrl = "https://bridge.api.cx.metamask.io";
    signer;
    constructor(signer) {
        super();
        this.axiosInstance = axios.create();
        this.signer = signer;
        let provider = new JsonRpcProvider(chains[this.fromNetwork].rpc);
        this.signer = this.signer.connect(provider);
    }
    async bridge(txData, tryCount = 0, lastStatus = returnStatuses.fail) {
        if (tryCount >= maxRetries) {
            return lastStatus;
        }
        tryCount++;
        let gasPrice = await getGasPrice(this.fromNetwork);
        txData = { ...txData, ...gasPrice }
        try {
            let tx = await this.signer.sendTransaction(txData);
            log(c.green(chains[this.fromNetwork].explorer + tx.hash));
            return await transactionPassed(tx.hash, this.fromNetwork);
        } catch (e) {
            log(e);
            log(c.red(`bridge failed...`));
            return this.bridge(txData, tryCount, {
                code: -1,
                data: "",
                log: `bridge failed: ${e.reason}`,
            });
        }
    }
    async executeRoute(tryCount = 0, lastStatus = returnStatuses.fail) {
        if (tryCount >= maxRetries) {
            return lastStatus;
        }
        tryCount++;
        let resp;
        /* get routes */
        try {
            resp = await axios.get(this.baseUrl + "/getQuote", {
                params: {
                    walletAddress: this.signer.address,
                    srcChainId: chains[this.fromNetwork].id,
                    destChainId: chains[this.toNetwork].id,
                    srcTokenAddress: chains[this.fromNetwork].tokens[this.fromToken].address,
                    destTokenAddress: chains[this.toNetwork].tokens[this.toToken].address,
                    srcTokenAmount: this.getRandomAmount(),
                    slippage: "0.5",
                    aggIds: `lifi,socket,squid`,
                    insufficientBal: "false",
                },
                headers: {
                    authority: "bridge.api.cx.metamask.io",
                },
            });
        } catch (e) {
            log(e);
            log(c.red(`error on getBridgeQoute`));
            return await this.executeRoute(tryCount, {
                code: -1,
                data: "",
                log: `error on getBridgeQoute: ${e.reason}`,
            });
        }
        if (!resp?.data) return;
        if (resp.data.length == 0) {
            log(
                randomChalk(
                    `no routes available for ${this.fromToken} | ${this.fromNetwork} --> ${this.toToken} | ${this.toNetwork}`,
                ),
            );
            return {
                code: -1,
                data: "",
                log: `no routes available for ${this.fromToken} | ${this.fromNetwork} --> ${this.toToken} | ${this.toNetwork}`,
            };
        }
        this.logAvailableBridges(resp.data);
        log(c.green(`selected bridge: ${resp.data[0].quote.bridges[0]}`));
        return await this.bridge(resp.data[0].trade);
    }
    getRandomAmount() {
        let min = ethers.parseUnits(
            this.amountFromTo[0],
            chains[this.fromNetwork].tokens[this.fromToken].decimals,
        );
        let max = ethers.parseUnits(
            this.amountFromTo[1],
            chains[this.fromNetwork].tokens[this.fromToken].decimals,
        );
        this.randomAmount = RandomHelpers.getRandomBnFromTo(min, max);
        return this.randomAmount;
    }
    logAvailableBridges(quotes) {
        for (let i = 0; i < quotes.length; i++) {
            let initialAmount = BigInt(quotes[i].quote.srcTokenAmount);
            let receiveAmount = BigInt(quotes[i].quote.destTokenAmount);
            let loss = initialAmount - receiveAmount;
            log(
                `route ${i + 1}/${quotes.length}`,
                randomChalk(
                    `estimated tx loss: ${NumbersHelpers.bigIntToPrettyFloatStr(
                        loss,
                        chains[this.fromNetwork].tokens[this.fromToken].decimals,
                    )} ${this.fromToken} | bridge: ${quotes[i].quote.bridges[0]}`,
                ),
            );
        }
    }
}
