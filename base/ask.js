import inquirer from "inquirer";
import { c, log } from "../utils/helpers.js";

class AskCli {
    async askMode() {
        const questions = [
            {
                name: "mode",
                type: "list",
                message: `Choose script scenario`,
                choices: [
                    {
                        name: `complete Week1 quests`,
                        value: "Week1",
                    },
                    {
                        name: `complete Week2 quests`,
                        value: "Week2",
                    },
                    {
                        name: `complete Week3 quests`,
                        value: "Week3",
                    },
                    {
                        name: `complete Week4 quests`,
                        value: "Week4",
                    },
                    {
                        name: `complete Week5 quests`,
                        value: "Week5",
                    },
                    {
                        name: `complete Week6 verification (0xScore)`,
                        value: "Week6",
                    },
                    {
                        name: `complete Week7 quests (Review)`,
                        value: "Week7",
                    },
                    {
                        name: `complete Week9 quests (Quiz)`,
                        value: "Week9",
                    },
                    {
                        name: `do polyhedra bridge`,
                        value: "Polyhedra",
                    },
                    {
                        name: `mint foxy nft`,
                        value: "Foxy",
                    },
                    {
                        name: `do Intract verify/claim/daily tasks`,
                        value: "Intract",
                    },
                    {
                        name: `Fast & Furious: The last race`,
                        value: "Fast & Furious: The last race",
                    },
                ],
                default: "Fast & Furious: The last race",
                loop: true,
            },
        ];
        const answers = await inquirer.prompt(questions);
        return answers.mode;
    }
    async askWeekTask(week) {
        const choises = {
            Week1: [
                {
                    name: `SwapMetamask`,
                    value: "SwapMetamask",
                },
                {
                    name: `BridgeMetamask`,
                    value: "BridgeMetamask",
                },
            ],
            Week2: [
                {
                    name: `BridgeOrbiter`,
                    value: "BridgeOrbiter",
                },
                {
                    name: `ReviewDapp`,
                    value: "ReviewDapp",
                },
            ],
            Week3: [
                {
                    name: `SwapIzumi`,
                    value: "SwapIzumi",
                },
                {
                    name: `ReviewDapp`,
                    value: "ReviewDapp",
                },
            ],
            Week4: [
                {
                    name: `ReviewDapp (Layer Bank)`,
                    value: "ReviewDapp",
                },
            ],
            Week5: [
                {
                    name: "Manage Velocore USDT+ liquidity pool",
                    value: "LP",
                },
            ],
            Week6: [
                {
                    name: "0xScore attestation",
                    value: "0xScore",
                },
            ],
            Week7: [
                {
                    name: "Review dapp (ZKEX)",
                    value: "ReviewDapp",
                },
            ],
            Week9: [
                {
                    name: "Complete quiz",
                    value: "Quiz",
                },
            ],
        };
        const questions = [
            {
                name: "mode",
                type: "list",
                message: `Choose task for ${week}`,
                choices: choises[week],
                loop: true,
            },
        ];
        const answers = await inquirer.prompt(questions);
        return answers.mode;
    }
    async askInteractMode() {
        const questions = [
            {
                name: "mode",
                type: "list",
                message: `Choose interact mode`,
                choices: [
                    {
                        name: `register`,
                        value: "register",
                    },
                    {
                        name: `complete daily quests`,
                        value: "daily",
                    },
                    {
                        name: `verify tasks`,
                        value: "verify",
                    },
                    {
                        name: `claim points`,
                        value: "claim",
                    },
                    {
                        name: "show account XP stats",
                        value: "stats",
                    },
                    {
                        name: "show POH status",
                        value: "POH",
                    },
                ],
                default: "daily",
                loop: true,
            },
        ];
        const answers = await inquirer.prompt(questions);
        return answers.mode;
    }
    async askIteractClaimWeek() {
        const questions = [
            {
                name: "mode",
                type: "list",
                message: `Choose week to claim`,
                choices: [
                    {
                        name: `week 1`,
                        value: "1",
                    },
                    {
                        name: `week 2`,
                        value: "2",
                    },
                    {
                        name: `week 3`,
                        value: "3",
                    },
                    {
                        name: `week 4`,
                        value: "4",
                    },
                    {
                        name: `week 5`,
                        value: "5",
                    },
                    {
                        name: `week 7`,
                        value: "7",
                    },
                ],
                default: "7",
                loop: true,
            },
        ];
        const answers = await inquirer.prompt(questions);
        return answers.mode;
    }
    /**
     *
     * @param {string} msg
     * @returns int
     */
    async getNumber(msg) {
        const question = [
            {
                name: "customNumber",
                type: "number",
                message: msg,
                default: 1,
                validate(input) {
                    return input > 0 && Number.isInteger(input);
                },
            },
        ];
        const answers = await inquirer.prompt(question);
        return answers.customNumber;
    }
    /**
     *
     * @param {*} msg
     * @returns
     */
    async getYesNo(msg) {
        const question = [
            {
                name: "yesNo",
                type: "list",
                message: `${msg}`,
                choices: [
                    {
                        name: `yes`,
                        type: `number`,
                        value: 1,
                    },
                    {
                        name: `no`,
                        type: `number`,
                        value: 0,
                    },
                ],
                default: 0,
                loop: true,
                validate(input) {
                    return input == 0 || input == 1;
                },
            },
        ];
        const answers = await inquirer.prompt(question);
        return answers.yesNo;
    }
}
let ask = new AskCli();
let settings = {};
settings.mode = await ask.askMode();
if (
    settings.mode != "Intract" &&
    settings.mode != "Polyhedra" &&
    settings.mode != "Foxy" &&
    settings.mode != "Fast & Furious: The last race"
) {
    settings.task = await ask.askWeekTask(settings.mode);
}

export { AskCli, settings };
