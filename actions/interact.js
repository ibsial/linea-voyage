import axios from "axios";
import { log, defaultSleep, c, randomChalk } from "../utils/helpers.js";
import { IntractSetup } from "../config.js";
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
            bridgeCore: "",
            bridgeMany: "",
            bridge500: "",
            bridge1000: "",
            postReview: "",
        },
    },
};
class Interact extends IntractSetup {
    baseUrl = `https://api.intract.io/api/qv1`;
    signer;
    axiosInstance;
    constructor(signer) {
        super();
        this.signer = signer;
        this.axiosInstance = axios.create({});
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
                log(c.red(`Task "${taskName}" is not completed, try verifying again`));
                return false;
            }
            if (completedTask.isXpClaimed) {
                log(c.green(`Task "${taskName}" already claimed`));
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
                    `Task "${taskName}" claimed +${claimResponse.data.claimDetails[0].xp} XP earned!`,
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
                    authorization: `Bearer ${authInfo.token}`,
                },
            });
            // log(resp.data);
            log(randomChalk(`current GM streak: ${resp.data.streakCount}`));
            return true;
        } catch (e) {
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
                randomChalk( quizResponse.data?.isFirstTimeMarked ? `Linea quiz completed for the first time` : 
                    `Linea quiz completed at ${new Date(
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
async function setWallet(signer) {
    const interact = new Interact(signer);
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

async function dailyCheckin(signer) {
    const interact = new Interact(signer);
    const authInfo = await interact.login();
    await interact.dailyCheckIn(authInfo);
}
async function dailyLineaQuiz(signer) {
    const interact = new Interact(signer);
    const authInfo = await interact.login();
    const lineaUserInfo = await interact.getLineaCampaignUserInfo(authInfo.token);
    const quizResp = await interact.lineaQuiz(authInfo, lineaUserInfo);
    // log(quizResp)
}
async function showStats(signer) {
    const interact = new Interact(signer);
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

async function verifyMetamaskBridge(signer) {
    const interact = new Interact(signer);
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
async function claimMetamaskBridge(signer) {
    const interact = new Interact(signer);
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
async function verifyMetamaskSwap(signer) {
    const interact = new Interact(signer);
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
    let verifyResp = await interact.verifyTask(authInfo.token, verifyPayload, preconditiontaskIds, "swap");
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
async function claimMetamaskSwap(signer) {
    const interact = new Interact(signer);
    const authInfo = await interact.login();
    const camplaignId = lineaWeekInfo.week1.id;
    const taskId = lineaWeekInfo.week1.taskIds.swap;
    let claimResp = await interact.claimTask(authInfo.token, camplaignId, taskId, "metamask swap");
}

export async function registerScenario(signer) {
    await setWallet(signer);
}
export async function claimDailyPointsScenario(signer) {
    await dailyCheckin(signer);
    await dailyLineaQuiz(signer);
}
export async function logStatsScenario(signer) {
    await showStats(signer)
}
export async function verifyTasksScenario(signer, week) {
    switch (week) {
        case "1":
            await verifyMetamaskBridge(signer);
            await verifyMetamaskSwap(signer);
    }
}
export async function claimTasksScenario(signer, week) {
    switch (week) {
        case "1":
            await claimMetamaskBridge(signer);
            await claimMetamaskSwap(signer);
    }
}
