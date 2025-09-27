"use client";

import Image from "next/image";
import { Input } from "@heroui/input";
import { ErrorObject } from "ajv";
import { useReactiveCookiesNext } from "cookies-next";
import { useState, useEffect } from "react";
import { Divider } from "@heroui/divider";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useFetch } from "hieutndev-toolkit";
import { useWindowSize } from "hieutndev-toolkit";

import CustomForm from "@/components/shared/form/custom-form";
import { IAPIResponse } from "@/types/global";
import { TSignIn, TSignInResponse } from "@/types/user";
import { setForm } from "@/utils/set-form";
import { getFieldError } from "@/utils/get-field-error";
import { BREAK_POINT } from "@/configs/break-point";

export default function SignInPage() {
	const router = useRouter();

	const { width } = useWindowSize();

	const { setCookie } = useReactiveCookiesNext();

	const [signInForm, setSignInForm] = useState<TSignIn>({
		email: "",
		password: "",
	});

	const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
			console.log("change router /");

			router.push("/overview");

			setCookie("access_token", signInResponse.results.access_token, { maxAge: 10, path: "/" });
			setCookie("refresh_token", signInResponse.results.refresh_token, { maxAge: 60 * 60 * 24, path: "/" });
			setCookie("email", signInResponse.results.email, { maxAge: 60 * 60 * 24, path: "/" });
			setCookie("username", signInResponse.results.username, { maxAge: 60 * 60 * 24, path: "/" });
		}

		if (signInError) {
			const parseError = JSON.parse(signInError);

			if (parseError.validateErrors) {
				setValidateErrors(parseError.validateErrors);
			} else {
				setErrorMessage(parseError.message || "An error occurred during sign in.");
			}
		}
	}, [signInResponse, signInError]);

	return (
		<div
			className={clsx("w-full h-full md:px-32 px-4 lg:grid lg:grid-cols-2 flex flex-col gap-4")}
		>
			<div
				className={clsx("flex items-center justify-center lg:col-span-1 h-max lg:h-full")}
			>
				<Image
					alt={"Cashlog Logo"}
					className={clsx("w-40 sm:w-2/5 sm:px-0 sm:py-0 md:w-2/5 lg:w-full")}
					height={1200}
					src={width  >= BREAK_POINT.SM ? "/cashlog_icontext_vertical.png": "/cashlog_icon.png"}
					width={1200}
				/>
			</div>
			<div
				className={clsx("flex flex-col item-start items-center justify-start lg:justify-center gap-8 px-4 lg:h-full lg:col-span-1 h-max")}
			>
				<h1
					className={clsx("w-full sm:w-4/6 text-5xl sm:text-6xl font-bold text-primary xl:text-left text-center")}
				>
					Sign In.
				</h1>
				<div className={"w-full flex flex-col gap-8 items-center"}>
					<CustomForm
						className={clsx("flex flex-col gap-4 xl:w-4/6 md:w-5/6 w-full")}
						formId={"loginForm"}
						isLoading={signingIn}
						loadingText={"Signing In..."}
						submitButtonSize={"lg"}
						submitButtonText={"Sign In"}
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
							value={signInForm.email}
							variant={"bordered"}
							onValueChange={(e) => setForm("email", e, validateErrors, setValidateErrors, setSignInForm)}
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
							value={signInForm.password}
							variant={"bordered"}
							onValueChange={(e) =>
								setForm("password", e, validateErrors, setValidateErrors, setSignInForm)
							}
						/>
						{errorMessage && <p className={"text-danger text-sm"}>{errorMessage}</p>}
					</CustomForm>
					<Divider className={"w-5/6"} />
					<p className={"text-center text-sm"}>
						Don&apos;t have an account?{" "}
						<button
							className={"text-primary-500 hover:text-primary-300 transition-colors duration-300"}
							type="button"
							onClick={() => router.push("/sign-up")}
						>
							Sign Up Here
						</button>
					</p>
				</div>
			</div>
		</div>
	);
}
