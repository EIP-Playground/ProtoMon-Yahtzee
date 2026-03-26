// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ProtoMonReactiveBadge} from "../contracts/reactive/ProtoMonReactiveBadge.sol";

contract DeployReactive is Script {
    function run() external {
        uint256 originChainId = vm.envUint("ORIGIN_CHAIN_ID");
        address originContract = vm.envAddress("ORIGIN_CONTRACT");
        uint256 destinationChainId = vm.envUint("DESTINATION_CHAIN_ID");
        address destinationContract = vm.envAddress("DESTINATION_CONTRACT");
        uint64 callbackGasLimit = uint64(vm.envUint("CALLBACK_GAS_LIMIT"));
        address callbackProxy = vm.envAddress("CALLBACK_PROXY");

        vm.startBroadcast();
        new ProtoMonReactiveBadge(
            originChainId,
            originContract,
            destinationChainId,
            destinationContract,
            callbackGasLimit,
            callbackProxy
        );
        vm.stopBroadcast();
    }
}
