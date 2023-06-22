// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import './Token.sol';
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


contract DAO {

    address public owner;
    Token public token;
    uint256 public quorum;
    IERC20 public paymentToken;

    struct Proposal {
        uint256 index;
        string name;
        string description;
        address receiver;
        uint256 amount;
        uint256 votes;
        bool finalized;
    }

    uint256 public proposalIndex;
    mapping(uint256 => Proposal) public proposals;

    mapping(address => mapping(uint256 => bool)) public votes;

    event Propose (
        uint256 indexed index,
        address receiver,
        uint256 amount,
        address indexed creator
    );

    event Vote (
        uint256 indexed index,
        address indexed voter
    );

    event Finalize(uint256 indexed index);

    modifier onlyInvestor() {
        require(token.balanceOf(msg.sender) > 0, 'Not an investor');
        _;
    }

    constructor(Token _token, uint256 _quorum, IERC20 _paymentToken) {
        owner = msg.sender;
        token = _token;
        quorum = _quorum;
        paymentToken = _paymentToken;
    }

    receive() external payable {
        revert();
    }

    function createProposal(
        string memory _name,
        string memory _description,
        address _receiver,
        uint256 _amount
    )
        external onlyInvestor {

        require(paymentToken.balanceOf(address(this)) >= _amount, 'Not enough tokens in treasury');

        proposalIndex += 1;

        proposals[proposalIndex] = Proposal(
            proposalIndex,
            _name,
            _description,
            _receiver,
            _amount,
            0,
            false
        );

        emit Propose(proposalIndex, _receiver, _amount, msg.sender);
    }

    function voteFor(uint256 _index) external onlyInvestor {

        Proposal storage proposal = proposals[_index];

        require(!votes[msg.sender][_index], 'Investor has already voted');

        votes[msg.sender][_index] = true;


        proposal.votes += token.balanceOf(msg.sender);

        emit Vote(_index, msg.sender);
    }

    function voteAgainst(uint256 _index) external onlyInvestor {

        require(!votes[msg.sender][_index], 'Investor has already voted');

        votes[msg.sender][_index] = true;

        emit Vote(_index, msg.sender);
    }

    function finalizeProposal(uint256 _index) external onlyInvestor {

        Proposal storage proposal = proposals[_index];

        require(!proposal.finalized, 'Proposal is already finalized');

        proposal.finalized = true;

        require(proposal.votes >= quorum, 'Insufficient votes');

        require(paymentToken.balanceOf(address(this)) >= proposal.amount, 'Insufficient token balance');

        require(paymentToken.transfer(proposal.receiver, proposal.amount));

        emit Finalize(_index);
    }
}
