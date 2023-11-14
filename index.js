import { Wallet, ethers } from "ethers";
import { MetamaskBridge } from "./actions/metamaskBridge.js";
import { shuffleAndOverwriteKeys } from "./utils/accs.js";
import { RandomHelpers, c, checkGwei, log, sleep } from "./utils/helpers.js";
import { goodGwei, sleepFromTo } from "./config.js";
import { settings } from "./base/ask.js";
import { MetamaskSwap } from "./actions/metamaskSwap.js";

let privates = await shuffleAndOverwriteKeys();

switch (settings.mode) {
    case "Bridge":
        for (let i = 0; i < privates.length; i++) {
            await checkGwei(goodGwei);
            let signer = new Wallet(privates[i]);
            let metamask = new MetamaskBridge(signer);
            log(c.cyan(`#${i+1}/${privates.length} ${signer.address}`))
            let res = await metamask.executeRoute();
            // log(res?.log);
            await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
        }
        break;
    case "Swap":
        for (let i = 0; i < privates.length; i++) {
            await checkGwei(goodGwei);
            let signer = new Wallet(privates[i]);
            let metamask = new MetamaskSwap(signer);
            log(c.cyan(`#${i+1}/${privates.length} ${signer.address}`))
            let res = await metamask.executeRoute();
            // log(res?.log);
            await sleep(RandomHelpers.getRandomIntFromTo(sleepFromTo[0], sleepFromTo[1]));
        }
        break;
}
