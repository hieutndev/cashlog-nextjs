import * as crypto from "crypto";
export const randomUniqueString = (size = 32) => {
    return crypto.randomBytes(size).toString("hex");
}
