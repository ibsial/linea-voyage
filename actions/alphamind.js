import axios from "axios";
import * as gotScraping from "got-scraping";
import { v4 } from "uuid";
import { defaultSleep, sleep } from "../utils/helpers.js";
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
        this.defaultSession = gotScraping.gotScraping.extend({
            headers: {
                accept: "*/*",
                "accept-language": "en;q=0.9",
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
        let msg = "AlphaMind Launchpad sign confirmation";
        let sig = await this.signer.signMessage(msg);
        let resp = await this.session
            .post("https://ido.alphamind.co/api/users/login", {
                json: {
                    chainId: 59144,
                    signature: sig,
                },
            })
            .json();
        this.session = this.session.extend({
            headers: { authorization: `Bearer ${resp.accessToken}` },
        });
        let eventResp = await this.session
            .post("https://ido.alphamind.co/api/users/events", {
                json: {
                    event: "Login",
                    ethAddress: this.signer.address,
                },
            })
            .json();
        let realToken = await this.session
            .get(`https://ido.alphamind.co/api/claimr/token?wallet=${this.signer.address}`, {
                headers: {
                    origin: "https://app.alphamind.co",
                    referer: "https://app.alphamind.co",
                },
            })
            .json();
            console.log('real token', realToken)
            this.session = this.session.extend({
            headers: { authorization: `Bearer ${realToken.token.token}` },
        });
        this.session_id = (
            await this.session
                .post("https://prod.claimr.io/sessions", {
                    json: {
                        source: {},
                    },
                })
                .json()
        ).data.id;
        this.session_id = (
            await this.session
                .post(`https://prod.claimr.io/sessions`, {
                    json: {
                        source: {},
                    },
                })
                .json()
        ).data.id;
        this.session_id = (
            await this.session
                .post(`https://prod.claimr.io/sessions`, {
                    json: {
                        source: {},
                    },
                })
                .json()
        ).data.id;
        let questPage = await this.session
            .get(
                `https://prod.claimr.io/v2/widget/campaign?otag=inmind&ptag=alphamind-onboarding&session_id=${this.session_id}&`,
            )
            .json();
        this.id0 = questPage.data.campaign.id0;
        this.id1 = questPage.data.campaign.id1;
        this.eid = questPage.data.campaign.eid;
        this.questPage = questPage.data.campaign;
        this.lineaQuests = questPage.data.campaign.groups[0];
        console.log(this.session.defaults.options.headers)
    }
    async auth() {
        console.log(
            (
                await this.session
                    .get("https://prod.claimr.io/logins", {
                        headers: {
                            "if-none-match": `W/"6f6-x0mMiQesAlx5xYUhZvdLug8imWY"`,
                            origin: "https://widgets.claimr.io",
                            referer: "https://widgets.claimr.io/",
                        },
                    })
                    .json()
            ).data.logins,
        );
        let nonce = this.generateRandomString(16);
        let msg = `I'm Claimer!\n\nURI:\nhttps://claimr.io\n\nNonce:\n${nonce}\n\nIssued At:\n${new Date().toISOString()}`;
        let sig = await this.signer.signMessage(msg);
        /*
            const t = n.get("id0")
                  , A = n.get("id1")
                  , a = n.get("session")
                  , r = n.get("country")
                  , o = n.get("ltkn")
                  , l = es([$r, o, t, A, a, r].join("::"))
        */
               //"bmvO33JN-JnEj7ds"
        // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiQzJ5aXhRaGMiLCJpYXQiOjE3MzAyMTM5NDB9.btjUbCbFXiqDyixbmS8cZA0-9_vbyo0Zzw3d_OJcOQ0
        let state = Buffer.from(
            `0::${this.generateRandomString(16)}::${this.id0}::${this.id1}::${
                this.session_id
            }::Russia`,
            "base64",
        ).toString();
        let resp = await this.defaultSession
            .post("https://prod.claimr.io/auth/wallet", {
                json: {
                    chain_id: "eip155",
                    address: this.signer.address.toLowerCase(),
                    signature: sig,
                    message: msg,
                    state: state,
                },
                headers: {
                    origin: "https://widgets.claimr.io",
                    referer: "https://widgets.claimr.io/",
                },
            })
            .json();
        console.log(resp);
        this.session = this.session.extend({
            headers: { authorization: `Bearer ${resp.data.access_token}` },
        });
        console.log(this.session.defaults.options.headers)
        await sleep(5);
        console.log(
            (
                await this.session
                    .get("https://prod.claimr.io/logins", {
                        headers: {
                            // "if-none-match": `W/"6f6-x0mMiQesAlx5xYUhZvdLug8imWY"`,
                            // origin: "https://widgets.claimr.io",
                            // referer: "https://widgets.claimr.io/",
                        },
                    })
                    .json()
            ).data.logins,
        );
        console.log(
            (
                await this.defaultSession
                    .get("https://prod.claimr.io/logins", {
                        headers: {
                            // "if-none-match": `W/"6f6-x0mMiQesAlx5xYUhZvdLug8imWY"`,
                            // origin: "https://widgets.claimr.io",
                            // referer: "https://widgets.claimr.io/",
                        },
                    })
                    .json()
            ).data.logins,
        );
    }
    async verifyQuest1() {
        let formJson = {};
        let ans = {};
        ans[v4()] = 3;
        formJson[v4()] = ans;
        formJson[v4()] = [v4()];
        formJson[v4()] = [v4()];
        formJson[v4()] = [v4()];

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
                    fid: this.generateFid(),
                    rate: Math.random() * 3,
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
                    fid: this.generateFid(),
                    rate: 0,
                },
            })
            .json();
        console.log(verifyEywaResp);
        let verifyPohResp = await this.session.post("https://prod.claimr.io/v2/widget/campaign", {
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
                fid: this.generateFid(),
                rate: Math.random(),
            },
        });
        console.log(await this.session.get("https://prod.claimr.io/logins").json());
    }
    async verifyQuest2() {
        let formJson = {};
        let ans = {};
        ans[v4()] = 3;
        formJson[v4()] = ans;
        formJson[v4()] = [v4()];
        formJson[v4()] = [v4()];
        formJson[v4()] = [v4()];

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
                fid: this.generateFid(),
                rate: Math.random() * 3,
            },
        });
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
                    aid: this.questPage.groups[0].contests[1].action_ids[2],
                    ref_id: "",
                    data: {},
                    source: {},
                    env: "",
                    session_id: this.session_id,
                    fid: this.generateFid(),
                    rate: Math.random() * 3,
                },
            },
        );
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
                fid: this.generateFid(),
                rate: Math.random() * 3,
            },
        });
    }
    async verifyQuest3() {
        let formJson = {};
        let ans = {};
        ans[v4()] = 4;
        formJson[v4()] = ans;
        formJson[v4()] = [v4()];
        formJson[v4()] = [v4()];
        formJson[v4()] = [v4()];
        formJson[v4()] = [v4()];
        formJson[v4()] = [v4()];
        let completeFormQuestResp = await this.session.post(
            "https://api.tally.so/forms/w2J1yL/respond",
            {
                json: {
                    sessionUuid: v4(),
                    respondentUuid: this.uuid,
                    responses: formJson,
                    captchas: {},
                    isCompleted: true,
                    password: "",
                },
            },
        );
        let respondentId = completeFormQuestRes.respondentId;
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
                fid: this.generateFid(),
                rate: Math.random(),
            },
        });
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
                fid: this.generateFid(),
                rate: Math.random() * 0.5,
            },
        });
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
    generateFid(length = 16) {
        const characters =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@::<>[]/@=-";
        let result = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            result += characters[randomIndex];
        }
        return result;
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
            // await defaultSleep(3, false);
            // await alpha.verifyQuest1();
            // await defaultSleep(3, false);
            // await alpha.verifyQuest2();
            // await defaultSleep(3, false);
            // await alpha.verifyQuest3();
            return;
        } catch (e) {
            console.log(e);
        }
        retry++;
    }
    // return "";
}
export { confirmAlphaQuests };
