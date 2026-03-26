// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ProtoMonGame {
    uint8 public constant BOSS_1_ID = 1;
    uint16 public constant BOSS_1_HP = 150;
    uint8 public constant TOTAL_SLOTS = 13;
    uint16 public constant UPPER_BONUS_TARGET = 63;
    uint16 public constant UPPER_BONUS_DAMAGE = 35;

    struct DealerProof {
        bytes32 gameId;
        address player;
        address rewardRecipient;
        uint8 turn;
        uint8 finalRollCount;
        uint8[5] dice;
        uint64 expiry;
        uint256 chainId;
        address verifyingContract;
        bytes backendSig;
    }

    struct GameSession {
        address player;
        address rewardRecipient;
        uint8 bossId;
        uint8 turn;
        uint16 bossHp;
        uint16 upperSubtotal;
        bool upperBonusClaimed;
        uint16 usedSlotsBitmap;
        bool finished;
        bool won;
    }

    address public immutable dealerSigner;

    mapping(bytes32 => GameSession) public gameSessions;
    mapping(bytes32 => bool) public usedDealerProofs;

    event GameStarted(
        bytes32 indexed gameId,
        address indexed player,
        address indexed rewardRecipient,
        uint8 bossId,
        uint16 bossHp
    );

    event TurnPlayed(
        bytes32 indexed gameId,
        address indexed player,
        address indexed rewardRecipient,
        uint8 turn,
        uint8 slotId,
        uint16 damage,
        uint16 bossHpAfter,
        uint16 upperSubtotalAfter,
        uint16 usedSlotsBitmap,
        bool won
    );

    event GameWon(
        bytes32 indexed gameId,
        address indexed player,
        address indexed rewardRecipient,
        uint8 bossId
    );

    constructor(address dealerSigner_) {
        require(dealerSigner_ != address(0), "ProtoMonGame: dealer signer is zero");
        dealerSigner = dealerSigner_;
    }

    function startGame(bytes32 gameId, address rewardRecipient, uint8 bossId) external {
        require(gameId != bytes32(0), "ProtoMonGame: gameId is zero");
        require(rewardRecipient != address(0), "ProtoMonGame: recipient is zero");
        require(bossId == BOSS_1_ID, "ProtoMonGame: unsupported boss");
        require(gameSessions[gameId].player == address(0), "ProtoMonGame: game exists");

        gameSessions[gameId] = GameSession({
            player: msg.sender,
            rewardRecipient: rewardRecipient,
            bossId: bossId,
            turn: 1,
            bossHp: BOSS_1_HP,
            upperSubtotal: 0,
            upperBonusClaimed: false,
            usedSlotsBitmap: 0,
            finished: false,
            won: false
        });

        emit GameStarted(gameId, msg.sender, rewardRecipient, bossId, BOSS_1_HP);
    }

    function playTurn(bytes32 gameId, uint8 slotId, DealerProof calldata proof) external {
        GameSession storage g = gameSessions[gameId];

        require(g.player != address(0), "ProtoMonGame: game not found");
        require(msg.sender == g.player, "ProtoMonGame: invalid player");
        require(!g.finished, "ProtoMonGame: game finished");
        require(slotId < TOTAL_SLOTS, "ProtoMonGame: invalid slot");
        require(!_isSlotUsed(g.usedSlotsBitmap, slotId), "ProtoMonGame: slot already used");

        require(proof.gameId == gameId, "ProtoMonGame: proof game mismatch");
        require(proof.player == msg.sender, "ProtoMonGame: proof player mismatch");
        require(
            proof.rewardRecipient == g.rewardRecipient,
            "ProtoMonGame: proof recipient mismatch"
        );
        require(proof.turn == g.turn, "ProtoMonGame: proof turn mismatch");
        require(proof.finalRollCount >= 1 && proof.finalRollCount <= 3, "ProtoMonGame: invalid roll count");
        require(proof.expiry >= block.timestamp, "ProtoMonGame: proof expired");
        require(proof.chainId == block.chainid, "ProtoMonGame: invalid chain");
        require(
            proof.verifyingContract == address(this),
            "ProtoMonGame: invalid verifying contract"
        );
        require(_validateDice(proof.dice), "ProtoMonGame: invalid dice");

        bytes32 proofHash = _hashDealerProof(proof);
        require(!usedDealerProofs[proofHash], "ProtoMonGame: proof already used");
        require(_verifyDealerProof(proofHash, proof.backendSig), "ProtoMonGame: bad dealer sig");

        (
            uint16 damage,
            uint16 nextUpperSubtotal,
            bool nextUpperBonusClaimed
        ) = _computeDamage(slotId, proof.dice, g);

        g.usedSlotsBitmap = _markSlotUsed(g.usedSlotsBitmap, slotId);
        g.upperSubtotal = nextUpperSubtotal;
        g.upperBonusClaimed = nextUpperBonusClaimed;
        g.bossHp = g.bossHp > damage ? g.bossHp - damage : 0;

        if (g.bossHp == 0) {
            g.finished = true;
            g.won = true;
        } else if (_countUsedSlots(g.usedSlotsBitmap) == TOTAL_SLOTS) {
            g.finished = true;
            g.won = false;
        } else {
            g.turn += 1;
        }

        usedDealerProofs[proofHash] = true;

        emit TurnPlayed(
            gameId,
            g.player,
            g.rewardRecipient,
            proof.turn,
            slotId,
            damage,
            g.bossHp,
            g.upperSubtotal,
            g.usedSlotsBitmap,
            g.won
        );

        if (g.won) {
            emit GameWon(gameId, g.player, g.rewardRecipient, g.bossId);
        }
    }

    function getGame(bytes32 gameId) external view returns (GameSession memory) {
        return gameSessions[gameId];
    }

    function previewScore(
        uint8 slotId,
        uint8[5] calldata dice
    ) external pure returns (uint16 slotScore, bool qualifies) {
        require(slotId < TOTAL_SLOTS, "ProtoMonGame: invalid slot");
        require(_validateDice(dice), "ProtoMonGame: invalid dice");

        if (slotId <= 5) {
            slotScore = _scoreUpper(slotId, dice);
            qualifies = slotScore > 0;
            return (slotScore, qualifies);
        }

        return _scoreLower(slotId, dice);
    }

    function previewDamageWithState(
        uint8 slotId,
        uint8[5] calldata dice,
        uint16 upperSubtotal,
        bool upperBonusClaimed
    ) external pure returns (uint16 damage, uint16 nextUpperSubtotal, bool nextUpperBonusClaimed) {
        require(slotId < TOTAL_SLOTS, "ProtoMonGame: invalid slot");
        require(_validateDice(dice), "ProtoMonGame: invalid dice");

        nextUpperSubtotal = upperSubtotal;
        nextUpperBonusClaimed = upperBonusClaimed;

        if (slotId <= 5) {
            uint16 slotScore = _scoreUpper(slotId, dice);
            nextUpperSubtotal = upperSubtotal + slotScore;

            if (!upperBonusClaimed && nextUpperSubtotal >= UPPER_BONUS_TARGET) {
                return (slotScore + UPPER_BONUS_DAMAGE, nextUpperSubtotal, true);
            }

            return (slotScore, nextUpperSubtotal, nextUpperBonusClaimed);
        }

        (damage, ) = _scoreLower(slotId, dice);
        return (damage, nextUpperSubtotal, nextUpperBonusClaimed);
    }

    function _computeDamage(
        uint8 slotId,
        uint8[5] calldata dice,
        GameSession storage g
    ) internal view returns (uint16 damage, uint16 nextUpperSubtotal, bool nextUpperBonusClaimed) {
        uint16 slotScore;

        nextUpperSubtotal = g.upperSubtotal;
        nextUpperBonusClaimed = g.upperBonusClaimed;

        if (slotId <= 5) {
            slotScore = _scoreUpper(slotId, dice);
            nextUpperSubtotal = g.upperSubtotal + slotScore;

            if (!g.upperBonusClaimed && nextUpperSubtotal >= UPPER_BONUS_TARGET) {
                damage = slotScore + UPPER_BONUS_DAMAGE;
                nextUpperBonusClaimed = true;
                return (damage, nextUpperSubtotal, nextUpperBonusClaimed);
            }
        } else {
            (slotScore, ) = _scoreLower(slotId, dice);
        }

        return (slotScore, nextUpperSubtotal, nextUpperBonusClaimed);
    }

    function _scoreUpper(uint8 slotId, uint8[5] calldata dice) internal pure returns (uint16 score) {
        uint8 faceValue = slotId + 1;

        for (uint256 i = 0; i < dice.length; i++) {
            if (dice[i] == faceValue) {
                score += faceValue;
            }
        }
    }

    function _scoreLower(
        uint8 slotId,
        uint8[5] calldata dice
    ) internal pure returns (uint16 score, bool qualifies) {
        uint8[7] memory counts = _countFaces(dice);
        uint8 maxCount = _maxCount(counts);
        uint16 total = _sumDice(dice);

        if (slotId == 6) {
            qualifies = maxCount >= 3;
            return (qualifies ? total : 0, qualifies);
        }

        if (slotId == 7) {
            qualifies = maxCount >= 4;
            return (qualifies ? total : 0, qualifies);
        }

        if (slotId == 8) {
            qualifies = _isFullHouse(counts);
            return (qualifies ? 25 : 0, qualifies);
        }

        if (slotId == 9) {
            qualifies = _isSmallStraight(counts);
            return (qualifies ? 30 : 0, qualifies);
        }

        if (slotId == 10) {
            qualifies = _isLargeStraight(counts);
            return (qualifies ? 40 : 0, qualifies);
        }

        if (slotId == 11) {
            qualifies = maxCount == 5;
            return (qualifies ? 50 : 0, qualifies);
        }

        if (slotId == 12) {
            return (total, true);
        }

        revert("ProtoMonGame: invalid lower slot");
    }

    function _isSmallStraight(uint8[7] memory counts) internal pure returns (bool) {
        return
            _hasSequence(counts, 1, 4) ||
            _hasSequence(counts, 2, 5) ||
            _hasSequence(counts, 3, 6);
    }

    function _isLargeStraight(uint8[7] memory counts) internal pure returns (bool) {
        return _hasSequence(counts, 1, 5) || _hasSequence(counts, 2, 6);
    }

    function _isFullHouse(uint8[7] memory counts) internal pure returns (bool) {
        bool hasThree;
        bool hasTwo;

        for (uint256 face = 1; face <= 6; face++) {
            if (counts[face] == 3) {
                hasThree = true;
            } else if (counts[face] == 2) {
                hasTwo = true;
            }
        }

        return hasThree && hasTwo;
    }

    function _hasSequence(
        uint8[7] memory counts,
        uint8 start,
        uint8 end
    ) internal pure returns (bool) {
        for (uint8 face = start; face <= end; face++) {
            if (counts[face] == 0) {
                return false;
            }
        }

        return true;
    }

    function _countFaces(uint8[5] calldata dice) internal pure returns (uint8[7] memory counts) {
        for (uint256 i = 0; i < dice.length; i++) {
            counts[dice[i]] += 1;
        }
    }

    function _sumDice(uint8[5] calldata dice) internal pure returns (uint16 total) {
        for (uint256 i = 0; i < dice.length; i++) {
            total += dice[i];
        }
    }

    function _maxCount(uint8[7] memory counts) internal pure returns (uint8 maxCount) {
        for (uint256 face = 1; face <= 6; face++) {
            if (counts[face] > maxCount) {
                maxCount = counts[face];
            }
        }
    }

    function _validateDice(uint8[5] calldata dice) internal pure returns (bool) {
        for (uint256 i = 0; i < dice.length; i++) {
            if (dice[i] < 1 || dice[i] > 6) {
                return false;
            }
        }

        return true;
    }

    function _isSlotUsed(uint16 usedSlotsBitmap, uint8 slotId) internal pure returns (bool) {
        return ((usedSlotsBitmap >> slotId) & 1) == 1;
    }

    function _markSlotUsed(uint16 usedSlotsBitmap, uint8 slotId) internal pure returns (uint16) {
        return usedSlotsBitmap | (uint16(1) << slotId);
    }

    function _countUsedSlots(uint16 usedSlotsBitmap) internal pure returns (uint8 count) {
        uint16 bitmap = usedSlotsBitmap;

        while (bitmap != 0) {
            bitmap &= (bitmap - 1);
            count += 1;
        }
    }

    function _hashDealerProof(DealerProof calldata proof) internal pure returns (bytes32) {
        return keccak256(
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
    }

    function _verifyDealerProof(
        bytes32 proofHash,
        bytes calldata signature
    ) internal view returns (bool) {
        bytes32 digest = _toEthSignedMessageHash(proofHash);
        bytes memory signatureCopy = signature;
        return _recoverSigner(digest, signatureCopy) == dealerSigner;
    }

    function _toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }

    function _recoverSigner(bytes32 digest, bytes memory signature) internal pure returns (address) {
        if (signature.length != 65) {
            return address(0);
        }

        bytes32 r;
        bytes32 s;
        uint8 v;

        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        if (v < 27) {
            v += 27;
        }

        if (v != 27 && v != 28) {
            return address(0);
        }

        return ecrecover(digest, v, r, s);
    }
}
