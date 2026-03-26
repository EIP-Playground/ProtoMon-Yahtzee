// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ProtoMonBadge} from "../contracts/destination/ProtoMonBadge.sol";

contract SetDestinationRvmId is Script {
    function run() external {
        address destinationContract = vm.envAddress("DESTINATION_CONTRACT");
        address authorizedRvmId = vm.envAddress("AUTHORIZED_RVM_ID");

        vm.startBroadcast();
        ProtoMonBadge(destinationContract).setAuthorizedRvmId(authorizedRvmId);
        vm.stopBroadcast();
    }
}
