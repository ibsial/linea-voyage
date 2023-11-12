import inquirer from "inquirer"
import { c } from "../utils/helpers.js"

class AskCli {
    async askMode() {
        const questions = [
            {
                name: 'mode',
                type: 'list',
                message: `Choose script scenario`,
                choices: [
                    {
                        name: `Bridge`,
                        value: 'Bridge'
                    },
                    {
                        name: `Swap`,
                        value: 'Swap'
                    },
                ],
                default: 'Bridge',
                loop: true
            },
        ]
        const answers = await inquirer.prompt(questions)
        return answers.mode
    }
    /**
     * 
     * @param {string} msg 
     * @returns int
     */
    async getNumber(msg) {
        const question = [
            {
            name: 'customNumber',
            type: 'number',
            message: msg,
            default: 1,
            validate(input) {
                return input > 0 && Number.isInteger(input)
              }
            }
        ]
        const answers = await inquirer.prompt(question)
        return answers.customNumber
    }
    /**
     * 
     * @param {*} msg 
     * @returns 
     */
    async getYesNo(msg) {
        const question = [
            {
                name: 'yesNo',
                type: 'list',
                message: `${msg}`,
                choices: [
                    {
                        name: `yes`,
                        type: `number`,
                        value: 1
                    },
                    {
                        name: `no`,
                        type: `number`,
                        value: 0
                    },
                ],
                default: 0,
                loop: true,
                validate(input) {
                    return input == 0 || input == 1
                  },
                },
            
        ]
        const answers = await inquirer.prompt(question)
        return answers.yesNo
    }
}
let ask = new AskCli()
let settings = {}
settings.mode = await ask.askMode()
export { AskCli, settings }