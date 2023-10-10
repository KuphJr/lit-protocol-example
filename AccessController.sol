// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DecryptionAccessController {
  address public allowedDecryptor;

  constructor(address _allowedDecryptor) {
    allowedDecryptor = _allowedDecryptor;
  }

  function isAllowedToDecrypt(address decryptor) public view returns (bool) {
    return decryptor == allowedDecryptor && isRedemptionRequestInFlight();
  }

  // This function should return true for 5 minutes after a creator intitiates a redemption request.  Once that time has passed, it should return false.
  function isRedemptionRequestInFlight() public view returns (bool) {
    // TODO: implement
    return true;
  }
}
