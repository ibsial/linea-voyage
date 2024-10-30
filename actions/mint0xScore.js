import { Contract, ErrorDescription, JsonRpcProvider, ethers } from "ethers";
import axios from "axios";
import { ZeroExScoreConfig, maxRetries } from "../config.js";
import {
    NumbersHelpers,
    RandomHelpers,
    c,
    defaultSleep,
    getGasPrice,
    getNativeBalance,
    log,
    randomChalk,
    retry,
    sleep,
    transactionPassed,
} from "../utils/helpers.js";
import { WEb3Wrapper } from "../base/web3Wrapper.js";
import { chains } from "../utils/chainData.js";
import { swapData } from "../utils/swapData.js";
import { returnStatuses } from "../utils/constants.js";
import { HttpsProxyAgent } from "https-proxy-agent";

class ZeroExScore extends ZeroExScoreConfig {
    urls = {
        getNonce: "https://api.0xscore.io/v2/authorization/nonce", // POST
        signIn: "https://api.0xscore.io/v2/authorization/sign",
        checkAttestationStatus: "https://api.0xscore.io/v2/nft/attest/status",
        register: "https://api.0xscore.io/v2/score/register",
        getScore: "https://api.0xscore.io/v2/score/get",
        getMintData: "https://api.0xscore.io/v2/nft/attest/create",
    };
    constructor(signer, proxy = undefined) {
        super();
        this.signer = signer;
        let provider = new JsonRpcProvider(chains[this.network].rpc);
        this.signer = this.signer.connect(provider);
        if (proxy) {
            this.axiosInstance = axios.create({
                httpAgent: new HttpsProxyAgent("http://" + proxy),
                httpsAgent: new HttpsProxyAgent("http://" + proxy),
            });
        } else {
            this.axiosInstance = axios.create({});
        }
    }

    async getNonce() {
        try {
            const resp = await this.axiosInstance.post(
                this.urls.getNonce,
                { wallet_address: this.signer.address.toLowerCase() },
                {
                    headers: {
                        Origin: `https://0xscore.io`,
                        Referer: `https://0xscore.io/`,
                        "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`,
                    },
                },
            );
            this.nonce = resp.data.nonce;
            return resp.data.nonce;
        } catch (e) {
            log(e?.message);
            log(c.red(`error on getting nonce for 0xScore`));
            await defaultSleep(10);
            return this.getNonce();
        }
    }
    async signIn() {
        let msg =
            "Welcome to 0xScore!\n\nThis request will not trigger a blockchain transaction or cost any gas fees.\n\nYour authentication status will reset after 24 hours.\n\nWallet address:\n" +
            this.signer.address.toLowerCase() +
            "\n\nNonce:\n" +
            (await this.getNonce());
        const signature = await this.signer.signMessage(msg);
        try {
            const resp = await this.axiosInstance.post(
                this.urls.signIn,
                {
                    wallet_address: this.signer.address.toLowerCase(),
                    signature: signature.toLowerCase(),
                },
                {
                    headers: {
                        Origin: `https://0xscore.io`,
                        Referer: `https://0xscore.io/`,
                        "User-Agent": `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`,
                    },
                },
            );
            this.refferral_code = resp.data.refferral_code;
            this.jwt = resp.data.jwt_token;
        } catch (e) {
            log(e?.message);
            log(c.red(`error on signing in 0xScore`));
            await defaultSleep(10);
            return this.signIn();
        }
    }
    async checkMinted() {
        try {
            const resp = await this.axiosInstance.post(
                this.urls.checkAttestationStatus,
                {},
                {
                    headers: {
                        Authorization: this.jwt,
                    },
                },
            );
            if (resp.data.attestation_exist) {
                log(
                    c.green(
                        `${c.bold(
                            resp.data.walletAddress,
                        )} 0xScore already minted with score: ${c.underline(resp.data.score)}`,
                    ),
                );
                return resp.data.score;
            }
            return undefined;
        } catch (e) {
            log(e);
            log(c.red(`error on checking if 0xScore already minted`));
            await defaultSleep(5);
            return this.checkMinted();
        }
    }
    async solveCaptcha() {
        try {
            // request recaptcha v2 solution
            const createTaskResp = await this.axiosInstance.post(
                "https://api.2captcha.com/createTask",
                {
                    clientKey: this.twoCaptchaKey,
                    task: {
                        type: "RecaptchaV2TaskProxyless",
                        websiteURL: "https://0xscore.io/linea-attestation",
                        websiteKey: "6Lf9Dx4pAAAAALCWASgOXeHdYPpyvp1ZbF-zMcm1",
                        isInvisible: true,
                    },
                },
            );
            let taskId = createTaskResp.data.taskId;
            await defaultSleep(25);
            // Poll recaptcha v2 solution
            let solutionResp = await this.axiosInstance.post(
                "https://api.2captcha.com/getTaskResult",
                {
                    clientKey: this.twoCaptchaKey,
                    taskId: taskId,
                },
            );
            console.log(solutionResp.data)
            while (solutionResp.data.status != "ready") {
                log(`waiting captcha solution...`)
                await defaultSleep(10);
                if (solutionResp.data.errorId != 0) {
                    await defaultSleep(5);
                    return this.solveCaptcha();
                }
                solutionResp = await this.axiosInstance.post(
                    "https://api.2captcha.com/getTaskResult",
                    {
                        clientKey: this.twoCaptchaKey,
                        taskId: taskId,
                    },
                );
            }
            this.captchaSolution = solutionResp.data.solution.token;
            return this.captchaSolution;
        } catch (e) {
            log(e?.message);
            log(c.red(`error on solving captcha`));
            await defaultSleep(5);
            return this.solveCaptcha();
        }
    }
    async register() {
        log(`registering and solving captcha...`);
        try {
            const resp = await this.axiosInstance.post(
                this.urls.register,
                {
                    blockchain: 1,
                    captcha_response: await this.solveCaptcha(),
                },
                {
                    headers: {
                        Authorization: this.jwt,
                    },
                },
            );
            // log(resp.data);
            if (resp.data?.score != undefined) {
                return resp.data?.score;
            }
            if (resp.data.success != true && resp.data?.score == undefined) {
                log(c.red(`could not register`));
                await defaultSleep(5);
                return this.register();
            }
            return undefined;
        } catch (e) {
            log(e?.message);
            log(e?.response);
            log(c.red(`error on registering at 0xScore`));
            await defaultSleep(5);
            return this.register();
        }
    }
    async getScore() {
        let minted = await this.checkMinted();
        if (minted != undefined) {
            return -1;
        }
        let score = await this.register();
        if (score != undefined) {
            this.score = score;

            log(c.green(`${c.bold(this.signer.address)} score: ${this.score}`));
            return this.score;
        }
        try {
            const resp = await this.axiosInstance.post(
                this.urls.getScore,
                { blockchain: 1 },
                {
                    headers: {
                        Authorization: this.jwt,
                    },
                },
            );
            this.score = resp.data.score;
            // log(resp.data);
            if (resp.data?.score === undefined) {
                log("empty score, waiting..");
                await defaultSleep(10);
                return this.getScore();
            }
            log(`${this.signer.address} score: ${this.score}`);
            return resp.data.score;
        } catch (e) {
            log(e?.message);
            log(e?.response?.data);
            log(c.red(`error on getting score at 0xScore`));
            await defaultSleep(10);
            return this.getScore();
        }
    }
    async getMintData() {
        try {
            const resp = await this.axiosInstance.post(
                this.urls.getMintData,
                {},
                {
                    headers: {
                        Authorization: this.jwt,
                    },
                },
            );
            // log(resp.data);
            const mintData = [
                resp.data.expiration_time,
                resp.data.wallet_address,
                resp.data.score,
                resp.data.signature,
            ];
            this.mintData = mintData;
            this.contract = resp.data.contract_address;
            return mintData;
        } catch (e) {
            log(e?.message);
            log(c.red(`error on getting mint data from 0xScore`));
            await defaultSleep(10);
            return this.getMintData();
        }
    }
    async mint() {
        await this.getMintData();
        const zeroExScore_abi = [
            `function attest0xScoreSimple(
                uint64 expirationTime,
                address walletAddress,
                uint32 score,
                bytes memory signature
            ) public payable`,
            `function issuePrice() external view returns(uint256)`
        ];
        const zeroExScore = new Contract(this.contract, zeroExScore_abi, this.signer);
        const price = await zeroExScore.issuePrice()
        // console.log(price)
        try {
            let limit = await zeroExScore.attest0xScoreSimple.estimateGas(...this.mintData, {
                value: price,
            });
            // log(limit);
            let gasPrice = await getGasPrice("Linea");
            let tx = await zeroExScore.attest0xScoreSimple(...this.mintData, {
                value: price,
                gasLimit: (limit * 12n) / 10n,
                ...gasPrice,
            });
            log(
                randomChalk(
                    `Minting 0xScore with ${c.underline(this.score)} points for ${
                        this.signer.address
                    }`,
                ),
            );
            log(c.green(chains[this.network].explorer + tx.hash));
            // return transactionPassed(tx.hash, this.network);
            return {
                code: 1,
                data: "",
                log: `tx receipt received with status: ${
                    1 == 1 ? "success" : "fail"
                }`,
            };
        } catch (e) {
            log(e);
            log(c.red(`error on minting 0xScore occured...`));
            return returnStatuses.fail;
        }
    }
}

export async function mint0xScore(signer, proxy = undefined, count = 0) {
    if (count >= maxRetries) {
        return returnStatuses.fiasco;
    }
    count++;
    const zeroExScore = new ZeroExScore(signer, proxy);
    let balance = await getNativeBalance(signer, zeroExScore.network);
    if (balance < 700000000000000n) {
        log(
            c.red(
                `${
                    signer.address
                } mint 0xScore failed, reason: Low balance \nbalance have: ${ethers.formatEther(
                    balance,
                )} ${chains[zeroExScore.network].currency} balance want: ${ethers.formatEther(
                    700000000000000n,
                )} ${chains[zeroExScore.network].currency}`,
            ),
        );
        return returnStatuses.fiasco;
    }
    await zeroExScore.signIn();
    const score = await zeroExScore.getScore();
    if (score < 0) return;
    if (BigInt(score) < BigInt(zeroExScore.minScore)) {
        log(
            c.red(
                `${signer.address} mint 0xScore failed, reason: Low Score \nScore have: ${score} Score want: ${zeroExScore.minScore}`,
            ),
        );
        return;
    }
    let res = await zeroExScore.mint();
    if (res.code == 0) return mint0xScore(signer, proxy, count);
    return;
}
