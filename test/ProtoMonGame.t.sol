// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtoMonGame} from "../contracts/origin/ProtoMonGame.sol";
import {MinimalTest} from "./utils/MinimalTest.sol";

contract ProtoMonGameTest is MinimalTest {
    uint256 internal constant DEALER_PRIVATE_KEY = 0xA11CE;

    ProtoMonGame internal game;
    address internal dealerSigner;
    address internal defaultRewardRecipient;

    function setUp() public {
        dealerSigner = vm.addr(DEALER_PRIVATE_KEY);
        defaultRewardRecipient = address(0xBEEF);
        game = new ProtoMonGame(dealerSigner);
    }

    function test_previewScore_upperSlot() public view {
        uint8[5] memory dice = [uint8(1), 1, 3, 4, 6];
        (uint16 score, bool qualifies) = game.previewScore(0, dice);

        assertEq(score, 2, "upper slot score mismatch");
        assertEq(qualifies, true, "upper slot qualify mismatch");
    }

    function test_previewScore_lowerSlots() public view {
        uint8[5] memory threeKindDice = [uint8(2), 2, 2, 4, 5];
        uint8[5] memory fullHouseDice = [uint8(3), 3, 3, 5, 5];
        uint8[5] memory largeStraightDice = [uint8(2), 3, 4, 5, 6];
        uint8[5] memory invalidFullHouseDice = [uint8(1), 1, 1, 1, 2];

        (uint16 threeKindScore, bool threeKindQualifies) = game.previewScore(6, threeKindDice);
        (uint16 fullHouseScore, bool fullHouseQualifies) = game.previewScore(8, fullHouseDice);
        (uint16 largeStraightScore, bool largeStraightQualifies) = game.previewScore(
            10,
            largeStraightDice
        );
        (uint16 invalidFullHouseScore, bool invalidFullHouseQualifies) = game.previewScore(
            8,
            invalidFullHouseDice
        );

        assertEq(threeKindScore, 15, "three kind score mismatch");
        assertEq(threeKindQualifies, true, "three kind qualify mismatch");
        assertEq(fullHouseScore, 25, "full house score mismatch");
        assertEq(fullHouseQualifies, true, "full house qualify mismatch");
        assertEq(largeStraightScore, 40, "large straight score mismatch");
        assertEq(largeStraightQualifies, true, "large straight qualify mismatch");
        assertEq(invalidFullHouseScore, 0, "invalid lower slot should score zero");
        assertEq(invalidFullHouseQualifies, false, "invalid lower slot should not qualify");
    }

    function test_previewDamageWithState_triggersUpperBonusOnce() public view {
        uint8[5] memory onesDice = [uint8(1), 1, 3, 4, 5];
        uint8[5] memory sixesDice = [uint8(6), 6, 1, 2, 3];

        (
            uint16 firstDamage,
            uint16 firstUpperSubtotal,
            bool firstUpperBonusClaimed
        ) = game.previewDamageWithState(0, onesDice, 61, false);

        (
            uint16 secondDamage,
            uint16 secondUpperSubtotal,
            bool secondUpperBonusClaimed
        ) = game.previewDamageWithState(5, sixesDice, 63, true);

        assertEq(firstDamage, 37, "upper bonus damage mismatch");
        assertEq(firstUpperSubtotal, 63, "upper subtotal after bonus mismatch");
        assertEq(firstUpperBonusClaimed, true, "upper bonus should be claimed");
        assertEq(secondDamage, 12, "bonus should not trigger twice");
        assertEq(secondUpperSubtotal, 75, "upper subtotal should continue to accumulate");
        assertEq(secondUpperBonusClaimed, true, "bonus claimed state should persist");
    }

    function test_startGame_initializesSession() public {
        bytes32 gameId = keccak256("game-start");

        game.startGame(gameId, defaultRewardRecipient, 1);

        ProtoMonGame.GameSession memory session = game.getGame(gameId);

        assertEq(session.player, address(this), "player mismatch");
        assertEq(session.rewardRecipient, defaultRewardRecipient, "recipient mismatch");
        assertEq(uint256(session.bossId), 1, "boss id mismatch");
        assertEq(uint256(session.turn), 1, "turn mismatch");
        assertEq(uint256(session.bossHp), 150, "boss hp mismatch");
        assertEq(uint256(session.upperSubtotal), 0, "upper subtotal mismatch");
        assertEq(session.upperBonusClaimed, false, "upper bonus claimed mismatch");
        assertEq(uint256(session.usedSlotsBitmap), 0, "used slots bitmap mismatch");
        assertEq(session.finished, false, "finished mismatch");
        assertEq(session.won, false, "won mismatch");
    }

    function test_startGame_rejectsDuplicateGameId() public {
        bytes32 gameId = keccak256("game-duplicate");

        game.startGame(gameId, defaultRewardRecipient, 1);

        vm.expectRevert(bytes("ProtoMonGame: game exists"));
        game.startGame(gameId, defaultRewardRecipient, 1);
    }

    function test_playTurn_marksSlotAndAdvancesTurn() public {
        bytes32 gameId = keccak256("game-play");
        uint8[5] memory dice = [uint8(2), 2, 2, 4, 5];

        game.startGame(gameId, defaultRewardRecipient, 1);

        ProtoMonGame.DealerProof memory proof = _buildProof({
            gameId: gameId,
            player: address(this),
            rewardRecipient: defaultRewardRecipient,
            turn: 1,
            finalRollCount: 1,
            dice: dice
        });

        game.playTurn(gameId, 6, proof);

        ProtoMonGame.GameSession memory session = game.getGame(gameId);

        assertEq(uint256(session.usedSlotsBitmap), uint256(1 << 6), "slot should be marked used");
        assertEq(uint256(session.bossHp), 135, "boss hp should decrease by score");
        assertEq(uint256(session.turn), 2, "turn should advance");
        assertEq(session.finished, false, "game should continue");
        assertEq(session.won, false, "game should not be won");
    }

    function test_playTurn_rejectsWrongPlayer() public {
        bytes32 gameId = keccak256("game-wrong-player");
        address player = address(0xCAFE);
        uint8[5] memory dice = [uint8(1), 2, 3, 4, 5];

        vm.prank(player);
        game.startGame(gameId, defaultRewardRecipient, 1);

        ProtoMonGame.DealerProof memory proof = _buildProof({
            gameId: gameId,
            player: player,
            rewardRecipient: defaultRewardRecipient,
            turn: 1,
            finalRollCount: 1,
            dice: dice
        });

        vm.expectRevert(bytes("ProtoMonGame: invalid player"));
        game.playTurn(gameId, 12, proof);
    }

    function _buildProof(
        bytes32 gameId,
        address player,
        address rewardRecipient,
        uint8 turn,
        uint8 finalRollCount,
        uint8[5] memory dice
    ) internal returns (ProtoMonGame.DealerProof memory proof) {
        proof = ProtoMonGame.DealerProof({
            gameId: gameId,
            player: player,
            rewardRecipient: rewardRecipient,
            turn: turn,
            finalRollCount: finalRollCount,
            dice: dice,
            expiry: uint64(block.timestamp + 1 days),
            chainId: block.chainid,
            verifyingContract: address(game),
            backendSig: ""
        });

        bytes32 proofHash = keccak256(
            abi.encode(
                proof.gameId,
                proof.player,
                proof.rewardRecipient,
                proof.turn,
                proof.finalRollCount,
                proof.dice,
                proof.expiry,
                proof.chainId,
                proof.verifyingContract
            )
        );

        bytes32 digest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", proofHash)
        );

        (uint8 v, bytes32 r, bytes32 s) = vm.sign(DEALER_PRIVATE_KEY, digest);
        proof.backendSig = abi.encodePacked(r, s, v);
    }

    function test_playTurn_rejectsReplayWithStaleTurn() public {
        bytes32 gameId = keccak256("game-proof-reuse");
        uint8[5] memory dice = [uint8(2), 2, 2, 4, 5];

        game.startGame(gameId, defaultRewardRecipient, 1);

        ProtoMonGame.DealerProof memory proof = _buildProof({
            gameId: gameId,
            player: address(this),
            rewardRecipient: defaultRewardRecipient,
            turn: 1,
            finalRollCount: 1,
            dice: dice
        });

        game.playTurn(gameId, 6, proof);

        vm.expectRevert(bytes("ProtoMonGame: proof turn mismatch"));
        game.playTurn(gameId, 7, proof);
    }

    function test_playTurn_rejectsReusedSlot() public {
        bytes32 gameId = keccak256("game-slot-reuse");
        uint8[5] memory diceTurn1 = [uint8(1), 2, 3, 4, 5];
        uint8[5] memory diceTurn2 = [uint8(1), 1, 1, 4, 5];

        game.startGame(gameId, defaultRewardRecipient, 1);

        ProtoMonGame.DealerProof memory proofTurn1 = _buildProof({
            gameId: gameId,
            player: address(this),
            rewardRecipient: defaultRewardRecipient,
            turn: 1,
            finalRollCount: 1,
            dice: diceTurn1
        });

        game.playTurn(gameId, 12, proofTurn1);

        ProtoMonGame.DealerProof memory proofTurn2 = _buildProof({
            gameId: gameId,
            player: address(this),
            rewardRecipient: defaultRewardRecipient,
            turn: 2,
            finalRollCount: 1,
            dice: diceTurn2
        });

        vm.expectRevert(bytes("ProtoMonGame: slot already used"));
        game.playTurn(gameId, 12, proofTurn2);
    }

    function test_playTurn_rejectsExpiredProof() public {
        bytes32 gameId = keccak256("game-proof-expired");
        uint8[5] memory dice = [uint8(1), 2, 3, 4, 5];

        game.startGame(gameId, defaultRewardRecipient, 1);

        ProtoMonGame.DealerProof memory proof = _buildProof({
            gameId: gameId,
            player: address(this),
            rewardRecipient: defaultRewardRecipient,
            turn: 1,
            finalRollCount: 1,
            dice: dice
        });

        proof.expiry = uint64(block.timestamp - 1);

        bytes32 proofHash = keccak256(
            abi.encode(
                proof.gameId,
                proof.player,
                proof.rewardRecipient,
                proof.turn,
                proof.finalRollCount,
                proof.dice,
                proof.expiry,
                proof.chainId,
                proof.verifyingContract
            )
        );
        bytes32 digest = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", proofHash)
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(DEALER_PRIVATE_KEY, digest);
        proof.backendSig = abi.encodePacked(r, s, v);

        vm.expectRevert(bytes("ProtoMonGame: proof expired"));
        game.playTurn(gameId, 12, proof);
    }

    function test_playTurn_marksWinOnBossKill() public {
        bytes32 gameId = keccak256("game-boss-kill");

        game.startGame(gameId, defaultRewardRecipient, 1);
        _playTurn(
            gameId,
            11,
            [uint8(6), 6, 6, 6, 6],
            1
        );
        _playTurn(
            gameId,
            10,
            [uint8(2), 3, 4, 5, 6],
            2
        );
        _playTurn(
            gameId,
            9,
            [uint8(1), 2, 3, 4, 6],
            3
        );
        _playTurn(
            gameId,
            12,
            [uint8(6), 6, 6, 6, 6],
            4
        );

        ProtoMonGame.GameSession memory session = game.getGame(gameId);

        assertEq(uint256(session.bossHp), 0, "boss hp should reach zero");
        assertEq(session.finished, true, "game should be finished");
        assertEq(session.won, true, "game should be won");
    }

    function test_playTurn_finishesLossOnThirteenthSlot() public {
        bytes32 gameId = keccak256("game-thirteen-slot-loss");

        game.startGame(gameId, defaultRewardRecipient, 1);

        for (uint8 slotId = 0; slotId < 12; slotId++) {
            _playTurn(gameId, slotId, [uint8(1), 2, 3, 4, 5], slotId + 1);
        }

        _playTurn(gameId, 12, [uint8(1), 2, 3, 4, 5], 13);

        ProtoMonGame.GameSession memory session = game.getGame(gameId);

        assertEq(session.finished, true, "game should be finished after 13 slots");
        assertEq(session.won, false, "game should be lost if boss survives");
        assertTrue(session.bossHp > 0, "boss should still be alive");
    }

    function _playTurn(
        bytes32 gameId,
        uint8 slotId,
        uint8[5] memory dice,
        uint8 turn
    ) internal {
        ProtoMonGame.DealerProof memory proof = _buildProof({
            gameId: gameId,
            player: address(this),
            rewardRecipient: defaultRewardRecipient,
            turn: turn,
            finalRollCount: 1,
            dice: dice
        });

        game.playTurn(gameId, slotId, proof);
    }
}
