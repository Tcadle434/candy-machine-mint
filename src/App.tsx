import "./App.css";
import { useMemo } from "react";

import Home from "./Home";
import styled from "styled-components";

import * as anchor from "@project-serum/anchor";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  getPhantomWallet,
  getSolflareWallet,
  getSolletWallet,
} from "@solana/wallet-adapter-wallets";

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";

import { WalletDialogProvider } from "@solana/wallet-adapter-material-ui";

const TopContainer = styled.div`
  width: 100%;
  height: 100vh;
  padding: 0;
  position=relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #d3d3d3;

  @media screen and (max-width: 480px) {
    height: 100vh;
}
`;

const treasury = new anchor.web3.PublicKey(
  process.env.REACT_APP_TREASURY_ADDRESS!
);

const config = new anchor.web3.PublicKey(
  process.env.REACT_APP_CANDY_MACHINE_CONFIG!
);

const candyMachineId = new anchor.web3.PublicKey(
  process.env.REACT_APP_CANDY_MACHINE_ID!
);

const network = process.env.REACT_APP_SOLANA_NETWORK as WalletAdapterNetwork;

const rpcHost = process.env.REACT_APP_SOLANA_RPC_HOST!;
const connection = new anchor.web3.Connection(rpcHost);

const startDateSeed = parseInt(process.env.REACT_APP_CANDY_START_DATE!, 10);

const txTimeout = 30000; // milliseconds (confirm this works for your project)

const App = () => {
  const endpoint = useMemo(() => clusterApiUrl(network), []);

  const wallets = useMemo(
    () => [getPhantomWallet(), getSolflareWallet(), getSolletWallet()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletDialogProvider>
        <TopContainer>
          <Home
            candyMachineId={candyMachineId}
            config={config}
            connection={connection}
            startDate={startDateSeed}
            treasury={treasury}
            txTimeout={txTimeout}
          />
          </TopContainer>
        </WalletDialogProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default App;
