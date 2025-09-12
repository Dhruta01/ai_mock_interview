
import {ReactNode} from 'react'
import Link from "next/link";
import Image from "next/image";
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/actions/auth.action';


const RootLayout = async ({children}:{children: ReactNode}) => {
  const isUserAuthenticated =await isAuthenticated();

  if(!isUserAuthenticated) redirect('/auth/sign-in');
  
  return (
    <div className='root-layout'>
      <nav>
        <link href="/" className="flex items-center gap-2">
         <Image src="/logo.svg" alt="Logo" width={38} height={32} />
         <h2 className="text-primary-100">PrepWise</h2>
        </link>
      </nav>

      {children}
    </div>
  )
}

export default RootLayout