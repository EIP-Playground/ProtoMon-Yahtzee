// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

struct VmLog {
    bytes32[] topics;
    bytes data;
    address emitter;
}

interface Vm {

    function expectRevert(bytes calldata revertData) external;
    function prank(address msgSender) external;
    function addr(uint256 privateKey) external returns (address keyAddr);
    function sign(
        uint256 privateKey,
        bytes32 digest
    ) external returns (uint8 v, bytes32 r, bytes32 s);
    function recordLogs() external;
    function getRecordedLogs() external returns (VmLog[] memory logs);
}

abstract contract MinimalTest {
    address internal constant VM_ADDRESS =
        address(uint160(uint256(keccak256("hevm cheat code"))));

    Vm internal constant vm = Vm(VM_ADDRESS);

    function assertTrue(bool condition, string memory message) internal pure {
        if (!condition) {
            revert(message);
        }
    }

    function assertEq(uint256 left, uint256 right, string memory message) internal pure {
        if (left != right) {
            revert(message);
        }
    }

    function assertEq(address left, address right, string memory message) internal pure {
        if (left != right) {
            revert(message);
        }
    }

    function assertEq(bytes32 left, bytes32 right, string memory message) internal pure {
        if (left != right) {
            revert(message);
        }
    }

    function assertEq(bool left, bool right, string memory message) internal pure {
        if (left != right) {
            revert(message);
        }
    }

    function assertEq(bytes memory left, bytes memory right, string memory message) internal pure {
        if (keccak256(left) != keccak256(right)) {
            revert(message);
        }
    }
}
