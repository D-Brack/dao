import Table from 'react-bootstrap/Table'
import Button from 'react-bootstrap/Button'
import { ethers } from 'ethers'

const Proposals = ({proposals}) => {
  return (
    <Table striped bordered hover responsive >
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th>Receiver</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Votes</th>
          <th>Vote</th>
          <th>Finalize</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal, index) => (
          <tr key={index}>
            <td>{proposal.index.toString()}</td>
            <td>{proposal.name}</td>
            <td>{proposal.receiver}</td>
            <td>{ethers.utils.formatUnits(proposal.amount, 'ether')} ETH</td>
            <td>{proposal.status ? 'Finalized' : 'In Progress'}</td>
            <td>{proposal.votes.toString()}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

export default Proposals