import { parseEther, Wallet } from "ethers";
import { c, getNativeBalance, RandomHelpers } from "../utils/helpers.js";
import { chains } from "../utils/chainData.js";
import axios from "axios";
import { Contract } from "ethers";
import { JsonRpcProvider } from "ethers";
import { maxRetries } from "../config.js";

/**
 *
 * @param {Wallet} signer
 */
async function chooseNetwork(signer) {
    let minBalance = parseEther("0.0052");
    let networks = ["Arbitrum", "Optimism", "Base", "Zksync"];
    networks = RandomHelpers.shuffleArray(networks);

    for (let network of networks) {
        let balance = await getNativeBalance(signer, network);
        if (balance >= minBalance) {
            return { network, balance };
        }
    }
    return;
}
/**
 *
 * @param {Wallet} signer
 * @param {{network: string, balance: bigint}} chosenNetwork
 */
async function fetchQuote(signer, chosenNetwork) {
    let minAmount = parseEther("0.00515");
    let maxAmount =
        chosenNetwork.balance > parseEther("0.0055") ? parseEther("0.0055") : chosenNetwork.balance;
    let randomPortion = RandomHelpers.getRandomBnFromTo(0n, ((maxAmount - minAmount) * 75n) / 100n);
    let params = {
        params: {
            amountIn: (minAmount + randomPortion).toString(),
            chainIdIn: parseInt(chains[chosenNetwork.network].id),
            chainIdOut: parseInt(chains["Linea"].id),
            tokenIn: "0x0000000000000000000000000000000000000000",
            tokenOut: "0x0000000000000000000000000000000000000000",
        },
        slippage: 1,
    };
    let resp = await axios.post("https://api.crosscurve.fi/routing/scan", params, {
        headers: {
            "user-agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        },
    });
    let scan = resp.data[0];
    resp = await axios.post(
        "https://api.crosscurve.fi/estimate",
        {
            amountIn: (minAmount + randomPortion).toString(),
            amountOut: scan.amountOut,
            amountOutWithoutSlippage: scan.amountOutWithoutSlippage,
            query: params,
            route: scan.route,
            tokenInPrice: scan.tokenInPrice,
            tokenOutPrice: scan.tokenOutPrice,
            txs: scan.txs,
        },
        {
            headers: {
                "user-agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            },
        },
    );
    let estimate = resp.data;
    resp = await axios.post("https://api.crosscurve.fi/tx/create", {
        from: signer.address,
        recipient: signer.address,
        routing: {
            query: params,
            route: scan.route,
            amountIn: (minAmount + randomPortion).toString(),
            amountOut: scan.amountOut,
            amountOutWithoutSlippage: scan.amountOutWithoutSlippage,
            tokenInPrice: scan.tokenInPrice,
            tokenOutPrice: scan.tokenOutPrice,
            txs: scan.txs,
        },
        estimate: estimate,
    });
    return resp.data;
}
/**
 *
 * @param {Wallet} signer
 * @param {*} quote
 */
async function bridgeFunds(signer, quote) {
    let contract = new Contract(quote.to, [quote.abi], signer);
    let tx = await contract.start(quote.args[0], quote.args[1], Object.values(quote.args[2]), {
        value: BigInt(quote.value) + (BigInt(quote.args[2].executionPrice) * 12n) / 10n,
    });
    return tx.hash;
}

async function useEywaBridge(signer) {
    let retry = 0;
    while (retry < maxRetries) {
        try {
            let chosenNetwork = await chooseNetwork(signer);
            if (!chosenNetwork) {
                console.log(c.red(`${signer.address} EYWA: low balance on all chains`));
                return false;
            }
            let rotatedSigner = signer.connect(
                new JsonRpcProvider(chains[chosenNetwork.network].rpc),
            );
            let quote = await fetchQuote(rotatedSigner, chosenNetwork);
            let txHash = await bridgeFunds(rotatedSigner, quote);
            console.log(
                c.green(`${signer.address} EYWA: ${chains[chosenNetwork.network].explorer + txHash}`),
            );
            return txHash
        } catch (e) {
            console.log(e)
        }
        retry++;
    }
    return ""
}

export { useEywaBridge };
