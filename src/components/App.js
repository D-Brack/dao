import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';
import Proposals from './Proposals'

// ABIs
import DAO_ABI from '../abis/DAO.json'

// Config
import config from '../config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)

  const [dao, setDao] = useState(null)
  const [daoTreasury, setDaoTreasury] = useState(0)

  const [proposals, setProposals] = useState(null)
  const [quorum, setQuorum] = useState(0)

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Initiate provider & network
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)
    const { chainId } = await provider.getNetwork()

    // Fetch contracts
    const dao = new ethers.Contract(config[chainId].dao.address, DAO_ABI, provider)
    setDao(dao)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    // Fetch dao account balance
    let treasuryBalance = await provider.getBalance(dao.address)
    treasuryBalance = ethers.utils.formatUnits(treasuryBalance, 18)
    setDaoTreasury(treasuryBalance)

    // Fetch proposals
    const proposalIndex = await dao.proposalIndex()
    let proposals = []

    for(var i = 1; i <= proposalIndex; i++) {
      const proposal = await dao.proposals(i)
      proposals.push(proposal)
    }

    setProposals(proposals)

    // Fetch quorum
    const quorum = await dao.quorum()
    setQuorum(quorum)

    setIsLoading(false)
  }

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData()
    }
  }, [isLoading]);

  // Listen for account changes
  window.ethereum.on('accountsChanged', () => {
    setIsLoading(true)
  })

  return(
    <Container>
      <Navigation account={account} />

      <h1 className='my-4 text-center'>DApp U dao</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <div>
          <hr />
            <p className='text-center'><strong>Treasury ETH Balance:</strong> {daoTreasury} ETH</p>
          <hr />
          <h4 className='text-center'>Proposals</h4>
          <Proposals proposals={proposals} quorum={quorum} provider={provider} dao={dao} setIsLoading={setIsLoading} />
        </div>
      )}
    </Container>
  )
}

export default App;
