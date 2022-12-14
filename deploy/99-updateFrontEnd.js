const { ethers, network } = require("hardhat");
const fs = require("fs");
const FRONT_END_ADDRESSES_FILE =
  "../lotto-time-next-js/constants/contractAddress.json";
const FRONT_END_ABI_FILE = "../lotto-time-next-js/constants/abi.json";

module.exports = async function () {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Updating front end...");
    await updateContractAddresses();
    await updateAbi();
  }
};

async function updateContractAddresses() {
  const raffle = await ethers.getContract("Raffle");
  const chainId = network.config.chainId.toString();
  const contractAddress = JSON.parse(
    fs.readFileSync(FRONT_END_ADDRESSES_FILE, "utf8")
  );
  if (chainId in contractAddress) {
    if (!contractAddress[chainId].includes(raffle.address)) {
      contractAddress[chainId].push[raffle.address];
    }
  } else {
    contractAddress[chainId] = [raffle.address];
  }
  fs.writeFileSync(FRONT_END_ADDRESSES_FILE, JSON.stringify(contractAddress));
}

async function updateAbi() {
  const raffle = await ethers.getContract("Raffle");
  fs.writeFileSync(
    FRONT_END_ABI_FILE,
    raffle.interface.format(ethers.utils.FormatTypes.json)
  );
}

module.exports.tags = ["all", "frontend"];
