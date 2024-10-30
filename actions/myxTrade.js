import { Contract, formatUnits, parseEther, parseUnits } from "ethers";
import { Wallet } from "ethers";
import { c, defaultSleep, RandomHelpers, sleep } from "../utils/helpers.js";
import axios from "axios";
import { WEb3Wrapper } from "../base/web3Wrapper.js";
import { MetamaskSwap } from "./metamaskSwap.js";
import { JsonRpcProvider } from "ethers";
import { chains } from "../utils/chainData.js";
import { maxRetries } from "../config.js";

class Myx {
    constructor(signer) {
        this.signer = signer;
        this.session = axios.create({
            headers: {
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            },
            origin: "https://app.myx.finance",
            referer: "https://app.myx.finance/",
        });
    }
    async login() {}
    /**
     *
     * @param {bigint} amountUsdc
     */
    async openTrade(amountUsdc) {
        let contract = new Contract(
            "0xd6BEf12E6ed9C0b33dfdf768C0fF7Da1Cd27086B",
            [
                "function createIncreaseOrder(tuple(address,uint256,uint8,int256,uint256,bool,uint256,uint256,uint8,uint256)) external payable",
                "function createDecreaseOrder(tuple(address,uint256,uint8,int256,uint256,uint256,bool,uint256,uint8,uint256)) external payable",
            ],
            this.signer,
        );
        let ethAmount = RandomHelpers.getRandomBnFromTo(parseEther("0.008"), parseEther("0.011"));
        let marketPriceResp = await this.session.get(
            "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USDC",
            {},
        );
        let marketPrice = marketPriceResp.data.USDC;
        marketPrice = BigInt(parseInt(marketPrice)) * 10n ** 30n;
        let openTradeTx = await contract.createIncreaseOrder(
            [
                this.signer.address, // account
                2, // pair index
                0, // tradeType
                amountUsdc, // collateral
                (marketPrice * 101n) / 100n, // openPrice
                true, // islong
                ethAmount, // sizeAmount
                300000n, // maxSlippage
                0, // paymentType
                300000000000000n, // networkFeeAmount
            ],
            {
                value: 300000000000000n,
            },
        );
        console.log(
            c.green(
                `${this.signer.address} opened long for ${formatUnits(amountUsdc, 6)} USDC on MYX`,
            ),
        );
        return { hash: openTradeTx.hash, ethAmount: ethAmount };
    }
    /**
     *
     * @param {*} ethAmount
     * @returns {Promise<string>}
     */
    async closeTrade(ethAmount) {
        let contract = new Contract(
            "0xd6BEf12E6ed9C0b33dfdf768C0fF7Da1Cd27086B",
            [
                "function createIncreaseOrder(tuple(address,uint256,uint8,int256,uint256,bool,int256,uint256,uint8,uint256,bytes)) external payable",
                "function createDecreaseOrder(tuple(address,uint256,uint8,int256,uint256,uint256,bool,uint256,uint8,uint256)) external payable",
            ],
            this.signer,
        );
        let marketPriceResp = await this.session.get(
            "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USDC",
            {},
        );
        let marketPrice = marketPriceResp.data.USDC;
        marketPrice = BigInt(parseInt(marketPrice)) * 10n ** 30n;
        let closePositionTx = await contract.createDecreaseOrder(
            [
                this.signer.address, // account
                2, // pair index
                0, // tradeType
                0, // collateral
                (marketPrice * 99n) / 100n, // triggerPrice
                ethAmount, // sizeAmount
                true, // islong
                300000n, // maxSlippage
                0, // paymentType
                300000000000000n, // networkFeeAmount
            ],
            {
                value: 300000000000000n,
            },
        );
        console.log(c.green(`${this.signer.address} closed long on MYX`));
        return closePositionTx.hash;
    }
    async prepareForTrade(usdcAmount) {
        let web3Wrapper = new WEb3Wrapper(this.signer, "Linea");
        let usdcBalance = await web3Wrapper.getTokenBalance("USDC");
        if (usdcBalance < usdcAmount) {
            let metamaskSwap = new MetamaskSwap(this.signer);
            metamaskSwap.network = "Linea";
            metamaskSwap.fromToken = "ETH";
            metamaskSwap.toToken = "USDC";
            metamaskSwap.amountFromTo = ["0.001", "0.003"];
            await metamaskSwap.executeRoute();
            await defaultSleep(5);
        }
        usdcBalance = await web3Wrapper.getTokenBalance("USDC");
        await web3Wrapper.approveToken(
            "USDC",
            "0xd6BEf12E6ed9C0b33dfdf768C0fF7Da1Cd27086B",
            usdcBalance,
        );
    }
    async finishQuest() {
        let web3Wrapper = new WEb3Wrapper(this.signer, "Linea");
        let usdcBalance = await web3Wrapper.getTokenBalance("USDC");
        let metamaskSwap = new MetamaskSwap(this.signer);
        metamaskSwap.network = "Linea";
        metamaskSwap.fromToken = "USDC";
        metamaskSwap.toToken = "ETH";
        metamaskSwap.amountFromTo = [formatUnits(usdcBalance, 6), formatUnits(usdcBalance, 6)];
        await metamaskSwap.executeRoute();
        await defaultSleep(5);
    }
    async executeMyxQuest(result) {
        let margin = RandomHelpers.getRandomBnFromTo(parseUnits("2", 6), parseUnits("4", 6));
        await this.prepareForTrade(margin);
        await defaultSleep(RandomHelpers.getRandomIntFromTo(10, 20))
        let openRes = await this.openTrade(margin);
        result.openHash = openRes.hash;
        await defaultSleep(RandomHelpers.getRandomIntFromTo(5, 10))
        let closeRes = await this.closeTrade(openRes.ethAmount);
        result.closeHash = closeRes;
        await defaultSleep(RandomHelpers.getRandomIntFromTo(10, 20))
        await this.finishQuest()
        return result;
    }
}

async function completeMyxQuest(signer) {
    let retry = 0;
    let result = {
        openHash: "",
        closeHash: "",
    };
    while (retry < maxRetries) {
        try {
            let myx = new Myx(signer.connect(new JsonRpcProvider(chains["Linea"].rpc)));
            result = await myx.executeMyxQuest(result);
            return result;
        } catch (e) {
            console.log(e);
        }
        retry++;
    }
    return result;
}

export { completeMyxQuest };
