import { Resend } from "resend";
import * as dotenv from 'dotenv';


export class ResendConfig {
    constructor(private readonly API_KEY: string) { }

    getInstance() {
        return new Resend(this.API_KEY)
    }
}

dotenv.config();
export const resendConfig = new ResendConfig(process.env.RESEND_API_KEY!)