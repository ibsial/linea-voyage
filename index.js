import { Wallet, ethers } from "ethers";
import { MetamaskBridge } from "./actions/metamaskBridge.js";
import { shuffleAndOverwriteKeys } from "./utils/accs.js";
import {
    RandomHelpers,
    c,
    checkGwei,
    delayedPrint,
    getNativeBalance,
    log,
    randomChalk,
    sleep,
} from "./utils/helpers.js";
import { IntractSetup, goodGwei, sleepFromTo } from "./config.js";
import { AskCli, settings } from "./base/ask.js";
import { MetamaskSwap } from "./actions/metamaskSwap.js";
import {
    claimDailyPointsScenario,
    claimTasksScenario,
    doReview,
    registerScenario,
    verifyTasksScenario,
} from "./actions/interact.js";
import { bridgeOrbiter } from "./actions/thirdPartyBridges.js";

const author = "@findmeonchain";
let privates = await shuffleAndOverwriteKeys();
switch (settings.mode) {
    case "Week1":
        switch (settings.task) {
            case "BridgeMetamask":
                await delayedPrint(
                    randomChalk(
                        `Welcome, metamask bridger!\nThis guy is your flashlight on a dark road of crosschain travels:\n${c.bold(
                            author,
                        )}`,
                    ),
                );
                for (let i = 0; i < privates.length; i++) {
                    await checkGwei(goodGwei);
                    let signer = new Wallet(privates[i]);
                    let metamask = new MetamaskBridge(signer);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    let res = await metamask.executeRoute();
                    if (res.code <= 0) {
                        log(c.red(res.log));
                        continue;
                    }
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
            case "SwapMetamask":
                await delayedPrint(
                    randomChalk(
                        `Make sure this tricky fox doesn't bite you too much... \n${c.bold(
                            author,
                        )} probably knows a safe route.`,
                    ),
                );
                for (let i = 0; i < privates.length; i++) {
                    await checkGwei(goodGwei);
                    let signer = new Wallet(privates[i]);
                    let metamask = new MetamaskSwap(signer);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    let res = await metamask.executeRoute();
                    // log(res?.log);
                    if (res.code <= 0) {
                        log(c.red(res.log));
                        continue;
                    }
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
        }
    case "Week2":
        switch (settings.task) {
            case "BridgeOrbiter":
                for (let i = 0; i < privates.length; i++) {
                    await checkGwei(goodGwei);
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    let res = await bridgeOrbiter(signer);
                    if (res.code <= 0) {
                        log(c.red(res.log));
                        continue;
                    }
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
            case "ReviewDapp":
                for (let i = 0; i < privates.length; i++) {
                    await checkGwei(goodGwei);
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    await doReview(signer);
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
        }
        break;
    case "Intract":
        let intSet = new IntractSetup();
        let interactSettings = {};
        const ask = new AskCli();
        interactSettings.mode = await ask.askInteractMode();
        if (interactSettings.mode == "verify" || interactSettings.mode == "claim") {
            interactSettings.week = await ask.askIteractClaimWeek();
        }
        intSet.useRefCode
            ? await delayedPrint(
                  c.ansi256(
                      215,
                      95,
                      175,
                  )(
                      `${c.bold(
                          author,
                      )} thinks You're a beautiful person with a charming personality.\n`,
                  ),
              )
            : await delayedPrint(
                  randomChalk(`This platform is offchain, while ${c.bold(author)} isn't.\n`),
              );
        for (let i = 0; i < privates.length; i++) {
            let signer = new Wallet(privates[i]);
            log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
            switch (interactSettings.mode) {
                case "register":
                    await registerScenario(signer);
                    break;
                case "daily":
                    await claimDailyPointsScenario(signer);
                    break;
                case "verify":
                    await verifyTasksScenario(signer, interactSettings.week);
                    break;
                case "claim":
                    await claimTasksScenario(signer, interactSettings.week);
                    break;
            }
            await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
        }
        break;
}
await delayedPrint(randomChalk(`Congrats, you've reached the finish line!`));
