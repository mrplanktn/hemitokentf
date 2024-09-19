require('dotenv').config();
const fs = require('fs');
const Web3 = require('web3');

// Mengambil variabel dari file .env
const privateKey = process.env.PRIVATE_KEY;
const rpcURL = process.env.RPC_URL;
const senderAddress = process.env.SENDER_ADDRESS;
const tokenContractAddress = process.env.TOKEN_CONTRACT_ADDRESS;

// Membuat instance Web3
const web3 = new Web3(rpcURL);

// ABI minimal untuk transfer ERC-20
const tokenABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' }
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function'
  }
];

// Membuat instance kontrak token
const tokenContract = new web3.eth.Contract(tokenABI, tokenContractAddress);

// Jumlah token yang ingin dikirim ke setiap penerima (misalnya 1 token = 1 * 10^18)
const amountToSend = web3.utils.toWei('1', 'ether');

// Membaca file addresses.json
const rawData = fs.readFileSync('addresses.json');
const addressesData = JSON.parse(rawData);
const recipientAddresses = addressesData.addresses;

// Fungsi untuk mengirim token ke beberapa alamat
const sendTokenToMultipleAddresses = async () => {
  for (let i = 0; i < recipientAddresses.length; i++) {
    const receiverAddress = recipientAddresses[i];
    
    // Membuat data transaksi
    const data = tokenContract.methods.transfer(receiverAddress, amountToSend).encodeABI();

    // Dapatkan nonce (jumlah transaksi pengirim)
    const nonce = await web3.eth.getTransactionCount(senderAddress, 'latest');

    // Membuat objek transaksi
    const tx = {
      from: senderAddress,
      to: tokenContractAddress,
      nonce: nonce,
      gas: 2000000, // Sesuaikan jika perlu
      data: data
    };

    try {
      // Menandatangani transaksi dengan private key
      const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

      // Mengirim transaksi ke jaringan Hemi Sepolia
      const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
      console.log(`Transaction successful to ${receiverAddress} with receipt: `, receipt);
    } catch (error) {
      console.error(`Error during transaction to ${receiverAddress}: `, error);
    }
  }
};

// Memanggil fungsi untuk mengirim token
sendTokenToMultipleAddresses();

