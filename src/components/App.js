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

  const [isLoading, setIsLoading] = useState(true)

  const loadBlockchainData = async () => {
    // Initiate provider & network
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)
    const { chainId } = await provider.getNetwork()

    // Fetch contracts
    const DAO = new ethers.Contract(config[chainId].dao.address, DAO_ABI, provider)
    setDao(DAO)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    // Fetch dao account balance
    let treasuryBalance = await provider.getBalance(DAO.address)
    treasuryBalance = ethers.utils.formatUnits(treasuryBalance, 18)
    setDaoTreasury(treasuryBalance)

    // Fetch proposals
    const proposalIndex = await DAO.proposalIndex()
    let proposals = []

    for(var i = 1; i <= proposalIndex; i++) {
      const proposal = await DAO.proposals(i)
      proposals.push(proposal)
    }

    setProposals(proposals)

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

      <h1 className='my-4 text-center'>DApp U Dao</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <div>
          <hr />
            <p className='text-center'><strong>Treasury ETH Balance:</strong> {daoTreasury} ETH</p>
          <hr />
          <Proposals proposals={proposals} />
        </div>
      )}
    </Container>
  )
}

export default App;
