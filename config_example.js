export const maxRetries = 3
export const sleepFromTo = [5 * 60, 10 * 60]
export const gasPricePreset = "low" // "low" | "medium" | "high"

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
       Linea:       ETH  | WETH | ---- | USDCe | USDT |     |      |
       Zksync:      not implemented by Metamask yet
       Bsc:         BNB  | WBNB | USDC | BUSD  | USDT | CAKE| TWT  | STG
       Polygon:     MATIC|WMATIC| ---- | USDCe | USDT | DAI | STG  |
       Avalanche:   AVAX |WAVAX | USDC | ----- | USDT | BTCB| STG  |

    Note: Swaps from NATIVE to WNATIVE do not count as metamask swaps
    */
    network = "Linea"
    fromToken  = "ETH"
    toToken = "USDCe"
    amountFromTo = ["0.0025", "0.0035"] // numbers ["0.1", "0.2"] | percentage ["30%", "40%"]
}