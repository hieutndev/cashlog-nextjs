"use client";

import { Input } from "@heroui/input";
import { ErrorObject } from "ajv";
import { useEffect, useState } from "react";
import { Divider } from "@heroui/divider";
import { useReactiveCookiesNext } from "cookies-next/client";

import CustomForm from "../shared/form/custom-form";

import { setForm } from "@/utils/set-form";
import { TSignIn, TSignInResponse } from "@/types/user";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";

interface SignInFormProps {
	setIsSignUp: React.Dispatch<React.SetStateAction<boolean>>;
	onClose?: () => void;
}

export default function SignInForm({ setIsSignUp, onClose }: SignInFormProps) {
	const { setCookie } = useReactiveCookiesNext();

	const [signInForm, setSignInForm] = useState<TSignIn>({
		email: "",
		password: "",
	});

	const [validateErrors, setValidateErrors] = useState<ErrorObject[]>([]);

	const {
		data: signInResponse,
		loading: signingIn,
		error: signInError,
		fetch: signIn,
	} = useFetch<IAPIResponse<TSignInResponse>>(`/users/sign-in`, {
		method: "POST",
		body: signInForm,
		skip: true,
	});

	const handleSubmit = () => {
		signIn();
	};

	useEffect(() => {
		if (signInResponse && signInResponse.results) {
			setCookie("access_token", signInResponse.results.access_token, { maxAge: 10, path: "/" });
			setCookie("refresh_token", signInResponse.results.refresh_token, { maxAge: 60 * 60 * 24, path: "/" });
			setCookie("email", signInResponse.results.email, { maxAge: 60 * 60 * 24, path: "/" });
			setCookie("username", signInResponse.results.username, { maxAge: 60 * 60 * 24, path: "/" });
			onClose?.();
		}
	}, [signInResponse, signInError]);

	return (
		<>
			<CustomForm
				className={"flex flex-col gap-4"}
				formId={"loginForm"}
				isLoading={signingIn}
				submitButtonSize={"lg"}
				submitButtonText={"Sign In"}
				onSubmit={handleSubmit}
			>
				<Input
					isRequired
					label={"Email"}
					labelPlacement={"outside"}
					placeholder={"example@email.com"}
					size={"lg"}
					type={"email"}
					value={signInForm.email}
					variant={"bordered"}
					onValueChange={(e) => setForm("email", e, validateErrors, setValidateErrors, setSignInForm)}
				/>

				<Input
					isRequired
					label={"Password"}
					labelPlacement={"outside"}
					placeholder={"Enter your password"}
					size={"lg"}
					type={"password"}
					value={signInForm.password}
					variant={"bordered"}
					onValueChange={(e) => setForm("password", e, validateErrors, setValidateErrors, setSignInForm)}
				/>
			</CustomForm>
			<Divider />
			<p className={"text-center text-sm"}>
				Don&apos;t have an account?{" "}
				<button
					className={"text-primary-500 hover:text-primary-300 transition-colors duration-300"}
					type="button"
					onClick={() => setIsSignUp(true)}
				>
					Sign Up Here
				</button>
			</p>
		</>
	);
}
