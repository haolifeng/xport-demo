// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./WmbAppNoEvm.sol";

contract ERC20TokenRemote is WmbAppNoEvm, ERC20 {
    using SafeERC20 for IERC20;

    uint8 private constant _DECIMALS = 6;
    bytes   public homeAddress;
    uint256 public homeChainId;

    event SendTokenToHome(uint256 indexed homeChainId, address indexed from, bytes indexed to, uint256 amount);
    event ReceiveTokenFromHome(uint256 indexed fromChainId, bytes indexed from, address indexed to, uint256 amount);

    constructor(
        address _wmbGateway, 
        bytes memory _homeAddress,
        uint256 _homeChainId, 
        string memory _name, 
        string memory _symbol
    ) ERC20(_name, _symbol) WmbAppNoEvm(_wmbGateway) {

        homeAddress = _homeAddress;
        homeChainId = _homeChainId;
        setTrustedRemote(_homeChainId, _homeAddress, true);
    }
    function decimals() public pure override returns (uint8) {
        return _DECIMALS;
    }

    function updateHomeAddress(bytes memory _homeAddress, uint256 _homeChainId) public onlyOwner {
        require(_homeAddress.length != 0, "ERC20TokenRemote: empty home address");
        require(_homeChainId != 0, "ERC20TokenRemote: invalid home chain id");
        // Revoke trust on the old peer so no dangling trusted remote is left behind
        if (homeAddress.length != 0) {
            trustedRemotes[homeChainId][homeAddress] = false;
            emit SetTrustedRemote(homeChainId, homeAddress, false);
        }
        homeAddress = _homeAddress;
        homeChainId = _homeChainId;
        setTrustedRemote(_homeChainId, _homeAddress, true);
    }

    function updateWmbGateway(address _wmbGateway) public onlyOwner {
        _setWmbGateway(_wmbGateway);
    }
        
    

    function send(bytes memory to, uint256 amount) external {
        require(homeAddress.length != 0, "homeAddress not set");
        require(amount > 0, "Amount must be greater than 0");
        require(to.length != 0, "Invalid receiver address");
        _burn(msg.sender, amount);
        _dispatchMessageNonEvm(homeChainId, homeAddress, 300_000, abi.encode("unlockToken",msg.sender, to, amount));
        emit SendTokenToHome(homeChainId, msg.sender, to, amount);
    }

    function _wmbReceive(
        bytes calldata data,
        bytes32 messageId,
        uint256 fromChainId,
        bytes memory from
    ) override internal{
        (bytes memory messageType, bytes memory fromAccount, address  to, uint256 amount) = abi.decode(data, (bytes,bytes, address, uint256));

        // Only accept the message type emitted by the peer app (Solana cross_token_to_evm)
        require(keccak256(messageType) == keccak256("cross_token"), "ERC20TokenRemote: invalid message type");
        require(to != address(0), "ERC20TokenRemote: mint to zero address");
        require(amount > 0, "ERC20TokenRemote: amount must be greater than 0");

        _mint(to, amount);
        emit ReceiveTokenFromHome(fromChainId, fromAccount, to, amount);
    }
}