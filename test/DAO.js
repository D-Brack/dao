const { expect } = require('chai')
const { ethers } = require('hardhat')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('DAO', () => {

  let transaction,
      result,
      dao,
      token,
      deployer,
      investor1,
      investor2,
      investor3,
      investor4,
      investor5,
      reciever,
      user

  beforeEach(async () => {

    // Deploy token
    const Token = await ethers.getContractFactory('Token')
    token = await Token.deploy('DAO Token', 'DAO', tokens(1000100))

    // Deploy dao
    const DAO = await ethers.getContractFactory('DAO')
    dao = await DAO.deploy(token.address, tokens(500000).add(1), token.address)

    // Fetch accounts
    const accounts = await ethers.getSigners()
    deployer = accounts[0]
    investor1 = accounts[1]
    investor2 = accounts[2]
    investor3 = accounts[3]
    investor4 = accounts[4]
    investor5 = accounts[5]
    receiver = accounts[6]
    user = accounts[7]
    funder = accounts[8]

    // Fund DAO with tokens
    await token.transfer(dao.address, tokens(100))

    // Send tokens to investors
    await token.transfer(investor1.address, tokens(200000))
    await token.transfer(investor2.address, tokens(200000))
    await token.transfer(investor3.address, tokens(200000))
    await token.transfer(investor4.address, tokens(200000))
    await token.transfer(investor5.address, tokens(200000))
  })

  describe('Deployment', () => {

    it('stores the owner address', async () => {
      expect(await dao.owner()).to.equal(deployer.address)
    })

    it('stores the token', async () => {
      expect(await dao.token()).to.equal(token.address)
    })

    it('sets the quorum', async () => {
      expect(await dao.quorum()).to.equal(tokens(500000).add(1))
    })

    it('accepts tokens', async () => {
      expect(await token.balanceOf(dao.address)).to.equal(tokens(100))
    })
  })

  describe('Proposal Creation', () => {

    describe('Success', () => {

      beforeEach(async () => {
        transaction = await dao.connect(investor1).createProposal('Prop 1', 'Description 1', receiver.address, tokens(50))
        result = transaction.wait()
      })

      it('increases proposal index', async () => {
        expect(await dao.proposalIndex()).to.equal(1)
      })

      it('creates a proposal', async () => {
        const proposal = await dao.proposals(1)

        expect(proposal.name).to.equal('Prop 1')
        expect(proposal.description).to.equal('Description 1')
        expect(proposal.receiver).to.equal(receiver.address)
        expect(proposal.amount).to.equal(tokens(50))
        expect(proposal.votes).to.equal(0)
        expect(proposal.finalized).to.equal(false)
      })

      it('emits a propose event', async () => {
        await expect(transaction).to.emit(dao, 'Propose').withArgs(1, receiver.address, tokens(50), investor1.address)
      })
    })

    describe('Failure', () => {

      it('rejects proposals from non-investors', async () => {
        await expect(dao.connect(user).createProposal('Prop 1', 'Description 1', receiver.address, tokens(50))).to.be.reverted
      })

      it('rejects proposals exceeding ETH balance', async () => {
        await expect(dao.connect(investor1).createProposal('Prop 1', 'Description 1', receiver.address, tokens(150))).to.be.reverted
      })
    })
  })

  describe('Voting For Proposal', () => {

    beforeEach(async () => {
      await expect(dao.connect(investor1).createProposal('Prop 1', 'Description 1', receiver.address, tokens(150))).to.be.reverted
      result = transaction.wait()
    })

    describe('Success', () => {

      beforeEach(async () => {
        transaction = await dao.connect(investor1).voteFor(1)
        result = transaction.wait()
      })

      it('updates votes mapping', async () => {
        expect(await dao.votes(investor1.address, 1)).to.equal(true)
      })

      it('updates vote count in proposal struct', async () => {
        const proposal = await dao.proposals(1)
        expect(proposal.votes).to.equal(tokens(200000))
      })

      it('emits a vote event', async () => {
        await expect(transaction).to.emit(dao, 'Vote').withArgs(1, investor1.address)
      })
    })

    describe('Failure', () => {

      it('rejects votes from non-investors', async () => {
        await expect(dao.connect(user).voteFor(1)).to.be.reverted
      })

      it('rejects multiple vote attempts', async () => {
        transaction = await dao.connect(investor1).voteFor(1)
        result = transaction.wait()
        await expect(dao.connect(investor1).voteFor(1)).to.be.reverted
      })
    })
  })

  describe('Voting Against Proposal', () => {

    beforeEach(async () => {
      await expect(dao.connect(investor1).createProposal('Prop 1', 'Description 1', receiver.address, tokens(150))).to.be.reverted
      result = transaction.wait()
    })

    describe('Success', () => {

      beforeEach(async () => {
        transaction = await dao.connect(investor1).voteAgainst(1)
        result = transaction.wait()
      })

      it('updates votes mapping', async () => {
        expect(await dao.votes(investor1.address, 1)).to.equal(true)
      })

      it('emits a vote event', async () => {
        await expect(transaction).to.emit(dao, 'Vote').withArgs(1, investor1.address)
      })
    })

    describe('Failure', () => {

      it('rejects votes from non-investors', async () => {
        await expect(dao.connect(user).voteAgainst(1)).to.be.reverted
      })

      it('rejects multiple vote attempts', async () => {
        transaction = await dao.connect(investor1).voteAgainst(1)
        result = transaction.wait()
        await expect(dao.connect(investor1).voteAgainst(1)).to.be.reverted
      })
    })
  })

  describe('Governance', () => {

    beforeEach(async () => {
      transaction = await dao.connect(investor1).createProposal('Prop 1', 'Description 1', receiver.address, tokens(50))
      result = transaction.wait()

      transaction = await dao.connect(investor1).voteFor(1)
      result = transaction.wait()

      transaction = await dao.connect(investor2).voteFor(1)
      result = transaction.wait()
    })

    describe('Success', () => {
      let proposal

      beforeEach(async () => {
        transaction = await dao.connect(investor3).voteFor(1)
        result = transaction.wait()

        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = transaction.wait()

        proposal = await dao.proposals(1)
      })

      it('sends tokens to the receiver', async () => {
        expect(await token.balanceOf(receiver.address)).to.equal(tokens(50))
      })

      it('marks proposal as finalized', async () => {
        expect(proposal.finalized).to.equal(true)
      })

      it('emits a finalize event', async () => {
        await expect(transaction).to.emit(dao, 'Finalize').withArgs(1)
      })

    })

    describe('Failure', () => {

      it('doesn\'t finalize proposal without a quorum', async () => {
        transaction = await dao.connect(investor1).createProposal('Prop 2', 'Description 2', receiver.address, tokens(0))
        result = transaction.wait()
        await expect(dao.connect(investor1).finalizeProposal(2)).to.be.reverted
      })

      // Build quorum
      beforeEach(async () => {
        transaction = await dao.connect(investor3).voteFor(1)
        result2 = transaction.wait()
      })

      it('rejects finalization by non-investors', async () => {
        await expect(dao.connect(user).finalizeProposal(1)).to.be.reverted
      })

      it('rejects finalizing a proposal twice', async () => {
        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = transaction.wait()
        await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted
      })

      //

      it('rejects transfer exceeding tokens balance', async () => {
        transaction = await dao.connect(investor1).createProposal('Prop 3', 'Description 3', receiver.address, tokens(100))
        result = transaction.wait()

        transaction = await dao.connect(investor1).finalizeProposal(1)
        result = transaction.wait

        transaction = await dao.connect(investor1).voteFor(3)
        result = transaction.wait()

        transaction = await dao.connect(investor2).voteFor(3)
        result = transaction.wait()

        transaction = await dao.connect(investor3).voteFor(3)
        result = transaction.wait()

        await expect(dao.connect(investor1).finalizeProposal(2)).to.be.reverted
      })
    })
  })
})
