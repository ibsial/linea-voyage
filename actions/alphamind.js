import axios from "axios";
import * as gotScraping from "got-scraping";
import { v4 } from "uuid";
import { defaultSleep, RandomHelpers, sleep } from "../utils/helpers.js";
import { maxRetries } from "../config.js";
/**
 *
 */
class AlphaMind {
    signer;
    session_id = undefined;

    constructor(signer, proxy = undefined) {
        this.signer = signer;
        this.session = gotScraping.gotScraping.extend({
            headers: {
                accept: "*/*",
                "accept-language": "en;q=0.9",
                Referer: "https://widgets.claimr.io/",
                "Referrer-Policy": "strict-origin-when-cross-origin",
            },
            ...(proxy != undefined ? { proxyUrl: "http://" + proxy } : {}),
            retry: {
                limit: maxRetries,
                methods: ["GET", "POST"],
                statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
                errorCodes: [
                    "ETIMEDOUT",
                    "ECONNRESET",
                    "EADDRINUSE",
                    "ECONNREFUSED",
                    "ENOTFOUND",
                    "ENETUNREACH",
                    "EAI_AGAIN",
                ],
                maxRetryAfter: undefined,
                backoffLimit: 15,
                noise: 100,
            },
        });
        this.uuid = v4();
    }
    async login() {
        let gql = await this.session
            .post("https://accounts.alphamind.co/graphql", {
                json: {
                    operationName: "SyncAccount",
                    variables: {
                        syncAccountInput: {
                            addr: this.signer.address,
                        },
                    },
                    query: "mutation SyncAccount($syncAccountInput: SyncAccountInput!) {\n  syncAccount(syncAccountInput: $syncAccountInput) {\n    id\n    __typename\n  }\n}",
                },
            })
            .json();
        let sig = await this.signer.signMessage("AlphaMind Launchpad sign confirmation");
        let resp = await this.session
            .post("https://ido.alphamind.co/api/users/login", {
                json: {
                    chainId: 59144,
                    signature: sig,
                },
            })
            .json();
        this.accessToken = resp.accessToken;
        let realToken = await this.session
            .get(`https://ido.alphamind.co/api/claimr/token?wallet=${this.signer.address}`, {
                headers: {
                    authorization: `Bearer ${this.accessToken}`,
                },
            })
            .json();
        this.claimrToken = realToken.token.token;

        let questPage = await this.session
            .get(
                `https://prod.claimr.io/v2/widget/campaign?otag=inmind&ptag=alphamind-onboarding&session_id=${this.session_id}&`,
                {
                    headers: {
                        authorization: `Bearer ${this.claimrToken}`,
                    },
                },
            )
            .json();
        this.id0 = questPage.data.campaign.id0;
        this.id1 = questPage.data.campaign.id1;
        this.eid = questPage.data.campaign.eid;
        this.questPage = questPage.data.campaign;
        this.lineaQuests = questPage.data.campaign.groups[0];
    }
    async auth() {
        this.session_id = (
            await this.session
                .post("https://prod.claimr.io/sessions", {
                    json: {
                        source: {},
                    },
                })
                .json()
        ).data.id;
        let nonce = this.generateRandomString(16);
        let msg = `I'm Claimer!\n\nURI:\nhttps://claimr.io\n\nNonce:\n${nonce}\n\nIssued At:\n${new Date().toISOString()}`;
        let sig = await this.signer.signMessage(msg);
        let state = Buffer.from(
            `0::${this.generateRandomString(16)}::${this.id0}::${this.id1}::${
                this.session_id
            }::undefined`,
        ).toString("base64");
        let resp = await this.session
            .post("https://prod.claimr.io/auth/wallet", {
                json: {
                    chain_id: "eip155",
                    address: this.signer.address,
                    signature: sig,
                    message: msg,
                    state: state,
                },
                headers: {
                    // authorization: `Bearer ${this.claimrToken}`,
                    origin: "https://widgets.claimr.io",
                    referer: "https://widgets.claimr.io/",
                },
            })
            .json();
        this.walletToken = resp.data.access_token;
        this.session = this.session.extend({
            headers: {
                authorization: `Bearer ${this.claimrToken}`,
            },
        });
    }
    async verifyQuest1() {
        let formJson = {};
        const quiz = await this.session.get("https://tally.so/r/" + "3qEZPO").text();
        const blocks = JSON.parse(
            quiz.match(
                /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
            )[1],
        ).props.pageProps.blocks;
        const conditionals = blocks.filter((i) => i.groupType === "CONDITIONAL_LOGIC");
        const answersBlockUuids = conditionals
            .map((c) => c.payload.conditionals)
            .flat()
            .map((c) => c.payload);

        for (const answer of answersBlockUuids) {
            if (answer.field.type === "INPUT_FIELD")
                formJson[answer.field.blockGroupUuid] = answer.value;
            else
                formJson[answer.field.blockGroupUuid] = {
                    [answer.field.uuid]: answer.value,
                };
        }
        let completeFormQuestResp = await this.session
            .post("https://api.tally.so/forms/3qEZPO/respond", {
                json: {
                    sessionUuid: v4(),
                    respondentUuid: this.uuid,
                    responses: formJson,
                    captchas: {},
                    isCompleted: true,
                    password: "",
                },
            })
            .json();
        let respondentId = completeFormQuestResp.respondentId;
        let submissionId = completeFormQuestResp.submissionId;
        let verifyResp = await this.session
            .post("https://prod.claimr.io/v2/widget/campaign", {
                json: {
                    eid: this.eid,
                    account: "",
                    platform: "tally",
                    otag: "inmind",
                    ptag: "alphamind-onboarding",
                    gid: this.questPage.groups[0].id,
                    cid: this.questPage.groups[0].contests[0].id,
                    aid: this.questPage.groups[0].contests[0].action_ids[0],
                    ref_id: "",
                    data: {
                        id: submissionId,
                        respondent_id: respondentId,
                        form_id: "3qEZPO",
                    },
                    source: {},
                    env: "",
                    session_id: this.session_id,
                    fid: this.generateFid(
                        this.generateFid(
                            this.session_id,
                            this.questPage.groups[0].contests[0].action_ids[0] +
                                this.questPage.groups[0].id,
                        ),
                        this.generateFid(
                            this.questPage.groups[0].contests[0].id +
                                this.questPage.groups[0].contests[0].action_ids[0],
                            this.questPage.groups[0].id + this.questPage.groups[0].contests[0].id,
                        ),
                    ),
                    rate: 4000 / RandomHelpers.getRandomIntFromTo(50000, 100000),
                },
            })
            .json();
        console.log(verifyResp);
        let verifyEywaResp = await this.session
            .post("https://prod.claimr.io/v2/widget/campaign", {
                json: {
                    eid: this.eid,
                    account: "",
                    platform: "web",
                    otag: "inmind",
                    ptag: "alphamind-onboarding",
                    gid: this.questPage.groups[0].id,
                    cid: this.questPage.groups[0].contests[0].id,
                    aid: this.questPage.groups[0].contests[0].action_ids[1],
                    ref_id: "",
                    data: {
                        logins: [
                            {
                                account: this.signer.address,
                                platform: this.id0 + "::web3",
                            },
                            {
                                account: `eip155:${this.signer.address.toLowerCase()}`,
                                platform: "web3",
                            },
                        ],
                        input: "",
                    },
                    source: {},
                    env: "",
                    session_id: this.session_id,
                    fid: this.generateFid(
                        this.generateFid(
                            this.session_id,
                            this.questPage.groups[0].contests[0].action_ids[1] +
                                this.questPage.groups[0].id,
                        ),
                        this.generateFid(
                            this.questPage.groups[0].contests[0].id +
                                this.questPage.groups[0].contests[0].action_ids[1],
                            this.questPage.groups[0].id + this.questPage.groups[0].contests[0].id,
                        ),
                    ),
                    rate: 4000 / RandomHelpers.getRandomIntFromTo(50000, 100000),
                },
            })
            .json();
        console.log(verifyEywaResp);
        let verifyPohResp = await this.session
            .post("https://prod.claimr.io/v2/widget/campaign", {
                json: {
                    eid: this.eid,
                    account: "",
                    platform: "web",
                    otag: "inmind",
                    ptag: "alphamind-onboarding",
                    gid: this.questPage.groups[0].id,
                    cid: this.questPage.groups[0].contests[0].id,
                    aid: this.questPage.groups[0].contests[0].action_ids[3],
                    ref_id: "",
                    data: {
                        logins: [
                            {
                                account: this.signer.address,
                                platform: this.id0 + "::web3",
                            },
                            {
                                account: `eip155:${this.signer.address.toLowerCase()}`,
                                platform: "web3",
                            },
                        ],
                        input: "",
                    },
                    source: {},
                    env: "",
                    session_id: this.session_id,
                    fid: this.generateFid(
                        this.generateFid(
                            this.session_id,
                            this.questPage.groups[0].contests[0].action_ids[3] +
                                this.questPage.groups[0].id,
                        ),
                        this.generateFid(
                            this.questPage.groups[0].contests[0].id +
                                this.questPage.groups[0].contests[0].action_ids[3],
                            this.questPage.groups[0].id + this.questPage.groups[0].contests[0].id,
                        ),
                    ),
                    rate: 4000 / RandomHelpers.getRandomIntFromTo(50000, 100000),
                },
            })
            .json();
        console.log(verifyPohResp);
    }
    async verifyQuest2() {
        let formJson = {};
        const quiz = await this.session.get("https://tally.so/r/" + "3x2YJG").text();
        const blocks = JSON.parse(
            quiz.match(
                /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
            )[1],
        ).props.pageProps.blocks;
        const conditionals = blocks.filter((i) => i.groupType === "CONDITIONAL_LOGIC");
        const answersBlockUuids = conditionals
            .map((c) => c.payload.conditionals)
            .flat()
            .map((c) => c.payload);

        for (const answer of answersBlockUuids) {
            if (answer.field.type === "INPUT_FIELD")
                formJson[answer.field.blockGroupUuid] = answer.value;
            else
                formJson[answer.field.blockGroupUuid] = {
                    [answer.field.uuid]: answer.value,
                };
        }
        let completeFormQuestResp = await this.session
            .post("https://api.tally.so/forms/3x2YJG/respond", {
                json: {
                    sessionUuid: v4(),
                    respondentUuid: this.uuid,
                    responses: formJson,
                    captchas: {},
                    isCompleted: true,
                    password: "",
                },
            })
            .json();
        let respondentId = completeFormQuestResp.respondentId;
        let submissionId = completeFormQuestResp.submissionId;
        let verifyResp = await this.session.post("https://prod.claimr.io/v2/widget/campaign", {
            json: {
                eid: this.eid,
                account: "",
                platform: "tally",
                otag: "inmind",
                ptag: "alphamind-onboarding",
                gid: this.questPage.groups[0].id,
                cid: this.questPage.groups[0].contests[1].id,
                aid: this.questPage.groups[0].contests[1].action_ids[0],
                ref_id: "",
                data: {
                    id: submissionId,
                    respondent_id: respondentId,
                    form_id: "3x2YJG",
                },
                source: {},
                env: "",
                session_id: this.session_id,
                fid: this.generateFid(
                    this.generateFid(
                        this.session_id,
                        this.questPage.groups[0].contests[1].action_ids[0] +
                            this.questPage.groups[0].id,
                    ),
                    this.generateFid(
                        this.questPage.groups[0].contests[1].id +
                            this.questPage.groups[0].contests[1].action_ids[0],
                        this.questPage.groups[0].id + this.questPage.groups[0].contests[1].id,
                    ),
                ),
                rate: 4000 / RandomHelpers.getRandomIntFromTo(50000, 100000),
            },
        }).json();
        console.log(verifyResp)
        let verifyBalanceResp = await this.session.post(
            "https://prod.claimr.io/v2/widget/campaign",
            {
                json: {
                    eid: this.eid,
                    account: `eip155:${this.signer.address.toLowerCase()}`,
                    platform: "web3",
                    otag: "inmind",
                    ptag: "alphamind-onboarding",
                    gid: this.questPage.groups[0].id,
                    cid: this.questPage.groups[0].contests[1].id,
                    aid: this.questPage.groups[0].contests[1].action_ids[1],
                    ref_id: "",
                    data: {},
                    source: {},
                    env: "",
                    session_id: this.session_id,
                    fid: this.generateFid(
                        this.generateFid(
                            this.session_id,
                            this.questPage.groups[0].contests[1].action_ids[1] +
                                this.questPage.groups[0].id,
                        ),
                        this.generateFid(
                            this.questPage.groups[0].contests[1].id +
                            this.questPage.groups[0].contests[1].action_ids[1],
                            this.questPage.groups[0].id + this.questPage.groups[0].contests[1].id,
                        ),
                    ),
                    rate: 4000 / RandomHelpers.getRandomIntFromTo(50000, 100000),
                },
            },
        ).json();
        console.log(verifyBalanceResp)
        let verifyBalance2Resp = await this.session.post(
            "https://prod.claimr.io/v2/widget/campaign",
            {
                json: {
                    eid: this.eid,
                    account: `eip155:${this.signer.address.toLowerCase()}`,
                    platform: "web3",
                    otag: "inmind",
                    ptag: "alphamind-onboarding",
                    gid: this.questPage.groups[0].id,
                    cid: this.questPage.groups[0].contests[1].id,
                    aid: this.questPage.groups[0].contests[1].action_ids[2],
                    ref_id: "",
                    data: {},
                    source: {},
                    env: "",
                    session_id: this.session_id,
                    fid: this.generateFid(
                        this.generateFid(
                            this.session_id,
                            this.questPage.groups[0].contests[1].action_ids[2] +
                                this.questPage.groups[0].id,
                        ),
                        this.generateFid(
                            this.questPage.groups[0].contests[1].id +
                            this.questPage.groups[0].contests[1].action_ids[2],
                            this.questPage.groups[0].id + this.questPage.groups[0].contests[1].id,
                        ),
                    ),
                    rate: 4000 / RandomHelpers.getRandomIntFromTo(50000, 100000),
                },
            },
        ).json();
        console.log(verifyBalanceResp)
        let verifyPohResp = await this.session.post("https://prod.claimr.io/v2/widget/campaign", {
            json: {
                eid: this.eid,
                account: "",
                platform: "web",
                otag: "inmind",
                ptag: "alphamind-onboarding",
                gid: this.questPage.groups[0].id,
                cid: this.questPage.groups[0].contests[1].id,
                aid: this.questPage.groups[0].contests[1].action_ids[3],
                ref_id: "",
                data: {
                    logins: [
                        {
                            account: this.signer.address,
                            platform: this.id0 + "::web3",
                        },
                        {
                            account: `eip155:${this.signer.address.toLowerCase()}`,
                            platform: "web3",
                        },
                    ],
                    input: "",
                },
                source: {},
                env: "",
                session_id: this.session_id,
                fid: this.generateFid(
                    this.generateFid(
                        this.session_id,
                        this.questPage.groups[0].contests[1].action_ids[3] +
                            this.questPage.groups[0].id,
                    ),
                    this.generateFid(
                        this.questPage.groups[0].contests[1].id +
                        this.questPage.groups[0].contests[1].action_ids[3],
                        this.questPage.groups[0].id + this.questPage.groups[0].contests[1].id,
                    ),
                ),
                rate: 4000 / RandomHelpers.getRandomIntFromTo(50000, 100000),
            },
        }).json();
        console.log(verifyPohResp)
    }
    async verifyQuest3() {
        let formJson = {};
        const quiz = await this.session.get("https://tally.so/r/" + "w2J1yL").text();
        const blocks = JSON.parse(
            quiz.match(
                /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/,
            )[1],
        ).props.pageProps.blocks;
        const conditionals = blocks.filter((i) => i.groupType === "CONDITIONAL_LOGIC");
        const answersBlockUuids = conditionals
            .map((c) => c.payload.conditionals)
            .flat()
            .map((c) => c.payload);

        for (const answer of answersBlockUuids) {
            if (answer.field.type === "INPUT_FIELD")
                formJson[answer.field.blockGroupUuid] = answer.value;
            else
                formJson[answer.field.blockGroupUuid] = {
                    [answer.field.uuid]: answer.value,
                };
        }
        let completeFormQuestResp = await this.session
            .post("https://api.tally.so/forms/w2J1yL/respond", {
                json: {
                    sessionUuid: v4(),
                    respondentUuid: this.uuid,
                    responses: formJson,
                    captchas: {},
                    isCompleted: true,
                    password: "",
                },
            })
            .json();
        let respondentId = completeFormQuestResp.respondentId;
        let submissionId = completeFormQuestResp.submissionId;
        let verifyResp = await this.session.post("https://prod.claimr.io/v2/widget/campaign", {
            json: {
                eid: this.eid,
                account: "",
                platform: "tally",
                otag: "inmind",
                ptag: "alphamind-onboarding",
                gid: this.questPage.groups[0].id,
                cid: this.questPage.groups[0].contests[2].id,
                aid: this.questPage.groups[0].contests[2].action_ids[0],
                ref_id: "",
                data: {
                    id: submissionId,
                    respondent_id: respondentId,
                    form_id: "w2J1yL",
                },
                source: {},
                env: "",
                session_id: this.session_id,
                fid: this.generateFid(
                    this.generateFid(
                        this.session_id,
                        this.questPage.groups[0].contests[2].action_ids[0] +
                            this.questPage.groups[0].id,
                    ),
                    this.generateFid(
                        this.questPage.groups[0].contests[2].id +
                            this.questPage.groups[0].contests[2].action_ids[0],
                        this.questPage.groups[0].id + this.questPage.groups[0].contests[2].id,
                    ),
                ),
                rate: 4000 / RandomHelpers.getRandomIntFromTo(50000, 100000),
            },
        }).json();
        console.log(verifyResp)
        let verifyPohResp = await this.session.post("https://prod.claimr.io/v2/widget/campaign", {
            json: {
                eid: this.eid,
                account: "",
                platform: "web",
                otag: "inmind",
                ptag: "alphamind-onboarding",
                gid: this.questPage.groups[0].id,
                cid: this.questPage.groups[0].contests[2].id,
                aid: this.questPage.groups[0].contests[2].action_ids[2],
                ref_id: "",
                data: {
                    logins: [
                        {
                            account: this.signer.address,
                            platform: this.id0 + "::web3",
                        },
                        {
                            account: `eip155:${this.signer.address.toLowerCase()}`,
                            platform: "web3",
                        },
                    ],
                    input: "",
                },
                source: {},
                env: "",
                session_id: this.session_id,
                fid: this.generateFid(
                    this.generateFid(
                        this.session_id,
                        this.questPage.groups[0].contests[2].action_ids[2] +
                            this.questPage.groups[0].id,
                    ),
                    this.generateFid(
                        this.questPage.groups[0].contests[2].id +
                            this.questPage.groups[0].contests[2].action_ids[2],
                        this.questPage.groups[0].id + this.questPage.groups[0].contests[2].id,
                    ),
                ),
                rate: 4000 / RandomHelpers.getRandomIntFromTo(50000, 100000),
            },
        }).json();
        console.log(verifyPohResp)
    }
    /**
     *
     * @param {number} length
     * @returns {string}
     */
    generateRandomString(length) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_";
        let result = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters[randomIndex];
        }
        return result;
    }
    generateFid(e, t) {
        const n = e.length,
            A = t.length;
        let a = "";
        for (let i = 0; i < n; i++) {
            const n = t.charCodeAt(i % A) - 48,
                r = e.charCodeAt(i) - 48;
            a += String.fromCharCode(Math.abs(r - n) + 48);
        }
        return a;
    }
}

async function confirmAlphaQuests(signer, proxy) {
    let retry = 0;
    while (retry < maxRetries) {
        try {
            let alpha = new AlphaMind(signer, proxy);
            await alpha.login();
            await defaultSleep(3, false);
            await alpha.auth();
            await defaultSleep(3, false);
            await alpha.verifyQuest1();
            await defaultSleep(3, false);
            await alpha.verifyQuest2();
            await defaultSleep(3, false);
            await alpha.verifyQuest3();
            return;
        } catch (e) {
            console.log(e);
        }
        retry++;
    }
    // return "";
}
export { confirmAlphaQuests };
