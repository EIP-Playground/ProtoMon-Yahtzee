// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtoMonBadge} from "../contracts/destination/ProtoMonBadge.sol";
import {MinimalTest} from "./utils/MinimalTest.sol";

contract ProtoMonBadgeTest is MinimalTest {
    ProtoMonBadge internal badge;

    address internal constant CALLBACK_PROXY = address(0xCA11BAc1);
    address internal constant REACTIVE_CONTRACT = address(0xBEEF1234);
    address internal constant RECIPIENT = address(0xFEE1DEAD);

    function setUp() public {
        badge = new ProtoMonBadge(CALLBACK_PROXY);
    }

    function test_constructor_initializesOwnerAndCallbackProxy() public view {
        assertEq(badge.owner(), address(this), "owner mismatch");
        assertEq(badge.callbackProxy(), CALLBACK_PROXY, "callback proxy mismatch");
    }

    function test_constructor_rejectsZeroCallbackProxy() public {
        vm.expectRevert(bytes("ProtoMonBadge: callback proxy is zero"));
        new ProtoMonBadge(address(0));
    }

    function test_setReactiveContract_updatesValue() public {
        badge.setAuthorizedRvmId(REACTIVE_CONTRACT);

        assertEq(
            badge.authorizedRvmId(),
            REACTIVE_CONTRACT,
            "authorized rvm id should update"
        );
    }

    function test_setReactiveContract_rejectsNonOwner() public {
        vm.prank(address(0x1234));
        vm.expectRevert(bytes("ProtoMonBadge: only owner"));
        badge.setAuthorizedRvmId(REACTIVE_CONTRACT);
    }

    function test_setReactiveContract_rejectsZeroAddress() public {
        vm.expectRevert(bytes("ProtoMonBadge: rvmId is zero"));
        badge.setAuthorizedRvmId(address(0));
    }

    function test_transferOwnership_updatesOwner() public {
        address newOwner = address(0xABCD);

        badge.transferOwnership(newOwner);

        assertEq(badge.owner(), newOwner, "owner should update");
    }

    function test_transferOwnership_rejectsNonOwner() public {
        vm.prank(address(0x1234));
        vm.expectRevert(bytes("ProtoMonBadge: only owner"));
        badge.transferOwnership(address(0xABCD));
    }

    function test_transferOwnership_rejectsZeroAddress() public {
        vm.expectRevert(bytes("ProtoMonBadge: owner is zero"));
        badge.transferOwnership(address(0));
    }

    function test_reactiveMint_recordsBadgeState() public {
        bytes32 gameId = keccak256("badge-success");
        badge.setAuthorizedRvmId(REACTIVE_CONTRACT);

        vm.prank(CALLBACK_PROXY);
        badge.reactiveMint(REACTIVE_CONTRACT, gameId, RECIPIENT, 1);

        assertEq(badge.minted(gameId), true, "badge should be minted");
        assertEq(badge.badgeRecipient(gameId), RECIPIENT, "recipient mismatch");
        assertEq(uint256(badge.badgeBossId(gameId)), 1, "boss id mismatch");
    }

    function test_reactiveMint_rejectsWrongCallbackSender() public {
        bytes32 gameId = keccak256("badge-wrong-sender");
        badge.setAuthorizedRvmId(REACTIVE_CONTRACT);

        vm.expectRevert(bytes("ProtoMonBadge: invalid callback sender"));
        badge.reactiveMint(REACTIVE_CONTRACT, gameId, RECIPIENT, 1);
    }

    function test_reactiveMint_rejectsWrongRvmId() public {
        bytes32 gameId = keccak256("badge-wrong-rvm");
        badge.setAuthorizedRvmId(REACTIVE_CONTRACT);

        vm.prank(CALLBACK_PROXY);
        vm.expectRevert(bytes("ProtoMonBadge: invalid rvmId"));
        badge.reactiveMint(address(0x1234), gameId, RECIPIENT, 1);
    }

    function test_reactiveMint_rejectsDuplicateGameId() public {
        bytes32 gameId = keccak256("badge-duplicate");
        badge.setAuthorizedRvmId(REACTIVE_CONTRACT);

        vm.prank(CALLBACK_PROXY);
        badge.reactiveMint(REACTIVE_CONTRACT, gameId, RECIPIENT, 1);

        vm.prank(CALLBACK_PROXY);
        vm.expectRevert(bytes("ProtoMonBadge: badge already minted"));
        badge.reactiveMint(REACTIVE_CONTRACT, gameId, RECIPIENT, 1);
    }

    function test_reactiveMint_rejectsZeroGameId() public {
        badge.setAuthorizedRvmId(REACTIVE_CONTRACT);

        vm.prank(CALLBACK_PROXY);
        vm.expectRevert(bytes("ProtoMonBadge: gameId is zero"));
        badge.reactiveMint(REACTIVE_CONTRACT, bytes32(0), RECIPIENT, 1);
    }

    function test_reactiveMint_rejectsZeroRecipient() public {
        bytes32 gameId = keccak256("badge-zero-recipient");
        badge.setAuthorizedRvmId(REACTIVE_CONTRACT);

        vm.prank(CALLBACK_PROXY);
        vm.expectRevert(bytes("ProtoMonBadge: recipient is zero"));
        badge.reactiveMint(REACTIVE_CONTRACT, gameId, address(0), 1);
    }
}
