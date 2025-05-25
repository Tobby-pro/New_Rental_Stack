'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const HostPage = dynamic(() => import('./host'), { ssr: false });


export default function Wrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HostPage />
    </Suspense>
  );
}
