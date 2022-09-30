const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const {
  isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle", async function () {
      let raffle, interval, raffleEntranceFee, deployer;
      const chainId = network.config.chainId;

      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        raffle = await ethers.getContract("Raffle", deployer);
        raffleEntranceFee = await raffle.getEntranceFee();
        interval = await raffle.getInterval();
      });

      describe("fulfillRandomWords", function () {
        it("works with live Chainlink Keepers and Chainlink VRF, we get a random winner", async function () {
          console.log("Setting up test...");
          const startingTimeStamp = await raffle.getLatestTimeStamp();
          const accounts = await ethers.getSigners();
          await new Promise(async (resolve, reject) => {
            raffle.once("WinnerPicked event fired!");
            try {
              const recentWinner = await raffle.getRecentWinner();
              const raffleState = await raffle.getRaffleState();
              const winnerEndingBalanace = await accounts[0];
              const endingTimeStamp = await raffle.getLatestTimeStamp();
              await expect(raffle.getPlayer(0)).to.be.reverted;
              assert.equal(recentWinner.toString(), accounts[0].address);
              assert.equal(raffleState, 0);
              assert.equal(
                winnerEndingBalanace.toString(),
                winnerStartingBalance.add(raffleEntranceFee).toString()
              );
              assert(endingTimeStamp > startingTimeStamp);
              resolve();
            } catch (error) {
              console.log(error);
              reject(e);
            }
          });

          await raffle.enterRaffle({ value: raffleEntranceFee });
          const winnerStartingBalance = await accounts[0].getBalance();
        });
      });
    });
