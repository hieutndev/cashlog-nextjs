"use client";

import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/modal";
import { useState } from "react";
import Image from "next/image";

import SignInForm from "./signin-form";
import SignUpForm from "./signup-form";

interface LoginModalProps {
	isOpen: boolean;
	loading?: boolean;
	onClose?: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
	const [isSignUp, setIsSignUp] = useState(false);

	return (
		<Modal
			hideCloseButton
			isOpen={isOpen}
			placement={"top"}
			size={"xl"}
			title="Login"
			onOpenChange={onClose}
		>
			<ModalContent>
				<ModalHeader>
					<div className={"w-full flex flex-col justify-center items-center gap-4"}>
						<div className={"p-2 rounded-2xl shadow-md border"}>
							<Image
								alt="hieutndev logo"
								className={"w-16 h-16"}
								height={1200}
								src="/1x1b.png"
								width={1200}
							/>
						</div>
						<h3 className={"capitalize text-xl font-semibold"}>
							{isSignUp ? "Create new account!" : "Welcome back!"}
						</h3>
					</div>
				</ModalHeader>
				<ModalBody className={"flex flex-col gap-4"}>
					{isSignUp ? (
						<SignUpForm
							setIsSignUp={setIsSignUp}
							onClose={onClose}
						/>
					) : (
						<SignInForm
							setIsSignUp={setIsSignUp}
							onClose={onClose}
						/>
					)}
				</ModalBody>

				<ModalFooter />
			</ModalContent>
		</Modal>
	);
}
