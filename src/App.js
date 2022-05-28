import './App.css';
import { useState, useEffect } from 'react';

import Arweave from 'arweave';

let arweave

if (process.env.REACT_APP_WORKSPACE_URL) {
  /* if in gitpod */
  let host = process.env.REACT_APP_WORKSPACE_URL.replace('https://', '')
  arweave = Arweave.init({
    host,
    protocol: 'https'
  })
} else {
  /* localhost / Arlocal */
  arweave = Arweave.init({
    host: '127.0.0.1',
    port: 1984,
    protocol: 'http'
  })
  
  /* to use mainnet */
  // const arweave = Arweave.init({
  //   host: 'arweave.net',
  //   port: 443,
  //   protocol: 'https'
  // })
}

function App() {
  const [state, setState] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [loadingState, setLoadingState] = useState('')

  async function createTransaction() {
    console.log("state", state);
    if (!state) return
    try {
      const formData = state
      setState('')
      setLoadingState('sendingTransaction')
      // // const key = await arweave.wallets.generate();
      // // const address = await arweave.wallets.jwkToAddress(key)
      // const address = "lELTFBlz4Kj14qUL-jmCZwb5xYnkGEsb_aztBO-b394";
      // const balance = await arweave.wallets.getBalance(address);
      // console.log(address, balance);
      let transaction = await arweave.createTransaction({ data: formData });
      transaction.addTag('Content-Type', 'image/png');
      console.log("transaction", transaction);
      await arweave.transactions.sign(transaction);
      let uploader = await arweave.transactions.getUploader(transaction);

      while (!uploader.isComplete) {
        await uploader.uploadChunk();
        console.log(`${uploader.pctComplete}% complete, ${uploader.uploadedChunks}/${uploader.totalChunks}`);
      }
      setTransactionId(transaction.id)
      setLoadingState('transactionSent')
    } catch(err) {
      console.log(err);
    }
  }

  async function readFromArweave() {
    arweave.transactions.get(transactionId).then(transaction => {
      console.log(transaction);
    })
    arweave.transactions.getData(transactionId, {
      decode: true, string: false
    }).then(data => {
      const blob = new Blob([data], { type: "image/png" });
      var imageUrl = window.URL.createObjectURL( blob );
      var img = document.createElement("img");
      img.src = imageUrl;
      document.body.appendChild(img);
    })
  }

  if (loadingState === 'sendingTransaction') return (
    <div className="container">
       <p>Sending Transaction...</p>
    </div>
  )

  return (
    <div className="container">
      <button
        style={button}
        onClick={createTransaction}
      >Create Transaction</button>

      {
        loadingState === 'transactionSent' && (
          <button
            style={button}
            onClick={readFromArweave}
          >Log Transaction Data</button>
        )
      }

      <input
        style={input}
        onChange={e => {
          setState(e.target.value)
          setLoadingState('')
        }}
        placeholder="text"
        value={state}
      />

      <input
        style={input}
        onChange={async (e) => {
          setState(await e.target.files[0].arrayBuffer())
          setLoadingState('')
        }}
        type="file"
      />
    </div>
  )
}

const button = {
  outline: 'none',
  border: '1px solid black',
  backgroundColor: 'white',
  padding: '10px',
  width: '200px',
  marginBottom: 10,
  cursor: 'pointer'
}

const input = {
  backgroundColor: '#ddd',
  outline: 'none',
  border: 'none',
  width: '200px',
  fontSize: '16px',
  padding: '10px'
}

export default App;

