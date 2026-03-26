// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ProtoMonBadge} from "../contracts/destination/ProtoMonBadge.sol";

contract DeployDestination is Script {
    function run() external {
        address callbackProxy = vm.envAddress("CALLBACK_PROXY");

        vm.startBroadcast();
        new ProtoMonBadge(callbackProxy);
        vm.stopBroadcast();
    }
}
