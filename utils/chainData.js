export const chains = {
    Ethereum: {
        id: "1",
        rpc: "https://ethereum.publicnode.com",
        explorer: "https://etherscan.io/tx/",
        currency: "ETH",
        tokens: {
            ETH: {
                name: "Ethereum",
                decimals: 18,
                address: "0x0000000000000000000000000000000000000000",
            },
        },
    },
    Arbitrum: {
        id: "42161",
        rpc: "https://arbitrum-one.publicnode.com",
        explorer: "https://arbiscan.io/tx/",
        currency: "ETH",
        tokens: {
            ETH: {
                name: "Ethereum",
                decimals: 18,
                address: "0x0000000000000000000000000000000000000000",
            },
        },
    },
    Optimism: {
        id: "10",
        rpc: "https://optimism.llamarpc.com	",
        explorer: "https://optimistic.etherscan.io/tx/",
        currency: "ETH",
        tokens: {
            ETH: {
                name: "Ethereum",
                decimals: 18,
                address: "0x0000000000000000000000000000000000000000",
            },
        },
    },
    Base: {
        id: "8453",
        rpc: "https://base.publicnode.com",
        explorer: "https://basescan.org/tx/",
        currency: "ETH",
        tokens: {
            ETH: {
                name: "Ethereum",
                decimals: 18,
                address: "0x0000000000000000000000000000000000000000",
            },
        },
    },
    Linea: {
        id: "59144",
        rpc: "https://1rpc.io/linea",
        explorer: "https://lineascan.build/tx/",
        currency: "ETH",
        tokens: {
            ETH: {
                name: "Ethereum",
                decimals: 18,
                address: "0x0000000000000000000000000000000000000000",
            },
        },
    },
    /* Bridge is not supported */
    Zksync: {
        id: "324",
        rpc: "https://mainnet.era.zksync.io",
        explorer: "https://explorer.zksync.io/tx/",
        currency: "ETH",
        tokens: {
            ETH: {
                name: "Ethereum",
                decimals: 18,
                address: "0x0000000000000000000000000000000000000000",
            },
        },
    },
    /* Bridge is not supported */
    Bcs: {
        id: "56",
        rpc: "https://rpc.ankr.com/bsc",
        explorer: "https://bscscan.com/tx/",
        currency: "BNB",
        tokens: {
            BNB: {
                name: "Binance coin",
                decimals: 18,
                address: "0x0000000000000000000000000000000000000000",
            },
        },
    },
    /* Bridge is not supported */
    Polygon: {
        id: "137",
        rpc: "https://polygon.llamarpc.com",
        explorer: "https://polygonscan.com/tx/",
        currency: "MATIC",
        tokens: {
            MATIC: {
                name: "MATIC",
                decimals: 18,
                address: "0x0000000000000000000000000000000000000000",
            },
        },
    },
    /* Bridge is not supported */
    Avalanche: {
        id: "43114",
        rpc: "https://avalanche.public-rpc.com",
        explorer: "https://subnets.avax.network/c-chain/tx/",
        currency: "AVAX",
        tokens: {
            AVAX: {
                name: "AVAX",
                decimals: 18,
                address: "0x0000000000000000000000000000000000000000",
            },
        },
    },
};
