// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract ProtoMonBadge {
    mapping(bytes32 => bool) public minted;
    mapping(bytes32 => address) public badgeRecipient;
    mapping(bytes32 => uint8) public badgeBossId;

    address public owner;
    address public callbackProxy;
    address public reactiveContract;

    event BadgeMinted(bytes32 indexed gameId, address indexed recipient, uint8 bossId);
    event ReactiveContractUpdated(address indexed newReactiveContract);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "ProtoMonBadge: only owner");
        _;
    }

    constructor(address callbackProxy_) {
        require(callbackProxy_ != address(0), "ProtoMonBadge: callback proxy is zero");
        owner = msg.sender;
        callbackProxy = callbackProxy_;
    }

    function reactiveMint(address rvmId, bytes32 gameId, address recipient, uint8 bossId) external {
        require(msg.sender == callbackProxy, "ProtoMonBadge: invalid callback sender");
        require(rvmId == reactiveContract, "ProtoMonBadge: invalid rvmId");
        require(gameId != bytes32(0), "ProtoMonBadge: gameId is zero");
        require(recipient != address(0), "ProtoMonBadge: recipient is zero");
        require(!minted[gameId], "ProtoMonBadge: badge already minted");

        minted[gameId] = true;
        badgeRecipient[gameId] = recipient;
        badgeBossId[gameId] = bossId;

        emit BadgeMinted(gameId, recipient, bossId);
    }

    function setReactiveContract(address newReactiveContract) external onlyOwner {
        require(newReactiveContract != address(0), "ProtoMonBadge: reactive contract is zero");

        reactiveContract = newReactiveContract;
        emit ReactiveContractUpdated(newReactiveContract);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ProtoMonBadge: owner is zero");

        address previousOwner = owner;
        owner = newOwner;

        emit OwnershipTransferred(previousOwner, newOwner);
    }
}
