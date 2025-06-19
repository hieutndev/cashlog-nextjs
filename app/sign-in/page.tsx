"use client";

import Image from "next/image";
import { Input } from "@heroui/input";
import { ErrorObject } from "ajv";
import { useReactiveCookiesNext } from "cookies-next";
import { useState, useEffect } from "react";
import { Divider } from "@heroui/divider";
import { useRouter } from "next/navigation";

import CustomForm from "@/components/shared/form/custom-form";
import { useFetch } from "@/hooks/useFetch";
import { IAPIResponse } from "@/types/global";
import { TSignIn, TSignInResponse } from "@/types/user";
import { setForm } from "@/utils/set-form";

export default function SignInPage() {
	const router = useRouter();

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
			console.log("change router /");

			router.push("/");

			setCookie("access_token", signInResponse.results.access_token, { maxAge: 10, path: "/" });
			setCookie("refresh_token", signInResponse.results.refresh_token, { maxAge: 60 * 60 * 24, path: "/" });
			setCookie("email", signInResponse.results.email, { maxAge: 60 * 60 * 24, path: "/" });
			setCookie("username", signInResponse.results.username, { maxAge: 60 * 60 * 24, path: "/" });
		}
	}, [signInResponse, signInError]);

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
				<h1 className="w-4/6 text-left text-6xl font-bold text-primary">Sign In.</h1>
				<div className={"w-full flex flex-col gap-8 items-center"}>
					<CustomForm
						className={"w-4/6 flex flex-col gap-4"}
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
							onValueChange={(e) =>
								setForm("password", e, validateErrors, setValidateErrors, setSignInForm)
							}
						/>
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
