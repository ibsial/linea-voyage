import inquirer from "inquirer";
import { c } from "../utils/helpers.js";

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
                        name: `do Intract verify/claim/daily tasks`,
                        value: "Intract",
                    },
                ],
                default: "Intract",
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
                ],
                default: "2",
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
if (settings.mode != "Intract") {
    settings.task = await ask.askWeekTask(settings.mode)
}

export { AskCli, settings };
