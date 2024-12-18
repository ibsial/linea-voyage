import { Wallet, ethers, parseEther } from "ethers";
import { MetamaskBridge } from "./actions/metamaskBridge.js";
import { getProxies, shuffleAndOverwriteKeys } from "./utils/accs.js";
import {
    RandomHelpers,
    c,
    checkGwei,
    defaultSleep,
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
    logStatsScenario,
    registerScenario,
    verifyTasksScenario,
} from "./actions/interact.js";
import { bridgeOrbiter } from "./actions/thirdPartyBridges.js";
import { makeIzumiSwap } from "./actions/izumiSwap.js";
import { makeVelocoreSwap } from "./actions/velocore.js";
import { mint0xScore } from "./actions/mint0xScore.js";
import { makePolyhedraBridge } from "./actions/polyhedra.js";
import { checkAndMint } from "./actions/foxyMint.js";
import { useEywaBridge } from "./actions/eywaBridge.js";
import { completeMyxQuest } from "./actions/myxTrade.js";
import { confirmAlphaQuests } from "./actions/alphamind.js";
import { WEb3Wrapper } from "./base/web3Wrapper.js";
import { JsonRpcProvider } from "ethers";
import { chains } from "./utils/chainData.js";

const author = "@findmeonchain";
let privates = await shuffleAndOverwriteKeys();
let proxies = await getProxies();
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
                    let metamask = new MetamaskBridge(signer, proxies[i % proxies.length]);
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
                    let metamask = new MetamaskSwap(signer, proxies[i % proxies.length]);
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
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    await doReview(signer, proxies[i % proxies.length]);
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
        }
        break;
    case "Week3":
        switch (settings.task) {
            case "SwapIzumi":
                for (let i = 0; i < privates.length; i++) {
                    await checkGwei(goodGwei);
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    let res = await makeIzumiSwap(signer);
                    if (res.code <= 0) {
                        log(c.red(res.log));
                        continue;
                    }
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
            case "ReviewDapp":
                for (let i = 0; i < privates.length; i++) {
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    await doReview(signer, proxies[i % proxies.length]);
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
        }
        break;
    case "Week4":
        switch (settings.task) {
            case "ReviewDapp":
                for (let i = 0; i < privates.length; i++) {
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    await doReview(signer, proxies[i % proxies.length]);
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
        }
        break;
    case "Week5":
        switch (settings.task) {
            case "LP":
                for (let i = 0; i < privates.length; i++) {
                    await checkGwei(goodGwei);
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    await makeVelocoreSwap(signer);
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
            case "ReviewDapp":
                for (let i = 0; i < privates.length; i++) {
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    await doReview(signer, proxies[i % proxies.length]);
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
        }
        break;
    case "Week6":
        switch (settings.task) {
            case "0xScore":
                for (let i = 0; i < privates.length; i++) {
                    await checkGwei(goodGwei);
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    await mint0xScore(signer, proxies[i % proxies.length]);
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
        }
        break;
    case "Week7":
        switch (settings.task) {
            case "ReviewDapp":
                for (let i = 0; i < privates.length; i++) {
                    await checkGwei(goodGwei);
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    await doReview(signer, proxies[i % proxies.length]);
                    await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
                }
                break;
        }
        break;
    case "Week9":
        switch (settings.task) {
            case "Quiz":
                for (let i = 0; i < privates.length; i++) {
                    let signer = new Wallet(privates[i]);
                    log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
                    await verifyTasksScenario(signer, "9", proxies[i % proxies.length]);
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
                    await registerScenario(signer, proxies[i % proxies.length]);
                    break;
                case "daily":
                    await claimDailyPointsScenario(signer, proxies[i % proxies.length]);
                    break;
                case "verify":
                    await verifyTasksScenario(
                        signer,
                        interactSettings.week,
                        proxies[i % proxies.length],
                    );
                    break;
                case "claim":
                    await claimTasksScenario(
                        signer,
                        interactSettings.week,
                        proxies[i % proxies.length],
                    );
                    break;
                case "stats":
                    await logStatsScenario(signer, proxies[i % proxies.length]);
                    break;
                case "POH":
                    await verifyTasksScenario(signer, "POH", proxies[i % proxies.length]);
                    break;
            }
            await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
        }
        break;
    case "Polyhedra":
        for (let i = 0; i < privates.length; i++) {
            let signer = new Wallet(privates[i]);
            log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
            await makePolyhedraBridge(signer);
            await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
        }
        break;
    case "Foxy":
        for (let i = 0; i < privates.length; i++) {
            let signer = new Wallet(privates[i]);
            log(c.cyan(`#${i + 1}/${privates.length} ${signer.address}`));
            await checkAndMint(signer);
            await defaultSleep(RandomHelpers.getRandomIntFromTo(10, 15));
            await verifyTasksScenario(signer, "Foxy", proxies[i % proxies.length]);
            await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
        }
    case "Fast & Furious: The last race":
        // for (let i = 0; i < privates.length; i++) {
        //     let signer = new Wallet(privates[i]);
        //     log(c.cyan(`#${i + 1}/${privates.length} ${signer.address} EYWA`));
        //     let eywaResult = await useEywaBridge(signer);
        //     await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
        // }
        // privates = await shuffleAndOverwriteKeys();
        // for (let i = 0; i < privates.length; i++) {
        //     let signer = new Wallet(privates[i], new JsonRpcProvider(chains["Linea"].rpc));
        //     let web3Wrapper = new WEb3Wrapper(signer, "Linea");
        //     let LXPBalance = await web3Wrapper.getTokenBalance("LXP");
        //     if (LXPBalance >= parseEther("1986")) {
        //         log(c.magenta(`#${i + 1}/${privates.length} ${signer.address} LXP > 1985, skip`));
        //         continue;
        //     }
        //     log(c.cyan(`#${i + 1}/${privates.length} ${signer.address} MYX`));
        //     let myxResult = await completeMyxQuest(signer);
        //     await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
        // }
        // privates = RandomHelpers.shuffleArray(privates);
        for (let i = 0; i < privates.length; i++) {
            let signer = new Wallet(privates[i]);
            log(c.cyan(`#${i + 1}/${privates.length} ${signer.address} AlphaMind`));
            let alphaResult = await confirmAlphaQuests(
                signer,
                RandomHelpers.chooseElementFromArray(proxies),
            );
            await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
        }
}
await delayedPrint(randomChalk(`Our road diverges, so ${c.bold("@findmeonchain")} says goodbye!`));
