import {
    AbiCoder,
    Contract,
    JsonRpcProvider,
    ZeroAddress,
    ethers,
    solidityPacked,
    zeroPadValue,
} from "ethers";
import { velocore_abi } from "../utils/abi.js";
import { VelocoreSetup, maxRetries } from "../config.js";
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

class Velocore extends VelocoreSetup {
    VELOCORE_ADDRESS = "0x32b241de86a8660f1ae0691a4760b426ea246d7";
    velocore = new Contract(this.VELOCORE_ADDRESS, velocore_abi);

    constructor(signer) {
        super();
        this.signer = signer;
        let provider = new JsonRpcProvider(chains[this.network].rpc);
        this.signer = this.signer.connect(provider);
        this.web3wrapper = new WEb3Wrapper(this.signer, this.network);
        this.velocore = this.velocore.connect(this.signer);
        this.tokenRef = [
            zeroPadValue("0x176211869cA2b568f2A7D4EE941E073a821EE1ff", 32), // USDC.e
            zeroPadValue("0x3F006B0493ff32B33be2809367F5F6722CB84a7b", 32), // wUSD+
            zeroPadValue("0xcc22F6AA610D1b2a0e89EF228079cB3e1831b1D1", 32), // LVC (Linea velocore)
            "0x0200000000000000000000011d312eedd57e8d43bcb6369e4b8f02d3c18aaf13", // ERC1155 (Wombat pool)
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // native coin
        ];
        this.deposit = [0, 0, 0, 0, 0];
        // struct VelocoreOperation {
        //     bytes32 poolId;
        //     bytes32[] tokenInformations;
        //     bytes dataLength;
        // }
        this.velocoreOperations = this.buildVelocoreOperations();
        log(this.tokenRef);
        log(this.deposit);
        log(JSON.stringify(this.velocoreOperations));
        log(
            this.velocore.interface.encodeFunctionData("execute", [
                this.tokenRef,
                this.deposit,
                this.velocoreOperations,
            ]),
        );
    }
    buildAddVelocoreOperations() {
        let operations = [];
        //     "0x0400000000000000000000005c29c60e14643c6f04bcf767170b4e785cb5f4d3",
        //     ["0x04000000000000000000000000000000ffffffffffffffffffd3c784fa7b1000"],
        //     "0x00",
        // ],
        let op0 = {
            poolId: solidityPacked(["uint8", "uint88", "address"], ["4", "0", this.signer.address]),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [4, 0, 0, "0x" + this.getAmountInHex()],
                ),
            ],
            data: "0x",
        };
        operations.push(op0);
        let op1 = {
            poolId: solidityPacked(["uint8", "uint88", "address"], ["4", "0", this.signer.address]),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint88", "int152"],
                    [4, 0, 0, "0x" + this.getAmountInHexSubtracted()],
                ),
            ],
            data: "0x",
        };
        operations.push(op1);
        let op2 = {
            poolId: solidityPacked(
                ["uint8", "uint88", "address"],
                ["0", "0", "0xe2c67a9b15e9e7ff8a9cb0dfb8fee5609923e5db"], // USDC/ETH pool
            ),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [0, 1, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [4, 2, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
            ],
            data: "0x",
        };
        operations.push(op2);
        //     "0x0000000000000000000000001d312eedd57e8d43bcb6369e4b8f02d3c18aaf13",
        //     [
        //         "0x000200000000000000000000000000007fffffffffffffffffffffffffffffff",
        //         "0x010100000000000000000000000000007fffffffffffffffffffffffffffffff",
        //     ],
        //     "0x00",
        // ],
        let op3 = {
            poolId: solidityPacked(
                ["uint8", "uint88", "address"],
                ["0", "0", "0x1d312eedd57e8d43bcb6369e4b8f02d3c18aaf13"], // ERC1155 (Wombat pool)
            ),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [0, 2, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [1, 1, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
            ],
            data: "0x",
        };
        operations.push(op3);
        //     "0x0000000000000000000000001d312eedd57e8d43bcb6369e4b8f02d3c18aaf13",
        //     [
        //         "0x010200000000000000000000000000007fffffffffffffffffffffffffffffff",
        //         "0x030100000000000000000000000000007fffffffffffffffffffffffffffffff",
        //     ],
        //     "0x00",
        // ],
        let op4 = {
            poolId: solidityPacked(
                ["uint8", "uint88", "address"],
                ["0", "0", "0x1d312eedd57e8d43bcb6369e4b8f02d3c18aaf13"], // ERC1155 (Wombat pool)
            ),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [1, 2, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [3, 1, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
            ],
            data: "0x",
        };
        operations.push(op4);
        //     "0x0500000000000000000000000000000000000000000000000000000000000000",
        //     ["0x03010000000000000000000000000000fffffffffffffffffffffffffe59563c"],
        //     "0x00",
        // ],
        let op5 = {
            poolId: solidityPacked(["uint8", "uint88", "address"], ["5", "0", ZeroAddress]),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint88", "int152"],
                    [3, 1, 0, "0x" + this.getAmountOutHexSubtracted()],
                ),
            ],
            data: "0x",
        };
        operations.push(op5);
        let op6 = {
            poolId: solidityPacked(
                ["uint8", "uint88", "address"],
                ["1", "0", "0x9582b6ad01b308edac14cb9bdf21e7da698b5edd"], // ??
            ), // poolId
            tokenInformations: [
                solidityPacked(["uint8", "uint8", "uint112", "int128"], [2, 1, 0, ZeroAddress]),
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [3, 2, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
            ],
            data: "0x",
        };
        operations.push(op6);
        return operations;
    }

    getAmountInHex() {
        /*
         *
         * TODO
         *
         */
        return "2c387b0584f000";
    }
    getAmountInHexSubtracted() {
        const int128Overflow = BigInt("0x100000000000000000000000000000000");
        return (int128Overflow - BigInt("0x" + this.getAmountInHex())).toString(16);
    }
    getAmountOutHexSubtracted() {
        const int128Overflow = BigInt("0x100000000000000000000000000000000");
        return (int128Overflow - BigInt("0x1a6a9c4")).toString(16);
    }
    // async swap(count = 0) {
    //     if (count >= maxRetries) {
    //         return returnStatuses.fiasco;
    //     }
    //     count++;
    //     let calldata;
    //     let tx;
    //     try {
    //         await this.setupSwap();
    //         calldata = this.buildMulticall();
    //     } catch (e) {
    //         log(e);
    //         log(`error on setup occured: ${e.message}`);
    //         return await this.swap(count);
    //     }
    //     let gasPriceData = await getGasPrice(this.network);
    //     try {
    //         tx = await this.velocore.multicall(calldata, {
    //             value: this.fromToken == chains[this.network].currency ? this.params.amount : 0n,
    //             ...gasPriceData,
    //         });
    //         log(
    //             randomChalk(
    //                 `swapped ${NumbersHelpers.bigIntToPrettyFloatStr(
    //                     this.params.amount,
    //                     BigInt(swapData[this.network][this.fromToken].decimals),
    //                 )} ${this.fromToken} --> ~${NumbersHelpers.bigIntToPrettyFloatStr(
    //                     this.params.minAcquired,
    //                     BigInt(swapData[this.network][this.toToken].decimals),
    //                 )} ${this.toToken} | ${this.network}`,
    //             ),
    //         );
    //         log(c.green(chains[this.network].explorer + tx.hash));
    //         return await transactionPassed(tx.hash, this.network);
    //     } catch (e) {
    //         log(
    //             `error swapping ${NumbersHelpers.bigIntToPrettyFloatStr(
    //                 this.params.amount,
    //                 BigInt(swapData[this.network][this.fromToken].decimals),
    //             )} ${this.fromToken} --> ~${NumbersHelpers.bigIntToPrettyFloatStr(
    //                 this.params.minAcquired,
    //                 BigInt(swapData[this.network][this.toToken].decimals),
    //             )} ${this.toToken} | ${this.network}`,
    //         );
    //         log(e.message);
    //         return await this.swap(count);
    //     }
    // }
    // async getRandomAmount(tokenName = this.fromToken) {
    //     if (this.amountFromTo[0].includes("%") && this.amountFromTo[1].includes("%")) {
    //         let percentageFrom = BigInt(this.amountFromTo[0].split("%")[0]);
    //         let percentageTo = BigInt(this.amountFromTo[1].split("%")[0]);
    //         let randomPercentage = RandomHelpers.getRandomBnFromTo(percentageFrom, percentageTo);
    //         if (tokenName == chains[this.network].currency) {
    //             let balance = await this.web3wrapper.getNativeBalace();
    //             this.randomAmount = (BigInt(balance) * BigInt(randomPercentage)) / 100n;
    //             return (BigInt(balance) * BigInt(randomPercentage)) / 100n;
    //         } else {
    //             let balance = await this.web3wrapper.getTokenBalance(tokenName);
    //             this.randomAmount = (BigInt(balance) * BigInt(randomPercentage)) / 100n;
    //             return (BigInt(balance) * BigInt(randomPercentage)) / 100n;
    //         }
    //     } else if (!this.amountFromTo[0].includes("%") && !this.amountFromTo[1].includes("%")) {
    //         let min = ethers.parseUnits(
    //             this.amountFromTo[0],
    //             swapData[this.network][tokenName].decimals,
    //         );
    //         let max = ethers.parseUnits(
    //             this.amountFromTo[1],
    //             swapData[this.network][tokenName].decimals,
    //         );
    //         this.randomAmount = RandomHelpers.getRandomBnFromTo(min, max);
    //         return this.randomAmount;
    //     } else {
    //         log(c.red("Invalid amountFromTo config, do you want to use % or values?"));
    //         throw Error("Invalid amountFromTo config");
    //     }
    // }
}

export async function makeVelocoreSwap(signer) {
    let velocore = new Velocore(signer);
    // return await velocore.swap();
}
