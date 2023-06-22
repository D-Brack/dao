import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import { ethers } from 'ethers'

const Proposals = ({
  proposals,
  quorum,
  provider,
  dao,
  token,
  setIsLoading,
  account,
  hasVoted,
  tokenSymbol
}) => {

  const voteForHandler = async (index) => {

    try {
      const signer = await provider.getSigner()
      const trasaction = await dao.connect(signer).voteFor(index)
      await trasaction.wait()
    } catch {
      window.alert('Vote canceled or reverted')
    }

    setIsLoading(true)
  }

  const voteAgainstHandler = async (index) => {

    try {
      const signer = await provider.getSigner()
      const trasaction = await dao.connect(signer).voteAgainst(index)
      await trasaction.wait()
    } catch {
      window.alert('Vote canceled or reverted')
    }

    setIsLoading(true)
  }

  const finalizeHandler = async (index) => {

    try {
      const signer = await provider.getSigner()
      const trasaction = await dao.connect(signer).finalizeProposal(index)
      await trasaction.wait()
    } catch {
      window.alert('Finalizing canceled or reverted')
    }

    setIsLoading(true)
  }

  return (
    <>
      <Table striped bordered hover responsive >
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Receiver</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Votes</th>
            <th>Vote For</th>
            <th>Vote Against</th>
            <th>Finalize</th>
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal, index) => (
            <tr key={index} >
              <td>{proposal.index.toString()}</td>
              <td>{proposal.name}</td>
              <td>{proposal.receiver}</td>
              <td>{ethers.utils.formatUnits(proposal.amount, 'ether')} {tokenSymbol}</td>
              <td>{proposal.finalized ? 'Approved' : 'In Progress'}</td>
              <td>{proposal.votes.toString()}</td>
              <td>
                {!proposal.finalized && !hasVoted[index] ? (
                  <Button
                    variant='primary'
                    style={{width: '100%'}}
                    onClick={() => voteForHandler(proposal.index)}
                  >
                    Vote For
                  </Button>
                ) : (
                  <></>
                )}
              </td>
              <td>
                {!proposal.finalized && !hasVoted[index] && (
                  <Button
                    variant='primary'
                    style={{width: '100%'}}
                    onClick={() => voteAgainstHandler(proposal.index)}
                  >
                    Vote Against
                  </Button>
                )}
              </td>
              <td>
                {proposal.votes.gte(quorum) && !proposal.finalized && (
                  <Button
                    variant='primary'
                    style={{width: '100%'}}
                    onClick={() => finalizeHandler(proposal.index)}
                  >
                    Finalize
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className='text-center' style={{ color: 'red' }}>
        *** {quorum.toString()} votes required to reach a quorum
      </p>
    </>
  )
}

export default Proposals
