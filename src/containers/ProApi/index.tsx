import styled from 'styled-components'
import React, { useEffect } from 'react'
import { useAccount, useNetwork, useSwitchNetwork } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { Copy } from 'react-feather'
import toast from 'react-hot-toast'

import { Button as ButtonComponent } from '~/components/Nav/Mobile/shared'
import { CheckIcon } from '../ProContainer/Subscribe/Icon'
import { useGetAuthToken, useSignInWithEthereum } from './queries/useAuth'
import { llamaAddress, subscriptionAmount } from './lib/constants'
import { useGetSubs } from './queries/useGetSubs'
import { ButtonDark, ButtonLight } from '~/components/ButtonStyled'
import { useGenerateNewApiKey } from './queries/useGenerateKey'
import logo from '~/public/llama.png'
import Subscriptions from './Subscriptions'
import useGithubAuth from './queries/useGithubAuth'
import SignInWithGithub from './SignInWithGithub'
import { useGetCurrentKey } from './queries/useGetCurrentKey'

const Body = styled.div`
	margin-top: 120px;
	text-align: center;
	display: flex;
	justify-content: center;
	flex-direction: column;
	align-items: center;
	margin: 0 auto;
`

const Content = styled.div`
	margin-top: 16px;
	display: grid;
	gap: 16px;
`

const Button = styled(ButtonComponent)`
	font-size: 16px;
	height: 36px;
`

const ListBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
	align-items: center;
`

const ListItem = styled.div`
	display: flex;
	gap: 8px;
	font-size: 16px;
	align-items: center;
`

const PricePerMonth = styled.div`
	font-size: 32px;
	font-weight: bold;
`

interface Props {
	price: number
}

const PriceComponent: React.FC<Props> = ({ price }) => {
	return (
		<PricePerMonth>
			<span style={{ color: 'gray' }}>{price}$</span> / <span style={{ fontSize: '18px' }}>month</span>
		</PricePerMonth>
	)
}

export const Box = styled.div`
	display: flex;
	flex-direction: column;
	font-size: 16px;
	width: 100%;
	border-radius: 10px;
	transition: all 0.3s ease;
	padding: 15px;
	background-color: ${({ theme }) => theme.bg1};
	color: ${({ theme }) => theme.text1};
	gap: 16px;
`

const ProApi = () => {
	const wallet = useAccount()
	const network = useNetwork()
	const { switchNetwork } = useSwitchNetwork()
	useEffect(() => {
		if (network?.chain?.id && network?.chain?.id !== 10) {
			switchNetwork?.(10)
		}
	}, [network?.chain?.id, switchNetwork])
	const { data: ghAuth } = useGithubAuth()
	const { openConnectModal } = useConnectModal()
	const { data: currentAuthToken } = useGetAuthToken()
	const { data: subs } = useGetSubs({ address: wallet?.address })
	const { data: newApiKey, mutate: generateApiKey } = useGenerateNewApiKey()
	const { data: authTokenAfterSigningIn, mutate: signIn } = useSignInWithEthereum()
	const { data: currentKey } = useGetCurrentKey({ authToken: currentAuthToken })
	const authToken = currentAuthToken || authTokenAfterSigningIn || ghAuth?.apiKey

	const startPayment = (isTopUp = false) => {
		const paymentWindow = window.open(
			`https://subscriptions.llamapay.io/subscribe?to=${llamaAddress}&amount=${subscriptionAmount}&brandColor=%232351be&closeAfterPayment=true`,
			'Window',
			`width=600,height=800,left=${window.screen.width / 2 - 300},top=${window.screen.height / 2 - 400}`
		)
		window.addEventListener('message', function (e) {
			if (e.data === 'payment_success' && !isTopUp) {
				signIn({ address: wallet.address })
			}
		})
	}

	return (
		<Body>
			<img src={logo.src} width="120px" height="120px" alt="logo" />
			<Content>
				<div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
					<h1>DefiLlama Pro API</h1>
					{authToken ? (
						<ButtonLight onClick={() => window.open('/pro-api/docs', '_blank')}>Open API Docs </ButtonLight>
					) : null}
				</div>
				{authToken ? null : (
					<>
						<PriceComponent price={300} />
						<div>Upgrade now for increased api limits and premium api endpoints.</div>
					</>
				)}

				{ghAuth?.login ? (
					<Box>
						<SignInWithGithub />
					</Box>
				) : authToken ? null : (
					<Box>
						{!wallet.isConnected ? (
							<Button onClick={openConnectModal}>Connect Wallet</Button>
						) : !authToken && !(subs?.[0]?.realExpiration > new Date().getTime() / 1000) ? (
							<Button onClick={() => startPayment()}>Subscribe</Button>
						) : authToken ? null : (
							<Button onClick={() => signIn({ address: wallet.address })}>Sign In</Button>
						)}
						OR
						<SignInWithGithub />
					</Box>
				)}

				{!authToken ? (
					<ListBody>
						<h2>Plan Includes:</h2>
						<ListItem>
							<CheckIcon />
							Increased API limits
						</ListItem>
						<ListItem>
							<CheckIcon />
							Access to premium API endpoints
						</ListItem>
					</ListBody>
				) : (
					<>
						<div style={{ display: 'flex', marginTop: '16px' }}>
							<h2>API Key </h2>
						</div>

						<Box>
							<div style={{ display: 'flex' }}>
								<h4>API Key</h4>: {newApiKey || currentKey || authToken || 'Not Subscribed'}
								<span
									onClick={() => {
										navigator.clipboard.writeText('Copy this text to clipboard')
										toast.success('API Key copied to clipboard')
									}}
								>
									<Copy style={{ height: '16px', cursor: 'pointer', marginTop: '4px' }} />
								</span>
							</div>
							{authToken && ghAuth?.isContributor ? null : (
								<ButtonDark
									onClick={() => {
										generateApiKey({ authToken })
									}}
									style={{ width: '120px' }}
								>
									Generate new API Key{' '}
								</ButtonDark>
							)}
						</Box>
						{subs?.length ? <Subscriptions startPayment={startPayment} /> : null}
					</>
				)}
				<></>
			</Content>
		</Body>
	)
}

export default ProApi
