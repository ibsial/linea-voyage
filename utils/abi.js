export const erc20_abi = [
    `function decimals() public view returns (uint8)`,
    `function balanceOf(address _owner) public view returns (uint256 balance)`,
    `function transfer(address _to, uint256 _value) public returns (bool success)`,
    `function approve(address _spender, uint256 _value) public returns (bool success)`,
    `function allowance(address _owner, address _spender) public view returns (uint256 remaining)`
]