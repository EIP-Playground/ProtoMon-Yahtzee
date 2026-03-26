// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ProtoMonReactiveBadge {
    struct LogRecord {
        uint256 chain_id;
        address _contract;
        uint256 topic_0;
        uint256 topic_1;
        uint256 topic_2;
        uint256 topic_3;
        bytes data;
        uint256 block_number;
        uint256 op_code;
        uint256 block_hash;
        uint256 tx_hash;
        uint256 log_index;
    }

    uint256 public immutable originChainId;
    address public immutable originGame;
    uint256 public immutable destinationChainId;
    address public immutable destinationBadge;
    uint64 public immutable callbackGasLimit;
    address public immutable callbackProxy;

    uint256 public constant GAME_WON_TOPIC_0 =
        uint256(keccak256("GameWon(bytes32,address,address,uint8)"));

    event Callback(
        uint256 indexed chain_id,
        address indexed _contract,
        uint64 indexed gas_limit,
        bytes payload
    );

    event GameWonReacted(bytes32 indexed gameId, address indexed rewardRecipient, uint8 bossId);

    constructor(
        uint256 originChainId_,
        address originGame_,
        uint256 destinationChainId_,
        address destinationBadge_,
        uint64 callbackGasLimit_,
        address callbackProxy_
    ) {
        require(originChainId_ != 0, "ProtoMonReactiveBadge: invalid origin chain");
        require(originGame_ != address(0), "ProtoMonReactiveBadge: origin game is zero");
        require(destinationChainId_ != 0, "ProtoMonReactiveBadge: invalid destination chain");
        require(
            destinationBadge_ != address(0),
            "ProtoMonReactiveBadge: destination badge is zero"
        );
        require(callbackGasLimit_ != 0, "ProtoMonReactiveBadge: callback gas is zero");
        require(callbackProxy_ != address(0), "ProtoMonReactiveBadge: callback proxy is zero");

        originChainId = originChainId_;
        originGame = originGame_;
        destinationChainId = destinationChainId_;
        destinationBadge = destinationBadge_;
        callbackGasLimit = callbackGasLimit_;
        callbackProxy = callbackProxy_;
    }

    function react(LogRecord calldata log) external {
        require(log.chain_id == originChainId, "ProtoMonReactiveBadge: wrong origin chain");
        require(log._contract == originGame, "ProtoMonReactiveBadge: wrong origin contract");
        require(log.topic_0 == GAME_WON_TOPIC_0, "ProtoMonReactiveBadge: wrong event topic");

        bytes32 gameId = bytes32(log.topic_1);
        address rewardRecipient = address(uint160(log.topic_3));
        uint8 bossId = abi.decode(log.data, (uint8));

        bytes memory payload = abi.encodeWithSignature(
            "reactiveMint(address,bytes32,address,uint8)",
            address(0),
            gameId,
            rewardRecipient,
            bossId
        );

        emit GameWonReacted(gameId, rewardRecipient, bossId);
        emit Callback(destinationChainId, destinationBadge, callbackGasLimit, payload);
    }
}
