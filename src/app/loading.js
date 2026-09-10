"use client";
import { LoadingAnimation } from "@/contents/home/animatedLoader";
export default function Loading() {
    return (<div className="flex items-center justify-center min-h-screen"><LoadingAnimation src={"/lottie/rabbit.json"} /></div>)
}