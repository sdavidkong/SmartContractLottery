const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
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
        interval = await raffle.getInterval();
      });
      describe("constructor", function() {
        it("initializes the raffle correctly", async function() {
          const raffleState = await raffle.getRaffleState();
          assert.equal(raffleState.toString(), "0");
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
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          await raffle.performUpkeep([]);
          await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be
            .revertedWithCustomError;
        });
      });
      describe("checkUpKeep", function() {
        it("returns false if people haven't sent any ETH", async function() {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });
        it("returns false is raffle isn't open", async function() {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.send("evm_mine", []);
          await raffle.performUpkeep([]);
          const raffleState = await raffle.getRaffleState();
          const { upkeepNeeded } = raffle.callStatic.checkUpkeep("0x");
          assert.equal(raffleState.toString(), "1");
        });
        it("returns false if enough time hasn't passed", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() - 5,
          ]); // use a higher number here if this test fails
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(!upkeepNeeded);
        });
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(upkeepNeeded);
        });
      });

      describe("performUpkeep", function() {
        it("can only run if checkupkeep is true", async function() {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx = await raffle.performUpkeep([]);
          assert(tx);
        });
        it("reverts when checkupkeep is false", async function() {
          await expect(raffle.performUpkeep([])).to.be.revertedWithCustomError;
        });
        it("updates the raffle state, emits an event, and called the vrf coordinator", async function() {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const raffleState = await raffle.getRaffleState();
          const txResponse = await raffle.performUpkeep("0x");
          const txReceipt = await txResponse.wait(1);
          assert(raffleState.toString(), "1");
        });
      });
      describe("fulfillRandomWords", function() {
        beforeEach(async function() {
          await raffle.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
        });
        it("can only be called after performUpKeep", async function() {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
          ).to.be.revertedWithCustomError;
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
          ).to.be.revertedWithCustomError;
        });
        it("picks a winner, resets the lottery, and sends money", async function() {
          const additionalEntrants = 3;
          const startingAccountIndex = 1;
          for (
            let i = startingAccountIndex;
            i < startingAccountIndex + additionalEntrants;
            i++
          ) {}
        });
      });
    });
