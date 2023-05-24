import { useState } from 'react'
import { ethers } from 'ethers'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

const Create = ({ provider, dao, setIsLoading }) => {
  const [isWaiting, setIsWaiting] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState(0)
  const [receiver, setReceiver] = useState(null)

  const createHandler = async (e) => {
    e.preventDefault()
    setIsWaiting(true)

    try {
      const signer = await provider.getSigner()
      const transaction = await dao.connect(signer).createProposal(name, description, receiver, ethers.utils.parseUnits(amount.toString(), 'ether'))
      await transaction.wait()
    } catch {
      window.alert('Proposal NOT created!')
    }

    setIsLoading(true)
  }

  return (
    <Form onSubmit={createHandler}>
      <Form.Group style={{ maxWidth: '500px', margin: '50px auto' }} >
        <Form.Control type='text' placeholder='Enter proposal name' className='my-2' onChange={(e) => {setName(e.target.value)}} />
        <Form.Control type='text' placeholder='Enter proposal description' className='my-2' onChange={(e) => {setDescription(e.target.value)}} />
        <Form.Control type='number' placeholder='Enter proposal amount' className='my-2' onChange={(e) => {setAmount(e.target.value)}} />
        <Form.Control type='text' placeholder='Enter proposal recipient' className='my-2' onChange={(e) => {setReceiver(e.target.value)}} />
        {isWaiting ? (
          <Spinner animation='border' style={{ display: 'block', margin: '0 auto' }} />
        ) : (
          <Button type='submit' variant='primary' style={{ width: '100%' }} >Create Proposal</Button>
        )}
      </Form.Group>
    </Form>
  )
}

export default Create
