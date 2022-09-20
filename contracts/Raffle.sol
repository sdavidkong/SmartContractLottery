// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract Raffle {
    uint256 private i_entranceFee;
    address payable[] private s_players;

    error Raffle__NotEnoughEthSent();

    constructor(uint256 entranceFee) {
        i_entranceFee = entranceFee;
    }

    function enterRaffle() public payable {
        if (msg.value < i_entranceFee) {
            revert Raffle__NotEnoughEthSent();
        }
    }

    function getEntranceFee() public view returns (uint256) {
        return i_entranceFee;
    }

    function getPlayer(uint256 index) public view returns (address) {
        return s_players[index];
    }
}
