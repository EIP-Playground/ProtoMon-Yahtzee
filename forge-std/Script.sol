// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface Vm {
    function envAddress(string calldata name) external returns (address value);
    function envUint(string calldata name) external returns (uint256 value);
    function startBroadcast() external;
    function stopBroadcast() external;
}

abstract contract Script {
    address internal constant VM_ADDRESS =
        address(uint160(uint256(keccak256("hevm cheat code"))));

    Vm internal constant vm = Vm(VM_ADDRESS);
}
