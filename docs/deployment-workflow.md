# ProtoMon Minimum Deployment Workflow

## Purpose

This runbook describes the minimum deployment order for the current hackathon workflow:

1. Origin game contract
2. Destination badge contract
3. Reactive contract
4. Destination authorized-RVM-ID backfill

This document is intentionally narrow. It exists to prevent deployment-order mistakes while the project is still moving quickly.

## Current Workflow Boundary

The minimum intended chain flow is:

1. Frontend / backend finalize a turn
2. Frontend submits `playTurn(...)` to `ProtoMonGame`
3. `ProtoMonGame` emits `GameWon` on victory
4. `ProtoMonReactiveBadge` reacts to `GameWon`
5. Reactive callback calls `ProtoMonBadge.reactiveMint(...)`

## Contracts

- Origin: `contracts/origin/ProtoMonGame.sol`
- Destination: `contracts/destination/ProtoMonBadge.sol`
- Reactive: `contracts/reactive/ProtoMonReactiveBadge.sol`

## Required Environment Variables

### Origin Deployment

- `PRIVATE_KEY`
- `DEALER_SIGNER`
- `RPC_URL`

Used by:
- `script/deploy-origin.s.sol`

### Destination Deployment

- `PRIVATE_KEY`
- `CALLBACK_PROXY`
- `RPC_URL`

Used by:
- `script/deploy-destination.s.sol`

### Reactive Deployment

- `PRIVATE_KEY`
- `ORIGIN_CHAIN_ID`
- `ORIGIN_CONTRACT`
- `DESTINATION_CHAIN_ID`
- `DESTINATION_CONTRACT`
- `CALLBACK_GAS_LIMIT`
- `CALLBACK_PROXY`
- `REACTIVE_INITIAL_FUNDING_WEI`
- `RPC_URL`

Used by:
- `script/deploy-reactive.s.sol`

## Deployment Order

### Step 1. Deploy Origin

Deploy:
- `ProtoMonGame`

Inputs:
- `DEALER_SIGNER`

Output to record:
- origin contract address

Why first:
- The Reactive contract depends on the origin contract address.

### Step 2. Deploy Destination

Deploy:
- `ProtoMonBadge`

Inputs:
- `CALLBACK_PROXY`

Output to record:
- destination contract address

Why second:
- The Reactive contract depends on the destination contract address.

### Step 3. Deploy Reactive

Deploy:
- `ProtoMonReactiveBadge`

Inputs:
- `ORIGIN_CHAIN_ID`
- `ORIGIN_CONTRACT`
- `DESTINATION_CHAIN_ID`
- `DESTINATION_CONTRACT`
- `CALLBACK_GAS_LIMIT`
- `CALLBACK_PROXY`
- `REACTIVE_INITIAL_FUNDING_WEI`

Output to record:
- reactive contract address

Why third:
- It needs both origin and destination addresses already deployed.
- For real Lasna deployment, fund the contract at deploy time so constructor-time subscription registration has an initial REACT balance.

### Step 4. Backfill Reactive Address Into Destination

Call on `ProtoMonBadge`:
- `setAuthorizedRvmId(authorizedRvmId)`

Why this step exists:
- It removes the deployment cycle between destination and reactive.
- Destination validates the callback source by `rvmId`.
- The required `authorizedRvmId` is the Reactive-side callback identity, not the plain deployed contract address.
- In practice, obtain it from Reactive address mapping after deployment.

## Address Recording

Every deployment must be copied into:
- `docs/addresses.md`

At minimum record:
- origin chain id
- origin contract address
- destination chain id
- destination contract address
- reactive contract address
- callback proxy address
- dealer signer address

## Transaction Recording

Every important transaction must be copied into:
- `docs/tx-hashes.md`

At minimum record:
- origin deployment tx
- destination deployment tx
- reactive deployment tx
- destination `setAuthorizedRvmId(...)` tx
- one successful game `playTurn(...)` tx
- one Reactive callback / destination reward tx

## Current Gaps After Deployment

Even after all three contracts are deployed, the workflow is not complete until:

1. backend finalize proof generation matches the origin contract verifier
2. frontend `CAST` calls the origin contract instead of remaining local-only
3. workflow transactions are collected and documented

## Handoff Note

This runbook documents the current minimum flow only.

If the deployment interfaces change, update:
- this file
- `docs/implementation-log.md`
- deployment scripts
