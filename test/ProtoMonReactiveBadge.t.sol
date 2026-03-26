// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtoMonReactiveBadge} from "../contracts/reactive/ProtoMonReactiveBadge.sol";
import {MinimalTest, VmLog} from "./utils/MinimalTest.sol";

contract ProtoMonReactiveBadgeTest is MinimalTest {
    uint256 internal constant ORIGIN_CHAIN_ID = 84532;
    uint256 internal constant DESTINATION_CHAIN_ID = 11155111;
    uint64 internal constant CALLBACK_GAS_LIMIT = 600_000;
    address internal constant ORIGIN_GAME = address(0x1001);
    address internal constant DESTINATION_BADGE = address(0x2002);
    address internal constant CALLBACK_PROXY = address(0x3003);
    address internal constant REWARD_RECIPIENT = address(0x4004);

    ProtoMonReactiveBadge internal reactiveBadge;

    function setUp() public {
        reactiveBadge = new ProtoMonReactiveBadge(
            ORIGIN_CHAIN_ID,
            ORIGIN_GAME,
            DESTINATION_CHAIN_ID,
            DESTINATION_BADGE,
            CALLBACK_GAS_LIMIT,
            CALLBACK_PROXY
        );
    }

    function test_constructor_initializesConfiguration() public view {
        assertEq(reactiveBadge.originChainId(), ORIGIN_CHAIN_ID, "origin chain mismatch");
        assertEq(reactiveBadge.originGame(), ORIGIN_GAME, "origin game mismatch");
        assertEq(
            reactiveBadge.destinationChainId(),
            DESTINATION_CHAIN_ID,
            "destination chain mismatch"
        );
        assertEq(
            reactiveBadge.destinationBadge(),
            DESTINATION_BADGE,
            "destination badge mismatch"
        );
        assertEq(
            uint256(reactiveBadge.callbackGasLimit()),
            uint256(CALLBACK_GAS_LIMIT),
            "callback gas mismatch"
        );
        assertEq(
            reactiveBadge.callbackProxy(),
            CALLBACK_PROXY,
            "callback proxy mismatch"
        );
    }

    function test_constructor_rejectsZeroOriginChain() public {
        vm.expectRevert(bytes("ProtoMonReactiveBadge: invalid origin chain"));
        new ProtoMonReactiveBadge(
            0,
            ORIGIN_GAME,
            DESTINATION_CHAIN_ID,
            DESTINATION_BADGE,
            CALLBACK_GAS_LIMIT,
            CALLBACK_PROXY
        );
    }

    function test_constructor_rejectsZeroOriginGame() public {
        vm.expectRevert(bytes("ProtoMonReactiveBadge: origin game is zero"));
        new ProtoMonReactiveBadge(
            ORIGIN_CHAIN_ID,
            address(0),
            DESTINATION_CHAIN_ID,
            DESTINATION_BADGE,
            CALLBACK_GAS_LIMIT,
            CALLBACK_PROXY
        );
    }

    function test_constructor_rejectsZeroDestinationChain() public {
        vm.expectRevert(bytes("ProtoMonReactiveBadge: invalid destination chain"));
        new ProtoMonReactiveBadge(
            ORIGIN_CHAIN_ID,
            ORIGIN_GAME,
            0,
            DESTINATION_BADGE,
            CALLBACK_GAS_LIMIT,
            CALLBACK_PROXY
        );
    }

    function test_constructor_rejectsZeroDestinationBadge() public {
        vm.expectRevert(bytes("ProtoMonReactiveBadge: destination badge is zero"));
        new ProtoMonReactiveBadge(
            ORIGIN_CHAIN_ID,
            ORIGIN_GAME,
            DESTINATION_CHAIN_ID,
            address(0),
            CALLBACK_GAS_LIMIT,
            CALLBACK_PROXY
        );
    }

    function test_constructor_rejectsZeroCallbackGas() public {
        vm.expectRevert(bytes("ProtoMonReactiveBadge: callback gas is zero"));
        new ProtoMonReactiveBadge(
            ORIGIN_CHAIN_ID,
            ORIGIN_GAME,
            DESTINATION_CHAIN_ID,
            DESTINATION_BADGE,
            0,
            CALLBACK_PROXY
        );
    }

    function test_constructor_rejectsZeroCallbackProxy() public {
        vm.expectRevert(bytes("ProtoMonReactiveBadge: callback proxy is zero"));
        new ProtoMonReactiveBadge(
            ORIGIN_CHAIN_ID,
            ORIGIN_GAME,
            DESTINATION_CHAIN_ID,
            DESTINATION_BADGE,
            CALLBACK_GAS_LIMIT,
            address(0)
        );
    }

    function test_react_rejectsWrongOriginChain() public {
        ProtoMonReactiveBadge.LogRecord memory log = _buildGameWonLog(
            ORIGIN_CHAIN_ID + 1,
            ORIGIN_GAME,
            keccak256("wrong-chain"),
            REWARD_RECIPIENT,
            1
        );

        vm.expectRevert(bytes("ProtoMonReactiveBadge: wrong origin chain"));
        reactiveBadge.react(log);
    }

    function test_react_rejectsWrongOriginContract() public {
        ProtoMonReactiveBadge.LogRecord memory log = _buildGameWonLog(
            ORIGIN_CHAIN_ID,
            address(0x9999),
            keccak256("wrong-contract"),
            REWARD_RECIPIENT,
            1
        );

        vm.expectRevert(bytes("ProtoMonReactiveBadge: wrong origin contract"));
        reactiveBadge.react(log);
    }

    function test_react_rejectsWrongEventTopic() public {
        ProtoMonReactiveBadge.LogRecord memory log = _buildGameWonLog(
            ORIGIN_CHAIN_ID,
            ORIGIN_GAME,
            keccak256("wrong-topic"),
            REWARD_RECIPIENT,
            1
        );
        log.topic_0 = uint256(keccak256("TurnPlayed(bytes32,address,address,uint8,uint8,uint16,uint16,uint16,uint16,bool)"));

        vm.expectRevert(bytes("ProtoMonReactiveBadge: wrong event topic"));
        reactiveBadge.react(log);
    }

    function test_react_emitsCallbackPayloadForGameWon() public {
        bytes32 gameId = keccak256("game-won");
        uint8 bossId = 1;
        ProtoMonReactiveBadge.LogRecord memory log = _buildGameWonLog(
            ORIGIN_CHAIN_ID,
            ORIGIN_GAME,
            gameId,
            REWARD_RECIPIENT,
            bossId
        );

        vm.recordLogs();
        reactiveBadge.react(log);
        VmLog[] memory logs = vm.getRecordedLogs();

        assertEq(uint256(logs.length), 2, "should emit two events");

        bytes32 gameWonReactedSig = keccak256("GameWonReacted(bytes32,address,uint8)");
        assertEq(logs[0].topics[0], gameWonReactedSig, "first event signature mismatch");
        assertEq(logs[0].topics[1], gameId, "reacted gameId mismatch");
        assertEq(
            logs[0].topics[2],
            bytes32(uint256(uint160(REWARD_RECIPIENT))),
            "reacted recipient mismatch"
        );
        assertEq(uint256(abi.decode(logs[0].data, (uint8))), bossId, "reacted bossId mismatch");

        bytes32 callbackSig = keccak256("Callback(uint256,address,uint64,bytes)");
        assertEq(logs[1].topics[0], callbackSig, "callback event signature mismatch");
        assertEq(
            logs[1].topics[1],
            bytes32(DESTINATION_CHAIN_ID),
            "callback chain mismatch"
        );
        assertEq(
            logs[1].topics[2],
            bytes32(uint256(uint160(DESTINATION_BADGE))),
            "callback contract mismatch"
        );
        assertEq(
            logs[1].topics[3],
            bytes32(uint256(CALLBACK_GAS_LIMIT)),
            "callback gas mismatch"
        );

        bytes memory payload = abi.decode(logs[1].data, (bytes));
        bytes memory expectedPayload = abi.encodeWithSignature(
            "reactiveMint(address,bytes32,address,uint8)",
            address(0),
            gameId,
            REWARD_RECIPIENT,
            bossId
        );
        assertEq(payload, expectedPayload, "callback payload mismatch");
    }

    function _buildGameWonLog(
        uint256 chainId,
        address originContract,
        bytes32 gameId,
        address rewardRecipient,
        uint8 bossId
    ) internal pure returns (ProtoMonReactiveBadge.LogRecord memory log) {
        log.chain_id = chainId;
        log._contract = originContract;
        log.topic_0 = uint256(keccak256("GameWon(bytes32,address,address,uint8)"));
        log.topic_1 = uint256(gameId);
        log.topic_2 = uint256(uint160(address(0x5150)));
        log.topic_3 = uint256(uint160(rewardRecipient));
        log.data = abi.encode(bossId);
        log.block_number = 1;
        log.op_code = 0;
        log.block_hash = 0;
        log.tx_hash = 0;
        log.log_index = 0;
    }
}
