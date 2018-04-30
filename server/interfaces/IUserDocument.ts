import { Document } from 'mongoose';

export interface IUserDocument extends Document {
    email: string;
    password: string;
    tokens: Array<{token: string}>;
    creationDate: Date;
    lastEditDate: Date;
    lastAccessDate: Date;
    enabled: boolean;
    emailConfirmed: boolean;
    badPasswordCount: number;
}
