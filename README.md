# xport-demo

Cross-chain token transfer demo (Solana ↔ Wanchain gwan) built on the WMB / Solana Gate-Way message channel.

**Language:** English | [中文](README.zh-CN.md)

---

## English

### 1. Overview

`xport-demo` is a cross-chain token transfer demo showing value moving between **Solana devnet** and the **Wanchain gwan testnet**:

| Direction | Entry point | On-chain action |
| --- | --- | --- |
| Solana → WAN | Solana instruction `cross_token_to_evm` | Emits a message through the Solana Gate-Way program (`out_bound_call`); the WAN contract `ERC20TokenRemote` receives the `cross_token` message and **mints** the same amount of `WSUSDC` (6 decimals) |
| WAN → Solana | `ERC20TokenRemote.send(to, amount)` | **Burns** local tokens and sends an `unlockToken` message through the WMB gateway; Solana `wmb_receive` verifies the source chain/program and message type before processing the unlock |

Message safety relies on the **peer whitelist** on both sides (the `peer_chain_id` + `peer_app_address` stored in the Solana `Settings` account, and `trustedRemotes` on the EVM side).

### 2. Repository layout

```text
xport-demo/
├── README.md / README.zh-CN.md
├── evm-token-transfer/            # WAN (EVM) side – Hardhat project
│   ├── contracts/
│   │   ├── ERC20TokenRemote.sol   # cross-chain token (mint/burn + messaging)
│   │   ├── WmbAppNoEvm.sol        # non-EVM messaging base (whitelist + replay guard)
│   │   └── interfaces/IWmbReceiverNonEvm.sol
│   ├── scripts/deploy_rec20tokenremote.js
│   ├── hardhat.config.js          # networks: wantest(999) / wanmain(888)
│   └── evm-cli/                   # on-chain call & event-parsing scripts (numbered)
└── sol-transfer-token/            # Solana side – Anchor 0.31.1 project
    ├── programs/sol-transfer-token/src/
    │   ├── lib.rs                 # instructions: initialize_settings / update_peer /
    │   │                           #   cross_token_to_evm / out_bound_call / wmb_receive
    │   ├── message_data.rs        # cross-chain message ABI/Borsh codec
    │   └── constants.rs / errors.rs / events.rs / utils/
    ├── 0_del_target.sh … 4_update_idl.sh   # clean, build, deploy, print id, sync IDL
    ├── sol-cli/                   # recommended CLI scripts (numbered)
    ├── test_app/                  # earlier integration scripts (partly outdated, see §8)
    ├── tests/                     # anchor tests (still scaffolding samples)
    └── Anchor.toml
```

### 3. Deployment information

**Solana side**

| Item | Value |
| --- | --- |
| program address | `7sVC9w6RuxBmR3eoSsKfTBvDmxAYJyMkk4fC5mgNovQQ` |
| chainId (WMB network id) | `2147484149` |
| RPC | `https://api.devnet.solana.com` (devnet) |
| Gate-Way program | `9J17hVJXCcMsD1E7Kv5yNKEgQAhwcu4NvtPQvXkgesiV` |
| admin board (owner of the ConfigData PDA) | `7jYCM8k5Nvwg5vyPpLk2yjivQhexPDMXuK8CSbUKqL6B` |
| USDC (devnet mint) | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |

**WAN (EVM) side**

| Item | Value |
| --- | --- |
| contract address | `0xCB96D72410742A294dFa834Ec41E8e30b0a7Caf4` |
| chainId (WMB network id) | `2153201998` |
| EVM chainId / RPC | `999` (wantest) / `https://gwan-ssl.wandevs.org:46891` |
| WMB Gateway | `0xDDddd58428706FEdD013b3A761c6E40723a7911d` |
| token | `wrap solana usdc` / `WSUSDC`, 6 decimals |
| peer (home) | Solana program `7sVC9w6RuxBmR3eoSsKfTBvDmxAYJyMkk4fC5mgNovQQ`, chainId `2147484149` |

> All of the above are **testnet/demo settings** — do not reuse them in production.

### 4. Prerequisites

- Node.js (18+ recommended) with `npm` / `yarn`
- Rust toolchain + [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/) `0.31.1` (matches `@coral-xyz/anchor` in `package.json`)
- Hardhat (bundled with `evm-token-transfer` dependencies)

### 5. Build & deploy

**Solana side** (`sol-transfer-token/`)

```bash
yarn install                 # or npm install
./1_build_app.sh             # anchor build
./2_deploy.sh                # anchor deploy  (Anchor.toml cluster defaults to devnet)
./3_get_app_address.sh       # print the program address
./4_update_idl.sh            # sync the IDL (see §8)
```

**WAN side** (`evm-token-transfer/`)

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy_rec20tokenremote.js --network wantest
```

Constructor arguments come from `evm-cli/config.js`: `gateWayScAddr`, `SolScAddr`, `solChainID`.

### 6. Configure the peer address (required)

> **Requirement: each project must be configured with the address of its counterparty.**

- **Solana side** — the `settings` PDA (`["settings"]`) stores the peer chain id and contract address
  - Initialize: `initialize_settings(gateway_program, peer_chain_id, peer_app_address)`
  - Update: `update_peer(peer_chain_id, peer_app_address)` (authority only)
  - Scripts: `sol-cli/10_setting_init.js`, `sol-cli/11_setting_get.js`
  - `peer_app_address` is the **20-byte** WAN contract address
- **WAN side** — `trustedRemotes[chainId][address]` whitelist plus `homeAddress` / `homeChainId`
  - `setTrustedRemote(chainId, solanaProgramBytes, true)` (owner)
  - `updateHomeAddress(bytes homeAddress, uint256 homeChainId)` (owner; automatically revokes the previous peer)
  - Scripts: `evm-cli/23_token_transfer_setTrusetedRemotes.js`, `evm-cli/27_token_transfer_update_HomeAddress.js`
- **Keep CLI configs in sync with on-chain state**
  - `sol-transfer-token/sol-cli/config.js` → `peer.WanChainId` / `peer.WanAppScAddr`
  - `evm-token-transfer/evm-cli/config.js` → `solChainID` / `SolScAddr` / `gateWayScAddr`

### 7. Running the demo

**Solana side — `sol-transfer-token/sol-cli/`**

```bash
node 10_setting_init.js                 # initialize peer settings
node 11_setting_get.js                  # print settings
node 20_token_transfer_app_crossTokenToEvm.js   # Solana -> WAN transfer
node 4_gateway_inbound.js               # inbound message (WAN -> Solana)
node 21_token_transfer_app_wmbReceiveAccounts.js
node 3_parse_event_CrosschainFunctionCall.js    # parse Gate-Way outbound event
node 5_parse_evm_data.js / 6_parse_event_InboundTaskExecuted.js
```

`test_app/` contains the earlier integration scripts (`0_get_users_balance.js`, `2_cross_token_to_evm.js`, `3/4/5_*`); some of their settings no longer match the current interface — see §8.

**WAN side — `evm-token-transfer/evm-cli/`**

```bash
node 1_gateway_checkchainId.js          # verify on-chain chain id
node 21_token_transfer_getGatewayAddress.js
node 22_token_transfer_getTrusetedRemotes.js
node 23_token_transfer_setTrusetedRemotes.js   # add the Solana peer
node 25_token_transfer_send.js                  # WAN -> Solana transfer
node 24_token_transfer_wmbReceiveNonEvm.js      # manual inbound (integration testing)
node 26_token_transfer_getBalance.js
node 27_token_transfer_update_HomeAddress.js
node 28_token_transfer_update_Gateway.js
node 31_parse_event_getTx.js / 32_parse_event_MessageDispatchedNonEvm.js
```

### 8. Project status & known issues

- **Placeholder config**: `WanAppScAddr` in `sol-transfer-token/test_app/config.js` is still the placeholder `0x742d35…C4C4`; the real contract is `0xCB96D7…Caf4` (already correct in `sol-cli/config.js`). Update it before using `test_app`, otherwise calls fail with `UntrustedPeer`.
- **Interface drift**: `test_app/AppProgram.js` passes `lockAccount` / `mintAccount` accounts that are not part of the current `CrossTokenToEvmAccounts`; prefer `sol-cli/` for day-to-day calls.
- **Program id mismatch**: `Anchor.toml` declares `[programs.localnet] sol_transfer_token = "EW77jV5…"` while `lib.rs` uses `declare_id!("7sVC9w6R…")` (the deployed address). Reconcile them before deploying.
- **`4_update_idl.sh`** copies the IDL into `app/idl/` (that directory does not exist) and `sol-cli/idl/`; fix the target path if it errors.
- **Inbound unlock not implemented yet**: `wmb_receive` currently only validates the `unlockToken` message type and amount — it does not actually perform the unlock transfer (TODO in the source). `wmb_receive_accounts` returns a fixed set of token / ATA / system program accounts.
- **Tests are scaffolding samples**: `sol-transfer-token/tests/sol-transfer-token.ts` and `evm-token-transfer/test/Lock.js` do not cover the cross-chain flow.
- **Security note**: the `config.js` files contain demo mnemonics and secret-key bytes. Testnet use only — never reuse them for mainnet or real funds.

### 9. Security design

- **Peer whitelist**: Solana validates `peer_chain_id` + `peer_app_address` on both outbound and inbound paths; EVM validates `trustedRemotes`, and `updateHomeAddress` revokes the old peer automatically.
- **Caller restriction**: Solana inbound requires `cpi_authority` to be the configured Gate-Way program; EVM inbound requires `msg.sender == wmbGateway`.
- **Replay protection**: `processedMessages[messageId]` on the EVM side ensures each message is consumed once.
- **Access control**: Solana admin instructions use `has_one = authority`; EVM admin functions use `onlyOwner`.
- **Input validation**: non-zero amounts, receiver address length (20 bytes on EVM / 32 bytes on Solana), empty-address checks.
