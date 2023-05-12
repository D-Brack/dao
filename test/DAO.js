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
    token = await Token.deploy('DAO Token', 'DAO', tokens(1000000))

    // Deploy dao
    const DAO = await ethers.getContractFactory('DAO')
    dao = await DAO.deploy(token.address, tokens(500000).add(1))

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
    
    // Fund DAO with ETH
    await funder.sendTransaction({ to: dao.address, value: ether(100) })

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

    it('accepts ETH', async () => {
      expect(await ethers.provider.getBalance(dao.address)).to.equal(ether(100).toString())
    })
  })

  describe('Proposal Creation', () => {

    describe('Success', () => {

      beforeEach(async () => {
        transaction = await dao.connect(investor1).createProposal('Prop 1', receiver.address, ether(50))
        result = transaction.wait()
      })

      it('increases proposal index', async () => {
        expect(await dao.proposalIndex()).to.equal(1)
      })

      it('creates a proposal', async () => {
        const proposal = await dao.proposals(1)

        expect(proposal.name).to.equal('Prop 1')
        expect(proposal.receiver).to.equal(receiver.address)
        expect(proposal.amount).to.equal(ether(50))
        expect(proposal.votes).to.equal(0)
        expect(proposal.finalized).to.equal(false)
      })

      it('emits a propose event', async () => {
        expect(transaction).to.emit('DAO', 'Propose').withArgs(1, ether(50), receiver.address, investor1.address)
      })
    })

    describe('Failure', () => {

      it('rejects proposals from non-investors', async () => {
        await expect(dao.connect(user).createProposal('Prop 1', receiver.address, ether(50))).to.be.reverted
      })

      it('rejects proposals exceeding ETH balance', async () => {
        await expect(dao.connect(investor1).createProposal('Prop 1', receiver.address, ether(150))).to.be.reverted
      })
    })
  })

})