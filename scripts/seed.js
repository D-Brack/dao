const { hre } = require('hardhat')

const config = require('../src/config.json')
const TOKEN_ABI = require('../src/abis/Token.json')
const DAO_ABI = require('../src/abis/DAO.json')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}
  
const ether = tokens

async function main() {

  let 
    dao,
    token,
    funder,
    investor1,
    investor2,
    investor3,
    transaction,
    result

  // Fetch netowrk/account info
  console.log('Fetching network & account info...\n')
  const provider = ethers.getDefaultProvider()
  const { chainId } = await ethers.provider.getNetwork()

  const accounts = await ethers.getSigners()
  funder = accounts[0]
  investor1 = accounts[1]
  investor2 = accounts[2]
  investor3 = accounts[3]
  investor4 = accounts[4]
  investor5 = accounts[5]
  receiver = accounts[6]

  // Fetch contracts
  console.log('Fetching contracts...')

  token = new ethers.Contract(config[chainId].token.address, TOKEN_ABI, provider)
  console.log(`\tToken fetched: ${token.address}`)

  dao = new ethers.Contract(config[chainId].dao.address, DAO_ABI, provider)
  console.log(`\tDAO fetched: ${dao.address}\n`)

  // Send tokens to investors  
  console.log('Sending tokens to investors...\n')
  const amount = ether(200000)

  transaction = await token.connect(funder).transfer(investor1.address, amount)
  result = await transaction.wait()

  transaction = await token.connect(funder).transfer(investor2.address, amount)
  result = await transaction.wait()

  transaction = await token.connect(funder).transfer(investor3.address, amount)
  result = await transaction.wait()

  transaction = await token.connect(funder).transfer(investor4.address, amount)
  result = await transaction.wait()

  transaction = await token.connect(funder).transfer(investor5.address, amount)
  result = await transaction.wait()

  // Fund DAO & create proposals
  console.log('Funding DAO...\n')
  //transaction = await funder.sendTransaction({ to: dao.address, value: ether(1000) })
  transaction = await token.connect(funder).transfer(dao.address, tokens(100))
  result = await transaction.wait()

  console.log('Creating, voting on, and finalizing proposals...\n')

  for(var i = 0; i < 3; i++) {
    // Create proposal
    //transaction = await dao.connect(investor1).createProposal(`Proposal ${i + 1}`, `Description ${i + 1}`, receiver.address, ether(50))
    transaction = await dao.connect(investor1).createProposal(`Proposal ${i + 1}`, `Description ${i + 1}`, receiver.address, tokens(50))
    result = await transaction.wait()

    // Vote on proposal to reach quorum
    // transaction = await dao.connect(investor1).vote(i + 1)
    // result = await transaction.wait()

    transaction = await dao.connect(investor2).voteFor(i + 1)
    result = await transaction.wait()

    transaction = await dao.connect(investor3).voteFor(i + 1)
    result = await transaction.wait()

    transaction = await dao.connect(investor4).voteFor(i + 1)
    result = await transaction.wait()

    transaction = await dao.connect(investor5).voteFor(i + 1)
    result = await transaction.wait()

    // Finalize proposal
    // transaction = await dao.connect(investor1).finalizeProposal(i + 1)
    // result = await transaction.wait()
  }

  console.log('Creating open proposal...\n')
  // Create
  //transaction = await dao.connect(investor1).createProposal(`Proposal 4`, `Description 4`, receiver.address, ether(50))
  transaction = await dao.connect(investor1).createProposal(`Proposal 4`, `Description 4`, receiver.address, tokens(50))
  result = await transaction.wait()

  // Vote
  transaction = await dao.connect(investor2).voteFor(i + 1)
  result = await transaction.wait()

  transaction = await dao.connect(investor3).voteFor(i + 1)
  result = await transaction.wait()

  console.log('Finished seeding!')
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
