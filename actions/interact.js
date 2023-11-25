import axios from "axios";
import { log, defaultSleep, c, randomChalk, RandomHelpers } from "../utils/helpers.js";
import { IntractSetup } from "../config.js";
import { HttpsProxyAgent } from "https-proxy-agent";
const refInfo = {
    referralCode: "uwO-g_",
    referralLink: "https://www.intract.io/referral?utm_source=navbar",
    referralSource: "REFERRAL_PAGE",
};
const lineaWeekInfo = {
    week1: {
        id: "654a0e8d95c012164b1f1620",
        taskIds: {
            bridge: "654a0e8d95c012164b1f1621",
            swap: "654a0e8d95c012164b1f1623",
        },
    },
    week2: {
        id: "65535ae63cd33ebafe9d68f8",
        taskIds: {
            bridgeCore: "65535ae63cd33ebafe9d68f9",
            bridgeMany: "65535ae63cd33ebafe9d6900",
            bridge500: "65535ae63cd33ebafe9d68fb",
            bridge1000: "65535ae63cd33ebafe9d68fd",
            postReview: "65535ae63cd33ebafe9d68ff",
        },
    },
    week3: {
        id: "655b48ec2e9188e21c94e93e",
        taskIds: {
            swapCore: "655b48ec2e9188e21c94e93f",
            swapAggregator: "655b48ec2e9188e21c94e941",
            swap1000: "655b48ed2e9188e21c94e946",
            swap20: "655b48ed2e9188e21c94e943",
            swapRwaLsd: "655b48ed2e9188e21c94e948",
            postReview: "655b48ed2e9188e21c94e94a",
        },
    },
};
/*
    thanks to https://github.com/tridetch/chain-abuzer
*/
class Interact extends IntractSetup {
    baseUrl = `https://api.intract.io/api/qv1`;
    signer;
    axiosInstance;
    constructor(signer, proxy = undefined) {
        super();
        this.signer = signer;
        if (proxy) {
            this.axiosInstance = axios.create({
                httpAgent: new HttpsProxyAgent("http://" + proxy),
                httpsAgent: new HttpsProxyAgent("http://" + proxy),
            });
        } else {
            this.axiosInstance = axios.create({});
        }
    }
    async login() {
        try {
            let resp = await this.axiosInstance.post(this.baseUrl + "/auth/generate-nonce", {
                walletAddress: this.signer.address,
            });
            let signedMsg = await this.signer.signMessage(
                "Please sign this message to verify your identity. Nonce: " + resp.data.data.nonce,
            );
            let walletResp = await this.axiosInstance.post(this.baseUrl + "/auth/wallet", {
                signature: signedMsg,
                userAddress: this.signer.address,
                chain: {
                    id: 59144,
                    name: "Linea",
                    network: "Linea",
                    nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
                    rpcUrls: {
                        public: { http: ["https://linea.drpc.org"] },
                        default: {
                            http: [
                                "https://linea-mainnet.infura.io/v3/bfc263a4f3cf49998641d16c24fd0b46",
                            ],
                        },
                    },
                    blockExplorers: {
                        etherscan: { name: "Lineascan", url: "https://lineascan.build/" },
                        default: { name: "Lineascan", url: "https://lineascan.build/" },
                    },
                    unsupported: false,
                },
                isTaskLogin: false,
                width: "590px",
                reAuth: false,
                connector: "metamask",
                referralCode: this.useRefCode ? refInfo.referralCode : null,
                referralLink: this.useRefCode ? refInfo.referralLink : null,
                referralSource: this.useRefCode ? refInfo.referralSource : null,
            });

            let expDate = new Date();
            expDate.setDate(expDate.getDate() + 6);
            const userId = walletResp.data._id;
            const authToken = walletResp.headers["authorization"];

            let authInfo = {
                address: this.signer.address,
                userId: userId,
                token: authToken,
                expires: expDate.toISOString(),
            };
            this.authInfo = authInfo;
            return authInfo;
        } catch (e) {
            log(e);
            await defaultSleep(10);
            return await this.login();
        }
    }
    async setWallet(authInfo, lineaCampaingUserId) {
        try {
            let resp = await this.axiosInstance.post(
                this.baseUrl + "/linea/user/set-wallet",
                {
                    userId: lineaCampaingUserId,
                    lineaWalletAddress: this.signer.address,
                },
                {
                    headers: {
                        authorization: `Bearer ${authInfo.token}`,
                        Questuserid: lineaCampaingUserId,
                    },
                },
            );
            return resp.data;
        } catch (e) {
            /**
             *
             */
            log(e);
        }
    }
    async getSuperUserInfo(token) {
        let getSuperUserResponse;
        try {
            getSuperUserResponse = await this.axiosInstance.get(
                this.baseUrl + "/auth/get-super-user",
                {
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                },
            );
        } catch (e) {
            /**
             *
             *
             */
            log(e);
        }
        return getSuperUserResponse.data;
    }

    async getLineaCampaignUserInfo(token) {
        let getLineaCampaingUserResponse;
        try {
            getLineaCampaingUserResponse = await this.axiosInstance.get(
                this.baseUrl + "/auth/get-user?projectId=6549ed0333cc8772783b858b",
                {
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                },
            );
        } catch (e) {
            /**
             *
             *
             */
            log(e);
        }
        return getLineaCampaingUserResponse.data;
    }

    async getCompletedCampaigns(token) {
        let getComplitedCampaignsResponse;
        try {
            getComplitedCampaignsResponse = await this.axiosInstance.get(
                this.baseUrl + "/campaign/completed-campaignids",
                {
                    headers: {
                        authorization: `Bearer ${token}`,
                    },
                },
            );
        } catch (e) {
            /**
             *
             *
             */
            log(e);
        }
        return getComplitedCampaignsResponse.data;
    }

    async getCampaignInfo(token, campaignId) {
        let getCampaignInfoResponse;
        try {
            let getLineaCampaingUserResponse = await this.getLineaCampaignUserInfo(token);

            getCampaignInfoResponse = await this.axiosInstance.get(
                this.baseUrl + "/journey/fetch",
                {
                    params: { campaignId: campaignId, channelCode: "DEFAULT", referralCode: null },
                    headers: {
                        authorization: `Bearer ${token}`,
                        Questuserid: getLineaCampaingUserResponse._id,
                    },
                },
            );
        } catch (e) {
            /**
             *
             *
             */
            log(e);
        }
        return getCampaignInfoResponse.data;
    }
    async getLineaCampaingUserResponse(authInfo) {
        await axios.get(InteractApiUrls.GetLineaUserCampaing, {
            headers: {
                authorization: `Bearer ${authInfo.token}`,
            },
        });
    }
    async verifyTask(token, payload, preconditiontaskIds, taskName = "") {
        try {
            let campaignInfo = await this.getCampaignInfo(token, payload.campaignId);

            let isPreconditionsCompleted = true;
            for (const taskId of preconditiontaskIds) {
                const completedTask = campaignInfo.events.find((e) => e.taskId === taskId);
                if (!completedTask) {
                    isPreconditionsCompleted = false;
                } else if (!completedTask.isVerified) {
                    isPreconditionsCompleted = false;
                }
            }

            if (!isPreconditionsCompleted) {
                log(c.red(`[${taskName}] Complete core tasks before verification`));
                return;
            }

            let getLineaCampaingUserResponse = await this.getLineaCampaignUserInfo(token);
            const verifyResponse = await this.axiosInstance.post(
                this.baseUrl + "/task/verify",
                payload,
                {
                    headers: {
                        authorization: `Bearer ${token}`,
                        Questuserid: getLineaCampaingUserResponse._id,
                    },
                },
            );
            return verifyResponse.data;
        } catch (e) {
            /**
             *
             */
            // log(e);
            return e?.response?.data?.message;
        }
    }

    async claimTask(token, campaignId, taskId, taskName = "") {
        try {
            let campaignInfo = await this.getCampaignInfo(token, campaignId);
            const completedTask = campaignInfo.events.find((e) => e.taskId == taskId);
            if (!completedTask) {
                log(c.red(`Task [${taskName}] is not completed, try verifying again`));
                return false;
            }
            if (completedTask.isXpClaimed) {
                log(c.green(`Task [${taskName}] already claimed`));
                return true;
            } else {
                let getLineaCampaingUserResponse = await this.getLineaCampaignUserInfo(token);
                const claimResponse = await this.axiosInstance.post(
                    `${this.baseUrl + "/campaign/{campaignId}/claim-task-xp"}`.replace(
                        "{campaignId}",
                        campaignId,
                    ),
                    { taskId: taskId },
                    {
                        headers: {
                            authorization: `Bearer ${token}`,
                            Questuserid: getLineaCampaingUserResponse._id,
                        },
                    },
                );
                console.log(
                    `[${taskName}] claimed +${claimResponse.data.claimDetails[0].xp} XP earned!`,
                );
                return true;
            }
        } catch (e) {
            /**
             *
             */
            log(e);
        }
    }
    async dailyCheckIn(authInfo) {
        try {
            let resp = await this.axiosInstance.post(this.baseUrl + "/auth/gm-streak", undefined, {
                headers: {
                    Authorization: `Bearer ${authInfo.token}`,
                },
            });
            // log(resp.data);
            log(randomChalk(`current GM streak: ${resp.data.streakCount}`));
            return true;
        } catch (e) {
            // log(e);
            /**
             *
             */
            log(randomChalk(e?.response?.data?.message));
        }
    }
    async lineaQuiz(authInfo, lineaUserInfo) {
        try {
            const quizResponse = await this.axiosInstance.post(
                this.baseUrl + "/linea/user/streak",
                undefined,
                {
                    headers: {
                        authorization: `Bearer ${authInfo.token}`,
                        Questuserid: lineaUserInfo._id,
                    },
                },
            );
            // log(quizResponse.data)
            console.log(
                randomChalk(
                    !quizResponse.data?.streakCount
                        ? `Linea quiz completed for the first time`
                        : `Linea quiz completed at ${new Date(
                              quizResponse.data?.streakTimestamp,
                          ).toLocaleDateString()} ${new Date(
                              quizResponse.data?.streakTimestamp,
                          ).toLocaleTimeString()} | current streak: ${
                              quizResponse.data?.streakCount
                          } | max streak: ${quizResponse.data?.longestStreakCount}`,
                ),
            );
        } catch (e) {
            log(c.green(e?.response?.data?.message));
        }
    }
}

// register
async function setWallet(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    let authInfo = await interact.login();
    let getLineaCampaingUserResponse = await interact.getLineaCampaignUserInfo(authInfo.token);
    const lineaCampaingUserId = getLineaCampaingUserResponse._id;

    if (getLineaCampaingUserResponse.lineaWalletAddress) {
        console.log(c.green(`Account already registered`));
        return true;
    }
    const setWalletResponse = await interact.setWallet(authInfo, lineaCampaingUserId);
    log(randomChalk(setWalletResponse.message));
}

async function dailyCheckin(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    await interact.dailyCheckIn(authInfo);
}
async function dailyLineaQuiz(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const lineaUserInfo = await interact.getLineaCampaignUserInfo(authInfo.token);
    const quizResp = await interact.lineaQuiz(authInfo, lineaUserInfo);
    // log(quizResp)
}
async function showStats(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const lineaUserInfo = await interact.getLineaCampaignUserInfo(authInfo.token);
    log(
        randomChalk(
            `${c.bold(signer.address)} | total XP: ${lineaUserInfo.totalXp} | current GM streak: ${
                lineaUserInfo?.lineaStreak?.streakCount
            } | max streak: ${
                lineaUserInfo?.lineaStreak?.longestStreakCount
            } | last action: ${new Date(
                lineaUserInfo?.lineaStreak?.streakTimestamp,
            ).toLocaleDateString()} ${new Date(
                lineaUserInfo?.lineaStreak?.streakTimestamp,
            ).toLocaleTimeString()}`,
        ),
    );
}
/*********************************************/
/**************** Week 1 ********************/
/*********************************************/

async function verifyMetamaskBridge(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const verifyPayload = {
        campaignId: "654a0e8d95c012164b1f1620",
        userInputs: { TRANSACTION_HASH: "0x" },
        task: {
            userInputs: {
                initiateButton: {
                    label: "Bridge on MetaMask",
                    baseLink: "https://portfolio.metamask.io/bridge",
                    isExist: true,
                },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        { source: "ADMIN_INPUT_FIELD", key: "METAMASK_BRIDGE_AMOUNT" },
                        { source: "QUEST_USER_DB_FIELD", key: "lineaWalletAddress" },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
                isAsyncVerify: true,
                verifyTimeInSeconds: 2100,
                maxRetryCount: 3,
                retryTimeInSeconds: 300,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Metamask Bridge amount",
            description: "Metamask Bridge amount",
            templateType: "MetaMaskBridgeAmount",
            xp: 100,
            adminInputs: [
                {
                    key: "METAMASK_BRIDGE_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Bridge Amount",
                    placeholder: "",
                    value: "0.009",
                    _id: "654a0e8d95c012164b1f1622",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK2",
            totalUsersCompleted: 101578,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: true,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: "654a0e8d95c012164b1f1621",
        },
        verificationObject: {
            questerWalletAddress: signer.address,
        },
    };
    let verifyResp = await interact.verifyTask(authInfo.token, verifyPayload, [], "bridge");
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[bridge] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claimMetamaskBridge(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const camplaignId = lineaWeekInfo.week1.id;
    const taskId = lineaWeekInfo.week1.taskIds.bridge;
    let claimResp = await interact.claimTask(
        authInfo.token,
        camplaignId,
        taskId,
        "metamask bridge",
    );
}
async function verifyMetamaskSwap(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const verifyPayload = {
        campaignId: "654a0e8d95c012164b1f1620",
        userInputs: { TRANSACTION_HASH: "0x" },
        task: {
            userInputs: {
                initiateButton: {
                    label: "Swap on MetaMask",
                    baseLink: "https://portfolio.metamask.io/swap",
                    isExist: true,
                },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        { source: "ADMIN_INPUT_FIELD", key: "METAMASK_SWAP_AMOUNT" },
                        { source: "QUEST_USER_DB_FIELD", key: "lineaWalletAddress" },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
                isAsyncVerify: true,
                verifyTimeInSeconds: 600,
                maxRetryCount: 3,
                retryTimeInSeconds: 300,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Metamask Swap amount",
            description: "Metamask Swap amount",
            templateType: "MetaMaskSwapAmount",
            xp: 50,
            adminInputs: [
                {
                    key: "METAMASK_SWAP_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Swap Amount",
                    placeholder: "",
                    value: "4",
                    _id: "654a0e8d95c012164b1f1624",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK2",
            totalUsersCompleted: 74545,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: false,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: "654a0e8d95c012164b1f1623",
        },
        verificationObject: {
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [lineaWeekInfo.week1.taskIds.bridge];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "swap",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[swap] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claimMetamaskSwap(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const camplaignId = lineaWeekInfo.week1.id;
    const taskId = lineaWeekInfo.week1.taskIds.swap;
    let claimResp = await interact.claimTask(authInfo.token, camplaignId, taskId, "metamask swap");
}
/*********************************************/
/**************** Week 2 ********************/
/*********************************************/

async function verifyCoreBridge(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const verifyPayload = {
        campaignId: "65535ae63cd33ebafe9d68f8",
        userInputs: { lineaProjectId: "653aa0a76e3c9704874cdd31", TRANSACTION_HASH: "0x" },
        task: {
            userInputs: {
                initiateButton: { isExist: false },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        { source: "ADMIN_INPUT_FIELD", key: "LINEA_BRIDGE_AMOUNT" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "questerWalletAddress" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "lineaProjectId" },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 2700,
                maxRetryCount: 3,
                retryTimeInSeconds: 1500,
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Linea Bridge ETH Amount",
            description:
                "Select any listed bridge partner dapp and bridge at least $25 worth of ETH from another network to Linea.",
            templateType: "LineaBridgeEthAmount",
            xp: 100,
            adminInputs: [
                {
                    key: "LINEA_BRIDGE_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Bridge Amount",
                    placeholder: "",
                    value: 20,
                    _id: "65535ae63cd33ebafe9d68fa",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK1",
            totalUsersCompleted: 0,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: true,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: lineaWeekInfo.week2.taskIds.bridgeCore,
        },
        verificationObject: {
            lineaProjectId: "653aa0a76e3c9704874cdd31",
            questerWalletAddress: signer.address,
        },
    };
    let verifyResp = await interact.verifyTask(authInfo.token, verifyPayload, [], "week2 bridge");
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[week2 bridge] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claimCoreBridge(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const camplaignId = lineaWeekInfo.week2.id;
    const taskId = lineaWeekInfo.week2.taskIds.bridgeCore;
    let claimResp = await interact.claimTask(authInfo.token, camplaignId, taskId, "week2 bridge");
}
async function verifyBonusBridge(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const verifyPayload = {
        campaignId: "65535ae63cd33ebafe9d68f8",
        userInputs: { lineaProjectId: "653aa0a76e3c9704874cdd31", TRANSACTION_HASH: "0x" },
        task: {
            userInputs: {
                initiateButton: { isExist: false },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        { source: "ADMIN_INPUT_FIELD", key: "LINEA_BRIDGE_AMOUNT" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "questerWalletAddress" },
                        { source: "ADMIN_INPUT_FIELD", key: "LINEA_PROJECT_ID" },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 1800,
                maxRetryCount: 3,
                retryTimeInSeconds: 600,
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Bridge $25 on ORBITER to Linea",
            description: "Bridge $25 on ORBITER to Linea",
            templateType: "LineaBridgeMultipleProject",
            xp: 5,
            adminInputs: [
                {
                    key: "LINEA_BRIDGE_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Bridge Amount for multiple",
                    placeholder: "",
                    value: 20,
                    _id: "65535ae63cd33ebafe9d690a",
                },
                {
                    key: "LINEA_PROJECT_ID",
                    inputType: "INPUT_STRING",
                    label: "Linea Project Id",
                    placeholder: "",
                    value: "653aa0a76e3c9704874cdd31",
                    _id: "65535ae63cd33ebafe9d690b",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK1",
            totalUsersCompleted: 184,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: false,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: lineaWeekInfo.week2.taskIds.bridgeMany,
        },
        verificationObject: {
            lineaProjectId: "653aa0a76e3c9704874cdd31",
            questerWalletAddress: signer.address,
        },
    };
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        [],
        "week2 bonus bridge",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[week2 bonus bridge] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claimBonusBridge(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const camplaignId = lineaWeekInfo.week2.id;
    const taskId = lineaWeekInfo.week2.taskIds.bridgeMany;
    let claimResp = await interact.claimTask(
        authInfo.token,
        camplaignId,
        taskId,
        "week2 bonus bridge",
    );
}
async function verify500Bridge(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const verifyPayload = {
        campaignId: "65535ae63cd33ebafe9d68f8",
        userInputs: { lineaProjectId: "653aa0a76e3c9704874cdd31", TRANSACTION_HASH: "0x" },
        task: {
            userInputs: {
                initiateButton: { isExist: false },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        { source: "ADMIN_INPUT_FIELD", key: "LINEA_BRIDGE_AMOUNT" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "questerWalletAddress" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "lineaProjectId" },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 1800,
                maxRetryCount: 3,
                retryTimeInSeconds: 600,
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Linea Bridge Eth Amount",
            description: "Bridge more than $500 worth of ETH in a single transaction to Linea.",
            templateType: "LineaBridgeEthAmount",
            xp: 50,
            adminInputs: [
                {
                    key: "LINEA_BRIDGE_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Bridge Amount",
                    placeholder: "",
                    value: 450,
                    _id: "65535ae63cd33ebafe9d68fc",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK1",
            totalUsersCompleted: 738,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: false,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: "65535ae63cd33ebafe9d68fb",
        },
        verificationObject: {
            lineaProjectId: "653aa0a76e3c9704874cdd31",
            questerWalletAddress: signer.address,
        },
    };
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        [lineaWeekInfo.week2.taskIds.bridgeCore],
        "week2 $500 bridge",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[week2 $500 bridge] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claim500Bridge(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const camplaignId = lineaWeekInfo.week2.id;
    const taskId = lineaWeekInfo.week2.taskIds.bridge500;
    let claimResp = await interact.claimTask(
        authInfo.token,
        camplaignId,
        taskId,
        "week2 $500 bridge",
    );
}
async function verify1000Bridge(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const verifyPayload = {
        campaignId: "65535ae63cd33ebafe9d68f8",
        userInputs: {
            lineaProjectId: "653aa0a76e3c9704874cdd31",
            lineaProjectIds: [],
            TRANSACTION_HASH: "0x",
        },
        task: {
            userInputs: {
                initiateButton: { isExist: false },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        { source: "ADMIN_INPUT_FIELD", key: "LINEA_BRIDGE_AMOUNT" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "questerWalletAddress" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "lineaProjectIds" },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 1800,
                maxRetryCount: 3,
                retryTimeInSeconds: 600,
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Linea Bridge Eth Amount",
            description:
                "Bridge more than $1000 in ETH (in total across the listed bridges) to Linea.",
            templateType: "LineaBridgeVolume",
            xp: 75,
            adminInputs: [
                {
                    key: "LINEA_BRIDGE_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Total Bridge Amount",
                    placeholder: "",
                    value: 900,
                    _id: "65535ae63cd33ebafe9d68fe",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK1",
            totalUsersCompleted: 695,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: false,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: "65535ae63cd33ebafe9d68fd",
        },
        verificationObject: {
            lineaProjectId: "653aa0a76e3c9704874cdd31",
            lineaProjectIds: [],
            questerWalletAddress: signer.address,
        },
    };
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        [lineaWeekInfo.week2.taskIds.bridge1000],
        "week2 $1000 bridge",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[week2 $1000 bridge] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claim1000Bridge(signer, proxy = undefined) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const camplaignId = lineaWeekInfo.week2.id;
    const taskId = lineaWeekInfo.week2.taskIds.bridge1000;
    let claimResp = await interact.claimTask(
        authInfo.token,
        camplaignId,
        taskId,
        "week2 $1000 bridge",
    );
}
export async function doReview(signer, proxy = undefined) {
    try {
        let axiosInstance;
        if (proxy) {
            axiosInstance = axios.create({ httpAgent: new HttpProxyAgent(proxy) });
        } else {
            axiosInstance = axios.create({});
        }
        const result = await axiosInstance.post("https://dappsheriff.com/api/app/127/reviews", {
            app_id: RandomHelpers.getRandomIntFromTo(10, 150),
            reviewer: signer.address,
            review: `"${RandomHelpers.getRandomSentence()}"`,
            rate: RandomHelpers.getRandomIntFromTo(4, 5),
        });
        console.log(`Review has been submitted`);
    } catch (e) {
        log(e.message);
        await defaultSleep(5);
        return await doReview(signer);
    }
}
async function verifyReview(signer, proxy = undefined, week = lineaWeekInfo.week2) {
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    const verifyPayload = {
        campaignId: week.id,
        userInputs: { TRANSACTION_HASH: "0x" },
        task: {
            userInputs: {
                initiateButton: {
                    label: "Write a review!",
                    baseLink: "https://dappsheriff.com/",
                    isExist: true,
                },
                verifyButton: { label: "Verify", callbackFunction: true, callbackParameters: [] },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 120,
                maxRetryCount: 3,
                retryTimeInSeconds: 60,
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Review your favorite dapp of the Bridge wave on DappSheriff (for 20XP)",
            description: "Verify that you added review on Dapsheriff",
            templateType: "DappSheriffReview",
            xp: 20,
            adminInputs: [],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK1",
            totalUsersCompleted: 2007,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: false,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: week.taskIds.postReview,
        },
        verificationObject: {
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [lineaWeekInfo.week2.taskIds.bridgeCore];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "review",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[review] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
export async function claimReview(signer, proxy = undefined, week = lineaWeekInfo.week2) {
    const campaignId = week.id;
    const taskId = week.taskIds.postReview;
    const interact = new Interact(signer, proxy);
    const authInfo = await interact.login();
    await interact.claimTask(authInfo.token, campaignId, taskId, "Review task");
}
/*********************************************/
/**************** Week 3 ********************/
/*********************************************/
export async function verifyWeek3SwapCore(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "655b48ec2e9188e21c94e93e",
        userInputs: {
            lineaProjectId: "65565a2f86b270fa5f703366",
            TRANSACTION_HASH: "0x",
        },
        task: {
            userInputs: {
                initiateButton: {
                    isExist: false,
                },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        {
                            source: "ADMIN_INPUT_FIELD",
                            key: "LINEA_SWAP_AMOUNT",
                        },
                        {
                            source: "CLIENT_VERIFICATION_OBJECT",
                            key: "questerWalletAddress",
                        },
                        {
                            source: "CLIENT_VERIFICATION_OBJECT",
                            key: "lineaProjectId",
                        },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 1200,
                maxRetryCount: 3,
                retryTimeInSeconds: 600,
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
            },
            powVerifyConfig: {
                isPOWVerify: false,
            },
            recurrenceConfig: {
                isRecurring: false,
                frequencyInDays: 1,
                maxRecurrenceCount: 1,
            },
            flashTaskConfig: {
                isFlashTask: false,
            },
            name: "Swap at least $25 worth of ETH to any of the supported tokens on any supported DEX.",
            description: "Verify that you have completed a valid swap",
            templateType: "LineaSwapEthAmount",
            xp: 150,
            adminInputs: [
                {
                    key: "LINEA_SWAP_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Swap Amount",
                    placeholder: "amt",
                    value: "22.5",
                    _id: "655b48ec2e9188e21c94e940",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK3",
            totalUsersCompleted: 168687,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: true,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: "655b48ec2e9188e21c94e93f",
        },
        verificationObject: {
            lineaProjectId: "65565a2f86b270fa5f703366",
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "core swap",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[core swap] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
export async function claimWeek3SwapCore(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week3.id;
    const taskId = lineaWeekInfo.week3.taskIds.swapCore;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "core swap");
}
export async function verifyWeek3SwapAggregator(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "655b48ec2e9188e21c94e93e",
        userInputs: { lineaProjectId: "65565a2f86b270fa5f703366", TRANSACTION_HASH: "0x" },
        task: {
            userInputs: {
                initiateButton: { isExist: false },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        { source: "ADMIN_INPUT_FIELD", key: "LINEA_SWAP_AMOUNT" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "questerWalletAddress" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "lineaProjectId" },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 1200,
                maxRetryCount: 3,
                retryTimeInSeconds: 600,
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Use an aggregator to swap at least $25 of volume from any supported token to any supported token of your choice.",
            description: "Use an aggregator to complete a valid swap",
            templateType: "LineaAggregatorSwapEthAmount",
            xp: 40,
            adminInputs: [
                {
                    key: "LINEA_SWAP_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Swap Amount",
                    placeholder: "amt",
                    value: "22.5",
                    _id: "655b48ed2e9188e21c94e942",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK3",
            totalUsersCompleted: 20099,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: false,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: "655b48ec2e9188e21c94e941",
        },
        verificationObject: {
            lineaProjectId: "65565a2f86b270fa5f703366",
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [lineaWeekInfo.week3.taskIds.swapCore];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "aggregator swap",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[aggregator swap] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
export async function claimWeek3SwapAggregator(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week3.id;
    const taskId = lineaWeekInfo.week3.taskIds.swapAggregator;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "aggregator swap");
}
export async function verifyWeek3Swap20(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "655b48ec2e9188e21c94e93e",
        userInputs: {
            lineaProjectIds: ["655659a386b270fa5f703361", "65565a2f86b270fa5f703366"],
            TRANSACTION_HASH: "0x",
        },
        task: {
            userInputs: {
                initiateButton: { isExist: false },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        { source: "ADMIN_INPUT_FIELD", key: "LINEA_SWAP_VOLUME" },
                        { source: "ADMIN_INPUT_FIELD", key: "LINEA_SWAP_AMOUNT" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "questerWalletAddress" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "lineaProjectIds" },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 1200,
                maxRetryCount: 3,
                retryTimeInSeconds: 600,
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Execute more than 20 swaps in total, each with a minimum value of $5, within the duration of the token swaps wave. ",
            description: "Execute more than 20 valid swaps",
            templateType: "LineaSwapEthTxnVolume",
            xp: 60,
            adminInputs: [
                {
                    key: "LINEA_SWAP_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Individual Min Swap Amount",
                    placeholder: "amt",
                    value: "20",
                    _id: "655b48ed2e9188e21c94e944",
                },
                {
                    key: "LINEA_SWAP_VOLUME",
                    inputType: "INPUT_NUMBER",
                    label: "Swap Volume",
                    placeholder: "amt",
                    value: "4.5",
                    _id: "655b48ed2e9188e21c94e945",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK3",
            totalUsersCompleted: 1859,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: false,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: "655b48ed2e9188e21c94e943",
        },
        verificationObject: {
            lineaProjectIds: ["655659a386b270fa5f703361", "65565a2f86b270fa5f703366"],
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [lineaWeekInfo.week3.taskIds.swapCore];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "20 swaps",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[20 swaps] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
export async function claimWeek3Swap20(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week3.id;
    const taskId = lineaWeekInfo.week3.taskIds.swap20;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "20 swaps");
}
export async function verifyWeek3Swap1000(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "655b48ec2e9188e21c94e93e",
        userInputs: {
            lineaProjectIds: ["65565a2f86b270fa5f703366", "655659a386b270fa5f703361"],
            TRANSACTION_HASH: "0x",
        },
        task: {
            userInputs: {
                initiateButton: { isExist: false },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        { source: "ADMIN_INPUT_FIELD", key: "LINEA_SWAP_AMOUNT" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "questerWalletAddress" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "lineaProjectIds" },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 1200,
                maxRetryCount: 3,
                retryTimeInSeconds: 600,
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Swap more than $1000 in total volume across multiple DEXs.",
            description: "Swap more than $1000 in total volume across multiple DEXs.",
            templateType: "LineaSwapEthAmountVolume",
            xp: 60,
            adminInputs: [
                {
                    key: "LINEA_SWAP_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Swap Amount",
                    placeholder: "amt",
                    value: "900",
                    _id: "655b48ed2e9188e21c94e947",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK3",
            totalUsersCompleted: 7969,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: false,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: "655b48ed2e9188e21c94e946",
        },
        verificationObject: {
            lineaProjectIds: ["65565a2f86b270fa5f703366", "655659a386b270fa5f703361"],
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [lineaWeekInfo.week3.taskIds.swapCore];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "swap $1000",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[swap $1000] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
export async function claimWeek3Swap1000(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week3.id;
    const taskId = lineaWeekInfo.week3.taskIds.swap1000;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "swap $1000");
}
export async function verifyWeek3SwapRWA(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "655b48ec2e9188e21c94e93e",
        userInputs: { lineaProjectId: "65565a2f86b270fa5f703366", TRANSACTION_HASH: "0x" },
        task: {
            userInputs: {
                initiateButton: { isExist: false },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        { source: "ADMIN_INPUT_FIELD", key: "LINEA_SWAP_AMOUNT" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "questerWalletAddress" },
                        { source: "CLIENT_VERIFICATION_OBJECT", key: "lineaProjectId" },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 1200,
                maxRetryCount: 3,
                retryTimeInSeconds: 600,
                isScatterEnabled: false,
                maxScatterInSeconds: 0,
            },
            powVerifyConfig: { isPOWVerify: false },
            recurrenceConfig: { isRecurring: false, frequencyInDays: 1, maxRecurrenceCount: 1 },
            flashTaskConfig: { isFlashTask: false },
            name: "Swap at least $25 of ETH into a RWA OR an LST.",
            description: "Swap at least $25 of ETH into a RWA OR an LST.",
            templateType: "LineaSwapLstOrRwa",
            xp: 40,
            adminInputs: [
                {
                    key: "LINEA_SWAP_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Swap Amount",
                    placeholder: "amt",
                    value: "22.5",
                    _id: "655b48ed2e9188e21c94e949",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK3",
            totalUsersCompleted: 11927,
            totalRecurringUsersCompleted: [],
            requiredLogins: ["EVMWallet"],
            isIntractTask: false,
            isRequiredTask: false,
            showOnChainHelper: false,
            hasMaxRetryCheck: false,
            hasRateLimitCheck: false,
            isAddedLater: false,
            isVisible: true,
            isDeleted: false,
            _id: "655b48ed2e9188e21c94e948",
        },
        verificationObject: {
            lineaProjectId: "65565a2f86b270fa5f703366",
            questerWalletAddress: signer.address,
        },
    };

    const preconditiontaskIds = [lineaWeekInfo.week3.taskIds.swapCore];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "swap RWA/LSD",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[swap RWA/LSD] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
export async function claimWeek3SwapRWA(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week3.id;
    const taskId = lineaWeekInfo.week3.taskIds.swapRwaLsd;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "swap RWA/LSD");
}
export async function verifyAllWeek3(signer, proxy = undefined) {
    const intract = new Interact(signer, proxy);
    await intract.login()
    await verifyWeek3SwapCore(signer, intract, proxy);
    await defaultSleep(3);
    await verifyWeek3SwapAggregator(signer, intract, proxy);
    await defaultSleep(3);
    await verifyWeek3SwapRWA(signer, intract, proxy);
    await defaultSleep(3);
    await verifyWeek3Swap1000(signer, intract, proxy);
    await defaultSleep(3);
    await verifyWeek3Swap20(signer, intract, proxy);
    await defaultSleep(3);
    await verifyReview(signer, proxy, lineaWeekInfo.week3);
}
export async function claimAllWeek3(signer, proxy = undefined) {
    const intract = new Interact(signer, proxy);
    await intract.login()
    await claimWeek3SwapCore(signer, intract, proxy);
    await defaultSleep(3);
    await claimWeek3SwapAggregator(signer, intract, proxy);
    await defaultSleep(3);
    await claimWeek3SwapRWA(signer, intract, proxy);
    await defaultSleep(3);
    await claimWeek3Swap1000(signer, intract, proxy);
    await defaultSleep(3);
    await claimWeek3Swap20(signer, intract, proxy);
    await defaultSleep(3);
    await claimReview(signer, proxy, lineaWeekInfo.week3);
}
export async function registerScenario(signer, proxy = undefined) {
    await setWallet(signer, proxy);
}
export async function claimDailyPointsScenario(signer, proxy = undefined) {
    await dailyCheckin(signer, proxy);
    await dailyLineaQuiz(signer, proxy);
}
export async function logStatsScenario(signer, proxy = undefined) {
    await showStats(signer, proxy);
}

export async function verifyTasksScenario(signer, week, proxy = undefined) {
    switch (week) {
        case "1":
            await verifyMetamaskBridge(signer, proxy);
            await verifyMetamaskSwap(signer, proxy);
            break;
        case "2":
            await verifyCoreBridge(signer, proxy);
            await defaultSleep(3);
            await verifyBonusBridge(signer, proxy);
            await defaultSleep(3);
            await verify500Bridge(signer, proxy);
            await defaultSleep(3);
            await verify1000Bridge(signer, proxy);
            await defaultSleep(3);
            await verifyReview(signer, proxy);
            break;
        case "3":
            await verifyAllWeek3(signer, proxy)
    }
}
export async function claimTasksScenario(signer, week, proxy = undefined) {
    switch (week) {
        case "1":
            await claimMetamaskBridge(signer, proxy);
            await claimMetamaskSwap(signer, proxy);
            break;
        case "2":
            await claimCoreBridge(signer, proxy);
            await defaultSleep(3);
            await claimBonusBridge(signer, proxy);
            await defaultSleep(3);
            await claim500Bridge(signer, proxy);
            await defaultSleep(3);
            await claim1000Bridge(signer, proxy);
            await defaultSleep(3);
            await claimReview(signer, proxy);
            break;
        case "3":
            await claimAllWeek3(signer, proxy);
    }
}
