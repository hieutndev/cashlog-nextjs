"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import { addToast } from "@heroui/toast";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useWindowSize } from "hieutndev-toolkit";

import { useAuthEndpoint } from "@/hooks/useAuthEndpoint";
import CustomForm from "@/components/shared/form/custom-form";
import { setForm } from "@/utils/set-form";
import { TSignUp } from "@/types/user";
import { getFieldError } from "@/utils/get-field-error";
import { BREAK_POINT } from "@/configs/break-point";
import { ZodCustomError } from "@/types/zod";

export default function SignUpPage() {
	const router = useRouter();
	const { useSignUp } = useAuthEndpoint();

	const { width } = useWindowSize();

	// const { setCookie } = useReactiveCookiesNext();

	const [signUpForm, setSignUpForm] = useState<TSignUp>({
		email: "",
		password: "",
		confirm_password: "",
	});
	const {
		data: signUpResponse,
		error: signUpError,
		loading: signingUp,
		fetch: signUp,
	} = useSignUp(signUpForm);

	const [validateErrors, setValidateErrors] = useState<ZodCustomError[]>([]);
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
		<div className={clsx("w-full h-full md:px-32 px-4 lg:grid lg:grid-cols-2 flex flex-col gap-4")}>
			<div className={clsx("flex items-center justify-center lg:col-span-1 h-max lg:h-full")}>
				<Image
					alt={"Cashlog Logo"}
					className={clsx("w-40 sm:w-2/5 sm:px-0 sm:py-0 md:w-2/5 lg:w-full")}
					height={1200}
					src={width >= BREAK_POINT.SM ? "/cashlog_icontext_vertical.png" : "/cashlog_icon.png"}
					width={1200}
				/>
			</div>
			<div
				className={clsx(
					"flex flex-col item-start items-center justify-start lg:justify-center gap-8 px-4 lg:h-full lg:col-span-1 h-max"
				)}
			>
				<h1
					className={clsx(
						"w-full sm:w-4/6 text-5xl sm:text-6xl font-bold text-primary xl:text-left text-center"
					)}
				>
					Sign Up.
				</h1>
				<div className={"w-full flex flex-col gap-8 items-center"}>
					<CustomForm
						className={clsx("flex flex-col gap-4 xl:w-4/6 md:w-5/6 w-full")}
						formId={"signUpForm"}
						isLoading={signingUp}
						loadingText={"Signing Up..."}
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
							errorMessage={getFieldError(validateErrors, "confirm_password")?.message}
							isInvalid={!!getFieldError(validateErrors, "confirm_password")}
							label={"Confirm Password"}
							labelPlacement={"outside"}
							placeholder={"Re-enter your password"}
							size={"lg"}
							type={"password"}
							value={signUpForm.confirm_password}
							variant={"bordered"}
							onValueChange={(e) =>
								setForm("confirm_password", e, validateErrors, setValidateErrors, setSignUpForm)
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
