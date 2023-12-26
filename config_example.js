export const maxRetries = 3
export const sleepFromTo = [5 * 60, 10 * 60]
export const gasPricePreset = "low" // "low" | "medium" | "high"
export const goodGwei = "25"
export const shuffleWallets = true // true | false

export class MetamaskBridgeSetup {
    /* "Ethereum" | "Arbitrum" | "Optimism" | "Base" | "Linea" */
    fromNetwork = "Arbitrum"
    /* "Ethereum" | "Arbitrum" | "Optimism" | "Base" | "Linea" */
    toNetwork = "Linea"
    /* "ETH" */
    fromToken  = "ETH"
    /* "ETH" */
    toToken = "ETH"
    amountFromTo = ["0.01", "0.011"]
}
export class MetamaskSwapSetup {
    /* 
    Networks: "Ethereum" | "Arbitrum" | "Optimism" | "Base" | "Linea"
    Tokens
       Ethereum:    ETH  | WETH | USDC | ----- | USDT |     |      |
       Arbitrum:    ETH  | WETH | USDC | USDCe | USDT | ARB | GMX  | STG
       Optimism:    ETH  | WETH | USDC | USDCe | USDT | OP  | VELO | STG
       Base:        not implemented by Metamask yet
       Linea:       ETH  | WETH | USDC | ----- | USDT |     |      | wstETH
       Zksync:      not implemented by Metamask yet
       Bsc:         BNB  | WBNB | USDC | BUSD  | USDT | CAKE| TWT  | STG
       Polygon:     MATIC|WMATIC| ---- | USDCe | USDT | DAI | STG  |
       Avalanche:   AVAX |WAVAX | USDC | ----- | USDT | BTCB| STG  |

    Note: Swaps from NATIVE to WNATIVE do NOT count as metamask swaps
    */
    network = "Linea"
    fromToken  = "ETH"
    toToken = "USDC"
    amountFromTo = ["0.0027", "0.0033"] // numbers ["0.1", "0.2"] | percentage ["30%", "40%"]
}

export class IntractSetup {
    useRefCode = true
}
export const ThirdPartyBridgeSetup = {
    /* "Ethereum" | "Arbitrum" | "Optimism" | "Base" | "Linea" */
    fromNetwork: "Arbitrum",
    /* "Linea" */
    toNetwork: "Linea",
    /* "ETH" */
    fromToken: "ETH",
    /* "ETH" */
    toToken: "ETH",
    amountFromTo: ["0.013", "0.014"],
}

export class IzumiSetup {
    network = "Linea"
    /* "ETH"  | "WETH" | "USDC" | ----- | "USDT" |     |      | "wstETH" */
    fromToken  = "ETH"
    /* "ETH"  | "WETH" | "USDC" | ----- | "USDT" |     |      | "wstETH" */
    toToken = "wstETH"
    amountFromTo = ["0.013", "0.014"] // numbers ["0.1", "0.2"] | percentage ["30%", "40%"]
}
// add LP to USDT+ pool on Velocore using "Magic" method
export class VelocoreSetup {
    /* You need ETH to run this script */
    network = "Linea"
    fromToken = "ETH"
    mode = "withdraw" // "deposit" | "withdraw"
    amountFromTo = ["0.01", "0.02"] // numbers ["0.1", "0.2"] | percentage ["30%", "40%"]
}
// complete anti-sybil verification on 0xScore
export class ZeroExScoreConfig {
    network = "Linea" // but actually should work at any available chain
    minScore = 50     // minimal sufficient score
    twoCaptchaKey = "your-key" // api key from https://2captcha.com/
}

export class PolyhedraSetup {
    /* "Ethereum" | "Arbitrum" | "Optimism" | "Base" | "Linea" | "Scroll" */
    fromNetwork = "Linea"
    /* "Ethereum" | "Arbitrum" | "Optimism" | "Base" | "Linea" | "Bsc" | "Polygon" | "Mantle" | "Scroll" | "OpBnb" */
    toNetwork = "Mantle"

    amountFromTo = ["0.0000001", "0.000002"] // numbers ["0.1", "0.2"] | percentage ["30%", "40%"]
}