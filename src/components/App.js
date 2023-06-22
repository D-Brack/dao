import { useEffect, useState } from 'react'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';
import Proposals from './Proposals'
import Create from './Create'

// ABIs
import DAO_ABI from '../abis/DAO.json'
import TOKEN_ABI from '../abis/Token.json'

// Config
import config from '../config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [account, setAccount] = useState(null)

  const [dao, setDao] = useState(null)
  const [daoTreasury, setDaoTreasury] = useState(0)

  const [token, setToken] = useState(null)
  const [tokenSymbol, setTokenSymbol] = useState('')

  const [proposals, setProposals] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
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

    const token = new ethers.Contract(config[chainId].token.address, TOKEN_ABI, provider)
    setToken(token)

    const symbol = await token.symbol()
    setTokenSymbol(symbol)

    // Fetch accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const account = ethers.utils.getAddress(accounts[0])
    setAccount(account)

    // Fetch dao account balance
    //let treasuryBalance = await provider.getBalance(dao.address)
    let treasuryBalance = await token.balanceOf(dao.address)
    treasuryBalance = ethers.utils.formatUnits(treasuryBalance, 18)
    setDaoTreasury(treasuryBalance)

    // Fetch proposals & voted status
    const proposalIndex = await dao.proposalIndex()
    let proposals = []
    let voteStatuses = []

    for(var i = 1; i <= proposalIndex; i++) {
      const proposal = await dao.proposals(i)
      proposals.push(proposal)

      const voted = await dao.votes(account, i)
      voteStatuses.push(voted)
    }

    setProposals(proposals)
    setHasVoted(voteStatuses)

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

      <h1 className='my-4 text-center'>DApp U DAO</h1>

      {isLoading ? (
        <Loading />
      ) : (
        <div>
          <Create provider={provider} dao={dao} setIsLoading={setIsLoading} />

          <hr />
            <p className='text-center'>
              <strong>Treasury Token Balance:</strong> {daoTreasury} {tokenSymbol}
            </p>
          <hr />

          <h4 className='text-center'>Proposals</h4>
          <Proposals
            proposals={proposals}
            quorum={quorum}
            provider={provider}
            dao={dao}
            token={token}
            setIsLoading={setIsLoading}
            account={account}
            hasVoted={hasVoted}
            tokenSymbol={tokenSymbol} />
        </div>
      )}
    </Container>
  )
}

export default App;
