"use client";

import Image from "next/image";
import { Input } from "@heroui/input";
import { ErrorObject } from "ajv";
import { useState, useEffect } from "react";
import { Divider } from "@heroui/divider";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";

import CustomForm from "@/components/shared/form/custom-form";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";
import { setForm } from "@/utils/set-form";
import { TSignUp } from "@/types/user";
import { getFieldError } from "@/utils/get-field-error";

export default function SignUpPage() {
	const router = useRouter();

	// const { setCookie } = useReactiveCookiesNext();

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
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const handleSubmit = () => {
		setErrorMessage(null);
		signUp();
	};

	useEffect(() => {
		if (signUpResponse && signUpResponse.results) {
			addToast({
				title: "Success",
				description: signUpResponse.message,
				color: "success",
			});

			router.push("/sign-in");
		}

		if (signUpError) {
			const parseError = JSON.parse(signUpError);

			if (parseError.validateErrors) {
				setValidateErrors(parseError.validateErrors);
			} else {
				setErrorMessage(parseError.message || "An error occurred during sign up.");
			}
		}
	}, [signUpResponse, signUpError]);

	return (
		<div className={"w-full h-full grid grid-cols-2 px-32"}>
			<div className={"h-full col-span-1 flex items-center justify-center"}>
				<Image
					alt={"Cashlog Logo"}
					className={"w-3/4"}
					height={1200}
					src={"/cashlog_icontext_vertical.png"}
					width={1200}
				/>
			</div>
			<div className={"h-full col-span-1 flex flex-col items-center justify-center gap-8 px-4"}>
				<h1 className="w-4/6 text-left text-6xl font-bold text-primary">Sign Up.</h1>
				<div className={"w-full flex flex-col gap-8 items-center"}>
					<CustomForm
						className={"w-4/6 flex flex-col gap-4"}
						formId={"signUpForm"}
						isLoading={signingUp}
						submitButtonSize={"lg"}
						submitButtonText={"Sign Up"}
						onSubmit={handleSubmit}
					>
						<Input
							isRequired
							errorMessage={getFieldError(validateErrors, "email")?.message}
							isInvalid={!!getFieldError(validateErrors, "email")}
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
							errorMessage={getFieldError(validateErrors, "password")?.message}
							isInvalid={!!getFieldError(validateErrors, "password")}
							label={"Password"}
							labelPlacement={"outside"}
							placeholder={"Enter your password"}
							size={"lg"}
							type={"password"}
							value={signUpForm.password}
							variant={"bordered"}
							onValueChange={(e) =>
								setForm("password", e, validateErrors, setValidateErrors, setSignUpForm)
							}
						/>
						<Input
							isRequired
							errorMessage={getFieldError(validateErrors, "confirmPassword")?.message}
							isInvalid={!!getFieldError(validateErrors, "confirmPassword")}
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
						{errorMessage && <p className={"text-danger text-sm"}>{errorMessage}</p>}
					</CustomForm>
					<Divider />
					<p className={"text-center text-sm"}>
						Already have an account?{" "}
						<button
							className={"text-primary-500 hover:text-primary-300 transition-colors duration-300"}
							type="button"
							onClick={() => router.push("/sign-in")}
						>
							Sign In Here
						</button>
					</p>
				</div>
			</div>
		</div>
	);
}
