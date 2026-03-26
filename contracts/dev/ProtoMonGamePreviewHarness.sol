// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {ProtoMonGame} from "../origin/ProtoMonGame.sol";

contract ProtoMonGamePreviewHarness {
    ProtoMonGame public immutable game;
    uint8 internal constant TOTAL_SLOTS = 13;
    uint8 internal constant TOTAL_UPPER_SLOTS = 6;

    constructor(address game_) {
        require(game_ != address(0), "ProtoMonGamePreviewHarness: game is zero");
        game = ProtoMonGame(game_);
    }

    function previewAllScores(
        uint8[5] calldata dice
    ) external view returns (uint16[13] memory scores, bool[13] memory qualifies) {
        for (uint8 slotId = 0; slotId < TOTAL_SLOTS; slotId++) {
            (scores[slotId], qualifies[slotId]) = game.previewScore(slotId, dice);
        }
    }

    function previewUpperState(
        uint8[5] calldata dice,
        uint16 upperSubtotal,
        bool upperBonusClaimed
    )
        external
        view
        returns (
            uint16[6] memory slotScores,
            uint16[6] memory totalDamages,
            uint16[6] memory nextUpperSubtotals,
            bool[6] memory nextUpperBonusClaimedFlags
        )
    {
        for (uint8 slotId = 0; slotId < TOTAL_UPPER_SLOTS; slotId++) {
            (slotScores[slotId], ) = game.previewScore(slotId, dice);
            (
                totalDamages[slotId],
                nextUpperSubtotals[slotId],
                nextUpperBonusClaimedFlags[slotId]
            ) = game.previewDamageWithState(slotId, dice, upperSubtotal, upperBonusClaimed);
        }
    }
}
