// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title Toptal token
 */

contract ToptalToken is ERC20("ToptalToken", "TTT") {
  using SafeMath for uint256;

  constructor() public {
      uint256 initialSupply = 1000000000000;
      _mint(msg.sender, initialSupply);
  }
}
