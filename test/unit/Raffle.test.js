const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Raffle", async function() {
      let raffle, vrfCoordinatorV2Mock, interval, raffleEntranceFee, deployer;
      const chainId = network.config.chainId;

      beforeEach(async function() {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        raffle = await ethers.getContract("Raffle", deployer);
        vrfCoordinatorV2Mock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
        raffleEntranceFee = await raffle.getEntranceFee();
      });
      describe("constructor", function() {
        it("initializes the raffle correctly", async function() {
          const raffleState = await raffle.getRaffleState();
          assert.equal(raffleState.toString(), "0");
          interval = await raffle.getInterval();
          assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
        });
      });
      describe("enterRaffle", function() {
        it("reverts when you don't pay enough", async function() {
          await expect(raffle.enterRaffle()).to.be.revertedWithCustomError;
        });
        it("records players when they enter", async function() {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          const playerFromContract = await raffle.getPlayer(0);
          assert.equal(playerFromContract, deployer);
        });
        it("emits event on enter", async function() {
          await expect(
            raffle.enterRaffle({ value: raffleEntranceFee })
          ).to.emit(raffle, "RaffleEnter");
        });
        it("doesn't allow entrance when raffle is calculating", async function() {
          await raffle.enterRaffle({ value: raffleEntranceFee });
        });
      });
    });