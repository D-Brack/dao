// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import './Token.sol';
import "hardhat/console.sol";

contract DAO {

    address public owner;
    Token public token;
    uint256 public quorum;

    struct Proposal {
        uint256 index;
        string name;
        address receiver;
        uint256 amount;
        uint256 votes;
        bool finalized;
    }

    uint256 public proposalIndex;
    mapping(uint256 => Proposal) public proposals;

    event Propose (
        uint256 index,
        address receiver,
        uint256 amount,
        address creator
    );

    modifier onlyInvestor() {
        require(token.balanceOf(msg.sender) > 0, 'Not an investor');
        _;
    }
    
    constructor(Token _token, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
    }

    receive() external payable {}

    function createProposal(
        string memory _name,
        address _receiver,
        uint256 _amount
    )  
        external onlyInvestor {

        require(address(this).balance >= _amount, 'Not enough ETH in treasury');

        proposalIndex += 1;

        // Create new proposal
        Proposal storage proposal = proposals[proposalIndex];
        proposal.index = proposalIndex;
        proposal.name = _name;
        proposal.receiver = _receiver;
        proposal.amount = _amount;
        proposal.votes = 0;
        proposal.finalized = false;

        //Emit propose event
        emit Propose(proposalIndex, _receiver, _amount, msg.sender);
    }
}