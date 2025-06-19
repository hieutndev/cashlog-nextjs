"use client";

import { Input } from "@heroui/input";
import { ErrorObject } from "ajv";
import React, { useEffect, useState } from "react";
import { Divider } from "@heroui/divider";
import { addToast } from "@heroui/toast";

import CustomForm from "../shared/form/custom-form";

import { setForm } from "@/utils/set-form";
import { TSignUp } from "@/types/user";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";

interface SignUpFormProps {
	setIsSignUp: React.Dispatch<React.SetStateAction<boolean>>;
	onClose?: () => void;
}

export default function SignUpForm({ setIsSignUp }: SignUpFormProps) {
	const [signUpForm, setSignUpForm] = useState<TSignUp>({
		email: "",
		password: "",
		confirmPassword: "",
	});

	const {
		data: signUpResponse,
		error: signUpError,
		loading: signingUp,
		fetch: signUp,
	} = useFetch<IAPIResponse>(`/users/sign-up`, {
		method: "POST",
		body: signUpForm,
		headers: {
			"Content-Type": "application/json",
		},
		skip: true,
	});

	const [validateErrors, setValidateErrors] = useState<ErrorObject[]>([]);

	const handleSubmit = () => {
		signUp();
	};

	useEffect(() => {
		if (signUpResponse && signUpResponse.results) {
			setIsSignUp(false);
			addToast({
				title: "Success",
				description: signUpResponse.message,
				color: "success",
			});
		}

		if (signUpError) {
			const parseError = JSON.parse(signUpError);

			if (parseError.validateErrors) {
				setValidateErrors(parseError.validateErrors);
			} else {
				addToast({
					title: "Error",
					description: parseError.message || "An error occurred during sign up.",
					color: "danger",
				});
			}
		}
	}, [signUpResponse, signUpError]);

	return (
		<>
			<CustomForm
				className={"flex flex-col gap-4"}
				formId={"signUpForm"}
				isLoading={signingUp}
				submitButtonSize={"lg"}
				onSubmit={handleSubmit}
			>
				<Input
					isRequired
					label={"Email"}
					labelPlacement={"outside"}
					placeholder={"example@email.com"}
					size={"lg"}
					type={"email"}
					value={signUpForm.email}
					variant={"bordered"}
					onValueChange={(e) => setForm("email", e, validateErrors, setValidateErrors, setSignUpForm)}
				/>

				<Input
					isRequired
					label={"Password"}
					labelPlacement={"outside"}
					placeholder={"Enter your password"}
					size={"lg"}
					type={"password"}
					value={signUpForm.password}
					variant={"bordered"}
					onValueChange={(e) => setForm("password", e, validateErrors, setValidateErrors, setSignUpForm)}
				/>
				<Input
					isRequired
					label={"Confirm Password"}
					labelPlacement={"outside"}
					placeholder={"Re-enter your password"}
					size={"lg"}
					type={"password"}
					value={signUpForm.confirmPassword}
					variant={"bordered"}
					onValueChange={(e) =>
						setForm("confirmPassword", e, validateErrors, setValidateErrors, setSignUpForm)
					}
				/>
			</CustomForm>
			<Divider />
			<p className={"text-center text-sm"}>
				Already have an account?{" "}
				<button
					className={"text-primary-500 hover:text-primary-300 transition-colors duration-300"}
					type="button"
					onClick={() => setIsSignUp(false)}
				>
					Sign In Here
				</button>
			</p>
		</>
	);
}
