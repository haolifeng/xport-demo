# xport-demo

跨链代币转账演示工程（Solana ↔ Wanchain gwan），基于 WMB / Solana Gate-Way 消息通道。

**语言：** [English](README.md) | 中文

---

## 中文

### 1. 项目简介

`xport-demo` 是一个跨链代币转账 Demo，展示代币在 **Solana devnet** 与 **Wanchain gwan 测试网** 之间双向转移：

| 方向 | 入口 | 链上动作 |
| --- | --- | --- |
| Solana → WAN | Solana 程序指令 `cross_token_to_evm` | 通过 Solana 侧 Gate-Way 程序 `out_bound_call` 发出消息；WAN 侧 `ERC20TokenRemote` 收到 `cross_token` 消息后 **mint** 等量 `WSUSDC`（6 位小数） |
| WAN → Solana | `ERC20TokenRemote.send(to, amount)` | 本地 **burn** 代币，经 WMB 网关发送 `unlockToken` 消息；Solana 侧 `wmb_receive` 校验来源链/来源程序与消息类型后处理 |

消息安全依赖两侧的**对端白名单**（Solana `Settings` 账户中的 `peer_chain_id` + `peer_app_address`，EVM 侧 `trustedRemotes`）。

### 2. 目录结构

```text
xport-demo/
├── README.md / README.zh-CN.md
├── evm-token-transfer/            # WAN (EVM) 侧工程（Hardhat）
│   ├── contracts/
│   │   ├── ERC20TokenRemote.sol   # 跨链代币合约（mint/burn + 转发）
│   │   ├── WmbAppNoEvm.sol        # 非 EVM 消息收发基类（白名单 + 防重放）
│   │   └── interfaces/IWmbReceiverNonEvm.sol
│   ├── scripts/deploy_rec20tokenremote.js
│   ├── hardhat.config.js          # networks: wantest(999) / wanmain(888)
│   └── evm-cli/                   # 链上调用与事件解析脚本（编号执行）
└── sol-transfer-token/            # Solana 侧工程（Anchor 0.31.1）
    ├── programs/sol-transfer-token/src/
    │   ├── lib.rs                 # 指令入口：initialize_settings / update_peer /
    │   │                           #   cross_token_to_evm / out_bound_call / wmb_receive
    │   ├── message_data.rs        # 跨链消息 ABI/Borsh 编解码
    │   └── constants.rs / errors.rs / events.rs / utils/
    ├── 0_del_target.sh … 4_update_idl.sh   # 清理、构建、部署、取地址、同步 IDL
    ├── sol-cli/                   # 推荐的命令行调用脚本（编号执行）
    ├── test_app/                  # 早期联调脚本（部分已落后于当前接口，见第 8 节）
    ├── tests/                     # anchor 测试（仍为脚手架样例）
    └── Anchor.toml
```

### 3. 部署信息

**Solana 侧**

| 类型 | 内容 |
| --- | --- |
| program address | `7sVC9w6RuxBmR3eoSsKfTBvDmxAYJyMkk4fC5mgNovQQ` |
| chainId（WMB network id） | `2147484149` |
| RPC | `https://api.devnet.solana.com`（devnet） |
| Gate-Way 程序 | `9J17hVJXCcMsD1E7Kv5yNKEgQAhwcu4NvtPQvXkgesiV` |
| admin board（ConfigData PDA 所属程序） | `7jYCM8k5Nvwg5vyPpLk2yjivQhexPDMXuK8CSbUKqL6B` |
| USDC（devnet mint） | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` |

**WAN（EVM）侧**

| 类型 | 内容 |
| --- | --- |
| contract address | `0xCB96D72410742A294dFa834Ec41E8e30b0a7Caf4` |
| chainId（WMB network id） | `2153201998` |
| EVM chainId / RPC | `999`（wantest）/ `https://gwan-ssl.wandevs.org:46891` |
| WMB Gateway | `0xDDddd58428706FEdD013b3A761c6E40723a7911d` |
| token | `wrap solana usdc` / `WSUSDC`，6 位小数 |
| 对端（home） | Solana program `7sVC9w6RuxBmR3eoSsKfTBvDmxAYJyMkk4fC5mgNovQQ`，chainId `2147484149` |

> 以上均为**测试网/demo 配置**，不要直接用于主网。

### 4. 环境依赖

- Node.js（建议 18+）与 `npm` / `yarn`
- Rust 工具链 + [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://www.anchor-lang.com/) `0.31.1`（与 `package.json` 中 `@coral-xyz/anchor` 版本一致）
- Hardhat（`evm-token-transfer` 已内置依赖）

### 5. 构建与部署

**Solana 侧**（`sol-transfer-token/`）

```bash
yarn install                 # 或 npm install
./1_build_app.sh             # anchor build
./2_deploy.sh                # anchor deploy  （Anchor.toml 默认 cluster: devnet）
./3_get_app_address.sh       # 打印程序地址
./4_update_idl.sh            # 同步 IDL（见第 8 节注意）
```

**WAN 侧**（`evm-token-transfer/`）

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy_rec20tokenremote.js --network wantest
```

部署参数取自 `evm-cli/config.js`：`gateWayScAddr`、`SolScAddr`、`solChainID`。

### 6. 配置对端地址（必须）

> **要求：需要在各自的项目中配置对端的地址。**

- **Solana 侧**：程序 `settings`（PDA `["settings"]`）中保存对端 chainId 与合约地址
  - 初始化：`initialize_settings(gateway_program, peer_chain_id, peer_app_address)`
  - 修改：`update_peer(peer_chain_id, peer_app_address)`（仅 authority）
  - 脚本：`sol-cli/10_setting_init.js`、`sol-cli/11_setting_get.js`
  - `peer_app_address` 为 WAN 合约的 **20 字节**地址
- **WAN 侧**：`trustedRemotes[chainId][address]` 白名单 + `homeAddress` / `homeChainId`
  - `setTrustedRemote(chainId, solanaProgramBytes, true)`（owner）
  - `updateHomeAddress(bytes homeAddress, uint256 homeChainId)`（owner，会自动撤销旧对端信任）
  - 脚本：`evm-cli/23_token_transfer_setTrusetedRemotes.js`、`evm-cli/27_token_transfer_update_HomeAddress.js`
- **配置文件同步**：两侧 CLI 的 `config.js` 必须与链上一致
  - `sol-transfer-token/sol-cli/config.js` → `peer.WanChainId` / `peer.WanAppScAddr`
  - `evm-token-transfer/evm-cli/config.js` → `solChainID` / `SolScAddr` / `gateWayScAddr`

### 7. 运行示例

**Solana 侧 — `sol-transfer-token/sol-cli/`**

```bash
node 10_setting_init.js                 # 初始化对端设置
node 11_setting_get.js                  # 查询设置
node 20_token_transfer_app_crossTokenToEvm.js   # Solana → WAN 转账
node 4_gateway_inbound.js               # 入站消息（WAN → Solana）
node 21_token_transfer_app_wmbReceiveAccounts.js
node 3_parse_event_CrosschainFunctionCall.js    # 解析 Gate-Way 出站事件
node 5_parse_evm_data.js / 6_parse_event_InboundTaskExecuted.js
```

`test_app/` 为早期联调脚本（`0_get_users_balance.js`、`2_cross_token_to_evm.js`、`3/4/5_*`），部分配置与当前接口存在差异，详见第 8 节。

**WAN 侧 — `evm-token-transfer/evm-cli/`**

```bash
node 1_gateway_checkchainId.js          # 校验链上链 ID
node 21_token_transfer_getGatewayAddress.js
node 22_token_transfer_getTrusetedRemotes.js
node 23_token_transfer_setTrusetedRemotes.js   # 添加对端（Solana 程序）
node 25_token_transfer_send.js                  # WAN → Solana 转账
node 24_token_transfer_wmbReceiveNonEvm.js      # 手动入站（联调）
node 26_token_transfer_getBalance.js
node 27_token_transfer_update_HomeAddress.js
node 28_token_transfer_update_Gateway.js
node 31_parse_event_getTx.js / 32_parse_event_MessageDispatchedNonEvm.js
```

### 8. 项目状态与注意事项

- **配置占位值**：`sol-transfer-token/test_app/config.js` 中 `WanAppScAddr` 仍为占位地址 `0x742d35…C4C4`，实际合约为 `0xCB96D7…Caf4`（`sol-cli/config.js` 已正确）。使用 `test_app` 前请先更新，否则会触发 `UntrustedPeer`。
- **接口漂移**：`test_app/AppProgram.js` 传入的账户列表含 `lockAccount` / `mintAccount`，与当前 `CrossTokenToEvmAccounts` 不一致；日常调用请以 `sol-cli/` 为准。
- **program id 不一致**：`Anchor.toml` 中 `[programs.localnet] sol_transfer_token = "EW77jV5…"`，而 `lib.rs` 的 `declare_id!` 为 `7sVC9w6R…`（已部署地址）。部署前请确认两者一致。
- **`4_update_idl.sh`** 会把 IDL 复制到 `app/idl/`（该目录当前不存在）与 `sol-cli/idl/`，如报错请自行修正目标路径。
- **入站解锁尚未落地**：`wmb_receive` 目前只校验消息类型 `unlockToken` 与金额，并未实际执行解锁转账（源码内有 TODO 注释）；`wmb_receive_accounts` 返回的是固定的 token / ATA / system 程序账户。
- **测试仍为脚手架样例**：`sol-transfer-token/tests/sol-transfer-token.ts` 与 `evm-token-transfer/test/Lock.js` 未覆盖跨链流程。
- **安全提示**：`config.js` 中包含演示用助记词与私钥字节，仅供测试网使用，请勿复用于主网或真实资产。

### 9. 安全设计

- **对端白名单**：Solana 侧出站/入站均校验 `peer_chain_id` + `peer_app_address`；EVM 侧校验 `trustedRemotes`，`updateHomeAddress` 会自动撤销旧对端。
- **调用方限制**：Solana 入站校验 `cpi_authority` 必须为配置的 Gate-Way 程序；EVM 入站要求 `msg.sender == wmbGateway`。
- **防重放**：EVM 侧 `processedMessages[messageId]` 保证同一消息只消费一次。
- **权限控制**：Solana 管理指令 `has_one = authority`；EVM 管理函数 `onlyOwner`。
- **入参校验**：金额大于 0、接收方地址长度（EVM 20 字节 / Solana 32 字节）、空地址检查等。
