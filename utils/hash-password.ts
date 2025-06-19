import bcrypt from "bcryptjs";

export const hashPassword = async (password: string) => {
    return await bcrypt.hash(password, Number(process.env.PWD_SECRET));
}

export const comparePassword = async (inputPassword: string, hashedPassword: string) => {
    return !!(await bcrypt.compare(inputPassword, hashedPassword));
}