import axios from "axios";
import { log, defaultSleep, c, randomChalk, RandomHelpers } from "../utils/helpers.js";
import { IntractSetup } from "../config.js";
import { HttpsProxyAgent } from "https-proxy-agent";
const refInfo = {
    referralCode: "KKktVW",
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
    week4: {
        id: "65647f06731b793354cb239c",
        taskIds: {
            postReview: "65647f06731b793354cb23b0",
        },
    },
    week5: {
        id: "656db678132add9470b7595c",
        tasksIds: {
            lpCore: "656db678132add9470b7595d",
            lpRwaLsd: "656db678132add9470b75961",
            lpVe33: "656db678132add9470b75965",
            lpSingle: "656db678132add9470b75969",
            postReview: "656db678132add9470b7596d",
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
                    randomChalk(
                        `[${taskName}] claimed +${claimResponse.data.claimDetails[0].xp} XP earned!`,
                    ),
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
            axiosInstance = axios.create({ httpAgent: new HttpsProxyAgent(proxy) });
        } else {
            axiosInstance = axios.create({});
        }
        const result = await axiosInstance.post(
            "https://dappsheriff.com/api/app/85/reviews",
            {
                app_id: 85,
                reviewer: signer.address,
                review: `"${RandomHelpers.getRandomSentence()}"`,
                rate: RandomHelpers.getRandomIntFromTo(4, 5),
            },
            {
                headers: {
                    Origin: "https://dappsheriff.com",
                    Referer: "https://dappsheriff.com/zkex",
                    Cookie: "_ga=GA1.1.1639761565.1700802651; cf_clearance=Y.ogDwQQ8_eeSMO1.TVaz1KTcbsnRTrP49iXV4v1gMk-1701764250-0-1-29339692.5260ef5.b67a5d73-160.2.1701764250; _ga_0364JV0Q2Q=GS1.1.1701764250.6.1.1701764351.0.0.0",
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
                },
            },
        );
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
/***************** Week 3 ********************/
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
async function verifyWeek3Review(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: lineaWeekInfo.week3.id,
        userInputs: {
            TRANSACTION_HASH: "0x",
        },
        task: {
            userInputs: {
                initiateButton: {
                    label: "Write a review!",
                    baseLink: "https://dappsheriff.com/",
                    isExist: true,
                },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        {
                            source: "ADMIN_INPUT_FIELD",
                            key: "DAPPSHERIFF_SLUG",
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
            name: "Review your favorite dapp of the Token Swap wave on DappSheriff (for 20XP)",
            description: "Verify that you added review on Dapsheriff",
            templateType: "DappsheriffReview",
            xp: 20,
            adminInputs: [
                {
                    key: "DAPPSHERIFF_SLUG",
                    inputType: "INPUT_STRING",
                    label: "URI SLUG",
                    placeholder: "",
                    value: "waves/2",
                    _id: "655b48ed2e9188e21c94e94b",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK1",
            totalUsersCompleted: 204417,
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
            _id: lineaWeekInfo.week3.taskIds.postReview,
        },
        verificationObject: {
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [lineaWeekInfo.week3.taskIds.swapCore];
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
export async function claimWeek3Review(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week3.id;
    const taskId = lineaWeekInfo.week3.taskIds.postReview;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "Review task");
}
export async function verifyAllWeek3(signer, proxy = undefined) {
    const intract = new Interact(signer, proxy);
    await intract.login();
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
    await verifyWeek3Review(signer, intract, proxy);
}
export async function claimAllWeek3(signer, proxy = undefined) {
    const intract = new Interact(signer, proxy);
    await intract.login();
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
    await claimWeek3Review(signer, intract, proxy);
}
/*********************************************/
/***************** Week 4 ********************/
/*********************************************/
async function verifyWeek4Review(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: lineaWeekInfo.week4.id,
        userInputs: {
            TRANSACTION_HASH: "0x",
        },
        task: {
            userInputs: {
                initiateButton: {
                    label: "Write a review!",
                    baseLink: "https://dappsheriff.com/",
                    isExist: true,
                },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        {
                            source: "ADMIN_INPUT_FIELD",
                            key: "DAPPSHERIFF_SLUG",
                        },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 900,
                maxRetryCount: 3,
                retryTimeInSeconds: 900,
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
            name: "Verify that you added review on Dappsheriff",
            description: "Verify that you added review on Dappsheriff",
            templateType: "DappsheriffReview",
            xp: 20,
            adminInputs: [
                {
                    key: "DAPPSHERIFF_SLUG",
                    inputType: "INPUT_STRING",
                    label: "URI SLUG",
                    placeholder: "",
                    value: "waves/3",
                    _id: "65647f06731b793354cb23b1",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK1",
            totalUsersCompleted: 10156,
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
            _id: "65647f06731b793354cb23b0",
        },
        verificationObject: {
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [];
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
export async function claimWeek4Review(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week4.id;
    const taskId = lineaWeekInfo.week4.taskIds.postReview;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "Review task");
}
/*********************************************/
/***************** Week 5 ********************/
/*********************************************/
async function verifyWeek5LpCore(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: lineaWeekInfo.week5.id,
        userInputs: {
            lineaProjectId: "65647a184b53507f1de4ea8c",
            TRANSACTION_HASH: "0x",
        },
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
                        {
                            key: "ALLOWED_TOKEN_ADDRESSES",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "LINEA_LIQUIDITY_AMOUNT",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "LINEA_LIQUIDITY_PROJECT_TYPE",
                            source: "ADMIN_INPUT_FIELD",
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
                verifyTimeInSeconds: 900,
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
            name: "Add liquidity in specific pools available on Linea",
            description:
                "Add liquidity on Linea. Carefully select the pool based on task description to successfuly verify the task.",
            templateType: "LineaAddLiquidity",
            xp: 150,
            adminInputs: [
                {
                    key: "ALLOWED_TOKEN_ADDRESSES",
                    inputType: "INPUT_STRING_ARRAY",
                    label: "List of Supported tokens",
                    placeholder: "amt",
                    value: [
                        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                        "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
                        "0x176211869ca2b568f2a7d4ee941e073a821ee1ff",
                        "0xa219439258ca9da29e9cc4ce5596924745e12b93",
                        "0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4",
                        "0x4af15ec2a0bd43db75dd04e62faa3b8ef36b00d5",
                        "0x7d43aabc515c356145049227cee54b608342c0ad",
                        "0xf5c6825015280cdfd0b56903f9f8b5a2233476f5",
                        "0x3b2f62d42db19b30588648bf1c184865d4c3b1d6",
                        "0x265b25e22bcd7f10a5bd6e6410f10537cc7567e8",
                        "0x0d1e753a25ebda689453309112904807625befbe",
                        "0x5471ea8f739dd37e9b81be9c5c77754d8aa953e4",
                        "0x1a584204db35460a32e7d9990ac1874cb9fb0827",
                        "0x6baa318cf7c51c76e17ae1ebe9bbff96ae017acb",
                        "0x5b16228b94b68c7ce33af2acc5663ebde4dcfa2d",
                        "0x0e076aafd86a71dceac65508daf975425c9d0cb6",
                        "0x0e5f2ee8c29e7ebc14e45da7ff90566d8c407db7",
                        "0x7da14988e4f390c2e34ed41df1814467d3ade0c3",
                        "0x8c56017b172226fe024dea197748fc1eaccc82b1",
                        "0x60d01ec2d5e98ac51c8b4cf84dfcce98d527c747",
                        "0x43e8809ea748eff3204ee01f08872f063e44065f",
                        "0x0b1a02a7309dfbfad1cd4adc096582c87e8a3ac1",
                        "0x0963a1abaf36ca88c21032b82e479353126a1c4b",
                        "0x9201f3b9dfab7c13cd659ac5695d12d605b5f1e6",
                        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
                        "0xb79dd08ea68a908a97220c76d19a6aa9cbde4376",
                        "0x1e1f509963a6d33e169d9497b11c7dbfe73b7f13",
                        "0x93f4d0ab6a8b4271f4a28db399b5e30612d21116",
                        "0x2f0b4300074afc01726262d4cc9c1d2619d7297a",
                        "0xcc22f6aa610d1b2a0e89ef228079cb3e1831b1d1",
                        "0x6ef95b6f3b0f39508e3e04054be96d5ee39ede0d",
                        "0x1be3735dd0c0eb229fb11094b6c277192349ebbf",
                        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
                        "0x93f4d0ab6a8b4271f4a28db399b5e30612d21116",
                        "0x2f0b4300074afc01726262d4cc9c1d2619d7297a",
                        "0xceed853798ff1c95ceb4dc48f68394eb7a86a782",
                        "0xb79dd08ea68a908a97220c76d19a6aa9cbde4376",
                        "0x1e1f509963a6d33e169d9497b11c7dbfe73b7f13",
                        "0x3f006b0493ff32b33be2809367f5f6722cb84a7b",
                        "0xb30e7a2e6f7389ca5ddc714da4c991b7a1dcc88e",
                        "0x1a7e4e63778b4f12a199c062f3efdd288afcbce8",
                        "0x0000000000000000000000000000000000000001",
                    ],
                    _id: "656db678132add9470b7595e",
                },
                {
                    key: "LINEA_LIQUIDITY_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Min total liquidity amount to be added in one single pool",
                    placeholder: "amt",
                    value: 20,
                    _id: "656db678132add9470b7595f",
                },
                {
                    key: "LINEA_LIQUIDITY_PROJECT_TYPE",
                    inputType: "INPUT_STRING_ARRAY",
                    label: "What kind of projects are allowed? Eg, only v3 pools, single sided pools, all projects etc",
                    placeholder: "amt",
                    value: ["All"],
                    _id: "656db678132add9470b75960",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK5",
            totalUsersCompleted: 131895,
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
            _id: "656db678132add9470b7595d",
        },
        verificationObject: {
            lineaProjectId: "65647a184b53507f1de4ea8c",
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "core LP",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[core LP] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claimWeek5LpCore(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week5.id;
    const taskId = lineaWeekInfo.week5.tasksIds.lpCore;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "core LP");
}
async function verifyWeek5RwaLsdLp(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "656db678132add9470b7595c",
        userInputs: {
            lineaProjectId: "65647a184b53507f1de4ea8c",
            TRANSACTION_HASH: "0x",
        },
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
                        {
                            key: "ALLOWED_TOKEN_ADDRESSES",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "LINEA_LIQUIDITY_AMOUNT",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "LINEA_LIQUIDITY_PROJECT_TYPE",
                            source: "ADMIN_INPUT_FIELD",
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
                verifyTimeInSeconds: 900,
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
            name: "Add liquidity in specific pools available on Linea",
            description:
                "Add liquidity on Linea. Carefully select the pool based on task description to successfuly verify the task.",
            templateType: "LineaAddLiquidity",
            xp: 60,
            adminInputs: [
                {
                    key: "ALLOWED_TOKEN_ADDRESSES",
                    inputType: "INPUT_STRING_ARRAY",
                    label: "List of Supported tokens",
                    placeholder: "amt",
                    value: [
                        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
                        "0x93f4d0ab6a8b4271f4a28db399b5e30612d21116",
                        "0x2f0b4300074afc01726262d4cc9c1d2619d7297a",
                        "0xceed853798ff1c95ceb4dc48f68394eb7a86a782",
                        "0xb79dd08ea68a908a97220c76d19a6aa9cbde4376",
                        "0x1e1f509963a6d33e169d9497b11c7dbfe73b7f13",
                        "0x3f006b0493ff32b33be2809367f5f6722cb84a7b",
                        "0xb30e7a2e6f7389ca5ddc714da4c991b7a1dcc88e",
                        "0x1a7e4e63778b4f12a199c062f3efdd288afcbce8",
                    ],
                    _id: "656db678132add9470b75962",
                },
                {
                    key: "LINEA_LIQUIDITY_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Min total liquidity amount to be added in one single pool",
                    placeholder: "amt",
                    value: 20,
                    _id: "656db678132add9470b75963",
                },
                {
                    key: "LINEA_LIQUIDITY_PROJECT_TYPE",
                    inputType: "INPUT_STRING_ARRAY",
                    label: "What kind of projects are allowed? Eg, only v3 pools, single sided pools, all projects etc",
                    placeholder: "amt",
                    value: ["All"],
                    _id: "656db678132add9470b75964",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK5",
            totalUsersCompleted: 70681,
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
            _id: "656db678132add9470b75961",
        },
        verificationObject: {
            lineaProjectId: "65647a184b53507f1de4ea8c",
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "Rwa/Lsd LP",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[Rwa/Lsd LP] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claimWeek5SwapRwaLsdLp(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week5.id;
    const taskId = lineaWeekInfo.week5.tasksIds.lpRwaLsd;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "Rwa/Lsd LP");
}
async function verifyWeek5LpVe33(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "656db678132add9470b7595c",
        userInputs: {
            lineaProjectId: "65647a184b53507f1de4ea8c",
            TRANSACTION_HASH: "0x",
        },
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
                        {
                            key: "ALLOWED_TOKEN_ADDRESSES",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "LINEA_LIQUIDITY_AMOUNT",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "LINEA_LIQUIDITY_PROJECT_TYPE",
                            source: "ADMIN_INPUT_FIELD",
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
                verifyTimeInSeconds: 900,
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
            name: "Add liquidity in specific pools available on Linea",
            description:
                "Add liquidity on Linea. Carefully select the pool based on task description to successfuly verify the task.",
            templateType: "LineaAddLiquidity",
            xp: 60,
            adminInputs: [
                {
                    key: "ALLOWED_TOKEN_ADDRESSES",
                    inputType: "INPUT_STRING_ARRAY",
                    label: "List of Supported tokens",
                    placeholder: "amt",
                    value: [
                        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                        "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
                        "0x176211869ca2b568f2a7d4ee941e073a821ee1ff",
                        "0xa219439258ca9da29e9cc4ce5596924745e12b93",
                        "0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4",
                        "0x4af15ec2a0bd43db75dd04e62faa3b8ef36b00d5",
                        "0x7d43aabc515c356145049227cee54b608342c0ad",
                        "0xf5c6825015280cdfd0b56903f9f8b5a2233476f5",
                        "0x3b2f62d42db19b30588648bf1c184865d4c3b1d6",
                        "0x265b25e22bcd7f10a5bd6e6410f10537cc7567e8",
                        "0x0d1e753a25ebda689453309112904807625befbe",
                        "0x5471ea8f739dd37e9b81be9c5c77754d8aa953e4",
                        "0x1a584204db35460a32e7d9990ac1874cb9fb0827",
                        "0x6baa318cf7c51c76e17ae1ebe9bbff96ae017acb",
                        "0x5b16228b94b68c7ce33af2acc5663ebde4dcfa2d",
                        "0x0e076aafd86a71dceac65508daf975425c9d0cb6",
                        "0x0e5f2ee8c29e7ebc14e45da7ff90566d8c407db7",
                        "0x7da14988e4f390c2e34ed41df1814467d3ade0c3",
                        "0x8c56017b172226fe024dea197748fc1eaccc82b1",
                        "0x60d01ec2d5e98ac51c8b4cf84dfcce98d527c747",
                        "0x43e8809ea748eff3204ee01f08872f063e44065f",
                        "0x0b1a02a7309dfbfad1cd4adc096582c87e8a3ac1",
                        "0x0963a1abaf36ca88c21032b82e479353126a1c4b",
                        "0x9201f3b9dfab7c13cd659ac5695d12d605b5f1e6",
                        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
                        "0xb79dd08ea68a908a97220c76d19a6aa9cbde4376",
                        "0x1e1f509963a6d33e169d9497b11c7dbfe73b7f13",
                        "0x93f4d0ab6a8b4271f4a28db399b5e30612d21116",
                        "0x2f0b4300074afc01726262d4cc9c1d2619d7297a",
                        "0xcc22f6aa610d1b2a0e89ef228079cb3e1831b1d1",
                        "0x6ef95b6f3b0f39508e3e04054be96d5ee39ede0d",
                        "0x1be3735dd0c0eb229fb11094b6c277192349ebbf",
                        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
                        "0x93f4d0ab6a8b4271f4a28db399b5e30612d21116",
                        "0x2f0b4300074afc01726262d4cc9c1d2619d7297a",
                        "0xceed853798ff1c95ceb4dc48f68394eb7a86a782",
                        "0xb79dd08ea68a908a97220c76d19a6aa9cbde4376",
                        "0x1e1f509963a6d33e169d9497b11c7dbfe73b7f13",
                        "0x3f006b0493ff32b33be2809367f5f6722cb84a7b",
                        "0xb30e7a2e6f7389ca5ddc714da4c991b7a1dcc88e",
                        "0x1a7e4e63778b4f12a199c062f3efdd288afcbce8",
                    ],
                    _id: "656db678132add9470b75966",
                },
                {
                    key: "LINEA_LIQUIDITY_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Min total liquidity amount to be added in one single pool",
                    placeholder: "amt",
                    value: 20,
                    _id: "656db678132add9470b75967",
                },
                {
                    key: "LINEA_LIQUIDITY_PROJECT_TYPE",
                    inputType: "INPUT_STRING_ARRAY",
                    label: "What kind of projects are allowed? Eg, only v3 pools, single sided pools, all projects etc",
                    placeholder: "amt",
                    value: ["V3"],
                    _id: "656db678132add9470b75968",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK5",
            totalUsersCompleted: 72320,
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
            _id: "656db678132add9470b75965",
        },
        verificationObject: {
            lineaProjectId: "65647a184b53507f1de4ea8c",
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "ve(3,3) LP",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[ve(3,3) LP] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claimWeek5LpVe33(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week5.id;
    const taskId = lineaWeekInfo.week5.tasksIds.lpVe33;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "Ve(3,3) LP");
}
async function verifyWeek5SingleLp(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "656db678132add9470b7595c",
        userInputs: {
            lineaProjectId: "65659f81646593f64862d08c",
            TRANSACTION_HASH: "0x",
        },
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
                        {
                            key: "ALLOWED_TOKEN_ADDRESSES",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "LINEA_LIQUIDITY_AMOUNT",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "LINEA_LIQUIDITY_PROJECT_TYPE",
                            source: "ADMIN_INPUT_FIELD",
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
                verifyTimeInSeconds: 900,
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
            name: "Add liquidity in specific pools available on Linea",
            description:
                "Add liquidity on Linea. Carefully select the pool based on task description to successfuly verify the task.",
            templateType: "LineaAddLiquidity",
            xp: 60,
            adminInputs: [
                {
                    key: "ALLOWED_TOKEN_ADDRESSES",
                    inputType: "INPUT_STRING_ARRAY",
                    label: "List of Supported tokens",
                    placeholder: "amt",
                    value: [
                        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                        "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
                        "0x176211869ca2b568f2a7d4ee941e073a821ee1ff",
                        "0xa219439258ca9da29e9cc4ce5596924745e12b93",
                        "0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4",
                        "0x4af15ec2a0bd43db75dd04e62faa3b8ef36b00d5",
                        "0x7d43aabc515c356145049227cee54b608342c0ad",
                        "0xf5c6825015280cdfd0b56903f9f8b5a2233476f5",
                        "0x3b2f62d42db19b30588648bf1c184865d4c3b1d6",
                        "0x265b25e22bcd7f10a5bd6e6410f10537cc7567e8",
                        "0x0d1e753a25ebda689453309112904807625befbe",
                        "0x5471ea8f739dd37e9b81be9c5c77754d8aa953e4",
                        "0x1a584204db35460a32e7d9990ac1874cb9fb0827",
                        "0x6baa318cf7c51c76e17ae1ebe9bbff96ae017acb",
                        "0x5b16228b94b68c7ce33af2acc5663ebde4dcfa2d",
                        "0x0e076aafd86a71dceac65508daf975425c9d0cb6",
                        "0x0e5f2ee8c29e7ebc14e45da7ff90566d8c407db7",
                        "0x7da14988e4f390c2e34ed41df1814467d3ade0c3",
                        "0x8c56017b172226fe024dea197748fc1eaccc82b1",
                        "0x60d01ec2d5e98ac51c8b4cf84dfcce98d527c747",
                        "0x43e8809ea748eff3204ee01f08872f063e44065f",
                        "0x0b1a02a7309dfbfad1cd4adc096582c87e8a3ac1",
                        "0x0963a1abaf36ca88c21032b82e479353126a1c4b",
                        "0x9201f3b9dfab7c13cd659ac5695d12d605b5f1e6",
                        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
                        "0xb79dd08ea68a908a97220c76d19a6aa9cbde4376",
                        "0x1e1f509963a6d33e169d9497b11c7dbfe73b7f13",
                        "0x93f4d0ab6a8b4271f4a28db399b5e30612d21116",
                        "0x2f0b4300074afc01726262d4cc9c1d2619d7297a",
                        "0xcc22f6aa610d1b2a0e89ef228079cb3e1831b1d1",
                        "0x6ef95b6f3b0f39508e3e04054be96d5ee39ede0d",
                        "0x1be3735dd0c0eb229fb11094b6c277192349ebbf",
                        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
                        "0x93f4d0ab6a8b4271f4a28db399b5e30612d21116",
                        "0x2f0b4300074afc01726262d4cc9c1d2619d7297a",
                        "0xceed853798ff1c95ceb4dc48f68394eb7a86a782",
                        "0xb79dd08ea68a908a97220c76d19a6aa9cbde4376",
                        "0x1e1f509963a6d33e169d9497b11c7dbfe73b7f13",
                        "0x3f006b0493ff32b33be2809367f5f6722cb84a7b",
                        "0xb30e7a2e6f7389ca5ddc714da4c991b7a1dcc88e",
                        "0x1a7e4e63778b4f12a199c062f3efdd288afcbce8",
                        "0x0000000000000000000000000000000000000001",
                    ],
                    _id: "656db678132add9470b7596a",
                },
                {
                    key: "LINEA_LIQUIDITY_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Min total liquidity amount to be added in one single pool",
                    placeholder: "amt",
                    value: 20,
                    _id: "656db678132add9470b7596b",
                },
                {
                    key: "LINEA_LIQUIDITY_PROJECT_TYPE",
                    inputType: "INPUT_STRING_ARRAY",
                    label: "What kind of projects are allowed? Eg, only v3 pools, single sided pools, all projects etc",
                    placeholder: "amt",
                    value: ["SingleSided"],
                    _id: "656db678132add9470b7596c",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK5",
            totalUsersCompleted: 101277,
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
            _id: "656db678132add9470b75969",
        },
        verificationObject: {
            lineaProjectId: "65659f81646593f64862d08c",
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "single LP",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[single LP] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claimWeek5SingleLp(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week5.id;
    const taskId = lineaWeekInfo.week5.tasksIds.lpSingle;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "single LP");
}
async function verifyWeek5Review(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "656db678132add9470b7595c",
        userInputs: {
            TRANSACTION_HASH: "0x",
        },
        task: {
            userInputs: {
                initiateButton: {
                    label: "Write a review!",
                    baseLink: "https://dappsheriff.com/",
                    isExist: true,
                },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        {
                            source: "ADMIN_INPUT_FIELD",
                            key: "DAPPSHERIFF_SLUG",
                        },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 900,
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
            name: "Verify that you added review on Dappsheriff",
            description: "Verify that you added review on Dappsheriff",
            templateType: "DappsheriffReview",
            xp: 20,
            adminInputs: [
                {
                    key: "DAPPSHERIFF_SLUG",
                    inputType: "INPUT_STRING",
                    label: "URI SLUG",
                    placeholder: "",
                    value: "waves/5",
                    _id: "656db678132add9470b7596e",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK1",
            totalUsersCompleted: 190277,
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
            _id: "656db678132add9470b7596d",
        },
        verificationObject: {
            questerWalletAddress: "0xf0da048fb937a835b8b88baae45ef10359dcba32",
        },
    };
    const preconditiontaskIds = [];
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
async function claimWeek5Review(signer, intract = undefined, proxy = undefined) {
    const campaignId = lineaWeekInfo.week5.id;
    const taskId = lineaWeekInfo.week5.tasksIds.postReview;
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "Review task");
}
export async function verifyAllWeek5(signer, proxy = undefined) {
    const intract = new Interact(signer, proxy);
    await intract.login();
    await verifyWeek5LpCore(signer, intract, proxy);
    await defaultSleep(3);
    await verifyWeek5LpVe33(signer, intract, proxy);
    await defaultSleep(3);
    await verifyWeek5SingleLp(signer, intract, proxy);
    await defaultSleep(3);
    await verifyWeek5RwaLsdLp(signer, intract, proxy);
    await defaultSleep(3);
    await verifyWeek5Review(signer, intract, proxy);
}
export async function claimAllWeek5(signer, proxy = undefined) {
    const intract = new Interact(signer, proxy);
    await intract.login();
    await claimWeek5LpCore(signer, intract, proxy);
    await defaultSleep(3);
    await claimWeek5LpVe33(signer, intract, proxy);
    await defaultSleep(3);
    await claimWeek5SingleLp(signer, intract, proxy);
    await defaultSleep(3);
    await claimWeek5SwapRwaLsdLp(signer, intract, proxy);
    await defaultSleep(3);
    await claimWeek5Review(signer, intract, proxy);
}
////////////////////////////////////
///////////// week 7 ///////////////
////////////////////////////////////
async function verifyWeek7ZkExDeposit(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "6572fc0bef415b56fd67608f",
        userInputs: {
            lineaProjectId: "657186570d75b1844e3cfdf9",
            TRANSACTION_HASH: "0x",
        },
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
                        {
                            key: "LINEA_TRADING_AMOUNT",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "LINEA_TRADE_TYPE",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "ALLOWED_TOKEN_ADDRESSES",
                            source: "ADMIN_INPUT_FIELD",
                        },
                        {
                            key: "LINEA_TRADING_LOGIC_KEY",
                            source: "ADMIN_INPUT_FIELD",
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
                maxRetryCount: 2,
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
            name: "Deposit at least $15 into a perpetual/options platform and make any trade.",
            description: "Do not use >2x leverage, unless you are an experienced trader.",
            templateType: "LineaTrade",
            xp: 160,
            adminInputs: [
                {
                    key: "LINEA_TRADING_AMOUNT",
                    inputType: "INPUT_NUMBER",
                    label: "Min trading amount",
                    placeholder: "amt",
                    value: 5,
                    _id: "6572fc0bef415b56fd676091",
                },
                {
                    key: "LINEA_TRADE_TYPE",
                    inputType: "INPUT_STRING_ARRAY",
                    label: "What kind of trades are allowed? ",
                    placeholder: "amt",
                    value: ["OPTIONS", "PERPETUAL"],
                    _id: "6572fc0bef415b56fd676092",
                },
                {
                    key: "ALLOWED_TOKEN_ADDRESSES",
                    inputType: "INPUT_STRING_ARRAY",
                    label: "List of Supported tokens",
                    placeholder: "amt",
                    value: [
                        "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
                        "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
                        "0x176211869ca2b568f2a7d4ee941e073a821ee1ff",
                        "0xa219439258ca9da29e9cc4ce5596924745e12b93",
                        "0x3aab2285ddcddad8edf438c1bab47e1a9d05a9b4",
                        "0x4af15ec2a0bd43db75dd04e62faa3b8ef36b00d5",
                        "0x7d43aabc515c356145049227cee54b608342c0ad",
                        "0xf5c6825015280cdfd0b56903f9f8b5a2233476f5",
                        "0x3b2f62d42db19b30588648bf1c184865d4c3b1d6",
                        "0x265b25e22bcd7f10a5bd6e6410f10537cc7567e8",
                        "0x0d1e753a25ebda689453309112904807625befbe",
                        "0x5471ea8f739dd37e9b81be9c5c77754d8aa953e4",
                        "0x1a584204db35460a32e7d9990ac1874cb9fb0827",
                        "0x6baa318cf7c51c76e17ae1ebe9bbff96ae017acb",
                        "0x5b16228b94b68c7ce33af2acc5663ebde4dcfa2d",
                        "0x0e076aafd86a71dceac65508daf975425c9d0cb6",
                        "0x0e5f2ee8c29e7ebc14e45da7ff90566d8c407db7",
                        "0x7da14988e4f390c2e34ed41df1814467d3ade0c3",
                        "0x8c56017b172226fe024dea197748fc1eaccc82b1",
                        "0x60d01ec2d5e98ac51c8b4cf84dfcce98d527c747",
                        "0x43e8809ea748eff3204ee01f08872f063e44065f",
                        "0x0b1a02a7309dfbfad1cd4adc096582c87e8a3ac1",
                        "0x0963a1abaf36ca88c21032b82e479353126a1c4b",
                        "0x9201f3b9dfab7c13cd659ac5695d12d605b5f1e6",
                        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
                        "0xb79dd08ea68a908a97220c76d19a6aa9cbde4376",
                        "0x1e1f509963a6d33e169d9497b11c7dbfe73b7f13",
                        "0x93f4d0ab6a8b4271f4a28db399b5e30612d21116",
                        "0x2f0b4300074afc01726262d4cc9c1d2619d7297a",
                        "0xcc22f6aa610d1b2a0e89ef228079cb3e1831b1d1",
                        "0x6ef95b6f3b0f39508e3e04054be96d5ee39ede0d",
                        "0x1be3735dd0c0eb229fb11094b6c277192349ebbf",
                        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
                        "0x93f4d0ab6a8b4271f4a28db399b5e30612d21116",
                        "0x2f0b4300074afc01726262d4cc9c1d2619d7297a",
                        "0xceed853798ff1c95ceb4dc48f68394eb7a86a782",
                        "0xb79dd08ea68a908a97220c76d19a6aa9cbde4376",
                        "0x1e1f509963a6d33e169d9497b11c7dbfe73b7f13",
                        "0x3f006b0493ff32b33be2809367f5f6722cb84a7b",
                        "0xb30e7a2e6f7389ca5ddc714da4c991b7a1dcc88e",
                        "0x1a7e4e63778b4f12a199c062f3efdd288afcbce8",
                    ],
                    _id: "6572fc0bef415b56fd676093",
                },
                {
                    key: "LINEA_TRADING_LOGIC_KEY",
                    inputType: "INPUT_STRING",
                    label: "What is the logic? ser",
                    placeholder: "amt",
                    value: "ProjectWise",
                    _id: "6572fc0bef415b56fd676094",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK6",
            totalUsersCompleted: 275513,
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
            _id: "6572fc0bef415b56fd676090",
        },
        verificationObject: {
            lineaProjectId: "657186570d75b1844e3cfdf9",
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [];
    let verifyResp = await interact.verifyTask(
        authInfo.token,
        verifyPayload,
        preconditiontaskIds,
        "ZKEX deposit",
    );
    if (verifyResp) {
        log(c.green(verifyResp));
    } else {
        log(
            randomChalk(
                `[ZKEX deposit] ${signer.address} started verification, come back in some time to claim points`,
            ),
        );
    }
}
async function claimWeek7ZkExDeposit(signer, intract = undefined, proxy = undefined) {
    const campaignId = "6572fc0bef415b56fd67608f";
    const taskId = "6572fc0bef415b56fd676090";
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "ZKEX deposit");
}
async function verifyWeek7Review(signer, intract = undefined, proxy = undefined) {
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    const verifyPayload = {
        campaignId: "6572fc0bef415b56fd67608f",
        userInputs: {
            TRANSACTION_HASH: "0x",
        },
        task: {
            userInputs: {
                initiateButton: {
                    label: "Write a review!",
                    baseLink: "https://dappsheriff.com/",
                    isExist: true,
                },
                verifyButton: {
                    label: "Verify",
                    callbackFunction: true,
                    callbackParameters: [
                        {
                            source: "ADMIN_INPUT_FIELD",
                            key: "DAPPSHERIFF_SLUG",
                        },
                    ],
                },
                dynamicInputs: [],
            },
            asyncVerifyConfig: {
                isAsyncVerify: true,
                verifyTimeInSeconds: 1200,
                maxRetryCount: 2,
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
            name: "Verify that you added review on Dappsheriff",
            description: "Verify that you added review on Dappsheriff",
            templateType: "DappsheriffReview",
            xp: 20,
            adminInputs: [
                {
                    key: "DAPPSHERIFF_SLUG",
                    inputType: "INPUT_STRING",
                    label: "URI SLUG",
                    placeholder: "",
                    value: "waves/6",
                    _id: "6572fc0bef415b56fd67609b",
                },
            ],
            isAttributionTask: true,
            templateFamily: "LINEA/WEEK1",
            totalUsersCompleted: 283944,
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
            _id: "6572fc0bef415b56fd67609a",
        },
        verificationObject: {
            questerWalletAddress: signer.address,
        },
    };
    const preconditiontaskIds = [];
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
async function claimWeek7Review(signer, intract = undefined, proxy = undefined) {
    const campaignId = "6572fc0bef415b56fd67608f";
    const taskId = "6572fc0bef415b56fd67609a";
    let interact = intract;
    if (!intract) {
        interact = new Interact(signer, proxy);
        await interact.login();
    }
    const authInfo = await interact.authInfo;
    await interact.claimTask(authInfo.token, campaignId, taskId, "Review task");
}
export async function verifyAllWeek7(signer, proxy = undefined) {
    const intract = new Interact(signer, proxy);
    await intract.login();
    await verifyWeek7ZkExDeposit(signer, intract, proxy);
    await defaultSleep(3);
    await verifyWeek7Review(signer, intract, proxy);
}
export async function claimAllWeek7(signer, proxy = undefined) {
    const intract = new Interact(signer, proxy);
    await intract.login();
    await claimWeek7ZkExDeposit(signer, intract, proxy);
    await defaultSleep(3);
    await claimWeek7Review(signer, intract, proxy);
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
            await verifyAllWeek3(signer, proxy);
            break;
        case "4":
            await verifyWeek4Review(signer, undefined, proxy);
            break;
        case "5":
            await verifyAllWeek5(signer, proxy);
            break;
        case "7":
            await verifyAllWeek7(signer, proxy);
            break;
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
            break;
        case "4":
            await claimWeek4Review(signer, undefined, proxy);
            break;
        case "5":
            await claimAllWeek5(signer, proxy);
            break;
        case "7":
            await claimAllWeek7(signer, proxy);
            break;
    }
}
