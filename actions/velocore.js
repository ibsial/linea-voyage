import {
    AbiCoder,
    Contract,
    JsonRpcProvider,
    ZeroAddress,
    ethers,
    solidityPacked,
    zeroPadValue,
} from "ethers";
import { velocore_abi, velocore_pool_abi } from "../utils/abi.js";
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
import axios from "axios";

class Velocore extends VelocoreSetup {
    VELOCORE_ADDRESS = "0x1d0188c4B276A09366D05d6Be06aF61a73bC7535";
    velocore = new Contract(this.VELOCORE_ADDRESS, velocore_abi);
    /*
    https://lab.miguelmota.com/ethereum-input-data-decoder/example/
    https://docs.velocore.xyz/technical-docs/how-to-interact-with-velocore
    */
    constructor(signer) {
        super();
        this.signer = signer;
        let provider = new JsonRpcProvider(chains[this.network].rpc);
        this.signer = this.signer.connect(provider);
        this.web3wrapper = new WEb3Wrapper(this.signer, this.network);
        this.velocore = this.velocore.connect(this.signer);
        this.tokenRef = [
            // zeroPadValue("0x176211869ca2b568f2a7d4ee941e073a821ee1ff", 32), // USDC.e
            zeroPadValue("0xb30e7a2e6f7389ca5ddc714da4c991b7a1dcc88e", 32), // wUSD+
            zeroPadValue("0xcc22F6AA610D1b2a0e89EF228079cB3e1831b1D1", 32), // LVC (Linea velocore)
            "0x0200000000000000000000021d312eedd57e8d43bcb6369e4b8f02d3c18aaf13", // ERC1155 (Wombat pool)
            "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", // native coin
        ];
        this.deposit = [0, 0, 0, 0];
    }
    buildAddVelocoreOperations() {
        let operations = [];
        let op0 = {
            poolId: solidityPacked(["uint8", "uint88", "address"], ["4", "0", this.signer.address]),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [4, 0, 0, "0x" + this.getAmountInHex()],
                ),
            ],
            data: "0x00",
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
            data: "0x00",
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
            data: "0x00",
        };
        operations.push(op2);
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
            data: "0x00",
        };
        operations.push(op3);
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
            data: "0x00",
        };
        operations.push(op4);
        let op5 = {
            poolId: solidityPacked(["uint8", "uint88", "address"], ["5", "0", ZeroAddress]),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint88", "int152"],
                    [3, 1, 0, "0x" + this.getAmountOutUsdHexSubtracted()],
                ),
            ],
            data: "0x00",
        };
        operations.push(op5);
        let op6 = {
            poolId: solidityPacked(
                ["uint8", "uint88", "address"],
                ["1", "0", "0xe0c6fdf4efc676eb35ea094f2b01af216f9c232c"], // ??
            ), // poolId
            tokenInformations: [
                solidityPacked(["uint8", "uint8", "uint112", "int128"], [2, 1, 0, 0]),
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [3, 2, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
            ],
            data: "0x00",
        };
        operations.push(op6);
        return operations;
    }
    buildRemoveVelocoreOperations() {
        let operations = [];
        let op0 = {
            poolId: solidityPacked(
                ["uint8", "uint88", "address"],
                ["1", "0", "0xe0c6fdf4efc676eb35ea094f2b01af216f9c232c"],
            ),
            tokenInformations: [
                solidityPacked(["uint8", "uint8", "uint112", "int128"], [1, 1, 0, ZeroAddress]),
                solidityPacked(
                    ["uint8", "uint8", "uint88", "int152"],
                    [2, 0, 0, "0x" + this.getAmountToWithdrawHexSubtracted()],
                ),
            ],
            data: "0x00",
        };
        operations.push(op0);
        let op1 = {
            poolId: solidityPacked(
                ["uint8", "uint88", "address"],
                ["0", "0", "0x1d312eedd57e8d43bcb6369e4b8f02d3c18aaf13"],
            ),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [0, 1, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [2, 2, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
            ],
            data: "0x00",
        };
        operations.push(op1);
        let op2 = {
            poolId: solidityPacked(
                ["uint8", "uint88", "address"],
                ["0", "0", "0x2bd146e7d95cea62c89fcca8e529e06eec1b053c"],
            ),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [0, 2, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
                solidityPacked(
                    ["uint8", "uint8", "uint112", "int128"],
                    [3, 1, 0, "0x7fffffffffffffffffffffffffffffff"],
                ),
            ],
            data: "0x00",
        };
        operations.push(op2);
        let op4 = {
            poolId: solidityPacked(["uint8", "uint88", "address"], ["5", "0", ZeroAddress]),
            tokenInformations: [
                solidityPacked(
                    ["uint8", "uint8", "uint88", "int152"],
                    [3, 1, 0, "0x" + this.getAmountOutEthHexSubtracted()],
                ),
            ],
            data: "0x00",
        };
        operations.push(op4);
        return operations;
    }
    getAmountInHex() {
        return this.randomAmount.toString(16);
    }
    getAmountInHexSubtracted() {
        const int128Overflow = BigInt("0x100000000000000000000000000000000");
        return (int128Overflow - BigInt("0x" + this.getAmountInHex())).toString(16);
    }
    getAmountOutUsdHexSubtracted() {
        let slippage = 10n;
        let ethPrice = BigInt(this.ethPrice);
        let amountOut =
            (this.randomAmount * ethPrice * (100n - slippage)) / 100n / 1_000_000_000_000n; // 12 decimals
        // log(this.randomAmount, this.ethPrice, amountOut);
        const int128Overflow = BigInt("0x100000000000000000000000000000000");
        return (int128Overflow - amountOut).toString(16);
    }
    async getAmountToWithdrawHex() {
        try {
            const poolContract = new Contract(
                "0xE0c6FDf4EFC676EB35EA094f2B01Af216F9C232c",
                velocore_pool_abi,
                this.signer,
            );
            let balance = await poolContract.stakedTokens(this.signer.address);
            this.amountToWithdraw = balance[0];
            return balance[0].toString(16);
        } catch (e) {
            log(e.message);
            log(c.red("Error getting amount to withdraw"));
            await defaultSleep(10);
            return await this.getAmountToWithdrawHex();
        }
    }
    getAmountToWithdrawHexSubtracted() {
        const int128Overflow = BigInt("0x100000000000000000000000000000000");
        return (int128Overflow - BigInt(this.amountToWithdraw)).toString(16);
    }
    getAmountOutEthHexSubtracted() {
        let slippage = 5n;
        let ethPrice = BigInt(this.ethPrice);
        let amountOut =
            (BigInt(this.amountToWithdraw) * 1_000_000_000_000n * (100n - slippage)) /
            100n /
            ethPrice;
        const int128Overflow = BigInt("0x100000000000000000000000000000000");
        return (int128Overflow - amountOut).toString(16);
    }
    async getEthPrice() {
        try {
            let resp = await axios.get("https://api4.binance.com/api/v3/avgPrice?symbol=ETHUSDT");
            this.ethPrice = BigInt(resp.data.price.split(".")[0]);
            return this.ethPrice;
        } catch (e) {
            log(e.message);
            log(c.red(`error on fetching eth price from Binance`));
            await defaultSleep(10);
            return await this.getEthPrice();
        }
    }
    async addLp(count = 0) {
        if (count >= maxRetries) {
            return returnStatuses.fiasco;
        }
        count++;
        let calldata;
        let tx;
        try {
            await this.getRandomAmount();
            await this.getEthPrice();
        } catch (e) {
            log(e);
            log(`error on setup occured: ${e.message}`);
            return await this.addLp(count);
        }
        let gasPriceData = await getGasPrice(this.network);
        try {
            let limit = await this.velocore.execute.estimateGas(
                this.tokenRef,
                this.deposit,
                this.buildAddVelocoreOperations(),
                {
                    value: this.randomAmount,
                },
            );
            tx = await this.velocore.execute(
                this.tokenRef,
                this.deposit,
                this.buildAddVelocoreOperations(),
                {
                    value: this.randomAmount,
                    ...gasPriceData,
                    gasLimit: (limit * 15n) / 10n,
                },
            );
            log(
                randomChalk(
                    `added ${NumbersHelpers.bigIntToPrettyFloatStr(
                        this.randomAmount,
                        BigInt(swapData[this.network][this.fromToken].decimals),
                    )} ${this.fromToken} to USD+ Liquidity Pool`,
                ),
            );
            log(c.green(chains[this.network].explorer + tx.hash));
            return await transactionPassed(tx.hash, this.network);
        } catch (e) {
            log(
                `error adding ${NumbersHelpers.bigIntToPrettyFloatStr(
                    this.randomAmount,
                    BigInt(swapData[this.network][this.fromToken].decimals),
                )} ${this.fromToken} to USD+ Liquidity Pool`,
            );
            log(e.message);
            await defaultSleep(10);
            return await this.addLp(count);
        }
    }
    async removeLp(count = 0) {
        if (count >= maxRetries) {
            return returnStatuses.fiasco;
        }
        count++;
        let calldata;
        let tx;
        try {
            await this.getAmountToWithdrawHex();
            await this.getEthPrice();
        } catch (e) {
            log(e);
            log(`error on setup occured: ${e.message}`);
            return await this.removeLp(count);
        }
        let gasPriceData = await getGasPrice(this.network);
        try {
            let limit = await this.velocore.execute.estimateGas(
                this.tokenRef,
                this.deposit,
                this.buildRemoveVelocoreOperations(),
                {
                    value: 0n,
                },
            );
            tx = await this.velocore.execute(
                this.tokenRef,
                this.deposit,
                this.buildRemoveVelocoreOperations(),
                {
                    value: 0n,
                    ...gasPriceData,
                    gasLimit: (limit * 15n) / 10n,
                },
            );
            log(c.green(chains[this.network].explorer + tx.hash));
            return await transactionPassed(tx.hash, this.network);
        } catch (e) {
            log(e);
            await defaultSleep(10);
            return await this.removeLp(count);
        }
    }
    async getRandomAmount(tokenName = this.fromToken) {
        if (this.amountFromTo[0].includes("%") && this.amountFromTo[1].includes("%")) {
            let percentageFrom = BigInt(this.amountFromTo[0].split("%")[0]);
            let percentageTo = BigInt(this.amountFromTo[1].split("%")[0]);
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
}

export async function makeVelocoreSwap(signer) {
    let velocore = new Velocore(signer);
    if (velocore.mode == "deposit") {
        return await velocore.addLp();
    } else {
        return await velocore.removeLp();
    }
}
