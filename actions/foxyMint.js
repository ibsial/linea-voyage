import { Contract, JsonRpcProvider, ethers, parseEther } from "ethers";
import { chains } from "../utils/chainData.js";
import { c, defaultSleep, getGasPrice, log, transactionPassed } from "../utils/helpers.js";
import { maxRetries } from "../config.js";

// prettier-ignore
function getUrl() {
    const urls = [
        { cid: "QmdYeDpkVZedk1mkGodjNmF35UNxwafhFLVvsHrWgJoz6A/beanz_metadata",supply: 19000,ending: "" }, // azuki beanz
        { cid: "QmZcH4YvBVVRJtdn4RdbaqgspFU8gH6P9vomDpBVpAL3u4", supply: 10000, ending: "" }, // azuki
        { cid: "QmeSjSinHpPnmXmspMjwiXyN6zS4E9zccariGR3jxcaWtq", supply: 10000, ending: "" }, // BAYC
        { cid: "QmaN1jRPtmzeqhp6s3mR1SRK4q1xWPvFvwqW1jyN6trir9", supply: 20000, ending: "" }, // Nakamigos
        { cid: "QmSARWPw2tAoVwZMqBLjxSh2qKCZ8qBimxZccTkWnNBggh", supply: 17000, ending: "" }, // PixelBubbies
        { cid: "QmPMc4tcBsMqLRuCQtPmPe84bpSjrC3Ky7t3JWuHXYB4aS", supply: 10000, ending: "" }, // Doodles
        { cid: "QmU7pgaLsVkrP1ao7pn51wDE37PYNime6pV6mx8sUx1Nr4", supply: 10000, ending: "" }, // ForgottenRunesWizardsCult
        { cid: "QmWiQE65tmpYzcokCheQmng2DCM33DEhjXcPB6PanwpAZo", supply: 10000, ending: "" }, // mfer
        { cid: "QmUEiYGcZJWZWp9LNCTL5PGhGcjGvokKfcaCoj23dbp79J", supply: 10000, ending: "" }, // SHIBOSHIS
        { cid: "QmXUUXRSAJeb4u8p4yKHmXN1iAKtAV7jwLHjw35TNm5jN7", supply: 10000, ending: "" }, // Sappy Seals
        { cid: "QmTDcCdt3yb6mZitzWBmQr65AW6Wska295Dg9nbEYpSUDR", supply: 9500, ending: "" }, // BoredApeKennelClub
        { cid: "QmeheS1gXQpdduhQsaba8Z1Q1bxz5xeSEzKdtEthdkRUw6", supply: 15000, ending: "json" }, // Akutars
    ];
    let collection = urls[Math.floor(Math.random() * urls.length)];
    let id = Math.floor(Math.random() * collection.supply);
    return `https://ipfs.clutchplay.ai/ipfs/${collection.cid}/${id}.${collection.ending}`;
}
async function check(signer, retryCount = 0) {
    if (retryCount >= maxRetries) {
        return false;
    }
    try {
        let foxy_contract = new Contract(
            "0x9Dd4a2A1dB6bc1168de7D758208AbB109d9A386A",
            ["function balanceOf(address owner) external view returns(uint256)"],
            signer,
        );
        let balance = await foxy_contract.balanceOf(signer.address);
        if (balance > 0n) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        log(c.red(`error on getting nft balance:`));
        log(e.message);
        await defaultSleep(10);
        return check(signer, retryCount++);
    }
}
async function mint(signer, retryCount = 0) {
    if (retryCount >= maxRetries) {
        return {
            code: 0,
            data: "",
            log: `could not mint foxy nft`,
        };
    }
    let url = getUrl();
    try {
        let foxy_contract = new Contract(
            "0x9Dd4a2A1dB6bc1168de7D758208AbB109d9A386A",
            ["function safeMint(address to, string uri) external payable"],
            signer,
        );
        let limit = await foxy_contract.safeMint.estimateGas(signer.address, url, {
            value: parseEther("0.0005"),
        });
        let gasPriceData = await getGasPrice("Linea");
        let tx = await foxy_contract.safeMint(signer.address, url, {
            value: parseEther("0.0005"),
            gasLimit: (limit * 13n) / 10n,
            ...gasPriceData,
        });
        log(`minted ${url} NFT on Foxy`);
        log(c.green(chains.Linea.explorer + tx.hash));
        return await transactionPassed(tx.hash, "Linea");
    } catch (e) {
        log(c.red(`error on foxy mint:`));
        log(e.message);
        await defaultSleep(10);
        return mint(signer, retryCount++);
    }
}

async function checkAndMint(signer) {
    let provider = new JsonRpcProvider(chains.Linea.rpc);
    let alreadyMinted = await check(signer.connect(provider));
    if (alreadyMinted) {
        log(c.green(`${signer.address} already minted`))
        return {
            code: 1,
            data: "",
            log: `already minted`,
        };
    }
    log(`${signer.address} didn't mint yet`)
    return mint(signer.connect(provider));
}

export { checkAndMint };
