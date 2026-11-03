"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BookOpen, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getStudentClassByCode } from "@/lib/firebase/firestore";
import { logOutUser, signInUser } from "@/lib/firebase/auth";

export default function StudentLoginPage() {
  const router = useRouter(); const [classCode,setClassCode]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const submit=async(e:FormEvent)=>{e.preventDefault();setError("");setLoading(true);try{const result=await signInUser(email,password);if(!result.user){throw new Error(result.error||"Giriş bilgileri doğrulanamadı.");}const classItem=await getStudentClassByCode(result.user.uid,classCode);if(!classItem){await logOutUser();throw new Error("Sınıf kodu geçersiz veya bu sınıfa kayıtlı değilsiniz.");}router.push("/panel");}catch(e){setError(e instanceof Error?e.message:"Giriş yapılamadı.");}finally{setLoading(false);}};
  return <div className="container mx-auto flex min-h-[80vh] max-w-md items-center px-4 py-12"><div className="w-full space-y-6"><header className="text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-700 text-amber-400"><BookOpen className="h-6 w-6"/></div><h1 className="mt-3 text-2xl font-bold font-serif">Öğrenci Girişi</h1><p className="mt-1 text-sm text-charcoal-muted">Öğretmeninizin verdiği sınıf kodu ile giriş yapın.</p></header><Card><CardContent className="p-6"><form className="space-y-4" onSubmit={submit}>{error&&<p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}<label className="block text-sm font-semibold">Sınıf kodu<input className="mt-1 w-full rounded-xl border border-sage-200 p-2.5 uppercase" value={classCode} onChange={e=>setClassCode(e.target.value.toUpperCase())} placeholder="Örn. OKUABC123" required/></label><label className="block text-sm font-semibold">E-posta<input type="email" className="mt-1 w-full rounded-xl border border-sage-200 p-2.5" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label className="block text-sm font-semibold">Parola<input type="password" className="mt-1 w-full rounded-xl border border-sage-200 p-2.5" value={password} onChange={e=>setPassword(e.target.value)} required/></label><Button type="submit" className="w-full" size="lg" isLoading={loading}><LogIn className="mr-2 h-4 w-4"/>Öğrenci olarak giriş yap</Button></form></CardContent></Card><p className="text-center text-sm text-charcoal-muted">Öğretmen/yönetici misiniz? <Link className="font-semibold text-brand-800 hover:underline" href="/giris">Genel girişe dönün</Link></p></div></div>;
}
