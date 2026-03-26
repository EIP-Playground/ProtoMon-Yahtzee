// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ProtoMonGame} from "../contracts/origin/ProtoMonGame.sol";

contract DeployOrigin is Script {
    function run() external {
        address dealerSigner = vm.envAddress("DEALER_SIGNER");

        vm.startBroadcast();
        new ProtoMonGame(dealerSigner);
        vm.stopBroadcast();
    }
}
