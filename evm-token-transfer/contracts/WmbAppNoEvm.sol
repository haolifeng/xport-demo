// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/IWmbReceiverNonEvm.sol";

interface IWmbGatewayNonEvm {
    function dispatchMessageNonEvm(uint256 toChainId, bytes memory to, uint256 gasLimit, bytes calldata data) external  returns (bytes32 messageId);
}


abstract contract WmbAppNoEvm is Ownable {

    address public wmbGateway;

    mapping (uint => mapping(bytes => bool)) public trustedRemotes;

    /// @dev Replay protection: a messageId can only be consumed once
    mapping (bytes32 => bool) public processedMessages;

    event SetTrustedRemote(uint256 fromChainId, bytes from, bool trusted);
    event WmbGatewayUpdated(address indexed oldGateway, address indexed newGateway);
    event MessageProcessed(bytes32 indexed messageId);

    constructor(address _wmbGateway) {
        require(_wmbGateway != address(0), "WmbApp: gateway is zero address");
        wmbGateway = _wmbGateway;
    }

    function wmbReceiveNonEvm(
        bytes calldata data,
        bytes32 messageId,
        uint256 fromChainId,
        bytes memory from
    ) virtual external {
        // Only the WMB gateway can call this function
        require(msg.sender == wmbGateway, "WmbApp: Only WMB gateway can call this function");
        require(trustedRemotes[fromChainId][from], "WmbApp: Remote is not trusted");
        // Replay protection: the same messageId must not be executed twice
        require(!processedMessages[messageId], "WmbApp: Message already processed");
        processedMessages[messageId] = true;
        emit MessageProcessed(messageId);
        _wmbReceive(data, messageId, fromChainId, from);
    }

    function _wmbReceive(
        bytes calldata data,
        bytes32 messageId,
        uint256 fromChainId,
        bytes memory from
    ) virtual internal;

    function _dispatchMessageNonEvm(
        uint toChainId,
        bytes memory to,
        uint gasLimit,
        bytes memory data
    ) virtual internal returns (bytes32) {
        return IWmbGatewayNonEvm(wmbGateway).dispatchMessageNonEvm(toChainId, to, gasLimit, data);
    }

    /// @dev Only owner may update the WMB gateway
    function _setWmbGateway(address _wmbGateway) internal {
        require(_wmbGateway != address(0), "WmbApp: gateway is zero address");
        emit WmbGatewayUpdated(wmbGateway, _wmbGateway);
        wmbGateway = _wmbGateway;
    }

    /// @dev Only owner may change the trusted remote whitelist
    function setTrustedRemote(uint fromChainId, bytes memory from, bool trusted) public onlyOwner {
        require(from.length != 0, "WmbApp: empty remote address");
        trustedRemotes[fromChainId][from] = trusted;
        emit SetTrustedRemote(fromChainId, from, trusted);
    }
}