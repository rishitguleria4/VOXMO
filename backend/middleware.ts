import { createSupabaseClient } from './client';
import type {  NextFunction, Request, Response } from 'express';
import { prisma } from './db';

const client = createSupabaseClient();
export async function Middleware(req: Request, res: Response, next: NextFunction) {
    const data = await client.auth.getUser(req.headers.authorization?.split(" ")[1] ?? "");
    const userId = data.data.user?.id;
    if (userId){
        try {
            console.log ({
                    id : data.data.user?.id!,
                    supabaseId : data.data.user?.id!,
                    email: data.data.user?.email!,
                    provider : data.data.user?.app_metadata.provider === "google" ? "Google" : "Github",
                    name : data.data.user?.user_metadata.full_name,
            });
            let dbUser = await prisma.user.findUnique({
                where: { id: data.data.user?.id! }
            });

            if (dbUser) {
                dbUser = await prisma.user.update({
                    where: { id: data.data.user?.id! },
                    data: {
                        email: data.data.user?.email!,
                        supabaseId: data.data.user?.id!,
                        provider: data.data.user?.app_metadata.provider === "google" ? "Google" : "Github",
                        name: data.data.user?.user_metadata.full_name,
                    }
                });
            } else {
                dbUser = await prisma.user.upsert({
                    where: { email: data.data.user?.email! },
                    update: {
                        supabaseId: data.data.user?.id!,
                        provider: data.data.user?.app_metadata.provider === "google" ? "Google" : "Github",
                        name: data.data.user?.user_metadata.full_name,
                    },
                    create: {
                        id: data.data.user?.id!,
                        supabaseId: data.data.user?.id!,
                        email: data.data.user?.email!,
                        provider: data.data.user?.app_metadata.provider === "google" ? "Google" : "Github",
                        name: data.data.user?.user_metadata.full_name,
                    }
                });
            }
            req.userId = dbUser.id;
        }catch (e){
            console.error("Middleware User Upsert Error:", e);
            res.status(500).json({ error: "Database error during authentication" });
            return;
        }
        next();
    }
    else {
        res.status (403).json({
            message :" incorrect inputs "
        })
    }
}