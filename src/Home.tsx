import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import TankOne  from "./assets/4.png";
import TankTwo  from "./assets/122.png";
import TankThree  from "./assets/198.png";
import TankFour  from "./assets/352.png";

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "./candy-machine";

const ConnectButton = styled(WalletDialogButton)`
padding: 16px 32px;
border-radius: 5px;
background-color: transparent;
color: #000000;
font-weight: normal;
font-size: 40px;
font-family: Disposable Droid BB;
outline: none;
border: none;
transition: all 220ms ease-in-out;
cursor: pointer;
margin-bottom: 1em;

&:hover {
  background-color: #16B1F3;
  border: none;
  color: #FFFFFF;
}
`;

const SloganText = styled.h1`
  font-family: SF TransRobotics;
  font-size: 64px;
  font-weight: 400;
  color: #000000;
  margin-bottom: 30px;
  line-height: 1.4;
  text-align: center;

  @media screen and (max-width: 480px) {
  width: 100%;
  font-size: 32px;
}

`;


const ContainerRow = styled.div`
  display: flex;
  align-items: center;
  flex-direction: "row";
  margin-bottom: 5px;
  max-width: 90%;

  @media screen and (max-width: 480px) {
  width: 100%;
  display: block;
}
`;

const DescriptionText = styled.h3`
  font-family: SF TransRobotics;
  font-size: 20px;
  font-weight: 400;
  color: #000000;
  margin: 20px;
  line-height: 1.4;
  text-align: center;
  width: 50%;

  @media screen and (max-width: 480px) {
  width: 100%;
  font-size: 32px;
}

`;

const ServiceImg = styled.img`
width: 24em;
height: 16em;
margin: 5px;

  @media screen and (max-width: 480px) {
  width: 12em;
  height: 16em;
}
`;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div`
width: 100%;
height: 100vh;
padding: 0;
position=relative;
display: flex;
flex-direction: column;
align-items: center;

@media screen and (max-width: 480px) {
  height: 100vh;
}
`; // add your styles here

const MintButton = styled(Button)`
padding: 16px 32px;
border-radius: 5px;
background-color: transparent;
color: #FFFFFF;
font-weight: normal;
font-size: 40px;
font-family: Disposable Droid BB;
outline: none;
border: none;
transition: all 220ms ease-in-out;
cursor: pointer;

&:hover {
  background-color: #16B1F3;
  border: none;
  color: #FFFFFF;
}
`; // add your styles here

export interface HomeProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
}

const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();

  const onMint = async () => {
    try {
      setIsMinting(true);
      if (wallet.connected && candyMachine?.program && wallet.publicKey) {
        const mintTxId = await mintOneToken(
          candyMachine,
          props.config,
          wallet.publicKey,
          props.treasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          props.txTimeout,
          props.connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet?.publicKey) {
        const balance = await props.connection.getBalance(wallet?.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet?.publicKey) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(() => {
    (async () => {
      if (
        !wallet ||
        !wallet.publicKey ||
        !wallet.signAllTransactions ||
        !wallet.signTransaction
      ) {
        return;
      }

      const anchorWallet = {
        publicKey: wallet.publicKey,
        signAllTransactions: wallet.signAllTransactions,
        signTransaction: wallet.signTransaction,
      } as anchor.Wallet;

      const { candyMachine, goLiveDate, itemsRemaining } =
        await getCandyMachineState(
          anchorWallet,
          props.candyMachineId,
          props.connection
        );

      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  }, [wallet, props.candyMachineId, props.connection]);

  return (
    <main>
      {wallet.connected && (
        <p>Address: {shortenAddress(wallet.publicKey?.toBase58() || "")}</p>
      )}

      {wallet.connected && (
        <p>Balance: {(balance || 0).toLocaleString()} SOL</p>
      )}
      <MintContainer>

      <SloganText> ASCII Fishies ◎ </SloganText>
      <ContainerRow>
      <ServiceImg src={TankOne} />
      <ServiceImg src={TankTwo} />
      </ContainerRow>
      <ContainerRow>
      <ServiceImg src={TankThree} />
      <ServiceImg src={TankFour} />
      </ContainerRow>

      <DescriptionText>500 ASCII Fish Tanks. 0.25 SOL for solana frens :) All unique, generated ASCII style art based off a Python script I wrote years ago. Just fun. Just affordable</DescriptionText>

        {!wallet.connected ? (
          <ConnectButton>Connect Wallet</ConnectButton>
        ) : (
          <MintButton
            disabled={isSoldOut || isMinting || !isActive}
            onClick={onMint}
            variant="contained"
          >
            {isSoldOut ? (
              "SOLD OUT"
            ) : isActive ? (
              isMinting ? (
                <CircularProgress />
              ) : (
                "MINT"
              )
            ) : (
              <Countdown
                date={startDate}
                onMount={({ completed }) => completed && setIsActive(true)}
                onComplete={() => setIsActive(true)}
                renderer={renderCounter}
              />
            )}
          </MintButton>
        )}
      </MintContainer>

      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {hours} hours, {minutes} minutes, {seconds} seconds
    </CounterText>
  );
};

export default Home;
